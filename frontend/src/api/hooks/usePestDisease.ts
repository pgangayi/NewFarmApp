import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/cloudflare';

export interface PestDiseaseRecord {
  id: number;
  farm_id: string;
  field_id?: string;
  crop_id?: string;
  type: 'pest' | 'disease';
  name: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'monitoring';
  detection_date?: string;
  description?: string;
  treatment_plan?: string;
  created_at?: string;
}

export function usePestDisease(farmId?: string) {
  return useQuery({
    queryKey: ['pest-disease', farmId],
    queryFn: async () => {
      if (!farmId) return [];
      const response = await apiClient.get<{ data: PestDiseaseRecord[] }>(
        `/api/pest-disease?farm_id=${farmId}`
      );
      return response.data;
    },
    enabled: !!farmId,
  });
}

export function useCreatePestDisease() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<PestDiseaseRecord, 'id' | 'created_at'>) => {
      const response = await apiClient.post<{ data: PestDiseaseRecord }>(
        '/api/pest-disease',
        data as any
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pest-disease', variables.farm_id] });
    },
  });
}

export function useDeletePestDisease() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/pest-disease/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pest-disease'] });
    },
  });
}
