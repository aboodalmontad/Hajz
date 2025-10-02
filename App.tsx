
import React, { useState } from 'react';
import Header from './components/Header';
import AdminDashboard from './components/AdminDashboard';
import ClerkView from './components/ClerkView';
import MainDisplay from './components/MainDisplay';
import KioskView from './components/KioskView';
import ManagementView from './components/ManagementView';
import { View } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.KIOSK);

  const renderView = () => {
    switch (currentView) {
      case View.ADMIN:
        return <AdminDashboard />;
      case View.CLERK:
        return <ClerkView />;
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
      <Header currentView={currentView} setCurrentView={setCurrentView} />
      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
