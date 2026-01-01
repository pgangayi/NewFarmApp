import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/cloudflare';
import { QUERY_KEYS, CACHE_CONFIG } from '../constants';
import type { InventoryItem, CreateRequest, UpdateRequest } from '../types';

export function useInventory(farmId?: string) {
  return useQuery({
    queryKey: farmId ? QUERY_KEYS.inventory.byFarm(farmId) : QUERY_KEYS.inventory.all,
    queryFn: async () => {
      const endpoint = farmId ? `/api/inventory?farm_id=${farmId}` : '/api/inventory';
      const response = await apiClient.get<InventoryItem[]>(endpoint);
      return response;
    },
    staleTime: CACHE_CONFIG.staleTime.inventory,
  });
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.inventory.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<InventoryItem>(`/api/inventory?id=${id}`);
      return response;
    },
    enabled: !!id,
    staleTime: CACHE_CONFIG.staleTime.inventory,
  });
}

export function useInventoryLowStock(farmId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.inventory.lowStock(),
    queryFn: async () => {
      const endpoint = farmId
        ? `/api/inventory?farm_id=${farmId}&low_stock=true`
        : '/api/inventory?low_stock=true';
      const response = await apiClient.get<InventoryItem[]>(endpoint);
      return response;
    },
    staleTime: CACHE_CONFIG.staleTime.inventory,
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateRequest<InventoryItem>) => {
      const response = await apiClient.post<InventoryItem>('/api/inventory', data as any);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory.all });
    },
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRequest<InventoryItem> }) => {
      const response = await apiClient.put<InventoryItem>('/api/inventory', { id, ...data });
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory.detail(variables.id) });
    },
  });
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/inventory/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory.all });
    },
  });
}
