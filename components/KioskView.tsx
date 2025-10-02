import React, { useState } from 'react';
import { useQueue } from '../context/QueueContext';

const KioskView: React.FC = () => {
  const { takeNumber, customers } = useQueue();
  const [showTicket, setShowTicket] = useState<boolean>(false);

  const handleTakeNumber = () => {
    takeNumber();
    setShowTicket(true);
    setTimeout(() => setShowTicket(false), 5000); // إخفاء التذكرة بعد 5 ثوانٍ
  };
  
  const lastTicket = customers.length > 0 ? customers[customers.length - 1].ticketNumber : '';

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg p-8">
      {showTicket && lastTicket ? (
        <div className="text-center text-white animate-fade-in-down">
          <h2 className="text-2xl font-light mb-2">رقم تذكرتك هو</h2>
          <p className="text-8xl font-black tracking-wider">{lastTicket}</p>
          <p className="mt-4 text-lg">يرجى الانتظار حتى يتم استدعاء رقمك.</p>
        </div>
      ) : (
        <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">أهلاً بك</h1>
            <p className="text-lg text-primary-200 mb-8 max-w-md mx-auto">اضغط على الزر أدناه للحصول على رقم تذكرتك والدخول إلى قائمة الانتظار.</p>
            <button
                onClick={handleTakeNumber}
                className="bg-white text-primary-600 font-bold text-2xl px-12 py-6 rounded-full shadow-2xl transform hover:scale-105 transition-transform duration-300 ease-in-out"
            >
                احصل على رقم
            </button>
        </div>
      )}
    </div>
  );
};

export default KioskView;
