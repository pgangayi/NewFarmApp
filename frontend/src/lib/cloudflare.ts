// Cloudflare API client with authentication
import { User } from '../api/types';
import { apiConfig } from '../config/env';

const API_BASE_URL = apiConfig.baseUrl;

const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

interface ApiRequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export const apiClient = {
  async request<T = unknown>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    let url = `${API_BASE_URL}${endpoint}`;

    if (options.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    const token = getAuthToken();

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API request failed: ${response.statusText}`);
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
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  put<T = unknown>(
    endpoint: string,
    data: Record<string, unknown>,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete<T = unknown>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  },

  // File upload method (doesn't set Content-Type to allow FormData boundary)
  upload<T = unknown>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getAuthToken();

    return fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    }).then(async response => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
      }
      return response.json();
    });
  },
};

export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get<{ user: User }>('/api/auth/validate');
    return response.user || null;
  } catch (err) {
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
      localStorage.setItem('auth_token', response.token);
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
      localStorage.setItem('auth_token', response.token);
    }
    return { data: response, error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Signup failed';
    return { data: null, error: { message: errorMessage } };
  }
};

export const signOut = async () => {
  localStorage.removeItem('auth_token');
  return { error: null };
};
