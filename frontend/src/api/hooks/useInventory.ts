import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/cloudflare';
import { QUERY_KEYS, CACHE_CONFIG } from '../constants';
import type { InventoryItem, CreateRequest, UpdateRequest } from '../types';

const INVENTORY_ENDPOINT = '/api/inventory';

export function useInventory(farm_id?: string) {
  return useQuery({
    queryKey: farm_id ? QUERY_KEYS.inventory.byFarm(farm_id) : QUERY_KEYS.inventory.all,
    queryFn: async () => {
      const endpoint = farm_id ? `${INVENTORY_ENDPOINT}?farm_id=${farm_id}` : INVENTORY_ENDPOINT;
      return await apiClient.get<InventoryItem[]>(endpoint);
    },
    staleTime: CACHE_CONFIG.staleTime.inventory,
  });
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.inventory.detail(id),
    queryFn: async () => {
      return await apiClient.get<InventoryItem>(`${INVENTORY_ENDPOINT}?id=${id}`);
    },
    enabled: !!id,
    staleTime: CACHE_CONFIG.staleTime.inventory,
  });
}

export function useInventoryLowStock(farm_id?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.inventory.lowStock(),
    queryFn: async () => {
      const endpoint = farm_id
        ? `${INVENTORY_ENDPOINT}?farm_id=${farm_id}&low_stock=true`
        : `${INVENTORY_ENDPOINT}?low_stock=true`;
      return await apiClient.get<InventoryItem[]>(endpoint);
    },
    staleTime: CACHE_CONFIG.staleTime.inventory,
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateRequest<InventoryItem>) => {
      return await apiClient.post<InventoryItem>(INVENTORY_ENDPOINT, data as any);
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
      return await apiClient.put<InventoryItem>(INVENTORY_ENDPOINT, { id, ...data });
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
      await apiClient.delete(`${INVENTORY_ENDPOINT}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory.all });
    },
  });
}
