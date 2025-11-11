import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '../lib/api/client';
import { apiEndpoints, cacheConfig } from '../config/env';

export interface CreatePestIssueForm {
  farm_id: string;
  field_id: string;
  issue_type: 'pest' | 'disease';
  crop_type: string;
  pest_name?: string;
  disease_name?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affected_area_percent: number;
  discovery_date?: string;
  outbreak_date?: string;
  status?:
    | 'active'
    | 'treated'
    | 'resolved'
    | 'monitoring'
    | 'treating'
    | 'controlled'
    | 'contained';
  description: string;
  growth_stage?: string;
  treatment_applied?: string;
  treatment_date?: string;
  cost_incurred?: number;
}

export interface UpdatePestIssueForm extends Partial<CreatePestIssueForm> {
  id: string;
  issue_type: 'pest' | 'disease';
}

export interface PestIssue {
  id: string;
  farm_id: string;
  field_id: string;
  crop_type: string;
  pest_name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affected_area_percent: number;
  discovery_date: string;
  status: 'active' | 'treated' | 'resolved' | 'escalated';
  treatment_applied?: string;
  treatment_date?: string;
  cost_incurred?: number;
  field_name: string;
  description: string;
  created_at: string;
}

export interface DiseaseOutbreak {
  id: string;
  farm_id: string;
  field_id: string;
  crop_type: string;
  disease_name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affected_area_percent: number;
  outbreak_date: string;
  status: 'monitoring' | 'treating' | 'controlled' | 'contained';
  growth_stage: string;
  weather_factors?: string;
  treatment_effectiveness?: number;
  field_name: string;
  description: string;
  created_at: string;
}

export interface PreventionTask {
  id: string;
  task_name: string;
  field_id: string;
  field_name: string;
  scheduled_date: string;
  priority: 'low' | 'medium' | 'high';
  description?: string;
  is_completed: boolean;
}

/**
 * Hook for pest and disease management
 * Provides pest issue and disease outbreak CRUD operations with React Query
 */
export function usePestDisease() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  // Fetch pest issues
  const {
    data: pestIssues,
    isLoading: pestLoading,
    error: pestError,
    refetch: refetchPests,
  } = useQuery({
    queryKey: ['pest-issues'],
    queryFn: async () => {
      const response = await apiClient.post<PestIssue[]>('/api/crops/pests-diseases', {
        action: 'list_pests',
      });
      return response;
    },
    staleTime: cacheConfig.staleTime.medium,
    gcTime: cacheConfig.gcTime.medium,
    retry: 2,
  });

  // Fetch disease outbreaks
  const {
    data: diseaseOutbreaks,
    isLoading: diseaseLoading,
    error: diseaseError,
    refetch: refetchDiseases,
  } = useQuery({
    queryKey: ['disease-outbreaks'],
    queryFn: async () => {
      const response = await apiClient.post<DiseaseOutbreak[]>('/api/crops/pests-diseases', {
        action: 'list_diseases',
      });
      return response;
    },
    staleTime: cacheConfig.staleTime.medium,
    gcTime: cacheConfig.gcTime.medium,
    retry: 2,
  });

  // Create issue mutation
  const {
    mutate: createIssue,
    isPending: isCreating,
    error: createError,
  } = useMutation({
    mutationFn: async (issueData: CreatePestIssueForm) => {
      const response = await apiClient.post<{ success: boolean; id: string }>(
        '/api/crops/pests-diseases',
        { action: 'create_issue', ...issueData }
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pest-issues'] });
      queryClient.invalidateQueries({ queryKey: ['disease-outbreaks'] });
    },
  });

  // Update issue mutation
  const {
    mutate: updateIssue,
    isPending: isUpdating,
    error: updateError,
  } = useMutation({
    mutationFn: async ({ id, issue_type, ...issueData }: UpdatePestIssueForm) => {
      const response = await apiClient.post<{ success: boolean }>('/api/crops/pests-diseases', {
        action: 'update_issue',
        id,
        issue_type,
        ...issueData,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pest-issues'] });
      queryClient.invalidateQueries({ queryKey: ['disease-outbreaks'] });
    },
  });

  // Delete issue mutation
  const {
    mutate: deleteIssue,
    isPending: isDeleting,
    error: deleteError,
  } = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<{ success: boolean }>('/api/crops/pests-diseases', {
        action: 'delete_issue',
        id,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pest-issues'] });
      queryClient.invalidateQueries({ queryKey: ['disease-outbreaks'] });
    },
  });

  return {
    pestIssues: pestIssues || [],
    diseaseOutbreaks: diseaseOutbreaks || [],
    isLoading: pestLoading || diseaseLoading,
    error: pestError || diseaseError,
    refetchPests,
    refetchDiseases,
    createIssue,
    updateIssue,
    deleteIssue,
    isCreating,
    isUpdating,
    isDeleting,
    createError,
    updateError,
    deleteError,
  };
}

/**
 * Hook for pest and disease issues by farm
 */
export function usePestDiseaseByFarm(farmId: string, severity?: string, status?: string) {
  const apiClient = getApiClient();

  const {
    data: pestIssues,
    isLoading: pestLoading,
    error: pestError,
  } = useQuery({
    queryKey: ['pest-issues', 'farm', farmId, severity, status],
    queryFn: async () => {
      const response = await apiClient.post<PestIssue[]>('/api/crops/pests-diseases', {
        action: 'list_pests',
        farm_id: farmId,
        severity,
        status,
      });
      return response;
    },
    staleTime: cacheConfig.staleTime.medium,
    gcTime: cacheConfig.gcTime.medium,
    retry: 2,
    enabled: !!farmId,
  });

  const {
    data: diseaseOutbreaks,
    isLoading: diseaseLoading,
    error: diseaseError,
  } = useQuery({
    queryKey: ['disease-outbreaks', 'farm', farmId],
    queryFn: async () => {
      const response = await apiClient.post<DiseaseOutbreak[]>('/api/crops/pests-diseases', {
        action: 'list_diseases',
        farm_id: farmId,
      });
      return response;
    },
    staleTime: cacheConfig.staleTime.medium,
    gcTime: cacheConfig.gcTime.medium,
    retry: 2,
    enabled: !!farmId,
  });

  return {
    pestIssues: pestIssues || [],
    diseaseOutbreaks: diseaseOutbreaks || [],
    isLoading: pestLoading || diseaseLoading,
    error: pestError || diseaseError,
  };
}

/**
 * Hook for prevention calendar
 */
export function usePreventionCalendar(farmId: string) {
  const apiClient = getApiClient();

  const {
    data: calendar,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['prevention-calendar', farmId],
    queryFn: async () => {
      const response = await apiClient.post<{
        upcoming: PreventionTask[];
        seasonal_recommendations: unknown[];
      }>('/api/crops/pests-diseases', { action: 'prevention_calendar', farm_id: farmId });
      return response;
    },
    staleTime: cacheConfig.staleTime.medium,
    gcTime: cacheConfig.gcTime.medium,
    enabled: !!farmId,
  });

  return {
    preventionTasks: calendar?.upcoming || [],
    seasonalRecommendations: calendar?.seasonal_recommendations || [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for pest predictions
 */
export function usePestPredictions(farmId: string) {
  const apiClient = getApiClient();

  const {
    data: predictions,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['pest-predictions', farmId],
    queryFn: async () => {
      const response = await apiClient.post<{
        predictions: Array<{
          crop_type: string;
          field_name: string;
          pest_name: string;
          risk_level: string;
          peak_period: string;
          prevention_actions: string[];
        }>;
        risk_factors: unknown[];
      }>('/api/crops/pests-diseases', { action: 'pest_predictions', farm_id: farmId });
      return response;
    },
    staleTime: cacheConfig.staleTime.long,
    gcTime: cacheConfig.gcTime.long,
    enabled: !!farmId,
  });

  return {
    predictions: predictions?.predictions || [],
    riskFactors: predictions?.risk_factors || [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for disease risk assessment
 */
export function useDiseaseRiskAssessment(farmId: string) {
  const apiClient = getApiClient();

  const {
    data: riskAssessment,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['disease-risk-assessment', farmId],
    queryFn: async () => {
      const response = await apiClient.post<{
        risk_assessment: {
          overall_risk: string;
          risk_factors: string[];
          weather_conditions: {
            avg_temperature: number;
            avg_humidity: number;
            total_precipitation: number;
          } | null;
        };
        recommendations: string[];
      }>('/api/crops/pests-diseases', { action: 'disease_risk_assessment', farm_id: farmId });
      return response;
    },
    staleTime: cacheConfig.staleTime.medium,
    gcTime: cacheConfig.gcTime.medium,
    enabled: !!farmId,
  });

  return {
    riskAssessment: riskAssessment?.risk_assessment,
    recommendations: riskAssessment?.recommendations || [],
    isLoading,
    error,
    refetch,
  };
}
