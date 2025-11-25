// Unified API Client
// Single entry point for all API calls with feature flag support

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { featureFlags, shouldUseEnhancedAPIs } from '../config/featureFlags';
import { apiEndpoints } from '../config/env';
import { getAccessToken } from './authStorage';

interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// API endpoints mapping for basic vs enhanced APIs
const API_ENDPOINTS = {
  // Farms API
  farms: {
    basic: '/api/farms',
    enhanced: '/api/farms-enhanced',
  },
  // Animals API
  animals: {
    basic: apiEndpoints.animals.list,
    enhanced: apiEndpoints.animals.list,
  },
  // Fields API
  fields: {
    basic: '/api/fields',
    enhanced: '/api/fields-enhanced',
  },
  // Inventory API
  inventory: {
    basic: '/api/inventory',
    enhanced: '/api/inventory-enhanced',
  },
  // Tasks API
  tasks: {
    basic: '/api/tasks',
    enhanced: '/api/tasks-enhanced',
  },
  // Finance API
  finance: {
    basic: '/api/finance',
    enhanced: '/api/finance-enhanced',
  },
  // Analytics API
  analytics: {
    basic: '/api/analytics',
    enhanced: '/api/analytics',
  },
};

class UnifiedApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env['VITE_API_BASE_URL'] || 'http://localhost:8787';
  }

  private getEndpoint(resource: keyof typeof API_ENDPOINTS): string {
    const useEnhanced = shouldUseEnhancedAPIs() || featureFlags.enableEnhancedAPIs;
    const endpoint = API_ENDPOINTS[resource];

    if (typeof endpoint === 'string') {
      return endpoint;
    }

    return useEnhanced ? endpoint.enhanced : endpoint.basic;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const token = getAccessToken();

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Generic CRUD operations
  async get<T>(
    resource: keyof typeof API_ENDPOINTS,
    params?: Record<string, unknown>
  ): Promise<ApiResponse<T>> {
    const endpoint = this.getEndpoint(resource);
    const stringParams = Object.entries(params || {}).reduce(
      (acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      },
      {} as Record<string, string>
    );
    const queryString = params ? '?' + new URLSearchParams(stringParams).toString() : '';
    return this.request<T>(`${endpoint}${queryString}`);
  }

  async getPaginated<T>(
    resource: keyof typeof API_ENDPOINTS,
    page: number = 1,
    limit: number = 20,
    params?: Record<string, unknown>
  ): Promise<ApiResponse<PaginatedResponse<T>>> {
    const endpoint = this.getEndpoint(resource);
    const queryParams = {
      page: page.toString(),
      limit: limit.toString(),
      ...params,
    };
    const queryString = '?' + new URLSearchParams(queryParams).toString();
    return this.request<PaginatedResponse<T>>(`${endpoint}${queryString}`);
  }

  async post<T>(resource: keyof typeof API_ENDPOINTS, data: unknown): Promise<ApiResponse<T>> {
    const endpoint = this.getEndpoint(resource);
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(
    resource: keyof typeof API_ENDPOINTS,
    id: string | number,
    data: unknown
  ): Promise<ApiResponse<T>> {
    const endpoint = this.getEndpoint(resource);
    return this.request<T>(`${endpoint}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(
    resource: keyof typeof API_ENDPOINTS,
    id: string | number
  ): Promise<ApiResponse<T>> {
    const endpoint = this.getEndpoint(resource);
    return this.request<T>(`${endpoint}/${id}`, {
      method: 'DELETE',
    });
  }

  // Specific API methods with enhanced logic
  async getFarmsWithStats() {
    if (featureFlags.enableAdvancedDashboard) {
      return this.request('/api/farms-enhanced/stats');
    }
    return this.request('/api/farms');
  }

  async getInventoryWithAlerts() {
    if (featureFlags.enableAdvancedWidgets) {
      return this.request('/api/inventory-enhanced/alerts');
    }
    return this.request('/api/inventory');
  }

  async getAnalyticsData(farmId: string, timeframe: string = '30d') {
    if (featureFlags.enableAIAnalytics) {
      return this.request('/api/analytics-engine', {
        method: 'POST',
        body: JSON.stringify({ action: 'comprehensive', farmId, timeframe }),
      });
    }
    return this.request('/api/analytics', {
      method: 'POST',
      body: JSON.stringify({ action: 'basic', farmId, timeframe }),
    });
  }

  async getPredictiveInsights(farmId: string) {
    if (featureFlags.enablePredictiveAnalytics) {
      const queryString = new URLSearchParams({ farmId, action: 'predictive_insights' }).toString();
      return this.request(`/api/system-integration?${queryString}`);
    }
    return { data: { message: 'Predictive analytics not enabled' } };
  }
}

// Export singleton instance
export const unifiedApi = new UnifiedApiClient();

// React Query hooks using the unified API
export const useApi = () => {
  const queryClient = useQueryClient();

  return {
    // Farms
    useFarms: () =>
      useQuery({
        queryKey: ['farms'],
        queryFn: () => unifiedApi.getFarmsWithStats(),
      }),

    useCreateFarm: () =>
      useMutation({
        mutationFn: (data: unknown) => unifiedApi.post('farms', data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farms'] }),
      }),

    // Animals
    useAnimals: (farmId?: string) =>
      useQuery({
        queryKey: ['animals', farmId],
        queryFn: () => unifiedApi.get('animals', farmId ? { farmId } : undefined),
        enabled: !!farmId,
      }),

    useCreateAnimal: () =>
      useMutation({
        mutationFn: (data: unknown) => unifiedApi.post('animals', data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['animals'] }),
      }),

    // Fields
    useFields: (farmId?: string) =>
      useQuery({
        queryKey: ['fields', farmId],
        queryFn: () => unifiedApi.get('fields', farmId ? { farmId } : undefined),
        enabled: !!farmId,
      }),

    // Inventory
    useInventory: (farmId?: string) =>
      useQuery({
        queryKey: ['inventory', farmId],
        queryFn: () => unifiedApi.getInventoryWithAlerts(),
        enabled: !!farmId,
      }),

    // Analytics
    useAnalytics: (farmId: string, timeframe?: string) =>
      useQuery({
        queryKey: ['analytics', farmId, timeframe],
        queryFn: () => unifiedApi.getAnalyticsData(farmId, timeframe),
        enabled: !!farmId,
      }),

    usePredictiveInsights: (farmId: string) =>
      useQuery({
        queryKey: ['predictive-insights', farmId],
        queryFn: () => unifiedApi.getPredictiveInsights(farmId),
        enabled: !!farmId && featureFlags.enablePredictiveAnalytics,
      }),
  };
};

export default unifiedApi;
