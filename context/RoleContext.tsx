import React, { createContext, useState, ReactNode, useMemo, useContext } from 'react';

interface RoleContextType {
  isServer: boolean;
  setRole: (isServer: boolean) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isServer, setIsServer] = useState(false);

  const value = useMemo(() => ({
    isServer,
    setRole: setIsServer,
  }), [isServer]);

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
