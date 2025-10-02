import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Customer, Clerk, ClerkStatus, ServingInfo, Window } from '../types';

interface QueueContextType {
  customers: Customer[];
  clerks: Clerk[];
  windows: Window[];
  serving: ServingInfo[];
  takeNumber: () => void;
  callNextCustomer: (clerkId: number) => void;
  finishService: (clerkId: number) => void;
  setClerkStatus: (clerkId: number, status: ClerkStatus) => void;
  addClerk: (username: string, password: string) => void;
  removeClerk: (clerkId: number) => void;
  loginClerk: (username: string, password: string, windowId: number) => { clerk?: Clerk; error?: string };
  logoutClerk: (clerkId: number) => void;
  addWindow: (number: number) => void;
  removeWindow: (windowId: number) => void;
  servedCount: number;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export const QueueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>(() => JSON.parse(localStorage.getItem('queue_customers') || '[]'));
  const [windows, setWindows] = useState<Window[]>(() => JSON.parse(localStorage.getItem('queue_windows') || '[]'));
  const [clerks, setClerks] = useState<Clerk[]>(() => {
    const savedClerks = JSON.parse(localStorage.getItem('queue_clerks') || '[]') as Clerk[];
    // On initial load, reset all clerks to an offline state to ensure a clean session.
    return savedClerks.map(clerk => ({
      ...clerk,
      status: ClerkStatus.OFFLINE,
      windowId: null,
      currentCustomerId: null,
    }));
  });
  const [serving, setServing] = useState<ServingInfo[]>([]); // Always start with an empty serving list for a clean state.
  const [nextTicket, setNextTicket] = useState<number>(() => JSON.parse(localStorage.getItem('queue_nextTicket') || '101'));
  const [servedCount, setServedCount] = useState<number>(() => JSON.parse(localStorage.getItem('queue_servedCount') || '0'));

  // Effect to save state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('queue_customers', JSON.stringify(customers));
      localStorage.setItem('queue_windows', JSON.stringify(windows));
      localStorage.setItem('queue_clerks', JSON.stringify(clerks));
      localStorage.setItem('queue_nextTicket', JSON.stringify(nextTicket));
      localStorage.setItem('queue_servedCount', JSON.stringify(servedCount));
      // The 'serving' state is transient and intentionally not persisted.
    } catch (error) {
      console.error("Failed to save state to localStorage:", error);
    }
  }, [customers, windows, clerks, nextTicket, servedCount]);

  const takeNumber = useCallback(() => {
    const newCustomer: Customer = {
      id: Date.now(),
      ticketNumber: `A-${nextTicket}`,
      arrivalTime: Date.now(),
    };
    setCustomers(prev => [...prev, newCustomer]);
    setNextTicket(prev => prev + 1);
  }, [nextTicket]);

  const callNextCustomer = useCallback((clerkId: number) => {
    setClerks(prevClerks => {
        const clerkIndex = prevClerks.findIndex(c => c.id === clerkId);
        if (clerkIndex === -1 || prevClerks[clerkIndex].status !== ClerkStatus.AVAILABLE) return prevClerks;

        const nextCustomer = customers[0];
        if (!nextCustomer) return prevClerks;

        const updatedClerk: Clerk = {
            ...prevClerks[clerkIndex],
            currentCustomerId: nextCustomer.id,
            status: ClerkStatus.BUSY,
        };

        const newClerks = [...prevClerks];
        newClerks[clerkIndex] = updatedClerk;
        
        setCustomers(prevCustomers => prevCustomers.slice(1));
        setServing(prevServing => {
            const newServingInfo: ServingInfo = { clerk: updatedClerk, customer: nextCustomer };
            return [...prevServing.filter(s => s.clerk.id !== clerkId), newServingInfo];
        });

        return newClerks;
    });
  }, [customers]);
  
  const finishService = useCallback((clerkId: number) => {
    const servingInfo = serving.find(s => s.clerk.id === clerkId);
    if (!servingInfo) return;

    const serviceDuration = (Date.now() - servingInfo.customer.arrivalTime) / 1000;

    setClerks(prev => prev.map(clerk => {
      if (clerk.id === clerkId) {
        return {
          ...clerk,
          status: ClerkStatus.AVAILABLE,
          customersServed: clerk.customersServed + 1,
          totalServiceTime: clerk.totalServiceTime + serviceDuration,
          currentCustomerId: null,
        };
      }
      return clerk;
    }));

    setServing(prev => prev.filter(s => s.clerk.id !== clerkId));
    setServedCount(prev => prev + 1);
  }, [serving]);

  const setClerkStatus = useCallback((clerkId: number, status: ClerkStatus) => {
    setClerks(prev => prev.map(clerk => clerk.id === clerkId ? { ...clerk, status } : clerk));
  }, []);

  const addClerk = useCallback((username: string, password: string) => {
    setClerks(prev => [...prev, {
        id: Date.now(),
        name: username,
        username,
        password,
        windowId: null,
        status: ClerkStatus.OFFLINE,
        customersServed: 0,
        totalServiceTime: 0,
        currentCustomerId: null
    }]);
  }, []);
  
  const removeClerk = useCallback((clerkId: number) => {
    setClerks(prev => prev.filter(clerk => clerk.id !== clerkId));
  }, []);

  const loginClerk = useCallback((username: string, password: string, windowId: number): { clerk?: Clerk; error?: string } => {
    const clerkToLogin = clerks.find(c => c.username === username && c.password === password);
    if (!clerkToLogin) {
        return { error: "اسم المستخدم أو كلمة المرور غير صحيحة." };
    }
    
    if (clerkToLogin.status !== ClerkStatus.OFFLINE || clerkToLogin.windowId !== null) {
        return { error: "هذا الموظف مسجل دخوله بالفعل في شباك آخر." };
    }

    const windowIsOccupied = clerks.some(c => c.windowId === windowId);
    if (windowIsOccupied) {
        return { error: "هذا الشباك مشغول حاليًا." };
    }

    const loggedInClerk: Clerk = {
        ...clerkToLogin,
        windowId: windowId,
        status: ClerkStatus.AVAILABLE,
    };
    
    setClerks(prevClerks => 
        prevClerks.map(clerk => 
            clerk.id === clerkToLogin.id ? loggedInClerk : clerk
        )
    );

    return { clerk: loggedInClerk };
  }, [clerks]);

  const logoutClerk = useCallback((clerkId: number) => {
    setClerks(prev => prev.map(clerk => {
        if (clerk.id === clerkId) {
            // Also remove from serving list if they were serving someone
            setServing(prevServing => prevServing.filter(s => s.clerk.id !== clerkId));
            return {
                ...clerk,
                windowId: null,
                status: ClerkStatus.OFFLINE,
                currentCustomerId: null,
            };
        }
        return clerk;
    }));
  }, []);

  const addWindow = useCallback((number: number) => {
      setWindows(prev => {
          if (prev.some(w => w.number === number)) {
              alert(`شباك رقم ${number} موجود بالفعل.`);
              return prev;
          }
          return [...prev, { id: Date.now(), number }].sort((a, b) => a.number - b.number);
      });
  }, []);

  const removeWindow = useCallback((windowId: number) => {
      if (clerks.some(c => c.windowId === windowId)) {
          alert("لا يمكن إزالة شباك معين لموظف حاليًا.");
          return;
      }
      setWindows(prev => prev.filter(w => w.id !== windowId));
  }, [clerks]);


  const value = {
    customers,
    clerks,
    windows,
    serving,
    takeNumber,
    callNextCustomer,
    finishService,
    setClerkStatus,
    addClerk,
    removeClerk,
    loginClerk,
    logoutClerk,
    addWindow,
    removeWindow,
    servedCount,
  };

  return <QueueContext.Provider value={value}>{children}</QueueContext.Provider>;
};

export const useQueue = (): QueueContextType => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
};