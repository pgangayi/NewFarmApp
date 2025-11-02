import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '../lib/api/client';
import { apiEndpoints, cacheConfig } from '../config/env';

export interface CreateRotationForm {
  farm_id: string;
  field_id: string;
  crop_sequence: Array<{
    year: number;
    crop_type: string;
    variety?: string;
    planting_date: string;
    harvest_date: string;
    status: 'planned' | 'planted' | 'harvested';
  }>;
  notes?: string;
}

export interface UpdateRotationForm extends Partial<CreateRotationForm> {
  id: string;
}

export interface RotationPlan {
  id: string;
  farm_id: string;
  field_id: string;
  crop_sequence: Array<{
    year: number;
    crop_type: string;
    variety?: string;
    planting_date: string;
    harvest_date: string;
    status: 'planned' | 'planted' | 'harvested';
  }>;
  field_name: string;
  is_active: boolean;
  created_at: string;
  notes?: string;
}

/**
 * Hook for crop rotation management
 * Provides rotation plan CRUD operations with React Query
 */
export function useRotation() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  // Fetch all rotation plans
  const { data: rotationPlans, isLoading, error, refetch } = useQuery({
    queryKey: ['rotation-plans'],
    queryFn: async () => {
      const response = await apiClient.post<RotationPlan[]>(
        '/api/crops/rotation',
        { action: 'list' }
      );
      return response;
    },
    staleTime: cacheConfig.staleTime.medium,
    gcTime: cacheConfig.gcTime.medium,
    retry: 2,
  });

  // Create rotation plan mutation
  const { mutate: createRotationPlan, isPending: isCreating, error: createError } = useMutation({
    mutationFn: async (rotationData: CreateRotationForm) => {
      const response = await apiClient.post<{ success: boolean; id: string }>(
        '/api/crops/rotation',
        { action: 'create', ...rotationData }
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotation-plans'] });
    },
  });

  // Update rotation plan mutation
  const { mutate: updateRotationPlan, isPending: isUpdating, error: updateError } = useMutation({
    mutationFn: async ({ id, ...rotationData }: UpdateRotationForm) => {
      const response = await apiClient.post<{ success: boolean }>(
        '/api/crops/rotation',
        { action: 'update', id, ...rotationData }
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotation-plans'] });
    },
  });

  // Delete rotation plan mutation
  const { mutate: deleteRotationPlan, isPending: isDeleting, error: deleteError } = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<{ success: boolean }>(
        '/api/crops/rotation',
        { action: 'delete', id }
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotation-plans'] });
    },
  });

  return {
    rotationPlans: rotationPlans || [],
    isLoading,
    error,
    refetch,
    createRotationPlan,
    updateRotationPlan,
    deleteRotationPlan,
    isCreating,
    isUpdating,
    isDeleting,
    createError,
    updateError,
    deleteError,
  };
}

/**
 * Hook for rotation plans by farm
 */
export function useRotationByFarm(farmId: string) {
  const apiClient = getApiClient();

  const { data: rotationPlans, isLoading, error, refetch } = useQuery({
    queryKey: ['rotation-plans', 'farm', farmId],
    queryFn: async () => {
      const response = await apiClient.post<RotationPlan[]>(
        '/api/crops/rotation',
        { action: 'list', farm_id: farmId }
      );
      return response;
    },
    staleTime: cacheConfig.staleTime.medium,
    gcTime: cacheConfig.gcTime.medium,
    retry: 2,
    enabled: !!farmId,
  });

  return { rotationPlans: rotationPlans || [], isLoading, error, refetch };
}

/**
 * Hook for rotation recommendations
 */
export function useRotationRecommendations(farmId: string) {
  const apiClient = getApiClient();

  const { data: recommendations, isLoading, error, refetch } = useQuery({
    queryKey: ['rotation-recommendations', farmId],
    queryFn: async () => {
      const response = await apiClient.post<{
        current_crops: any[];
        recommendations: any[];
      }>(
        '/api/crops/rotation',
        { action: 'recommendations', farm_id: farmId }
      );
      return response;
    },
    staleTime: cacheConfig.staleTime.long,
    gcTime: cacheConfig.gcTime.long,
    enabled: !!farmId,
  });

  return { recommendations: recommendations?.recommendations || [], isLoading, error, refetch };
}

/**
 * Hook for rotation health check
 */
export function useRotationHealthCheck(rotationId: string) {
  const apiClient = getApiClient();

  const { data: healthCheck, isLoading, error, refetch } = useQuery({
    queryKey: ['rotation-health', rotationId],
    queryFn: async () => {
      const response = await apiClient.post<{
        score: any;
        issues: string[];
        recommendations: string[];
        cropFamilies: Record<string, number>;
        summary: any;
      }>(
        '/api/crops/rotation',
        { action: 'health_check', rotation_id: rotationId }
      );
      return response;
    },
    staleTime: cacheConfig.staleTime.short,
    enabled: !!rotationId,
  });

  return { healthCheck, isLoading, error, refetch };
}