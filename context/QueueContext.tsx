import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Customer, Clerk, ClerkStatus, ServingInfo } from '../types';

interface QueueContextType {
  customers: Customer[];
  clerks: Clerk[];
  serving: ServingInfo[];
  takeNumber: () => void;
  callNextCustomer: (clerkId: number) => void;
  finishService: (clerkId: number) => void;
  setClerkStatus: (clerkId: number, status: ClerkStatus) => void;
  addClerk: (name: string, windowNumber: number) => void;
  removeClerk: (clerkId: number) => void;
  servedCount: number;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

const initialClerks: Clerk[] = [
  { id: 1, name: 'علي أحمد', windowNumber: 1, status: ClerkStatus.AVAILABLE, customersServed: 0, totalServiceTime: 0, currentCustomerId: null },
  { id: 2, name: 'فاطمة خان', windowNumber: 2, status: ClerkStatus.AVAILABLE, customersServed: 0, totalServiceTime: 0, currentCustomerId: null },
  { id: 3, name: 'يوسف إبراهيم', windowNumber: 3, status: ClerkStatus.OFFLINE, customersServed: 0, totalServiceTime: 0, currentCustomerId: null },
];

export const QueueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
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
    setClerks(prevClerks => 
      prevClerks.map(clerk => 
        clerk.id === clerkId ? { ...clerk, status: ClerkStatus.BUSY } : clerk
      )
    );
    
    setCustomers(prevCustomers => {
      if (prevCustomers.length === 0) return [];
      
      const clerk = clerks.find(c => c.id === clerkId);
      if (!clerk) return prevCustomers;

      const [nextCustomer, ...remainingCustomers] = prevCustomers;
      
      setClerks(prev => prev.map(c => c.id === clerkId ? {...c, currentCustomerId: nextCustomer.id, status: ClerkStatus.BUSY} : c));

      const newServingInfo: ServingInfo = { clerk, customer: nextCustomer };
      setServing(prevServing => [...prevServing.filter(s => s.clerk.id !== clerkId), newServingInfo]);

      return remainingCustomers;
    });
  }, [clerks]);
  
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

  const addClerk = useCallback((name: string, windowNumber: number) => {
    setClerks(prev => [...prev, {
        id: Date.now(),
        name,
        windowNumber,
        status: ClerkStatus.OFFLINE,
        customersServed: 0,
        totalServiceTime: 0,
        currentCustomerId: null
    }]);
  }, []);
  
  const removeClerk = useCallback((clerkId: number) => {
    setClerks(prev => prev.filter(clerk => clerk.id !== clerkId));
  }, []);

  const value = {
    customers,
    clerks,
    serving,
    takeNumber,
    callNextCustomer,
    finishService,
    setClerkStatus,
    addClerk,
    removeClerk,
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