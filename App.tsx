
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Header from './components/Header';
import ClerkView from './components/ClerkView';
import MainDisplay from './components/MainDisplay';
import KioskView from './components/KioskView';
import ManagementView from './components/ManagementView';
import WindowSelectionView from './components/WindowSelectionView';
import { View, Clerk } from './types';
import { useQueue } from './context/QueueContext';
import { useRole } from './context/RoleContext';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.KIOSK);
  const [loggedInClerkId, setLoggedInClerkId] = useState<number | null>(() => {
    // Restore logged-in state from session storage to persist across reloads
    const savedClerkId = sessionStorage.getItem('loggedInClerkId');
    return savedClerkId ? JSON.parse(savedClerkId) : null;
  });

  const { clerks, loginClerk, logoutClerk, multiServerWarning } = useQueue();
  const { setRole } = useRole();

  useEffect(() => {
    setRole(currentView === View.MANAGEMENT);
  }, [currentView, setRole]);

  const loggedInClerk = useMemo(() => {
    if (!loggedInClerkId) return null;
    return clerks.find(c => c.id === loggedInClerkId) || null;
  }, [clerks, loggedInClerkId]);

  const handleLogin = useCallback(async (username: string, password: string, windowId: number): Promise<string | null> => {
    const { clerk, error } = await loginClerk(username, password, windowId);
    if (clerk) {
        setLoggedInClerkId(clerk.id);
        sessionStorage.setItem('loggedInClerkId', JSON.stringify(clerk.id));
        return null;
    } else {
        return error || "حدث خطأ غير متوقع.";
    }
  }, [loginClerk]);


  const handleLogout = useCallback(() => {
    if (loggedInClerk) {
      logoutClerk(loggedInClerk.id);
      setLoggedInClerkId(null);
      sessionStorage.removeItem('loggedInClerkId');
      setCurrentView(View.CLERK); // Go back to window selection
    }
  }, [loggedInClerk, logoutClerk]);

  const renderView = () => {
    switch (currentView) {
      case View.CLERK:
        return loggedInClerk ? <ClerkView clerk={loggedInClerk} onLogout={handleLogout} /> : <WindowSelectionView onLogin={handleLogin} />;
      case View.DISPLAY:
        return <MainDisplay />;
      case View.KIOSK:
        return <KioskView />;
      case View.MANAGEMENT:
        return <ManagementView />;
      default:
        return <KioskView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        loggedInClerk={loggedInClerk}
      />
      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        {currentView === View.MANAGEMENT && multiServerWarning && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded-md" role="alert">
            <p className="font-bold">وضع القراءة فقط</p>
            <p>تم فتح واجهة إدارة أخرى بالفعل وهي تعمل كخادم. هذه الواجهة في وضع القراءة فقط لمنع التعارضات.</p>
          </div>
        )}
        {renderView()}
      </main>
    </div>
  );
};

export default App;
