import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, User } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async (): Promise<User | null> => {
    try {
      const response = await api.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data.user);
        return response.data.user;
      } else {
        setUser(null);
        return null;
      }
    } catch {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Listen for unauthorized events
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    if (response.success && response.data) {
      console.log('Login API response successful, verifying session...');

      // Wait for cookie to be set by browser
      await new Promise(resolve => setTimeout(resolve, 300));

      // Verify session is working by checking auth
      // Don't set user until we verify the session works
      const verifiedUser = await checkAuth();
      console.log('Session verification result:', verifiedUser);

      if (!verifiedUser) {
        // Check if cookies are enabled/working
        console.error('Session verification failed. Cookie may not be set correctly.');
        console.log('Document cookies:', document.cookie);
        throw new Error('Session could not be established. Please check that cookies are enabled and try again.');
      }
    } else {
      throw new Error(response.error || 'Login failed');
    }
  };

  const register = async (email: string, password: string) => {
    const response = await api.register(email, password);
    if (response.success && response.data) {
      // Small delay to ensure cookie is fully set in browser
      await new Promise(resolve => setTimeout(resolve, 100));
      // Verify session is working by checking auth
      const verifiedUser = await checkAuth();
      if (!verifiedUser) {
        throw new Error('Session could not be established. Please try again.');
      }
    } else {
      throw new Error(response.error || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
