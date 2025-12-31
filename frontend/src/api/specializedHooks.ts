/**
 * SPECIALIZED DOMAIN HOOKS
 * ========================
 * Consolidated hooks for specific domain features:
 * - Irrigation
 * - Pest & Disease
 * - Soil Health
 * - Crop Rotation
 *
 * These hooks use a specific 'action' pattern with POST requests
 * rather than standard RESTful endpoints.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { CACHE_CONFIG } from './config';
import type {
  IrrigationSchedule,
  CreateIrrigationForm,
  UpdateIrrigationForm,
  IrrigationAnalytics,
  PestIssue,
  DiseaseOutbreak,
  CreatePestIssueForm,
  UpdatePestIssueForm,
  PreventionTask,
  SoilTestResult,
  CreateSoilTestForm,
  UpdateSoilTestForm,
  SoilHealthMetrics,
  RotationPlan,
  CreateRotationForm,
  UpdateRotationForm,
} from './types';

// ============================================================================
// IRRIGATION HOOKS
// ============================================================================

export function useIrrigation() {
  const queryClient = useQueryClient();

  const {
    data: schedules = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['irrigation-schedules'],
    queryFn: () =>
      apiClient.post<IrrigationSchedule[]>('/api/crops/irrigation', { action: 'list' }),
    staleTime: CACHE_CONFIG.staleTime.medium,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateIrrigationForm) =>
      apiClient.post<{ success: boolean; id: string }>('/api/crops/irrigation', {
        action: 'create',
        ...data,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['irrigation-schedules'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: UpdateIrrigationForm) =>
      apiClient.post<{ success: boolean }>('/api/crops/irrigation', {
        action: 'update',
        id,
        ...data,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['irrigation-schedules'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient.post<{ success: boolean }>('/api/crops/irrigation', { action: 'delete', id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['irrigation-schedules'] }),
  });

  const optimizeMutation = useMutation({
    mutationFn: ({ schedule_id, weatherData }: { schedule_id: string; weatherData?: unknown }) =>
      apiClient.post<{ success: boolean; optimizations: unknown; savings: unknown }>(
        '/api/crops/irrigation',
        { action: 'optimize', schedule_id, weather_data: weatherData }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['irrigation-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['irrigation-analytics'] });
    },
  });

  return {
    schedules,
    isLoading,
    error,
    refetch,
    createSchedule: createMutation.mutate,
    updateSchedule: updateMutation.mutate,
    deleteSchedule: deleteMutation.mutate,
    optimizeSchedule: optimizeMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isOptimizing: optimizeMutation.isPending,
  };
}

export function useIrrigationByFarm(farmId: string) {
  const {
    data: schedules = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['irrigation-schedules', 'farm', farmId],
    queryFn: () =>
      apiClient.post<IrrigationSchedule[]>('/api/crops/irrigation', {
        action: 'list',
        farm_id: farmId,
      }),
    enabled: !!farmId,
    staleTime: CACHE_CONFIG.staleTime.medium,
  });
  return { schedules, isLoading, error, refetch };
}

export function useIrrigationAnalytics(farmId: string) {
  const {
    data: analytics,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['irrigation-analytics', farmId],
    queryFn: () =>
      apiClient.post<IrrigationAnalytics>('/api/crops/irrigation', {
        action: 'analytics',
        farm_id: farmId,
      }),
    enabled: !!farmId,
    staleTime: CACHE_CONFIG.staleTime.medium,
  });
  return { analytics, isLoading, error, refetch };
}

export function useIrrigationRecommendations(farmId: string) {
  const {
    data: recommendations,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['irrigation-recommendations', farmId],
    queryFn: async () => {
      const res = await apiClient.post<{ recommendations: any[] }>('/api/crops/irrigation', {
        action: 'recommendations',
        farm_id: farmId,
      });
      return res.recommendations;
    },
    enabled: !!farmId,
    staleTime: CACHE_CONFIG.staleTime.long,
  });
  return { recommendations: recommendations || [], isLoading, error, refetch };
}

// ============================================================================
// PEST & DISEASE HOOKS
// ============================================================================

export function usePestDisease() {
  const queryClient = useQueryClient();

  const {
    data: pestIssues = [],
    isLoading: pestLoading,
    error: pestError,
    refetch: refetchPests,
  } = useQuery({
    queryKey: ['pest-issues'],
    queryFn: () =>
      apiClient.post<PestIssue[]>('/api/crops/pests-diseases', { action: 'list_pests' }),
    staleTime: CACHE_CONFIG.staleTime.medium,
  });

  const {
    data: diseaseOutbreaks = [],
    isLoading: diseaseLoading,
    error: diseaseError,
    refetch: refetchDiseases,
  } = useQuery({
    queryKey: ['disease-outbreaks'],
    queryFn: () =>
      apiClient.post<DiseaseOutbreak[]>('/api/crops/pests-diseases', { action: 'list_diseases' }),
    staleTime: CACHE_CONFIG.staleTime.medium,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePestIssueForm) =>
      apiClient.post<{ success: boolean; id: string }>('/api/crops/pests-diseases', {
        action: 'create_issue',
        ...data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pest-issues'] });
      queryClient.invalidateQueries({ queryKey: ['disease-outbreaks'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, issue_type, ...data }: UpdatePestIssueForm) =>
      apiClient.post<{ success: boolean }>('/api/crops/pests-diseases', {
        action: 'update_issue',
        id,
        issue_type,
        ...data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pest-issues'] });
      queryClient.invalidateQueries({ queryKey: ['disease-outbreaks'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient.post<{ success: boolean }>('/api/crops/pests-diseases', {
        action: 'delete_issue',
        id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pest-issues'] });
      queryClient.invalidateQueries({ queryKey: ['disease-outbreaks'] });
    },
  });

  return {
    pestIssues,
    diseaseOutbreaks,
    isLoading: pestLoading || diseaseLoading,
    error: pestError || diseaseError,
    refetchPests,
    refetchDiseases,
    createIssue: createMutation.mutate,
    updateIssue: updateMutation.mutate,
    deleteIssue: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function usePestDiseaseByFarm(farmId: string, severity?: string, status?: string) {
  const {
    data: pestIssues = [],
    isLoading: pestLoading,
    error: pestError,
  } = useQuery({
    queryKey: ['pest-issues', 'farm', farmId, severity, status],
    queryFn: () =>
      apiClient.post<PestIssue[]>('/api/crops/pests-diseases', {
        action: 'list_pests',
        farm_id: farmId,
        severity,
        status,
      }),
    enabled: !!farmId,
    staleTime: CACHE_CONFIG.staleTime.medium,
  });

  const {
    data: diseaseOutbreaks = [],
    isLoading: diseaseLoading,
    error: diseaseError,
  } = useQuery({
    queryKey: ['disease-outbreaks', 'farm', farmId],
    queryFn: () =>
      apiClient.post<DiseaseOutbreak[]>('/api/crops/pests-diseases', {
        action: 'list_diseases',
        farm_id: farmId,
      }),
    enabled: !!farmId,
    staleTime: CACHE_CONFIG.staleTime.medium,
  });

  return {
    pestIssues,
    diseaseOutbreaks,
    isLoading: pestLoading || diseaseLoading,
    error: pestError || diseaseError,
  };
}

export function usePreventionCalendar(farmId: string) {
  const {
    data: calendar,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['prevention-calendar', farmId],
    queryFn: () =>
      apiClient.post<{ upcoming: PreventionTask[]; seasonal_recommendations: unknown[] }>(
        '/api/crops/pests-diseases',
        { action: 'prevention_calendar', farm_id: farmId }
      ),
    enabled: !!farmId,
    staleTime: CACHE_CONFIG.staleTime.medium,
  });

  return {
    preventionTasks: calendar?.upcoming || [],
    seasonalRecommendations: calendar?.seasonal_recommendations || [],
    isLoading,
    error,
    refetch,
  };
}

// ============================================================================
// SOIL HEALTH HOOKS
// ============================================================================

export function useSoilHealth() {
  const queryClient = useQueryClient();

  const {
    data: soilTests = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['soil-tests'],
    queryFn: () =>
      apiClient.post<SoilTestResult[]>('/api/crops/soil-health', { action: 'list_tests' }),
    staleTime: CACHE_CONFIG.staleTime.medium,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateSoilTestForm) =>
      apiClient.post<{ success: boolean; id: string; recommendations: string[] }>(
        '/api/crops/soil-health',
        { action: 'create_test', ...data }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soil-tests'] });
      queryClient.invalidateQueries({ queryKey: ['soil-health-metrics'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: UpdateSoilTestForm) =>
      apiClient.post<{ success: boolean }>('/api/crops/soil-health', {
        action: 'update_test',
        id,
        ...data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soil-tests'] });
      queryClient.invalidateQueries({ queryKey: ['soil-health-metrics'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient.post<{ success: boolean }>('/api/crops/soil-health', { action: 'delete_test', id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soil-tests'] });
      queryClient.invalidateQueries({ queryKey: ['soil-health-metrics'] });
    },
  });

  return {
    soilTests,
    isLoading,
    error,
    refetch,
    createSoilTest: createMutation.mutate,
    updateSoilTest: updateMutation.mutate,
    deleteSoilTest: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useSoilTestsByFarm(farmId: string, fieldId?: string) {
  const {
    data: soilTests = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['soil-tests', 'farm', farmId, fieldId],
    queryFn: () =>
      apiClient.post<SoilTestResult[]>('/api/crops/soil-health', {
        action: 'list_tests',
        farm_id: farmId,
        field_id: fieldId,
      }),
    enabled: !!farmId,
    staleTime: CACHE_CONFIG.staleTime.medium,
  });

  return { soilTests, isLoading, error, refetch };
}

export function useSoilHealthMetrics(farmId: string) {
  const {
    data: metrics,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['soil-health-metrics', farmId],
    queryFn: () =>
      apiClient.post<SoilHealthMetrics>('/api/crops/soil-health', {
        action: 'metrics',
        farm_id: farmId,
      }),
    enabled: !!farmId,
    staleTime: CACHE_CONFIG.staleTime.medium,
  });

  return { metrics, isLoading, error, refetch };
}

// ============================================================================
// CROP ROTATION HOOKS
// ============================================================================

export function useRotation() {
  const queryClient = useQueryClient();

  const {
    data: rotationPlans = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['rotation-plans'],
    queryFn: () => apiClient.post<RotationPlan[]>('/api/crops/rotation', { action: 'list' }),
    staleTime: CACHE_CONFIG.staleTime.medium,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateRotationForm) =>
      apiClient.post<{ success: boolean; id: string }>('/api/crops/rotation', {
        action: 'create',
        ...data,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rotation-plans'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: UpdateRotationForm) =>
      apiClient.post<{ success: boolean }>('/api/crops/rotation', {
        action: 'update',
        id,
        ...data,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rotation-plans'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient.post<{ success: boolean }>('/api/crops/rotation', { action: 'delete', id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rotation-plans'] }),
  });

  return {
    rotationPlans,
    isLoading,
    error,
    refetch,
    createRotationPlan: createMutation.mutate,
    updateRotationPlan: updateMutation.mutate,
    deleteRotationPlan: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useRotationByFarm(farmId: string) {
  const {
    data: rotationPlans = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['rotation-plans', 'farm', farmId],
    queryFn: () =>
      apiClient.post<RotationPlan[]>('/api/crops/rotation', { action: 'list', farm_id: farmId }),
    enabled: !!farmId,
    staleTime: CACHE_CONFIG.staleTime.medium,
  });

  return { rotationPlans, isLoading, error, refetch };
}
