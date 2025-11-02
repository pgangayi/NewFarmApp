import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '../lib/api/client';
import { apiEndpoints, cacheConfig } from '../config/env';

export interface CreateIrrigationForm {
  farm_id: string;
  field_id: string;
  crop_type: string;
  irrigation_type: string;
  frequency_days: number;
  duration_minutes: number;
  water_amount_liters: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  start_date?: string;
}

export interface UpdateIrrigationForm extends Partial<CreateIrrigationForm> {
  id: string;
  status?: 'active' | 'paused' | 'completed';
}

export interface IrrigationSchedule {
  id: string;
  farm_id: string;
  field_id: string;
  crop_type: string;
  irrigation_type: string;
  frequency_days: number;
  duration_minutes: number;
  water_amount_liters: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  next_watering_date: string;
  status: 'active' | 'paused' | 'completed';
  field_name: string;
  is_active: boolean;
}

export interface IrrigationAnalytics {
  total_water_usage: number;
  efficiency_score: number;
  cost_savings: number;
  next_schedules: IrrigationSchedule[];
  recommendations: string[];
}

/**
 * Hook for irrigation management
 * Provides irrigation schedule CRUD operations with React Query
 */
export function useIrrigation() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  // Fetch all irrigation schedules
  const { data: schedules, isLoading, error, refetch } = useQuery({
    queryKey: ['irrigation-schedules'],
    queryFn: async () => {
      const response = await apiClient.post<IrrigationSchedule[]>(
        '/api/crops/irrigation',
        { action: 'list' }
      );
      return response;
    },
    staleTime: cacheConfig.staleTime.medium,
    gcTime: cacheConfig.gcTime.medium,
    retry: 2,
  });

  // Create irrigation schedule mutation
  const { mutate: createSchedule, isPending: isCreating, error: createError } = useMutation({
    mutationFn: async (scheduleData: CreateIrrigationForm) => {
      const response = await apiClient.post<{ success: boolean; id: string }>(
        '/api/crops/irrigation',
        { action: 'create', ...scheduleData }
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['irrigation-schedules'] });
    },
  });

  // Update irrigation schedule mutation
  const { mutate: updateSchedule, isPending: isUpdating, error: updateError } = useMutation({
    mutationFn: async ({ id, ...scheduleData }: UpdateIrrigationForm) => {
      const response = await apiClient.post<{ success: boolean }>(
        '/api/crops/irrigation',
        { action: 'update', id, ...scheduleData }
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['irrigation-schedules'] });
    },
  });

  // Delete irrigation schedule mutation
  const { mutate: deleteSchedule, isPending: isDeleting, error: deleteError } = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<{ success: boolean }>(
        '/api/crops/irrigation',
        { action: 'delete', id }
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['irrigation-schedules'] });
    },
  });

  // Optimize irrigation schedule mutation
  const { mutate: optimizeSchedule, isPending: isOptimizing, error: optimizeError } = useMutation({
    mutationFn: async ({ schedule_id, weatherData }: { schedule_id: string; weatherData?: any }) => {
      const response = await apiClient.post<{
        success: boolean;
        optimizations: any;
        savings: any;
      }>(
        '/api/crops/irrigation',
        { action: 'optimize', schedule_id, weather_data: weatherData }
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['irrigation-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['irrigation-analytics'] });
    },
  });

  return {
    schedules: schedules || [],
    isLoading,
    error,
    refetch,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    optimizeSchedule,
    isCreating,
    isUpdating,
    isDeleting,
    isOptimizing,
    createError,
    updateError,
    deleteError,
    optimizeError,
  };
}

/**
 * Hook for irrigation schedules by farm
 */
export function useIrrigationByFarm(farmId: string) {
  const apiClient = getApiClient();

  const { data: schedules, isLoading, error, refetch } = useQuery({
    queryKey: ['irrigation-schedules', 'farm', farmId],
    queryFn: async () => {
      const response = await apiClient.post<IrrigationSchedule[]>(
        '/api/crops/irrigation',
        { action: 'list', farm_id: farmId }
      );
      return response;
    },
    staleTime: cacheConfig.staleTime.medium,
    gcTime: cacheConfig.gcTime.medium,
    retry: 2,
    enabled: !!farmId,
  });

  return { schedules: schedules || [], isLoading, error, refetch };
}

/**
 * Hook for irrigation analytics
 */
export function useIrrigationAnalytics(farmId: string) {
  const apiClient = getApiClient();

  const { data: analytics, isLoading, error, refetch } = useQuery({
    queryKey: ['irrigation-analytics', farmId],
    queryFn: async () => {
      const response = await apiClient.post<IrrigationAnalytics>(
        '/api/crops/irrigation',
        { action: 'analytics', farm_id: farmId }
      );
      return response;
    },
    staleTime: cacheConfig.staleTime.medium,
    gcTime: cacheConfig.gcTime.medium,
    enabled: !!farmId,
  });

  return { analytics, isLoading, error, refetch };
}

/**
 * Hook for irrigation recommendations
 */
export function useIrrigationRecommendations(farmId: string) {
  const apiClient = getApiClient();

  const { data: recommendations, isLoading, error, refetch } = useQuery({
    queryKey: ['irrigation-recommendations', farmId],
    queryFn: async () => {
      const response = await apiClient.post<{
        recommendations: Array<{
          type: string;
          priority: string;
          message: string;
          benefit: string;
          action: string;
        }>;
      }>(
        '/api/crops/irrigation',
        { action: 'recommendations', farm_id: farmId }
      );
      return response;
    },
    staleTime: cacheConfig.staleTime.long,
    gcTime: cacheConfig.gcTime.long,
    enabled: !!farmId,
  });

  return { 
    recommendations: recommendations?.recommendations || [], 
    isLoading, 
    error, 
    refetch 
  };
}