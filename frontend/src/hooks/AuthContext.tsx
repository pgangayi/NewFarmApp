import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  signIn as apiSignIn,
  signUp as apiSignUp,
  getCurrentUser as apiGetCurrentUser,
} from '../lib/cloudflare';
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

      try {
        // Verify token with backend
        const validUser = await apiGetCurrentUser();
        if (validUser) {
          setUser(validUser as User);
          authStorage.setUser(validUser);
        } else {
          authStorage.clear();
          setUser(null);
        }
      } catch (e) {
        authStorage.clear();
        setUser(null);
      }
      setLoading(false);
    };
    init();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await apiSignIn(email, password);

      if (error) {
        return { error: error.message || 'Login failed' };
      }

      const response = data as any;
      const user = response.user;
      const token = response.token || response.accessToken;

      if (token) {
        authStorage.setToken(token);
      }

      if (user) {
        authStorage.setUser(user);
        setUser(user);
      }

      return {};
    } catch (e: any) {
      console.error(e);
      return { error: e.message || 'Login failed' };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await apiSignUp(email, password, name);

      if (error) {
        return { error: error.message || 'Signup failed' };
      }

      const response = data as any;
      const user = response.user;
      const token = response.token || response.accessToken;

      if (token) {
        authStorage.setToken(token);
      }

      if (user) {
        authStorage.setUser(user);
        setUser(user);
      }

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
