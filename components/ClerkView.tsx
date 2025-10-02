import React from 'react';
import { useQueue } from '../context/QueueContext';
import { Clerk, ClerkStatus, Customer } from '../types';

const ClerkCard: React.FC<{
  clerk: Clerk;
  onCallNext: (clerkId: number) => void;
  onFinishService: (clerkId: number) => void;
  onSetStatus: (clerkId: number, status: ClerkStatus) => void;
  customer: Customer | undefined;
}> = ({ clerk, onCallNext, onFinishService, onSetStatus, customer }) => {
  
  const getStatusColor = (status: ClerkStatus) => {
    switch (status) {
      case ClerkStatus.AVAILABLE: return 'bg-green-500';
      case ClerkStatus.BUSY: return 'bg-yellow-500';
      case ClerkStatus.OFFLINE: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{clerk.name}</h3>
            <p className="text-gray-500">شباك {clerk.windowNumber}</p>
          </div>
          <span className={`px-3 py-1 text-sm font-semibold text-white rounded-full ${getStatusColor(clerk.status)}`}>
            {clerk.status}
          </span>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg text-center min-h-[100px] flex items-center justify-center">
          {clerk.status === ClerkStatus.BUSY && customer ? (
            <div>
              <p className="text-gray-500">يخدم الآن</p>
              <p className="text-4xl font-bold text-primary-600">{customer.ticketNumber}</p>
            </div>
          ) : (
            <p className="text-gray-400">في انتظار العميل التالي...</p>
          )}
        </div>
      </div>
      <div className="mt-6 space-y-2">
        <button
          onClick={() => onCallNext(clerk.id)}
          disabled={clerk.status !== ClerkStatus.AVAILABLE}
          className="w-full bg-primary-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          استدعاء العميل التالي
        </button>
        <button
          onClick={() => onFinishService(clerk.id)}
          disabled={clerk.status !== ClerkStatus.BUSY}
          className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          إنهاء الخدمة
        </button>
        <div className="flex gap-2">
           <button
             onClick={() => onSetStatus(clerk.id, clerk.status === ClerkStatus.OFFLINE ? ClerkStatus.AVAILABLE : ClerkStatus.OFFLINE)}
             className={`w-full font-bold py-2 px-4 rounded-lg transition ${
                clerk.status === ClerkStatus.OFFLINE
                ? 'bg-blue-200 text-blue-800 hover:bg-blue-300'
                : 'bg-red-200 text-red-800 hover:bg-red-300'
             }`}
           >
             {clerk.status === ClerkStatus.OFFLINE ? 'اتصال' : 'قطع الاتصال'}
           </button>
        </div>
      </div>
    </div>
  );
};


const ClerkView: React.FC = () => {
    const { clerks, callNextCustomer, finishService, setClerkStatus, serving } = useQueue();
  
    return (
      <div className="container mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">لوحة تحكم الموظف</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clerks.map(clerk => {
                  const currentCustomer = serving.find(s => s.clerk.id === clerk.id)?.customer;
                  return (
                      <ClerkCard 
                          key={clerk.id}
                          clerk={clerk}
                          customer={currentCustomer}
                          onCallNext={callNextCustomer}
                          onFinishService={finishService}
                          onSetStatus={setClerkStatus}
                      />
                  )
              })}
          </div>
      </div>
    );
  };
  
export default ClerkView;
