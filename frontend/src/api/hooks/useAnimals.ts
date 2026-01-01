import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/cloudflare';
import { QUERY_KEYS, CACHE_CONFIG } from '../constants';
import type { Animal, CreateRequest, UpdateRequest } from '../types';
import { LookupService } from '../../services/lookupService';

export function useAnimals(farmId?: string) {
  return useQuery({
    queryKey: farmId ? QUERY_KEYS.animals.byFarm(farmId) : QUERY_KEYS.animals.all,
    queryFn: async () => {
      const endpoint = farmId ? `/api/livestock?farm_id=${farmId}` : '/api/livestock';
      const response = await apiClient.get<{ animals: Animal[] }>(endpoint);
      return response.animals;
    },
    staleTime: CACHE_CONFIG.staleTime.animals,
  });
}

export function useAnimal(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.animals.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<Animal>(`/api/livestock/${id}`);
      return response;
    },
    enabled: !!id,
    staleTime: CACHE_CONFIG.staleTime.animals,
  });
}

export function useBreeds(species?: string) {
  return useQuery({
    queryKey: ['breeds', species],
    queryFn: () => LookupService.getBreeds(species),
    staleTime: CACHE_CONFIG.staleTime.animals,
  });
}

export function useAddBreed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: LookupService.addBreed,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breeds'] });
    },
  });
}

export function useCreateAnimal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateRequest<Animal>) => {
      const response = await apiClient.post<Animal>('/api/livestock', data as any);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.animals.all });
    },
  });
}

export function useUpdateAnimal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRequest<Animal> }) => {
      const response = await apiClient.put<Animal>(`/api/livestock/${id}`, data as any);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.animals.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.animals.detail(variables.id) });
    },
  });
}

export function useDeleteAnimal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/livestock/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.animals.all });
    },
  });
}

// Aliases for backward compatibility
export const useLivestock = useAnimals;
export const useCreateLivestock = useCreateAnimal;
export const useUpdateLivestock = useUpdateAnimal;
export const useDeleteLivestock = useDeleteAnimal;
