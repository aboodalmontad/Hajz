import React from 'react';
import { useQueue } from '../context/QueueContext';

const MainDisplay: React.FC = () => {
  const { serving } = useQueue();

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg shadow-2xl h-full flex flex-col">
      <h1 className="text-4xl text-center font-bold mb-6 border-b-2 border-primary-500 pb-4">
        الخدمة الحالية
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-grow">
        {serving.length > 0 ? (
          serving.map(({ clerk, customer }) => (
            <div key={clerk.id} className="bg-primary-800 rounded-xl p-8 flex flex-col items-center justify-center transform transition-all duration-500 animate-fade-in">
              <div className="text-2xl text-primary-300 font-semibold mb-2">تذكرة</div>
              <div className="text-8xl font-black text-white tracking-tighter mb-4">{customer.ticketNumber}</div>
              <div className="text-3xl text-primary-300 font-light">شباك</div>
              <div className="text-6xl font-bold text-white">{clerk.windowNumber}</div>
            </div>
          ))
        ) : (
          <div className="col-span-full flex items-center justify-center">
            <p className="text-4xl text-gray-500">في انتظار العميل التالي...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainDisplay;
