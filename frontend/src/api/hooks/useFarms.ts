import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/cloudflare';
import { QUERY_KEYS, CACHE_CONFIG } from '../constants';
import type { Farm, CreateRequest, UpdateRequest } from '../types';

export function useFarms(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: QUERY_KEYS.farms.list(filters),
    queryFn: async () => {
      const response = await apiClient.get<Farm[]>('/api/farms');
      return response;
    },
    staleTime: CACHE_CONFIG.staleTime.farms,
  });
}

export function useFarm(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.farms.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<Farm>(`/api/farms?id=${id}`);
      return response;
    },
    enabled: !!id,
    staleTime: CACHE_CONFIG.staleTime.farms,
  });
}

export function useFarmWithSelection() {
  const { data: farms = [], isLoading, error } = useFarms();

  // Simple implementation - returns first farm as selected
  // Pages can override this with their own selection logic
  const currentFarm = farms.length > 0 ? farms[0] : null;

  return {
    farms,
    currentFarm,
    isLoading,
    error,
  };
}

export function useCreateFarm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateRequest<Farm>) => {
      const response = await apiClient.post<Farm>('/api/farms', data as any);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.farms.all });
    },
  });
}

export function useUpdateFarm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRequest<Farm> }) => {
      const response = await apiClient.put<Farm>(`/api/farms/${id}`, data as any);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.farms.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.farms.detail(variables.id) });
    },
  });
}

export function useDeleteFarm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/farms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.farms.all });
    },
  });
}
