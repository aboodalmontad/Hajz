import React, { useState } from 'react';
import { useQueue } from '../context/QueueContext';
import { Clerk } from '../types';

const ManagementView: React.FC = () => {
    const { clerks, addClerk, removeClerk } = useQueue();
    const [name, setName] = useState('');
    const [windowNumber, setWindowNumber] = useState('');

    const handleAddClerk = (e: React.FormEvent) => {
        e.preventDefault();
        const num = parseInt(windowNumber, 10);
        if (name.trim() && !isNaN(num) && num > 0) {
            addClerk(name, num);
            setName('');
            setWindowNumber('');
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">إدارة الموظفين والنوافذ</h1>

            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-semibold mb-4">إضافة موظف جديد</h2>
                <form onSubmit={handleAddClerk} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-1">
                        <label htmlFor="clerkName" className="block text-sm font-medium text-gray-700">اسم الموظف</label>
                        <input
                            type="text"
                            id="clerkName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="مثال: أحمد العلي"
                            required
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label htmlFor="windowNumber" className="block text-sm font-medium text-gray-700">رقم الشباك</label>
                        <input
                            type="number"
                            id="windowNumber"
                            value={windowNumber}
                            onChange={(e) => setWindowNumber(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="مثال: 5"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 transition"
                    >
                        إضافة موظف
                    </button>
                </form>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">الموظفون الحاليون</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الاسم</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الشباك</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">إجراءات</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {clerks.map((clerk) => (
                                <tr key={clerk.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{clerk.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{clerk.windowNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{clerk.status}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                                        <button
                                            onClick={() => removeClerk(clerk.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            إزالة
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ManagementView;
