import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  created_at?: string;
}

interface AuthData {
  user: User;
  token: string;
}

interface AuthError {
  message: string;
}

const AUTH_TOKEN_KEY = 'auth_token';

async function parseJson(response: Response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

function extractErrorMessage(body: any, fallback: string) {
  if (!body) return fallback;
  if (typeof body.error === 'string') return body.error;
  if (typeof body.message === 'string') return body.message;
  return fallback;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      void validateToken(token);
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateToken = async (token: string) => {
    try {
      const response = await fetch('/api/auth/validate', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setUser(null);
        return;
      }

      const data = await parseJson(response);
      if (data?.user) {
        setUser(data.user);
      } else {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setUser(null);
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<{ data?: AuthData; error?: AuthError }> => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const body = await parseJson(response);

      if (!response.ok || !body?.token || !body?.user) {
        const message = extractErrorMessage(body, 'Unable to sign up. Please try again.');
        return { error: { message } };
      }

      localStorage.setItem(AUTH_TOKEN_KEY, body.token);
      setUser(body.user);

      return { data: { user: body.user, token: body.token } };
    } catch (error) {
      console.error('Signup failed:', error);
      return { error: { message: 'Unable to sign up. Please try again.' } };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ data?: AuthData; error?: AuthError }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const body = await parseJson(response);

      if (!response.ok || !body?.token || !body?.user) {
        const message = extractErrorMessage(body, 'Invalid credentials');
        return { error: { message } };
      }

      localStorage.setItem(AUTH_TOKEN_KEY, body.token);
      setUser(body.user);

      return { data: { user: body.user, token: body.token } };
    } catch (error) {
      console.error('Sign in failed:', error);
      return { error: { message: 'Unable to sign in. Please try again.' } };
    }
  };

  const signOut = async (): Promise<{ error?: AuthError }> => {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setUser(null);
      return {};
    } catch (error) {
      console.error('Sign out failed:', error);
      return { error: { message: 'Sign out failed' } };
    }
  };

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  };

  const isAuthenticated = () => Boolean(user) && Boolean(localStorage.getItem(AUTH_TOKEN_KEY));

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    getAuthHeaders,
    isAuthenticated,
  };
}