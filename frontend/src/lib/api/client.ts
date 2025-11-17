/**
 * Centralized API Client for Farmers Boot
 * Handles authentication, error handling, retries, and request/response formatting
 */

export class ApiError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export interface ApiClientConfig {
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
}

export interface RequestOptions extends RequestInit {
  data?: unknown;
  params?: Record<string, unknown>;
  skipAuth?: boolean;
}

/**
 * ApiClient - Centralized HTTP client with auth, error handling, and retries
 */
export class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private retryAttempts: number;
  private getAuthHeaders: (() => Record<string, string>) | null = null;

  constructor(config: ApiClientConfig = {}) {
    const metaEnv = import.meta.env as Record<string, unknown>;
    const envBaseUrl =
      (typeof metaEnv['VITE_API_URL'] === 'string'
        ? (metaEnv['VITE_API_URL'] as string)
        : undefined) ||
      (typeof metaEnv['VITE_API_BASE_URL'] === 'string'
        ? (metaEnv['VITE_API_BASE_URL'] as string)
        : undefined);
    const browserBase =
      typeof window !== 'undefined' && window.location ? window.location.origin : '';
    this.baseUrl = config.baseUrl ?? envBaseUrl ?? browserBase;
    this.timeout = config.timeout || 30000;
    this.retryAttempts = config.retryAttempts || 3;
  }

  /**
   * Set the auth header getter function
   */
  setAuthHeadersGetter(fn: () => Record<string, string>) {
    this.getAuthHeaders = fn;
  }

  /**
   * Build the full URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, unknown>): string {
    const isAbsolute = /^https?:\/\//i.test(endpoint);
    const base =
      this.baseUrl ||
      (typeof window !== 'undefined' && window.location ? window.location.origin : '');

    let urlString: string;

    if (isAbsolute) {
      urlString = endpoint;
    } else if (base) {
      urlString = new URL(endpoint, base).toString();
    } else {
      urlString = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    }

    if (!params || Object.keys(params).length === 0) {
      return urlString;
    }

    if (/^https?:\/\//i.test(urlString)) {
      const url = new URL(urlString);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
      return url.toString();
    }

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const separator = urlString.includes('?') ? '&' : '?';
    return `${urlString}${separator}${searchParams.toString()}`;
  }

  /**
   * Get default headers including auth
   */
  private getHeaders(options: RequestOptions = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (options.headers && typeof options.headers === 'object') {
      Object.assign(headers, options.headers);
    }

    if (!options.skipAuth && this.getAuthHeaders) {
      Object.assign(headers, this.getAuthHeaders());
    }

    return headers;
  }

  /**
   * Perform request with retry logic and error handling
   */
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
      try {
        const url = this.buildUrl(endpoint, options.params);
        const body = options.data ? JSON.stringify(options.data) : undefined;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const fetchOptions: RequestInit = {
          ...options,
          headers: this.getHeaders(options),
          signal: controller.signal,
        };

        if (body !== undefined) {
          fetchOptions.body = body;
        }

        const response = await fetch(url, fetchOptions);

        clearTimeout(timeoutId);

        // Handle successful response
        if (response.ok) {
          const contentType = response.headers.get('content-type');

          // Return empty response for 204 No Content
          if (response.status === 204) {
            return {} as T;
          }

          // Parse JSON if response has JSON content type
          if (contentType?.includes('application/json')) {
            return await response.json();
          }

          // Parse other content types
          return (await response.text()) as T;
        }

        // Handle error responses
        let errorMessage = response.statusText || 'Unknown error';
        let errorDetails: unknown = {};

        try {
          errorDetails = await response.json();
          if (typeof errorDetails === 'object' && errorDetails !== null) {
            const errorObj = errorDetails as Record<string, unknown>;
            errorMessage = String(errorObj['error'] || errorObj['message'] || errorMessage);
          }
        } catch {
          // Response is not JSON, use status text
        }

        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw new ApiError(response.status, errorMessage, errorDetails);
        }

        // Retry on server errors (5xx) and rate limits (429)
        lastError = new ApiError(response.status, errorMessage, errorDetails);

        if (attempt < this.retryAttempts) {
          // Exponential backoff: 100ms, 200ms, 400ms, etc.
          const delay = Math.pow(2, attempt) * 100;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        if (error instanceof ApiError) {
          lastError = error;
        } else if (error instanceof TypeError && error.name === 'AbortError') {
          lastError = new ApiError(408, 'Request timeout');
        } else {
          lastError = new ApiError(500, 'Network error', error);
        }

        // Don't retry on abort or network errors
        if (error instanceof TypeError) {
          throw lastError;
        }

        // Retry on other errors
        if (attempt < this.retryAttempts) {
          const delay = Math.pow(2, attempt) * 100;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new ApiError(500, 'Request failed after retries');
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      data,
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      data,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      data,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }
}

/**
 * Global API client instance
 */
let globalApiClient: ApiClient | null = null;

/**
 * Initialize the global API client
 */
export function initializeApiClient(config: ApiClientConfig = {}) {
  globalApiClient = new ApiClient(config);
  return globalApiClient;
}

/**
 * Get the global API client instance
 */
export function getApiClient(): ApiClient {
  if (!globalApiClient) {
    globalApiClient = new ApiClient();
  }
  return globalApiClient;
}

/**
 * Hook-compatible version - call this in your component/hook
 * Usage: const api = useApiClient();
 */
export function createApiClient(getAuthHeaders: () => Record<string, string>): ApiClient {
  const client = getApiClient();
  client.setAuthHeadersGetter(getAuthHeaders);
  return client;
}
