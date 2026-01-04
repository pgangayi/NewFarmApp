// Cloudflare API client with authentication
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

export const apiClient = {
  async request<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
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

  get<T = unknown>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  },

  post<T = unknown>(endpoint: string, data: Record<string, unknown>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  put<T = unknown>(endpoint: string, data: Record<string, unknown>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete<T = unknown>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
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
    const response = await apiClient.get('/api/auth/validate');
    return response.user || null;
  } catch (err) {
    return null;
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const response = await apiClient.post('/api/auth/login', { email, password });
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
    }
    return { data: response, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Login failed';
    return { data: null, error: errorMessage };
  }
};

export const signUp = async (email: string, password: string, name: string) => {
  try {
    const response = await apiClient.post('/api/auth/signup', { email, password, name });
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
    }
    return { data: response, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Signup failed';
    return { data: null, error: errorMessage };
  }
};

export const signOut = async () => {
  localStorage.removeItem('auth_token');
  return { error: null };
};
