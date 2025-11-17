import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from './useApiClient';
import {
  Animal,
  AnimalHealth,
  PedigreeNode,
  LivestockStats,
  AnimalMovement,
} from '../types/entities';
import { apiEndpoints, cacheConfig } from '../config/env';

export interface CreateAnimalForm {
  farm_id: string;
  name: string;
  species: string;
  breed?: string;
  identification_tag?: string;
  birth_date?: string;
  sex?: string;
  health_status?: string;
  // New intake management fields
  intake_type: 'Birth' | 'Purchase' | 'Transfer';
  intake_date: string;
  purchase_price?: number;
  seller_details?: string;
  // New pedigree fields
  father_id?: string;
  mother_id?: string;
  // New location field
  current_location_id?: string;
  // Legacy fields (keeping for backward compatibility)
  current_location?: string;
  pasture_id?: number;
  production_type?: string;
  status?: 'active' | 'sold' | 'deceased';
  current_weight?: number;
  target_weight?: number;
  vaccination_status?: string;
  acquisition_date?: string;
  acquisition_cost?: number;
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
  const apiClient = useApiClient();

  // Fetch all animals
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['animals'],
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: {
          animals: Animal[];
          pagination: { page: number; limit: number; total: number; pages: number };
        };
      }>(apiEndpoints.animals.list);
      return response;
    },
    staleTime: cacheConfig.staleTime.medium,
    gcTime: cacheConfig.gcTime.medium,
    retry: 2,
  });

  // Extract animals array from the response
  const animals = response?.data?.animals || [];

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
  const apiClient = useApiClient();

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['animals', 'farm', farmId],
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: {
          animals: Animal[];
          pagination: { page: number; limit: number; total: number; pages: number };
        };
      }>(`${apiEndpoints.animals.list}?farm_id=${farmId}`);
      return response;
    },
    staleTime: cacheConfig.staleTime.medium,
    gcTime: cacheConfig.gcTime.medium,
    retry: 2,
    enabled: !!farmId,
  });

  // Extract animals array from the response
  const animals = response?.data?.animals || [];

  return { animals: animals || [], isLoading, error, refetch };
}

/**
 * Hook for animal health information
 */
export function useAnimalHealth(animalId: string) {
  const apiClient = useApiClient();

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
 * Hook for animal statistics (enhanced with backend stats)
 */
export function useAnimalsStats() {
  const apiClient = useApiClient();

  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['animals', 'stats'],
    queryFn: async () => {
      const response = await apiClient.get<LivestockStats>(apiEndpoints.animals.stats);
      return response;
    },
    staleTime: cacheConfig.staleTime.long,
    gcTime: cacheConfig.gcTime.long,
    retry: 2,
  });

  return { stats: stats || null, isLoading, error, refetch };
}

/**
 * Hook for animal pedigree
 */
export function useAnimalPedigree(animalId: string) {
  const apiClient = useApiClient();

  const {
    data: pedigree,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['animals', 'pedigree', animalId],
    queryFn: async () => {
      const response = await apiClient.get<PedigreeNode>(
        `${apiEndpoints.animals.get(animalId)}/pedigree`
      );
      return response;
    },
    staleTime: cacheConfig.staleTime.medium,
    gcTime: cacheConfig.gcTime.medium,
    retry: 2,
    enabled: !!animalId,
  });

  return { pedigree: pedigree || null, isLoading, error, refetch };
}

/**
 * Hook for animal movements
 */
export function useAnimalMovements(animalId: string) {
  const apiClient = useApiClient();

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['animals', 'movements', animalId],
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: AnimalMovement[];
      }>(`${apiEndpoints.animals.get(animalId)}/movements`);
      return response;
    },
    staleTime: cacheConfig.staleTime.medium,
    gcTime: cacheConfig.gcTime.medium,
    retry: 2,
    enabled: !!animalId,
  });

  const movements = response?.data || [];

  return { movements, isLoading, error, refetch };
}

/**
 * Hook for creating animal movements
 */
export function useCreateAnimalMovement() {
  const queryClient = useQueryClient();
  const apiClient = useApiClient();

  const {
    mutate: moveAnimal,
    isPending: isMoving,
    error: moveError,
  } = useMutation({
    mutationFn: async ({
      animalId,
      destination_location_id,
      movement_date,
      notes,
    }: {
      animalId: string;
      destination_location_id: string;
      movement_date: string;
      notes?: string;
    }) => {
      const response = await apiClient.post<AnimalMovement>(
        `${apiEndpoints.animals.get(animalId)}/movements`,
        { destination_location_id, movement_date, notes }
      );
      return response;
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      queryClient.invalidateQueries({ queryKey: ['animals', 'movements', variables.animalId] });
      queryClient.invalidateQueries({ queryKey: ['animals', 'stats'] });
    },
  });

  return { moveAnimal, isMoving, moveError };
}
