import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  // Get wallet and user info from AuthContext instead
  const { user, isAuthenticated } = useAuth();

  return (
    <UserContext.Provider
      value={{
        userId: user?.id || '',
        setUserId: () => {}, // No-op - use AuthContext for auth
        walletBalance: user?.walletBalance || 0,
        loadingWallet: false,
        fetchWalletBalance: () => {}, // No-op - synced with AuthContext
        updateWalletBalance: () => {}, // No-op - use AuthContext
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Hook to use user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};
