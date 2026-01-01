import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthServiceAdapter } from '../services/adapters/authServiceAdapter';
import type { User } from '../api/types';
import { authStorage } from '../lib/authStorage';

// Reusing generic User type but ensuring alignment
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  signOut: () => void;
  isAuthenticated: () => boolean;
  getAuthHeaders: () => HeadersInit;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = authStorage.getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      // Verify token purely client-side
      const validUser = await AuthServiceAdapter.verifyToken(token);
      if (validUser) {
        setUser(validUser as User);
        authStorage.setUser(validUser);
      } else {
        authStorage.clear();
        setUser(null);
      }
      setLoading(false);
    };
    init();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      // Local Auth Call - No Network API
      const response = await AuthServiceAdapter.login(email, password);

      if (response.requiresMFA) {
        // Handle MFA flow (not implemented in UI yet, avoiding complexity)
        return { error: 'MFA required (not implemented yet)' };
      }

      const { user, session } = response as any;

      authStorage.setToken(session.access_token);
      authStorage.setUser(user);
      setUser(user);
      return {};
    } catch (e: any) {
      console.error(e);
      return { error: e.message || 'Login failed' };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    try {
      // Local Auth Call
      const { user, session } = await AuthServiceAdapter.signup(email, password, name);

      authStorage.setToken(session.access_token);
      authStorage.setUser(user);
      setUser(user);
      return {};
    } catch (e: any) {
      console.error(e);
      return { error: e.message || 'Signup failed' };
    }
  }, []);

  const signOut = useCallback(() => {
    authStorage.clear();
    setUser(null);
  }, []);

  const getAuthHeaders = useCallback(() => {
    const token = authStorage.getToken();
    return {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    };
  }, []);

  const isAuthenticated = useCallback(() => !!user, [user]);

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, signOut, isAuthenticated, getAuthHeaders }}
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
