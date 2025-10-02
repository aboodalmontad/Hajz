
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
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

const initialWindows: Window[] = [
  { id: 1, number: 1 },
  { id: 2, number: 2 },
  { id: 3, number: 3 },
  { id: 4, number: 4 },
  { id: 5, number: 5 },
];

const initialClerks: Clerk[] = [
  { id: 1, name: 'علي أحمد', username: 'ali', password: 'password123', windowId: null, status: ClerkStatus.OFFLINE, customersServed: 0, totalServiceTime: 0, currentCustomerId: null },
  { id: 2, name: 'فاطمة خان', username: 'fatima', password: 'password123', windowId: null, status: ClerkStatus.OFFLINE, customersServed: 0, totalServiceTime: 0, currentCustomerId: null },
  { id: 3, name: 'يوسف إبراهيم', username: 'youssef', password: 'password123', windowId: null, status: ClerkStatus.OFFLINE, customersServed: 0, totalServiceTime: 0, currentCustomerId: null },
];

export const QueueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [windows, setWindows] = useState<Window[]>(initialWindows);
  const [clerks, setClerks] = useState<Clerk[]>(initialClerks);
  const [serving, setServing] = useState<ServingInfo[]>([]);
  const [nextTicket, setNextTicket] = useState(101);
  const [servedCount, setServedCount] = useState(0);

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
    const clerk = clerks.find(c => c.id === clerkId);
    const nextCustomer = customers[0];

    // Pre-conditions check
    if (!clerk || clerk.status !== ClerkStatus.AVAILABLE || !nextCustomer) {
        return;
    }
    
    const updatedClerk: Clerk = {
        ...clerk,
        currentCustomerId: nextCustomer.id,
        status: ClerkStatus.BUSY,
    };

    // Update states
    setClerks(prevClerks => 
      prevClerks.map(c => 
        c.id === clerkId ? updatedClerk : c
      )
    );
    
    setCustomers(prevCustomers => prevCustomers.slice(1));

    setServing(prevServing => {
        const newServingInfo: ServingInfo = { clerk: updatedClerk, customer: nextCustomer };
        return [...prevServing.filter(s => s.clerk.id !== clerkId), newServingInfo];
    });
  }, [clerks, customers]);
  
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
      if (windows.some(w => w.number === number)) {
          console.warn(`Window number ${number} already exists.`);
          return;
      }
      setWindows(prev => [...prev, { id: Date.now(), number }].sort((a, b) => a.number - b.number));
  }, [windows]);

  const removeWindow = useCallback((windowId: number) => {
      if (clerks.some(c => c.windowId === windowId)) {
          console.warn(`Cannot remove window assigned to a clerk.`);
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
