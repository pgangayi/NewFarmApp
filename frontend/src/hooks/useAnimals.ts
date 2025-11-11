import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '../lib/api/client';
import { Animal, AnimalHealth } from '../types/entities';
import { apiEndpoints, cacheConfig } from '../config/env';

export interface CreateAnimalForm {
  farm_id: string;
  animal_type: string;
  breed?: string;
  identification: string;
  date_of_birth?: string;
  acquisition_date: string;
  status?: 'active' | 'sold' | 'deceased';
}

export interface UpdateAnimalForm extends Partial<CreateAnimalForm> {
  id: string;
}

/**
 * Main hook for animal management
 * Provides query, create, update, delete operations with React Query
 */
export function useAnimals() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  // Fetch all animals
  const {
    data: animals,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['animals'],
    queryFn: async () => {
      const response = await apiClient.get<Animal[]>(apiEndpoints.animals.list);
      return response;
    },
    staleTime: cacheConfig.staleTime.medium,
    gcTime: cacheConfig.gcTime.medium,
    retry: 2,
  });

  // Create animal mutation
  const {
    mutate: createAnimal,
    isPending: isCreating,
    error: createError,
  } = useMutation({
    mutationFn: async (animalData: CreateAnimalForm) => {
      const response = await apiClient.post<Animal>(apiEndpoints.animals.create, animalData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
    },
  });

  // Update animal mutation
  const {
    mutate: updateAnimal,
    isPending: isUpdating,
    error: updateError,
  } = useMutation({
    mutationFn: async ({ id, ...animalData }: UpdateAnimalForm) => {
      const response = await apiClient.put<Animal>(apiEndpoints.animals.update(id), animalData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
    },
  });

  // Delete animal mutation
  const {
    mutate: deleteAnimal,
    isPending: isDeleting,
    error: deleteError,
  } = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(apiEndpoints.animals.delete(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
    },
  });

  return {
    animals: animals || [],
    isLoading,
    error,
    refetch,
    createAnimal,
    updateAnimal,
    deleteAnimal,
    isCreating,
    isUpdating,
    isDeleting,
    createError,
    updateError,
    deleteError,
  };
}

/**
 * Hook for fetching animals by farm
 */
export function useAnimalsByFarm(farmId: string) {
  const apiClient = getApiClient();

  const {
    data: animals,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['animals', 'farm', farmId],
    queryFn: async () => {
      const response = await apiClient.get<Animal[]>(
        `${apiEndpoints.animals.list}?farm_id=${farmId}`
      );
      return response;
    },
    staleTime: cacheConfig.staleTime.medium,
    gcTime: cacheConfig.gcTime.medium,
    retry: 2,
    enabled: !!farmId,
  });

  return { animals: animals || [], isLoading, error, refetch };
}

/**
 * Hook for animal health information
 */
export function useAnimalHealth(animalId: string) {
  const apiClient = getApiClient();

  const {
    data: health,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['animals', 'health', animalId],
    queryFn: async () => {
      const response = await apiClient.get<AnimalHealth>(
        `${apiEndpoints.animals.get(animalId)}/health`
      );
      return response;
    },
    staleTime: cacheConfig.staleTime.short,
    gcTime: cacheConfig.gcTime.short,
    retry: 2,
    enabled: !!animalId,
  });

  return { health: health || {}, isLoading, error, refetch };
}

/**
 * Hook for animal statistics
 */
export function useAnimalsStats() {
  const { animals } = useAnimals();

  const stats = {
    total: animals.length,
    byStatus: {
      active: animals.filter(a => a.status === 'active').length,
      sold: animals.filter(a => a.status === 'sold').length,
      deceased: animals.filter(a => a.status === 'deceased').length,
    },
    activeCount: animals.filter(a => a.status === 'active').length,
    byType: animals.reduce(
      (acc, animal) => {
        acc[animal.animal_type] = (acc[animal.animal_type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
  };

  return stats;
}
