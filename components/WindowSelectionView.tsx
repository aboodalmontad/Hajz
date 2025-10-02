
import React, { useState } from 'react';
import { useQueue } from '../context/QueueContext';
import { Window, Clerk } from '../types';

interface WindowSelectionViewProps {
    onLogin: (username: string, password: string, windowId: number) => Promise<string | null>;
}

const LoginModal: React.FC<{
    window: Window;
    onClose: () => void;
    onLogin: (username: string, password: string, windowId: number) => Promise<string | null>;
}> = ({ window, onClose, onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoggingIn(true);
        const loginError = await onLogin(username, password, window.id);
        if (loginError) {
            setError(loginError);
            setIsLoggingIn(false);
        }
        // On success, the app state changes and this component unmounts, so no need to handle the success case here.
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">تسجيل الدخول - شباك {window.number}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-3xl font-light">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                            اسم المستخدم
                        </label>
                        <input
                            id="username" name="username" type="text" autoComplete="username" required
                            value={username} onChange={(e) => setUsername(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            كلمة المرور
                        </label>
                        <input
                            id="password" name="password" type="password" autoComplete="current-password" required
                            value={password} onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                    </div>
                    {error && (
                        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
                            {error}
                        </div>
                    )}
                    <button
                        type="submit" disabled={isLoggingIn}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400"
                    >
                        {isLoggingIn ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const WindowSelectionView: React.FC<WindowSelectionViewProps> = ({ onLogin }) => {
    const { windows, clerks } = useQueue();
    const [selectedWindow, setSelectedWindow] = useState<Window | null>(null);

    const getClerkAtWindow = (windowId: number): Clerk | undefined => {
        return clerks.find(c => c.windowId === windowId);
    };

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold text-center text-gray-800 my-8">اختر شباكاً لتسجيل الدخول</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {windows.map(window => {
                    const servingClerk = getClerkAtWindow(window.id);
                    const isOccupied = !!servingClerk;

                    return (
                        <div
                            key={window.id}
                            onClick={() => !isOccupied && setSelectedWindow(window)}
                            className={`p-6 rounded-lg shadow-lg text-center transition-all duration-300 ease-in-out border-2 ${
                                isOccupied
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed border-gray-300'
                                    : 'bg-white hover:shadow-xl hover:-translate-y-1 cursor-pointer border-transparent hover:border-primary-500'
                            }`}
                        >
                            <div className="text-xl font-bold text-gray-400 mb-2">شباك</div>
                            <div className="text-7xl font-black text-primary-600">{window.number}</div>
                            <div className="mt-4 h-6 text-sm font-medium">
                                {isOccupied 
                                  ? <>
                                      <span className="text-red-600">مشغول</span>
                                      <span className="block text-xs text-gray-600">({servingClerk.name})</span>
                                    </>
                                  : <span className="text-green-600">متاح</span>
                                }
                            </div>
                        </div>
                    );
                })}
            </div>
            {selectedWindow && (
                <LoginModal
                    window={selectedWindow}
                    onClose={() => setSelectedWindow(null)}
                    onLogin={onLogin}
                />
            )}
        </div>
    );
};

export default WindowSelectionView;
