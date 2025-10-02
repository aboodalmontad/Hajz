
import React, { useState, useMemo, useCallback } from 'react';
import Header from './components/Header';
import ClerkView from './components/ClerkView';
import MainDisplay from './components/MainDisplay';
import KioskView from './components/KioskView';
import ManagementView from './components/ManagementView';
import WindowSelectionView from './components/WindowSelectionView';
import { View, Clerk } from './types';
import { useQueue } from './context/QueueContext';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.KIOSK);
  const [loggedInClerkId, setLoggedInClerkId] = useState<number | null>(null);
  const { clerks, loginClerk, logoutClerk } = useQueue();

  const loggedInClerk = useMemo(() => {
    if (!loggedInClerkId) return null;
    return clerks.find(c => c.id === loggedInClerkId) || null;
  }, [clerks, loggedInClerkId]);

  const handleLogin = useCallback(async (username: string, password: string, windowId: number): Promise<string | null> => {
    const { clerk, error } = loginClerk(username, password, windowId);
    if (clerk) {
        setLoggedInClerkId(clerk.id);
        return null;
    } else {
        return error || "حدث خطأ غير متوقع.";
    }
  }, [loginClerk]);


  const handleLogout = useCallback(() => {
    if (loggedInClerk) {
      logoutClerk(loggedInClerk.id);
      setLoggedInClerkId(null);
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
        {renderView()}
      </main>
    </div>
  );
};

export default App;