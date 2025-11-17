import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from './useApiClient';
import { apiEndpoints, cacheConfig } from '../config/env';

export interface CreateSoilTestForm {
  farm_id: string;
  field_id: string;
  test_type: 'lab' | 'home' | 'professional';
  test_date?: string;
  ph_level: number;
  organic_matter_percent: number;
  nitrogen_ppm: number;
  phosphorus_ppm: number;
  potassium_ppm: number;
  soil_type?: 'sandy' | 'clay' | 'loam' | 'silt' | 'peat';
  texture?: string;
  notes?: string;
  lab_name?: string;
}

export interface UpdateSoilTestForm extends Partial<CreateSoilTestForm> {
  id: string;
}

export interface SoilTestResult {
  id: string;
  farm_id: string;
  field_id: string;
  test_date: string;
  test_type: 'lab' | 'home' | 'professional';
  ph_level: number;
  organic_matter_percent: number;
  nitrogen_ppm: number;
  phosphorus_ppm: number;
  potassium_ppm: number;
  soil_type?: 'sandy' | 'clay' | 'loam' | 'silt' | 'peat';
  texture?: string;
  notes?: string;
  lab_name?: string;
  field_name: string;
  is_active: boolean;
  created_at: string;
  recommendations?: string[];
}

export interface SoilHealthMetrics {
  overall_health_score: number;
  ph_balance: 'acidic' | 'neutral' | 'alkaline';
  nutrient_status: 'deficient' | 'adequate' | 'excessive';
  organic_matter_status: 'low' | 'moderate' | 'high';
  last_test_date: string | null;
  next_test_recommended: string;
  trends: {
    ph_trend: 'improving' | 'declining' | 'stable';
    organic_matter_trend: 'improving' | 'declining' | 'stable';
    nutrient_trend: 'improving' | 'declining' | 'stable';
  };
}

/**
 * Hook for soil health management
 * Provides soil test CRUD operations and health analytics with React Query
 */
export function useSoilHealth() {
  const queryClient = useQueryClient();
  const apiClient = useApiClient();

  // Fetch all soil tests
  const {
    data: soilTests,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['soil-tests'],
    queryFn: async () => {
      const response = await apiClient.post<SoilTestResult[]>('/api/crops/soil-health', {
        action: 'list_tests',
      });
      return response;
    },
    staleTime: cacheConfig.staleTime.medium,
    gcTime: cacheConfig.gcTime.medium,
    retry: 2,
  });

  // Create soil test mutation
  const {
    mutate: createSoilTest,
    isPending: isCreating,
    error: createError,
  } = useMutation({
    mutationFn: async (testData: CreateSoilTestForm) => {
      const response = await apiClient.post<{
        success: boolean;
        id: string;
        recommendations: string[];
      }>('/api/crops/soil-health', { action: 'create_test', ...testData });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soil-tests'] });
      queryClient.invalidateQueries({ queryKey: ['soil-health-metrics'] });
    },
  });

  // Update soil test mutation
  const {
    mutate: updateSoilTest,
    isPending: isUpdating,
    error: updateError,
  } = useMutation({
    mutationFn: async ({ id, ...testData }: UpdateSoilTestForm) => {
      const response = await apiClient.post<{ success: boolean }>('/api/crops/soil-health', {
        action: 'update_test',
        id,
        ...testData,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soil-tests'] });
      queryClient.invalidateQueries({ queryKey: ['soil-health-metrics'] });
    },
  });

  // Delete soil test mutation
  const {
    mutate: deleteSoilTest,
    isPending: isDeleting,
    error: deleteError,
  } = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<{ success: boolean }>('/api/crops/soil-health', {
        action: 'delete_test',
        id,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soil-tests'] });
      queryClient.invalidateQueries({ queryKey: ['soil-health-metrics'] });
    },
  });

  return {
    soilTests: soilTests || [],
    isLoading,
    error,
    refetch,
    createSoilTest,
    updateSoilTest,
    deleteSoilTest,
    isCreating,
    isUpdating,
    isDeleting,
    createError,
    updateError,
    deleteError,
  };
}

/**
 * Hook for soil tests by farm
 */
export function useSoilTestsByFarm(farmId: string, fieldId?: string) {
  const apiClient = useApiClient();

  const {
    data: soilTests,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['soil-tests', 'farm', farmId, fieldId],
    queryFn: async () => {
      const response = await apiClient.post<SoilTestResult[]>('/api/crops/soil-health', {
        action: 'list_tests',
        farm_id: farmId,
        field_id: fieldId,
      });
      return response;
    },
    staleTime: cacheConfig.staleTime.medium,
    gcTime: cacheConfig.gcTime.medium,
    retry: 2,
    enabled: !!farmId,
  });

  return { soilTests: soilTests || [], isLoading, error, refetch };
}

/**
 * Hook for soil health metrics
 */
export function useSoilHealthMetrics(farmId: string) {
  const apiClient = useApiClient();

  const {
    data: metrics,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['soil-health-metrics', farmId],
    queryFn: async () => {
      const response = await apiClient.post<SoilHealthMetrics>('/api/crops/soil-health', {
        action: 'metrics',
        farm_id: farmId,
      });
      return response;
    },
    staleTime: cacheConfig.staleTime.medium,
    gcTime: cacheConfig.gcTime.medium,
    enabled: !!farmId,
  });

  return { metrics, isLoading, error, refetch };
}

/**
 * Hook for soil recommendations
 */
export function useSoilRecommendations(farmId: string) {
  const apiClient = useApiClient();

  const {
    data: recommendations,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['soil-recommendations', farmId],
    queryFn: async () => {
      const response = await apiClient.post<{
        recommendations: Array<{
          field_id: string;
          field_name: string;
          test_date: string;
          recommendations: Array<{
            type: string;
            priority: string;
            description: string;
            action: string;
            timeline: string;
          }>;
        }>;
      }>('/api/crops/soil-health', { action: 'recommendations', farm_id: farmId });
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
    refetch,
  };
}

/**
 * Hook for soil trends analysis
 */
export function useSoilTrendsAnalysis(farmId: string) {
  const apiClient = useApiClient();

  const {
    data: trendsAnalysis,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['soil-trends-analysis', farmId],
    queryFn: async () => {
      const response = await apiClient.post<{
        trend_analysis: Array<{
          field_id: string;
          field_name: string;
          test_count: number;
          date_range: {
            first: string;
            last: string;
          };
          trends: {
            ph: { direction: string; magnitude: number };
            organic_matter: { direction: string; magnitude: number };
            nitrogen: { direction: string; magnitude: number };
          };
        }>;
      }>('/api/crops/soil-health', { action: 'trends_analysis', farm_id: farmId });
      return response;
    },
    staleTime: cacheConfig.staleTime.long,
    gcTime: cacheConfig.gcTime.long,
    enabled: !!farmId,
  });

  return {
    trendsAnalysis: trendsAnalysis?.trend_analysis || [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for soil report export
 */
export function useSoilReportExport(farmId: string) {
  const apiClient = useApiClient();

  const {
    mutate: exportReport,
    isPending: isExporting,
    error: exportError,
  } = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<{
        report: string;
        filename: string;
      }>('/api/crops/soil-health', { action: 'export_report', farm_id: farmId });
      return response;
    },
  });

  return {
    exportReport,
    isExporting,
    exportError,
  };
}
