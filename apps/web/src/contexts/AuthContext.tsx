import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@/types';
import { apiClient } from '@/lib/api-client';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('revops_auth_token'),
  );
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session
  useEffect(() => {
    async function initSession() {
      const storedToken = localStorage.getItem('revops_auth_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await apiClient.getCurrentUser();
        setUser(currentUser);
      } catch {
        localStorage.removeItem('revops_auth_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    initSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const session = await apiClient.login(email, password);
      localStorage.removeItem('revops_active_org_id');
      localStorage.setItem('revops_auth_token', session.accessToken);
      setToken(session.accessToken);
      setUser(session.user);

    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('revops_auth_token');
    localStorage.removeItem('revops_active_org_id');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
