import React, { useState, useEffect, useRef } from 'react';
import { useQueue } from '../context/QueueContext';

const KioskView: React.FC = () => {
  const { takeNumber, customers } = useQueue();
  const [showTicket, setShowTicket] = useState<boolean>(false);
  const [myTicketNumber, setMyTicketNumber] = useState<string | null>(null);
  const prevCustomerCount = useRef<number>(0);

  const handleTakeNumber = () => {
    prevCustomerCount.current = customers.length;
    takeNumber();
    setShowTicket(true);
    setMyTicketNumber(null); // إعادة تعيين ليعرض حالة التحميل '...'
    setTimeout(() => {
        setShowTicket(false);
    }, 5000); // إخفاء التذكرة بعد 5 ثوانٍ
  };
  
  useEffect(() => {
    // هذا التأثير يراقب التغييرات في قائمة العملاء
    // إذا كنا في وضع عرض التذكرة، ولم يتم تعيين رقم تذكرتنا بعد، وزاد عدد العملاء،
    // فهذا يعني أن تذكرتنا قد وصلت.
    if (showTicket && myTicketNumber === null && customers.length > prevCustomerCount.current) {
        // نفترض أن العميل الجديد في الفهرس القديم هو "نحن"
        const myCustomer = customers[prevCustomerCount.current];
        if (myCustomer) {
            setMyTicketNumber(myCustomer.ticketNumber);
        }
    }
  }, [customers, showTicket, myTicketNumber]);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg p-8">
      {showTicket ? (
        <div className="text-center text-white animate-fade-in-down">
          <h2 className="text-2xl font-light mb-2">رقم تذكرتك هو</h2>
          <p className="text-8xl font-black tracking-wider min-h-[110px] flex items-center justify-center">
            {myTicketNumber || '...'}
          </p>
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