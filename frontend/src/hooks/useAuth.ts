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

const TOKEN_KEY = 'auth_token';

async function parseJson(response: Response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

function extractErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback;

  const errorBody = body as { error?: string; message?: string };

  if (typeof errorBody.error === 'string') return errorBody.error;
  if (typeof errorBody.message === 'string') return errorBody.message;
  return fallback;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void validateToken();
  }, []);

  const validateToken = async () => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch('/api/auth/validate', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Clean up on invalid token
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        return;
      }

      const data = await parseJson(response);
      if (data?.user) {
        setUser(data.user);
      } else {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      }
    } catch (error) {
      // Clean up on network errors or timeout - don't block the UI
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Auth validation timeout');
      } else {
        console.warn('Auth validation failed:', error);
      }
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name: string
  ): Promise<{ data?: AuthData; error?: AuthError }> => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const body = await parseJson(response);

      if (!response.ok || !body?.user || !body?.token) {
        const message = extractErrorMessage(body, 'Unable to sign up. Please try again.');
        return { error: { message } };
      }

      // Store token and user data
      localStorage.setItem(TOKEN_KEY, body.token);
      setUser(body.user);

      return { data: { user: body.user, token: body.token } };
    } catch (error) {
      // Handle signup error
      return { error: { message: 'Unable to sign up. Please try again.' } };
    }
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ data?: AuthData; error?: AuthError }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const body = await parseJson(response);

      if (!response.ok || !body?.user || !body?.token) {
        const message = extractErrorMessage(body, 'Invalid credentials');
        return { error: { message } };
      }

      // Store token and user data
      localStorage.setItem(TOKEN_KEY, body.token);
      setUser(body.user);

      return { data: { user: body.user, token: body.token } };
    } catch (error) {
      // Handle sign in error
      return { error: { message: 'Unable to sign in. Please try again.' } };
    }
  };

  const signOut = async (): Promise<{ error?: AuthError }> => {
    try {
      // Clear local storage
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      return {};
    } catch (error) {
      console.error('Sign out failed:', error);
      return { error: { message: 'Sign out failed' } };
    }
  };

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Include auth token if available
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  };

  const isAuthenticated = (): boolean => {
    return Boolean(user);
  };

  const isTokenValid = (): boolean => {
    return Boolean(user);
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    getAuthHeaders,
    isAuthenticated,
    isTokenValid,
  };
}
