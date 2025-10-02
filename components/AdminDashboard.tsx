import React, { useState, useMemo } from 'react';
import { useQueue } from '../context/QueueContext';
import { Clerk, ClerkStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getGeminiSuggestions } from '../services/geminiService';

const COLORS = {
  [ClerkStatus.AVAILABLE]: '#22c55e', // green-500
  [ClerkStatus.BUSY]: '#facc15', // yellow-400
  [ClerkStatus.OFFLINE]: '#6b7280', // gray-500
};

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
        <div className="p-3 bg-primary-100 text-primary-600 rounded-full ml-4">{icon}</div>
        <div>
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const AdminDashboard: React.FC = () => {
  const { clerks, customers, servedCount } = useQueue();
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState('');

  const clerkPerformanceData = useMemo(() => clerks.map(clerk => ({
    name: clerk.name,
    'العملاء المخدومون': clerk.customersServed,
    'متوسط وقت الخدمة (ث)': clerk.customersServed > 0 ? (clerk.totalServiceTime / clerk.customersServed).toFixed(2) : 0,
  })), [clerks]);

  const clerkStatusData = useMemo(() => {
    const statusCounts = clerks.reduce((acc, clerk) => {
        acc[clerk.status] = (acc[clerk.status] || 0) + 1;
        return acc;
    }, {} as Record<ClerkStatus, number>);
    
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [clerks]);

  const handleGetSuggestions = async () => {
    setLoadingSuggestions(true);
    setSuggestions('');
    try {
        const summary = `
        الحالة الحالية للطابور:
        - عملاء في الانتظار: ${customers.length}
        - إجمالي العملاء الذين تم خدمتهم اليوم: ${servedCount}
        - عدد الموظفين: ${clerks.length}
        - تفاصيل الموظفين:
        ${clerks.map(c =>
            `  - ${c.name} (شباك ${c.windowNumber}): الحالة=${c.status}, خدم=${c.customersServed}, متوسط الوقت=${(c.customersServed > 0 ? c.totalServiceTime / c.customersServed : 0).toFixed(2)} ثانية`
        ).join('\n')}
        `;
        const result = await getGeminiSuggestions(summary);
        setSuggestions(result);
    } catch (error) {
        console.error("Error fetching Gemini suggestions:", error);
        setSuggestions("تعذر استرداد الاقتراحات في الوقت الحالي. يرجى التحقق من مفتاح API الخاص بك واتصال الشبكة.");
    } finally {
        setLoadingSuggestions(false);
    }
  };

  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">لوحة تحكم المسؤول</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="عملاء في الانتظار" value={customers.length} icon={<UsersIcon />} />
            <StatCard title="إجمالي الخدمات اليوم" value={servedCount} icon={<CheckCircleIcon />} />
            <StatCard title="الموظفون النشطون" value={`${clerks.filter(c => c.status !== ClerkStatus.OFFLINE).length} / ${clerks.length}`} icon={<UserGroupIcon />} />
            <StatCard title="متوسط وقت الخدمة" value={`${(clerks.reduce((sum, c) => sum + c.totalServiceTime, 0) / (servedCount || 1)).toFixed(2)} ثانية`} icon={<ClockIcon />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">أداء الموظفين</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={clerkPerformanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="العملاء المخدومون" fill="#3b82f6" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">حالة الموظفين</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={clerkStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                            {clerkStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[entry.name as ClerkStatus]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">توصيات مدعومة بالذكاء الاصطناعي</h2>
            <p className="text-gray-600 mb-4">احصل على اقتراحات ذكية من Gemini AI لتحسين تدفق قائمة الانتظار وأداء الموظفين بناءً على البيانات الحالية.</p>
            <button
                onClick={handleGetSuggestions}
                disabled={loadingSuggestions}
                className="bg-primary-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-700 transition disabled:bg-gray-400 flex items-center"
            >
                {loadingSuggestions ? <SpinnerIcon /> : <SparklesIcon />}
                {loadingSuggestions ? 'جاري التحليل...' : 'احصل على توصيات'}
            </button>
            {suggestions && (
                 <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg text-right">
                    <h3 className="font-bold text-primary-800 mb-2">توصيات Gemini:</h3>
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">{suggestions}</div>
                </div>
            )}
        </div>
    </div>
  );
};

// Helper Icon Components
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a4 4 0 110-5.292" /></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UserGroupIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a3.002 3.002 0 013.445-2.288A5 5 0 0012 15a5 5 0 00-2.801-4.445A3.002 3.002 0 017.356 8.143M12 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm6 0a1 1 0 011 1v1h1a1 1 0 010 2h-1v1a1 1 0 01-2 0V6h-1a1 1 0 010-2h1V3a1 1 0 011-1zM5 12a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0v-1H3a1 1 0 010-2h1v-1a1 1 0 011-1zm6 0a1 1 0 011 1v1h1a1 1 0 010 2h-1v1a1 1 0 01-2 0v-1h-1a1 1 0 010-2h1v-1a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const SpinnerIcon = () => <svg className="animate-spin -mr-1 ml-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;

export default AdminDashboard;
