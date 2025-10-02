import React from 'react';
import { View } from '../types';

interface HeaderProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const NavButton: React.FC<{
  view: View;
  currentView: View;
  onClick: (view: View) => void;
  children: React.ReactNode;
}> = ({ view, currentView, onClick, children }) => (
  <button
    onClick={() => onClick(view)}
    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
      currentView === view
        ? 'bg-primary-700 text-white'
        : 'text-gray-300 hover:bg-primary-600 hover:text-white'
    }`}
  >
    {children}
  </button>
);

const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView }) => {
  return (
    <header className="bg-primary-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a3.002 3.002 0 013.445-2.288A5 5 0 0012 15a5 5 0 00-2.801-4.445A3.002 3.002 0 017.356 8.143M12 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
            </svg>
            <span className="text-white text-xl font-bold ms-3">طابور ذكي</span>
          </div>
          <nav className="flex gap-x-2">
            <NavButton view={View.KIOSK} currentView={currentView} onClick={setCurrentView}>{View.KIOSK}</NavButton>
            <NavButton view={View.DISPLAY} currentView={currentView} onClick={setCurrentView}>{View.DISPLAY}</NavButton>
            <NavButton view={View.CLERK} currentView={currentView} onClick={setCurrentView}>{View.CLERK}</NavButton>
            <NavButton view={View.MANAGEMENT} currentView={currentView} onClick={setCurrentView}>{View.MANAGEMENT}</NavButton>
            <NavButton view={View.ADMIN} currentView={currentView} onClick={setCurrentView}>{View.ADMIN}</NavButton>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
