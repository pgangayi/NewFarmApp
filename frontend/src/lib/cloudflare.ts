import { User } from '../api/types';
import { apiConfig } from '../config/env';

// 1. Centralized Token Management
// Makes it easier to swap localStorage for Cookies/Memory later
const TOKEN_KEY = 'auth_token';

const TokenManager = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const API_BASE_URL = apiConfig.baseUrl.replace(/\/$/, ''); // Remove trailing slash if present
const CONTENT_TYPE = 'Content-Type';

interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined>;
  body?: Record<string, unknown> | FormData | null; // Explicit body types
  skipAuth?: boolean; // Optional: allows bypassing token injection
}

const buildUrl = (
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>
): string => {
  // 2. URL Sanitization (Prevent double slashes)
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let url = `${API_BASE_URL}${cleanEndpoint}`;

  // 3. Query Parameter Serialization
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  return url;
};

const prepareHeadersAndBody = (
  options: ApiRequestOptions
): { headers: Headers; body: BodyInit | null } => {
  // 4. Header & Body Logic
  const headers = new Headers(options.headers);

  // Auth Token Injection
  if (!options.skipAuth) {
    const token = TokenManager.get();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  let body: BodyInit | null = null;

  // Handle JSON vs FormData automatically
  if (options.body) {
    if (options.body instanceof FormData) {
      // browser sets Content-Type automatically for FormData (multipart/form-data + boundary)
      body = options.body;
      // Explicitly delete Content-Type if it was accidentally set, or browser will fail to add boundary
      if (headers.has(CONTENT_TYPE)) {
        headers.delete(CONTENT_TYPE);
      }
    } else {
      // It's a plain object, send as JSON
      body = JSON.stringify(options.body);
      if (!headers.has(CONTENT_TYPE)) {
        headers.set(CONTENT_TYPE, 'application/json');
      }
    }
  }

  return { headers, body };
};

export const apiClient = {
  async request<T = unknown>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    const url = buildUrl(endpoint, options.params);
    const { headers, body } = prepareHeadersAndBody(options);

    // 5. Execution
    const response = await fetch(url, {
      ...options,
      headers,
      body,
    });

    // 6. robust Error Handling
    if (!response.ok) {
      // Try to parse error JSON, fallback to status text
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error ||
          errorData.message ||
          `Request failed: ${response.status} ${response.statusText}`
      );
    }

    // 7. Handle 204 No Content (Prevents crash on empty responses)
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  },

  get<T = unknown>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T = unknown>(
    endpoint: string,
    data: Record<string, unknown>,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body: data });
  },

  put<T = unknown>(
    endpoint: string,
    data: Record<string, unknown>,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body: data });
  },

  delete<T = unknown>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  },

  // Now uses the main request method, inheriting all error handling and auth logic
  upload<T = unknown>(
    endpoint: string,
    formData: FormData,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
    });
  },
};

// --- Auth Helpers ---

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await apiClient.get<{ user: User }>('/api/auth/me');
    return response.user || null;
  } catch (err) {
    // Optional: Check if error is 401, then clear token
    return null;
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const response = await apiClient.post<{ token: string; user: User }>('/api/auth/login', {
      email,
      password,
    });

    if (response.token) {
      TokenManager.set(response.token);
    }

    return { data: response, error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Login failed';
    return { data: null, error: { message: errorMessage } };
  }
};

export const signUp = async (email: string, password: string, name: string) => {
  try {
    const response = await apiClient.post<{ token: string; user: User }>('/api/auth/signup', {
      email,
      password,
      name,
    });

    if (response.token) {
      TokenManager.set(response.token);
    }

    return { data: response, error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Signup failed';
    return { data: null, error: { message: errorMessage } };
  }
};

export const signOut = async () => {
  TokenManager.clear();
  // Optional: Call API to invalidate token on server side
  // await apiClient.post('/api/auth/logout', {});
  return { error: null };
};
