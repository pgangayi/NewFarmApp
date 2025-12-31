/**
 * LEGACY HOOKS COMPATIBILITY LAYER
 * ================================
 * Provides backward-compatible hook interfaces for pages
 * that use the old hook patterns.
 *
 * These re-export from the unified API layer with the old interface.
 */

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useFarms,
  useCreateFarm,
  useUpdateFarm,
  useDeleteFarm,
  useAnimals as useAnimalsQuery,
  useCreateAnimal,
  useUpdateAnimal,
  useDeleteAnimal,
  useCrops as useCropsQuery,
  useCreateCrop,
  useTasks as useTasksQuery,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useInventory as useInventoryQuery,
  useInventoryLowStock,
  useCreateInventoryItem,
  CACHE_CONFIG,
  QUERY_KEYS,
} from '../api';
import type { Farm, Animal, Crop, Task, InventoryItem, CreateRequest } from '../api';

// ============================================================================
// FARM HOOK (with currentFarm selection)
// ============================================================================

export function useFarm() {
  const [currentFarm, setCurrentFarm] = useState<Farm | null>(null);
  const queryClient = useQueryClient();

  // Load current farm from storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('currentFarm');
      if (stored) {
        setCurrentFarm(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load current farm', e);
    }
  }, []);

  const { data: farms = [], isLoading, error, refetch } = useFarms();
  const createMutation = useCreateFarm();
  const updateMutation = useUpdateFarm();
  const deleteMutation = useDeleteFarm();

  const selectFarm = (farm: Farm | null) => {
    setCurrentFarm(farm);
    if (farm) {
      localStorage.setItem('currentFarm', JSON.stringify(farm));
    } else {
      localStorage.removeItem('currentFarm');
    }
  };

  // Auto-select first farm if none selected
  useEffect(() => {
    if (!currentFarm && farms.length > 0) {
      selectFarm(farms[0]);
    }
  }, [currentFarm, farms]);

  return {
    farms,
    currentFarm,
    selectFarm,
    isLoading,
    error,
    getFarms: refetch,
    createFarm: (data: CreateRequest<Farm>) => createMutation.mutate(data),
    updateFarm: (id: string, data: Partial<Farm>) => updateMutation.mutate({ id, data }),
    deleteFarm: (id: string) => deleteMutation.mutate(id),
  };
}

// ============================================================================
// ANIMALS HOOK (legacy interface)
// ============================================================================

export function useAnimals(farmId?: string) {
  const { data: animals = [], isLoading, error, refetch } = useAnimalsQuery(farmId);
  const createMutation = useCreateAnimal();
  const updateMutation = useUpdateAnimal();
  const deleteMutation = useDeleteAnimal();

  return {
    animals,
    isLoading,
    error,
    refetch,
    createAnimal: (data: CreateRequest<Animal>) => createMutation.mutate(data),
    updateAnimal: (data: { id: string } & Partial<Animal>) =>
      updateMutation.mutate({ id: data.id, data }),
    deleteAnimal: (id: string) => deleteMutation.mutate(id),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// ============================================================================
// CROPS HOOK (legacy interface)
// ============================================================================

export function useCrops(farmId?: string) {
  const { data: crops = [], isLoading, error, refetch } = useCropsQuery(farmId);
  const createMutation = useCreateCrop();

  return {
    crops,
    isLoading,
    error,
    refetch,
    createCrop: (data: CreateRequest<Crop>) => createMutation.mutate(data),
    createCropAsync: (data: CreateRequest<Crop>) => createMutation.mutateAsync(data),
    isCreating: createMutation.isPending,
  };
}

export function useCropsStats() {
  const { crops } = useCrops();

  const byStatus = {
    planned: crops.filter((c: Crop) => c.status === 'planned').length,
    active: crops.filter((c: Crop) => c.status === 'active').length,
    harvested: crops.filter((c: Crop) => c.status === 'harvested').length,
    failed: crops.filter((c: Crop) => c.status === 'failed').length,
  };

  return {
    total: crops.length,
    activeCount: byStatus.active,
    byStatus,
  };
}

// ============================================================================
// TASKS HOOK (legacy interface)
// ============================================================================

export function useTasks(farmId?: string) {
  const {
    data: tasks = [],
    isLoading,
    error,
    refetch,
  } = useTasksQuery(farmId ? { farm_id: farmId } : undefined);
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();

  return {
    tasks,
    isLoading,
    error,
    refetch,
    createTask: (data: CreateRequest<Task>) => createMutation.mutate(data),
    updateTask: (data: { id: string } & Partial<Task>) =>
      updateMutation.mutate({ id: data.id, data }),
    deleteTask: (id: string) => deleteMutation.mutate(id),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// ============================================================================
// INVENTORY HOOK (legacy interface)
// ============================================================================

export function useInventory(farmId?: string) {
  const { data: items = [], isLoading, error, refetch } = useInventoryQuery(farmId);
  const createMutation = useCreateInventoryItem();

  return {
    items,
    isLoading,
    error,
    refetch,
    createItem: (data: CreateRequest<InventoryItem>) => createMutation.mutate(data),
    createItemAsync: (data: CreateRequest<InventoryItem>) => createMutation.mutateAsync(data),
    isCreating: createMutation.isPending,
  };
}

export function useLowStockItems() {
  return useInventoryLowStock();
}

// ============================================================================
// API CLIENT (legacy interface)
// ============================================================================

export { apiClient as useApiClient } from '../api';
