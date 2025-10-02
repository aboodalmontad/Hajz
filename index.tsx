
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { QueueProvider } from './context/QueueContext';
import { RoleProvider } from './context/RoleContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <RoleProvider>
      <QueueProvider>
        <App />
      </QueueProvider>
    </RoleProvider>
  </React.StrictMode>
);
