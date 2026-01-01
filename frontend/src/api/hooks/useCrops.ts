import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/cloudflare';
import { QUERY_KEYS, CACHE_CONFIG } from '../constants';
import type { Crop, CreateRequest, UpdateRequest } from '../types';
import { LookupService } from '../../services/lookupService';

export function useCrops(farmId?: string) {
  return useQuery({
    queryKey: farmId ? QUERY_KEYS.crops.byFarm(farmId) : QUERY_KEYS.crops.all,
    queryFn: async () => {
      const endpoint = farmId ? `/api/crops?farm_id=${farmId}` : '/api/crops';
      const response = await apiClient.get<Crop[]>(endpoint);
      return response;
    },
    staleTime: CACHE_CONFIG.staleTime.crops,
  });
}

export function useCrop(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.crops.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<Crop>(`/api/crops?id=${id}`);
      return response;
    },
    enabled: !!id,
    staleTime: CACHE_CONFIG.staleTime.crops,
  });
}

export function useCropVarieties(cropType?: string) {
  return useQuery({
    queryKey: ['crop-varieties', cropType],
    queryFn: () => LookupService.getCropVarieties(cropType),
    staleTime: CACHE_CONFIG.staleTime.crops,
  });
}

export function useStrains() {
  return useCropVarieties();
}

export function useAddCropVariety() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: LookupService.addCropVariety,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crop-varieties'] });
    },
  });
}

export function useCreateCrop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateRequest<Crop>) => {
      const response = await apiClient.post<Crop>('/api/crops', data as any);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.crops.all });
    },
  });
}

export function useUpdateCrop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRequest<Crop> }) => {
      const response = await apiClient.put<Crop>(`/api/crops/${id}`, data as any);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.crops.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.crops.detail(variables.id) });
    },
  });
}

export function useDeleteCrop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/crops/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.crops.all });
    },
  });
}
