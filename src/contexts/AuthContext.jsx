import { createContext, useContext } from 'react';
import { useAuth as useSupabaseAuth, AuthProvider as SupabaseAuthProvider } from './SupabaseAuthContext';

export const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  return (
    <SupabaseAuthProvider>
      {children}
    </SupabaseAuthProvider>
  )
};

export const useAuth = () => {
  const context = useSupabaseAuth();
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};