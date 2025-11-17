// Centralized auth storage helper
// Persists the full auth payload (user + session) and keeps the legacy `auth_token` in sync

export const AUTH_SESSION_KEY = 'auth_session';
export const AUTH_TOKEN_KEY = 'auth_token';

export interface AuthSession {
  access_token: string;
  refresh_token?: string;
  csrf_token?: string;
  expires_at?: number;
}

export interface StoredAuth {
  user?: unknown;
  session?: AuthSession | null;
}

export function setAuth(stored: StoredAuth) {
  try {
    if (typeof window === 'undefined') return;
    if (stored) {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(stored));
      if (stored.session && stored.session.access_token) {
        localStorage.setItem(AUTH_TOKEN_KEY, stored.session.access_token);
      }
    }
  } catch (err) {
    // ignore storage errors
  }
}

export function getAuth(): StoredAuth | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuth;
  } catch (err) {
    return null;
  }
}

export function clearAuth() {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (err) {
    // ignore
  }
}

export function getAccessToken(): string | null {
  try {
    const auth = getAuth();
    if (auth?.session?.access_token) return auth.session.access_token;
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getAuthHeadersFromStorage(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = getAccessToken();
  const auth = getAuth();
  const csrf = auth?.session?.csrf_token;

  if (token) headers.Authorization = `Bearer ${token}`;
  if (csrf) headers['X-CSRF-Token'] = csrf;

  return headers;
}

export default {
  setAuth,
  getAuth,
  clearAuth,
  getAccessToken,
  getAuthHeadersFromStorage,
};
