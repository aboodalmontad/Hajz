import React from 'react';
import { useQueue } from '../context/QueueContext';

const MainDisplay: React.FC = () => {
  const { serving, windows } = useQueue();

  // Sort the serving list by customer arrival time to show them in order of their turn.
  const sortedServing = [...serving].sort((a, b) => a.customer.arrivalTime - b.customer.arrivalTime);

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg shadow-2xl h-full flex flex-col">
      <h1 className="text-4xl text-center font-bold mb-6 border-b-2 border-primary-500 pb-4">
        الخدمة الحالية
      </h1>
      <div className="flex flex-col gap-4 flex-grow overflow-y-auto px-2">
        {sortedServing.length > 0 ? (
          sortedServing.map(({ clerk, customer }) => {
            const window = windows.find(w => w.id === clerk.windowId);
            return (
              <div 
                key={clerk.id} 
                className="bg-primary-800 rounded-xl p-6 flex items-center justify-between transform transition-all duration-500 animate-fade-in-down"
              >
                <div className="text-center">
                  <div className="text-2xl text-primary-300 font-semibold mb-1">تذكرة</div>
                  <div className="text-7xl font-black text-white tracking-tighter">{customer.ticketNumber}</div>
                </div>
                <div className="text-5xl text-gray-400 font-light">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                <div className="text-center">
                  <div className="text-2xl text-primary-300 font-light">شباك</div>
                  <div className="text-7xl font-bold text-white">{window ? window.number : '-'}</div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="flex-grow flex items-center justify-center">
            <p className="text-4xl text-gray-500">في انتظار العميل التالي...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainDisplay;