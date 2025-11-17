import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from './useApiClient';
import { Crop } from '../types/entities';
import { apiEndpoints, cacheConfig } from '../config/env';

export interface CreateCropForm {
  name: string;
  farm_id: string;
  field_id: string;
  crop_type: string;
  variety?: string;
  planting_date: string;
  expected_harvest_date?: string;
  status?: 'planned' | 'active' | 'harvested' | 'failed';
}

export interface UpdateCropForm extends Partial<CreateCropForm> {
  id: string;
}

/**
 * Main hook for crop management
 * Provides query, create, update, delete operations with React Query
 */
export function useCrops() {
  const queryClient = useQueryClient();
  const apiClient = useApiClient();

  // Fetch all crops
  const {
    data: crops,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['crops'],
    queryFn: async () => {
      const response = await apiClient.get<Crop[]>(apiEndpoints.crops.list);
      return response;
    },
    staleTime: cacheConfig.staleTime.medium,
    gcTime: cacheConfig.gcTime.medium,
    retry: 2,
  });

  // Create crop mutation
  const createMutation = useMutation({
    mutationFn: async (cropData: CreateCropForm) => {
      const response = await apiClient.post<Crop>(apiEndpoints.crops.create, cropData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crops'] });
    },
  });

  // Expose both the callback-style mutate and the promise-style mutateAsync
  const createCrop = createMutation.mutate;
  const createCropAsync = createMutation.mutateAsync;
  const isCreating = createMutation.isLoading || createMutation.isPending;
  const createError = createMutation.error;

  // Update crop mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...cropData }: UpdateCropForm) => {
      const response = await apiClient.put<Crop>(apiEndpoints.crops.update(id), cropData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crops'] });
    },
  });

  const updateCrop = updateMutation.mutate;
  const updateCropAsync = updateMutation.mutateAsync;
  const isUpdating = updateMutation.isLoading || updateMutation.isPending;
  const updateError = updateMutation.error;

  // Delete crop mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(apiEndpoints.crops.delete(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crops'] });
    },
  });

  const deleteCrop = deleteMutation.mutate;
  const deleteCropAsync = deleteMutation.mutateAsync;
  const isDeleting = deleteMutation.isLoading || deleteMutation.isPending;
  const deleteError = deleteMutation.error;

  return {
    crops: crops || [],
    isLoading,
    error,
    refetch,
    // callback-style
    createCrop,
    updateCrop,
    deleteCrop,
    // promise-style (awaitable)
    createCropAsync,
    updateCropAsync,
    deleteCropAsync,
    isCreating,
    isUpdating,
    isDeleting,
    createError,
    updateError,
    deleteError,
  };
}

/**
 * Hook for fetching crops by field
 */
export function useCropsByField(fieldId: string) {
  const apiClient = useApiClient();

  const {
    data: crops,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['crops', 'field', fieldId],
    queryFn: async () => {
      const response = await apiClient.get<Crop[]>(
        `${apiEndpoints.crops.list}?field_id=${fieldId}`
      );
      return response;
    },
    staleTime: cacheConfig.staleTime.medium,
    gcTime: cacheConfig.gcTime.medium,
    retry: 2,
    enabled: !!fieldId,
  });

  return { crops: crops || [], isLoading, error, refetch };
}

/**
 * Hook for crop statistics
 */
export function useCropsStats() {
  const { crops } = useCrops();

  const stats = {
    total: crops.length,
    byStatus: {
      planned: crops.filter(c => c.status === 'planned').length,
      active: crops.filter(c => c.status === 'active').length,
      harvested: crops.filter(c => c.status === 'harvested').length,
      failed: crops.filter(c => c.status === 'failed').length,
    },
    activeCount: crops.filter(c => c.status === 'active').length,
  };

  return stats;
}
