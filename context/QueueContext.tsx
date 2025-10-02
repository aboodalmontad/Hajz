import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useReducer, useRef } from 'react';
import { Customer, Clerk, ClerkStatus, ServingInfo, Window } from '../types';
import { useRole } from './RoleContext';

// --- STATE AND REDUCER ---

interface FullQueueState {
  customers: Customer[];
  clerks: Clerk[];
  windows: Window[];
  serving: ServingInfo[];
  nextTicket: number;
  servedCount: number;
}

type QueueAction =
  | { type: 'SET_STATE', payload: FullQueueState }
  | { type: 'TAKE_NUMBER' }
  | { type: 'CALL_NEXT_CUSTOMER', payload: { clerkId: number } }
  | { type: 'FINISH_SERVICE', payload: { clerkId: number } }
  | { type: 'SET_CLERK_STATUS', payload: { clerkId: number, status: ClerkStatus } }
  | { type: 'ADD_CLERK', payload: { username: string, password: string } }
  | { type: 'REMOVE_CLERK', payload: { clerkId: number } }
  | { type: 'LOGIN_CLERK', payload: { clerk: Clerk } }
  | { type: 'LOGOUT_CLERK', payload: { clerkId: number } }
  | { type: 'ADD_WINDOW', payload: { number: number } }
  | { type: 'REMOVE_WINDOW', payload: { windowId: number } };

function queueReducer(state: FullQueueState, action: QueueAction): FullQueueState {
  switch (action.type) {
    case 'SET_STATE':
      return action.payload;
    case 'TAKE_NUMBER': {
      const newCustomer: Customer = { id: Date.now(), ticketNumber: `A-${state.nextTicket}`, arrivalTime: Date.now() };
      return { ...state, customers: [...state.customers, newCustomer], nextTicket: state.nextTicket + 1 };
    }
    case 'CALL_NEXT_CUSTOMER': {
      const { clerkId } = action.payload;
      const clerkIndex = state.clerks.findIndex(c => c.id === clerkId);
      if (clerkIndex === -1 || state.clerks[clerkIndex].status !== ClerkStatus.AVAILABLE || state.customers.length === 0) return state;

      const nextCustomer = state.customers[0];
      const updatedClerk: Clerk = { ...state.clerks[clerkIndex], currentCustomerId: nextCustomer.id, status: ClerkStatus.BUSY };
      const newClerks = [...state.clerks];
      newClerks[clerkIndex] = updatedClerk;
      const newServingInfo: ServingInfo = { clerk: updatedClerk, customer: nextCustomer };

      return {
        ...state,
        clerks: newClerks,
        customers: state.customers.slice(1),
        serving: [...state.serving.filter(s => s.clerk.id !== clerkId), newServingInfo],
      };
    }
    case 'FINISH_SERVICE': {
      const { clerkId } = action.payload;
      const servingInfo = state.serving.find(s => s.clerk.id === clerkId);
      if (!servingInfo) return state;

      const serviceDuration = (Date.now() - servingInfo.customer.arrivalTime) / 1000;
      const newClerks = state.clerks.map(clerk =>
        clerk.id === clerkId
          ? { ...clerk, status: ClerkStatus.AVAILABLE, customersServed: clerk.customersServed + 1, totalServiceTime: clerk.totalServiceTime + serviceDuration, currentCustomerId: null }
          : clerk
      );
      return {
        ...state,
        clerks: newClerks,
        serving: state.serving.filter(s => s.clerk.id !== clerkId),
        servedCount: state.servedCount + 1,
      };
    }
    case 'LOGIN_CLERK': {
      return { ...state, clerks: state.clerks.map(c => c.id === action.payload.clerk.id ? action.payload.clerk : c) };
    }
    case 'LOGOUT_CLERK': {
      const { clerkId } = action.payload;
      const newClerks = state.clerks.map(clerk =>
        clerk.id === clerkId
          ? { ...clerk, windowId: null, status: ClerkStatus.OFFLINE, currentCustomerId: null }
          : clerk
      );
      return { ...state, clerks: newClerks, serving: state.serving.filter(s => s.clerk.id !== clerkId) };
    }
    case 'SET_CLERK_STATUS': {
        const { clerkId, status } = action.payload;
        return {...state, clerks: state.clerks.map(c => c.id === clerkId ? { ...c, status } : c)};
    }
    case 'ADD_CLERK': {
        const { username, password } = action.payload;
        const newClerk: Clerk = { id: Date.now(), name: username, username, password, windowId: null, status: ClerkStatus.OFFLINE, customersServed: 0, totalServiceTime: 0, currentCustomerId: null };
        return { ...state, clerks: [...state.clerks, newClerk] };
    }
    case 'REMOVE_CLERK': {
        return { ...state, clerks: state.clerks.filter(c => c.id !== action.payload.clerkId) };
    }
    case 'ADD_WINDOW': {
        const { number } = action.payload;
        if (state.windows.some(w => w.number === number)) return state;
        const newWindows = [...state.windows, { id: Date.now(), number }].sort((a,b) => a.number - b.number);
        return { ...state, windows: newWindows };
    }
    case 'REMOVE_WINDOW': {
        return { ...state, windows: state.windows.filter(w => w.id !== action.payload.windowId) };
    }
    default:
      return state;
  }
}

// --- CONTEXT INTERFACE ---

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
  loginClerk: (username: string, password: string, windowId: number) => Promise<{ clerk?: Clerk; error?: string }>;
  logoutClerk: (clerkId: number) => void;
  addWindow: (number: number) => void;
  removeWindow: (windowId: number) => void;
  servedCount: number;
  multiServerWarning: boolean;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---

const CHANNEL_NAME = 'q-system-channel';
const SERVER_LOCK_NAME = 'q-system-server-lock';

const getInitialState = (): FullQueueState => {
    const customers = JSON.parse(localStorage.getItem('queue_customers') || '[]');
    const windows = JSON.parse(localStorage.getItem('queue_windows') || '[]');
    const savedClerks = JSON.parse(localStorage.getItem('queue_clerks') || '[]') as Clerk[];
    const clerks = savedClerks.map(clerk => ({ ...clerk, status: ClerkStatus.OFFLINE, windowId: null, currentCustomerId: null }));
    const nextTicket = JSON.parse(localStorage.getItem('queue_nextTicket') || '101');
    const servedCount = JSON.parse(localStorage.getItem('queue_servedCount') || '0');
    return { customers, clerks, windows, nextTicket, servedCount, serving: [] };
};


export const QueueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isServer } = useRole();
  const [isLeader, setIsLeader] = useState(false);
  const [multiServerWarning, setMultiServerWarning] = useState(false);
  
  const [state, dispatch] = useReducer(queueReducer, { customers: [], clerks: [], windows: [], serving: [], nextTicket: 101, servedCount: 0 });
  
  const channelRef = useRef<BroadcastChannel>();
  const loginPromises = useRef<Map<string, { resolve: (value: any) => void, reject: (reason?: any) => void }>>(new Map());

  // Leader election and server setup
  useEffect(() => {
    // هذا التأثير هو المسؤول عن عملية انتخاب القائد للنسخ التي تعمل كخادم.
    if (!isServer) {
        // إذا لم تكن هذه النسخة خادمًا (مثل الكشك أو واجهة الموظف)، فإنها لا تفعل شيئًا.
        setIsLeader(false);
        setMultiServerWarning(false);
        return;
    }

    // هذه النسخة تعمل في واجهة الإدارة، لذا ستحاول أن تصبح القائد/الخادم.
    let acquiredLock = false;
    navigator.locks.request(SERVER_LOCK_NAME, { ifAvailable: true }, async (lock) => {
        if (lock) {
            // تم الحصول على القفل بنجاح! هذه النافذة هي الآن الخادم الوحيد الموثوق.
            acquiredLock = true;
            setIsLeader(true);
            setMultiServerWarning(false);
            
            // بصفتها الخادم، تقوم بتحميل الحالة المحفوظة من localStorage.
            dispatch({ type: 'SET_STATE', payload: getInitialState() });
            
            // يتم الاحتفاظ بالقفل حتى يتم إغلاق النافذة، مما يمنع الخوادم الأخرى من البدء.
            await new Promise(() => {});
        } else {
            // القفل غير متاح، مما يعني أن نافذة إدارة أخرى هي الخادم بالفعل.
            setIsLeader(false);
            // ستعمل هذه النافذة في وضع العميل للقراءة فقط وتعرض تحذيرًا.
            setMultiServerWarning(true);
        }
    });

    return () => {
        if(acquiredLock) {
            // In a real scenario, we might need a way to release the lock, but for this app, tab closure is sufficient.
        }
    }
  }, [isServer]);

  // Communication channel setup and message handling
  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;
    
    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data;
      
      // القائد/الخادم هو الوحيد الذي يعالج الإجراءات من النوافذ الأخرى (العملاء).
      if (isLeader) {
        // يتعامل الخادم مع الإجراءات الواردة من العملاء
        switch(type) {
            case 'REQUEST_STATE':
                channel.postMessage({ type: 'STATE_UPDATE', payload: state });
                break;
            case 'LOGIN_CLERK': {
                const { username, password, windowId, clientId } = payload;
                const clerkToLogin = state.clerks.find(c => c.username === username && c.password === password);
                if (!clerkToLogin) {
                    channel.postMessage({ type: 'LOGIN_RESPONSE', payload: { error: "اسم المستخدم أو كلمة المرور غير صحيحة.", clientId }});
                    return;
                }
                if (clerkToLogin.status !== ClerkStatus.OFFLINE || clerkToLogin.windowId !== null) {
                    channel.postMessage({ type: 'LOGIN_RESPONSE', payload: { error: "هذا الموظف مسجل دخوله بالفعل في شباك آخر.", clientId }});
                    return;
                }
                const windowIsOccupied = state.clerks.some(c => c.windowId === windowId);
                if (windowIsOccupied) {
                    channel.postMessage({ type: 'LOGIN_RESPONSE', payload: { error: "هذا الشباك مشغول حاليًا.", clientId }});
                    return;
                }
                const loggedInClerk: Clerk = { ...clerkToLogin, windowId: windowId, status: ClerkStatus.AVAILABLE };
                dispatch({ type: 'LOGIN_CLERK', payload: { clerk: loggedInClerk } });
                channel.postMessage({ type: 'LOGIN_RESPONSE', payload: { clerk: loggedInClerk, clientId } });
                break;
            }
            default:
                dispatch(event.data);
        }
      } else {
        // يستمع العملاء فقط لتحديثات الحالة التي يبثها الخادم.
        if (type === 'STATE_UPDATE') {
            dispatch({ type: 'SET_STATE', payload: payload });
        } else if (type === 'LOGIN_RESPONSE' && loginPromises.current.has(payload.clientId)) {
            const promiseCallbacks = loginPromises.current.get(payload.clientId);
            if (promiseCallbacks) {
                // نمرر فقط الخصائص المتوقعة (clerk أو error) إلى دالة resolve
                // لضمان تطابق شكل البيانات مع نوع الإرجاع للدالة loginClerk.
                promiseCallbacks.resolve({ clerk: payload.clerk, error: payload.error });
                loginPromises.current.delete(payload.clientId);
            }
        }
      }
    };
    channel.addEventListener('message', handleMessage);

    // إذا كانت هذه النافذة عميلاً، فيجب أن تطلب الحالة الحالية من الخادم عند التحميل.
    if (!isLeader) {
        channel.postMessage({ type: 'REQUEST_STATE' });
    }
    
    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, [isLeader, state]);

  // Persist state to localStorage on the leader
  useEffect(() => {
      // هذا يضمن أن جميع البيانات يتم حفظها فقط بواسطة الخادم الموثوق.
      if (isLeader) {
        try {
            localStorage.setItem('queue_customers', JSON.stringify(state.customers));
            localStorage.setItem('queue_windows', JSON.stringify(state.windows));
            localStorage.setItem('queue_clerks', JSON.stringify(state.clerks));
            localStorage.setItem('queue_nextTicket', JSON.stringify(state.nextTicket));
            localStorage.setItem('queue_servedCount', JSON.stringify(state.servedCount));
        } catch (error) {
            console.error("Failed to save state to localStorage:", error);
        }
      }
  }, [state, isLeader]);
  
  // Broadcast state changes from the leader
  useEffect(() => {
    // كلما تغيرت حالة الخادم، فإنه يبث الحالة الجديدة إلى جميع العملاء.
    if(isLeader) {
        channelRef.current?.postMessage({ type: 'STATE_UPDATE', payload: state });
    }
  }, [state, isLeader]);

  // --- CONTEXT VALUE ---
  
  const postAction = useCallback((action: Omit<QueueAction, 'type'> & {type: string}) => {
      // إذا كانت هذه النسخة هي الخادم، فإنها ترسل الإجراء مباشرة إلى المخفض الخاص بها.
      if (isLeader) {
          dispatch(action);
      } else {
          // إذا كانت عميلاً، فإنها ترسل الإجراء عبر القناة ليقوم الخادم بمعالجته.
          channelRef.current?.postMessage(action);
      }
  }, [isLeader]);
  
  const loginClerk = useCallback(async (username: string, password: string, windowId: number): Promise<{ clerk?: Clerk; error?: string }> => {
    if (isLeader) {
        // منطق تسجيل الدخول من جانب الخادم
        const clerkToLogin = state.clerks.find(c => c.username === username && c.password === password);
        if (!clerkToLogin) return { error: "اسم المستخدم أو كلمة المرور غير صحيحة." };
        if (clerkToLogin.status !== ClerkStatus.OFFLINE || clerkToLogin.windowId !== null) return { error: "هذا الموظف مسجل دخوله بالفعل في شباك آخر." };
        const windowIsOccupied = state.clerks.some(c => c.windowId === windowId);
        if (windowIsOccupied) return { error: "هذا الشباك مشغول حاليًا." };

        const loggedInClerk: Clerk = { ...clerkToLogin, windowId: windowId, status: ClerkStatus.AVAILABLE };
        dispatch({ type: 'LOGIN_CLERK', payload: { clerk: loggedInClerk }});
        return { clerk: loggedInClerk };
    } else {
        // منطق تسجيل الدخول من جانب العميل
        const clientId = `login_${Date.now()}`;
        return new Promise((resolve, reject) => {
            loginPromises.current.set(clientId, { resolve, reject });
            channelRef.current?.postMessage({ type: 'LOGIN_CLERK', payload: { username, password, windowId, clientId } });
            setTimeout(() => { // مهلة زمنية لمنع الوعود المعلقة
                if(loginPromises.current.has(clientId)){
                    reject({ error: "انتهت مهلة طلب تسجيل الدخول. يرجى التأكد من أن واجهة 'الإدارة والتحكم' مفتوحة في علامة تبويب أخرى لتعمل كخادم." });
                    loginPromises.current.delete(clientId);
                }
            }, 10000);
        });
    }
  }, [isLeader, state.clerks]);

  const value = {
    ...state,
    takeNumber: () => postAction({ type: 'TAKE_NUMBER' }),
    callNextCustomer: (clerkId: number) => postAction({ type: 'CALL_NEXT_CUSTOMER', payload: { clerkId } }),
    finishService: (clerkId: number) => postAction({ type: 'FINISH_SERVICE', payload: { clerkId } }),
    setClerkStatus: (clerkId: number, status: ClerkStatus) => postAction({ type: 'SET_CLERK_STATUS', payload: { clerkId, status } }),
    addClerk: (username: string, password: string) => postAction({ type: 'ADD_CLERK', payload: { username, password } }),
    removeClerk: (clerkId: number) => postAction({ type: 'REMOVE_CLERK', payload: { clerkId } }),
    logoutClerk: (clerkId: number) => postAction({ type: 'LOGOUT_CLERK', payload: { clerkId } }),
    addWindow: (number: number) => postAction({ type: 'ADD_WINDOW', payload: { number } }),
    removeWindow: (windowId: number) => postAction({ type: 'REMOVE_WINDOW', payload: { windowId } }),
    loginClerk,
    multiServerWarning,
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
