import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, AuthResponse } from '../types/entities';
import { setAuth, getAuth, clearAuth, getAccessToken, getAuthHeadersFromStorage } from '../lib/authStorage';

interface AuthSession {
  access_token: string;
  refresh_token?: string;
  csrf_token?: string;
  expires_at?: number;
}

type AuthenticatedUser = User & { session?: AuthSession };

interface AuthError {
  message: string;
}

interface AuthResult {
  data?: AuthResponse;
  error?: AuthError;
}

interface AuthContextValue {
  user: AuthenticatedUser | null;
  session: AuthSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, name: string) => Promise<AuthResult>;
  signOut: () => Promise<{ error?: AuthError }>;
  refreshToken: () => Promise<AuthResult>;
  getAuthHeaders: () => Record<string, string>;
  isAuthenticated: () => boolean;
  isTokenValid: () => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const isBrowser = typeof window !== 'undefined';

const extractErrorMessage = (body: unknown, fallback: string): string => {
  if (!body || typeof body !== 'object') return fallback;

  const payload = body as Record<string, unknown>;
  if (typeof payload.error === 'string') return payload.error;
  if (typeof payload.message === 'string') return payload.message;
  if (payload.errors && Array.isArray(payload.errors) && payload.errors.length > 0) {
    const first = payload.errors[0];
    if (typeof first === 'string') return first;
    if (typeof first === 'object' && first && 'message' in first) {
      const message = (first as Record<string, unknown>).message;
      if (typeof message === 'string') return message;
    }
  }

  return fallback;
};

const buildAuthResponse = (
  user: User,
  token: string,
  refreshToken?: string,
  csrfToken?: string
): AuthResponse => ({
  user,
  session: {
    access_token: token,
    refresh_token: refreshToken,
    csrf_token: csrfToken,
  },
});

const createUserWithSession = (user: User, session: AuthSession): AuthenticatedUser => ({
  ...user,
  session,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  const updateState = (
    nextUser: User,
    token: string,
    refreshToken?: string,
    csrfToken?: string
  ) => {
    const nextSession: AuthSession = {
      access_token: token,
      refresh_token: refreshToken,
      csrf_token: csrfToken,
    };
    setSession(nextSession);
    setUser(createUserWithSession(nextUser, nextSession));
    // Persist full auth info
    try {
      setAuth({ user: nextUser, session: nextSession });
    } catch (_) {
      // ignore
    }
  };

  const clearState = () => {
    setUser(null);
    setSession(null);
    try {
      clearAuth();
    } catch (_) {}
  };

  const getAuthHeaders = useCallback(() => {
    // Prefer in-memory session, fall back to storage
    const headersFromStorage = getAuthHeadersFromStorage();
    // Merge with session-based CSRF if present
    const headers: Record<string, string> = { ...headersFromStorage };
    if (session?.csrf_token) {
      headers['X-CSRF-Token'] = session.csrf_token;
    }
    return headers;
  }, [session]);

  const validateToken = useCallback(async () => {
    const stored = getAuth();
    const token = stored?.session?.access_token || (isBrowser ? getAccessToken() : null);

    if (!token) {
      clearState();
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/validate', {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        clearState();
        setLoading(false);
        return;
      }

      const body = await response.json();
      if (!body?.data?.user) {
        clearState();
        setLoading(false);
        return;
      }

      updateState(body.data.user as User, token);
    } catch (error) {
      console.warn('Auth validation failed:', error);
      clearState();
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    void validateToken();
  }, [validateToken]);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const body = await response.json();

      if (!response.ok || !body?.user || !body?.accessToken) {
        const message = extractErrorMessage(body, 'Invalid credentials');
        return { error: { message } };
      }

      updateState(
        body.user as User,
        body.accessToken as string,
        body.refreshToken as string,
        body.csrfToken as string
      );
      return {
        data: buildAuthResponse(
          body.user as User,
          body.accessToken as string,
          body.refreshToken as string,
          body.csrfToken as string
        ),
      };
    } catch (error) {
      console.error('Sign in failed:', error);
      return { error: { message: 'Unable to sign in. Please try again.' } };
    }
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, name: string): Promise<AuthResult> => {
      try {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, name }),
        });

        const body = await response.json();

        if (!response.ok || !body?.user || !body?.accessToken) {
          const message = extractErrorMessage(body, 'Unable to create an account');
          return { error: { message } };
        }

        updateState(
          body.user as User,
          body.accessToken as string,
          body.refreshToken as string,
          body.csrfToken as string
        );
        return {
          data: buildAuthResponse(
            body.user as User,
            body.accessToken as string,
            body.refreshToken as string,
            body.csrfToken as string
          ),
        };
      } catch (error) {
        console.error('Sign up failed:', error);
        return { error: { message: 'Unable to sign up. Please try again.' } };
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    const token = readToken();
    clearState();

    if (!token) {
      return {};
    }

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch (error) {
      console.warn('Server sign out failed:', error);
    }

    return {};
  }, [getAuthHeaders]);

  const isAuthenticated = useCallback(() => Boolean(user), [user]);

  const isTokenValid = useCallback(() => Boolean(readToken()), []);

  const refreshToken = useCallback(async (): Promise<AuthResult> => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      const body = await response.json();

      if (!response.ok || !body?.user || !body?.accessToken) {
        const message = extractErrorMessage(body, 'Unable to refresh session');
        clearState();
        return { error: { message } };
      }

      updateState(
        body.user as User,
        body.accessToken as string,
        body.refreshToken as string,
        body.csrfToken as string
      );
      return {
        data: buildAuthResponse(
          body.user as User,
          body.accessToken as string,
          body.refreshToken as string,
          body.csrfToken as string
        ),
      };
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearState();
      return { error: { message: 'Unable to refresh session. Please sign in again.' } };
    }
  }, [getAuthHeaders]);

  const value: AuthContextValue = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshToken,
    getAuthHeaders,
    isAuthenticated,
    isTokenValid,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
