import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@/types';
import { apiClient } from '@/lib/api-client';
import { MOCK_USERS } from '@/lib/mock-data';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  roleName: string;
  permissions: string[];
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUserRole: (role: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('revops_auth_token'));
  const [user, setUser] = useState<User | null>(null);
  const [roleName, setRoleName] = useState<string>('Organization Admin');
  const [permissions, setPermissions] = useState<string[]>(['*']);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session
  useEffect(() => {
    async function initSession() {
      const storedToken = localStorage.getItem('revops_auth_token');
      if (!storedToken) {
        // Auto-initialize with Admin demo user for seamless Phase 1 review if not logged in
        const defaultDemo = MOCK_USERS[0];
        if (defaultDemo) {
          localStorage.setItem('revops_auth_token', defaultDemo.token);
          setToken(defaultDemo.token);
          setUser(defaultDemo.user);
          setRoleName(defaultDemo.role);
          setPermissions(defaultDemo.permissions);
        }
        setIsLoading(false);
        return;
      }

      try {
        const foundMock = MOCK_USERS.find((u) => u.token === storedToken);
        if (foundMock) {
          setUser(foundMock.user);
          setRoleName(foundMock.role);
          setPermissions(foundMock.permissions);
        } else {
          const currentUser = await apiClient.getCurrentUser();
          setUser(currentUser);
          setRoleName('Organization Admin');
          setPermissions(['*']);
        }
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
      localStorage.setItem('revops_auth_token', session.accessToken);
      setToken(session.accessToken);
      setUser(session.user);

      // Find role / permissions matching email
      const matched = MOCK_USERS.find(
        (u) => u.user.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (matched) {
        setRoleName(matched.role);
        setPermissions(matched.permissions);
      } else {
        setRoleName('Organization Admin');
        setPermissions(['*']);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('revops_auth_token');
    localStorage.removeItem('revops_active_org_id');
    setToken(null);
    setUser(null);
    setRoleName('');
    setPermissions([]);
  }, []);

  const setUserRole = useCallback((role: string) => {
    const found = MOCK_USERS.find((u) => u.role === role);
    if (found) {
      setRoleName(found.role);
      setPermissions(found.permissions);
      setUser(found.user);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        roleName,
        permissions,
        login,
        logout,
        setUserRole,
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
