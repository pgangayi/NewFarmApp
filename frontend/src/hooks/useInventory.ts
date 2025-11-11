/**
 * Custom hook for inventory management
 * Encapsulates all inventory-related API calls and mutations
 * Single source of truth for inventory operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useFarm } from './useFarm';
import { InventoryItem, CreateInventoryForm } from '../types/entities';
import { apiEndpoints, cacheConfig } from '../config/env';
import { getApiClient } from '../lib/api/client';

/**
 * Hook for managing inventory items
 * Provides CRUD operations and state management for inventory
 */
export function useInventory() {
  const { currentFarm } = useFarm();
  const { isAuthenticated } = useAuth();
  const apiClient = getApiClient();
  const queryClient = useQueryClient();

  // Query: Fetch all inventory items for the farm
  const {
    data: items = [],
    isLoading,
    error,
    refetch,
    isError,
  } = useQuery({
    queryKey: ['inventory', currentFarm?.id],
    queryFn: async () => {
      if (!currentFarm?.id) return [];
      return apiClient.get<InventoryItem[]>(apiEndpoints.inventory.list);
    },
    enabled: !!currentFarm?.id && isAuthenticated(),
    staleTime: cacheConfig.staleTime.medium,
    gcTime: cacheConfig.gcTime.medium,
    retry: 2,
    select: data => {
      // Sort by stock status (critical first, then low, then normal)
      return [...data].sort((a, b) => {
        const statusOrder: Record<string, number> = {
          critical: 0,
          low: 1,
          normal: 2,
        };
        return (
          (statusOrder[a.stock_status || 'normal'] || 2) -
          (statusOrder[b.stock_status || 'normal'] || 2)
        );
      });
    },
  });

  // Mutation: Create new inventory item
  const createItemMutation = useMutation({
    mutationFn: async (data: CreateInventoryForm) => {
      return apiClient.post<InventoryItem>(apiEndpoints.inventory.create, {
        farm_id: currentFarm?.id,
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  // Mutation: Update inventory item
  const updateItemMutation = useMutation({
    mutationFn: async (item: Partial<InventoryItem> & { id: string }) => {
      const { id, ...data } = item;
      return apiClient.put<InventoryItem>(apiEndpoints.inventory.update, { id, ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  // Mutation: Delete inventory item
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(apiEndpoints.inventory.delete(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  // Computed: Count items by status
  const itemsByStatus = {
    critical: items.filter(item => item.stock_status === 'critical').length,
    low: items.filter(item => item.stock_status === 'low').length,
    normal: items.filter(item => item.stock_status === 'normal').length,
  };

  // Computed: Total inventory value
  const totalValue = items.reduce((sum, item) => {
    const value = (item.current_cost_per_unit || 0) * item.qty;
    return sum + value;
  }, 0);

  // Computed: Check if unknown critical stock warnings
  const hasCriticalStock = itemsByStatus.critical > 0;

  return {
    // Data
    items,
    itemsByStatus,
    totalValue,
    hasCriticalStock,

    // State
    isLoading,
    isError,
    error,

    // Actions
    refetch,
    createItem: createItemMutation.mutate,
    updateItem: updateItemMutation.mutate,
    deleteItem: deleteItemMutation.mutate,

    // Mutation states
    isCreating: createItemMutation.isPending,
    isUpdating: updateItemMutation.isPending,
    isDeleting: deleteItemMutation.isPending,
    createError: createItemMutation.error,
    updateError: updateItemMutation.error,
    deleteError: deleteItemMutation.error,
  };
}

/**
 * Hook for low stock alerts
 * Get items that are below reorder threshold
 */
export function useLowStockItems() {
  const { currentFarm } = useFarm();
  const { isAuthenticated } = useAuth();
  const apiClient = getApiClient();

  return useQuery({
    queryKey: ['inventory', 'lowStock', currentFarm?.id],
    queryFn: async () => {
      if (!currentFarm?.id) return [];
      return apiClient.get<InventoryItem[]>(apiEndpoints.inventory.lowStock);
    },
    enabled: !!currentFarm?.id && isAuthenticated(),
    staleTime: cacheConfig.staleTime.medium,
    gcTime: cacheConfig.gcTime.medium,
  });
}

/**
 * Hook for inventory statistics
 * Calculate useful metrics from inventory data
 */
export function useInventoryStats() {
  const { items, itemsByStatus, totalValue } = useInventory();

  return {
    total: items.length,
    byStatus: itemsByStatus,
    totalValue,
    criticalItems: items.filter(item => item.stock_status === 'critical'),
    lowItems: items.filter(item => item.stock_status === 'low'),
    normalItems: items.filter(item => item.stock_status === 'normal'),
    averageValue: items.length > 0 ? totalValue / items.length : 0,
  };
}

export default useInventory;
