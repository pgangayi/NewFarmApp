/**
 * LOCATION HOOKS
 * ==============
 * TanStack Query hooks for location operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/cloudflare';
import { QUERY_KEYS, CACHE_CONFIG, API_ENDPOINTS } from '../constants';
import type { Location, CreateRequest, UpdateRequest } from '../types';

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch all locations, optionally filtered by farm
 */
export function useLocations(farmId?: string) {
  return useQuery({
    queryKey: farmId ? QUERY_KEYS.locations.byFarm(farmId) : QUERY_KEYS.locations.all,
    queryFn: async () => {
      const endpoint: string = farmId
        ? `${API_ENDPOINTS.locations.list}?farm_id=${farmId}`
        : API_ENDPOINTS.locations.list;
      return await apiClient.get<Location[]>(endpoint);
    },
    staleTime: CACHE_CONFIG.staleTime.locations,
    gcTime: CACHE_CONFIG.gcTime.default,
  });
}

/**
 * Fetch a single location by ID
 */
export function useLocation(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.locations.detail(id),
    queryFn: async () => {
      return await apiClient.get<Location>(API_ENDPOINTS.locations.detail(id));
    },
    enabled: !!id,
    staleTime: CACHE_CONFIG.staleTime.locations,
    gcTime: CACHE_CONFIG.gcTime.default,
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new location
 */
export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRequest<Location>) => {
      return await apiClient.post<Location>(API_ENDPOINTS.locations.create, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.locations.all });
    },
  });
}

/**
 * Update an existing location
 */
export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRequest<Location> }) => {
      return await apiClient.put<Location>(API_ENDPOINTS.locations.update(id), data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.locations.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.locations.detail(variables.id) });
    },
  });
}

/**
 * Delete a location
 */
export function useDeleteLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(API_ENDPOINTS.locations.delete(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.locations.all });
    },
  });
}
