import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { apiClient } from '../../lib/cloudflare';

export function useIrrigation() {
  const queryClient = useQueryClient();

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['irrigation-schedules'],
    queryFn: async () => {
      // Placeholder endpoint
      // return apiClient.get('/api/irrigation/schedules');
      return [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (_data: any) => {
      // Placeholder endpoint
      // return apiClient.put(`/api/irrigation/schedules/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['irrigation-schedules'] });
    },
  });

  const optimizeMutation = useMutation({
    mutationFn: async (_data: { schedule_id: string }) => {
      // Placeholder endpoint
      // return apiClient.post('/api/irrigation/optimize', data);
    },
  });

  return {
    schedules,
    isLoading,
    updateSchedule: updateMutation.mutate,
    optimizeSchedule: optimizeMutation.mutate,
    isOptimizing: optimizeMutation.isPending,
  };
}
