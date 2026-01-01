import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/cloudflare';

export interface RotationStep {
  id?: number;
  step_order: number;
  crop_type: string;
  variety?: string;
  season: string;
  year_offset: number;
  notes?: string;
}

export interface RotationPlan {
  id: number;
  farm_id: string;
  field_id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status: 'active' | 'completed' | 'archived';
  steps: RotationStep[];
  created_at?: string;
}

export function useRotations(farmId?: string) {
  return useQuery({
    queryKey: ['rotations', farmId],
    queryFn: async () => {
      if (!farmId) return [];
      const response = await apiClient.get<{ data: RotationPlan[] }>(
        `/api/rotations?farm_id=${farmId}`
      );
      return response.data;
    },
    enabled: !!farmId,
  });
}

export function useCreateRotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<RotationPlan, 'id' | 'created_at'>) => {
      const response = await apiClient.post<{ data: RotationPlan }>('/api/rotations', data as any);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rotations', variables.farm_id] });
    },
  });
}

export function useDeleteRotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/rotations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotations'] });
    },
  });
}
