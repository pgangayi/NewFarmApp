// Enhanced React Query Hook for Optimized Animal Management
// Addresses audit findings for frontend performance and real-time integration

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useApiClient } from './useApiClient';
import { useWebSocket } from './useWebSocket';
import { Animal, AnimalHealth } from '../types/entities';
import { apiEndpoints, cacheConfig } from '../config/env';

// Optimized hook with caching, real-time updates, and performance enhancements
export function useOptimizedAnimals() {
  const queryClient = useQueryClient();
  const apiClient = useApiClient();
  const { subscribe, unsubscribe } = useWebSocket();

  // Configure query options for optimal performance
  const queryOptions = {
    staleTime: cacheConfig.staleTime.medium,
    gcTime: cacheConfig.gcTime.long,
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors except 408, 429
      if (error?.status >= 400 && error?.status < 500 && ![408, 429].includes(error.status)) {
        return false;
      }
      return failureCount < 3;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  };

  // Main animals query with optimized caching
  const {
    data: response,
    isLoading,
    error,
    refetch,
    isFetching,
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
    ...queryOptions,
  });

  // Infinite scroll query for large datasets
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['animals', 'infinite'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<{
        success: boolean;
        data: {
          animals: Animal[];
          pagination: { page: number; limit: number; total: number; pages: number };
        };
      }>(`${apiEndpoints.animals.list}?page=${pageParam}&limit=50`);
      return {
        ...response.data,
        pageParam,
      };
    },
    getNextPageParam: lastPage => {
      const { pagination } = lastPage.data;
      return pagination.page < pagination.pages ? pagination.page + 1 : undefined;
    },
    initialPageParam: 1,
    ...queryOptions,
  });

  // Extract animals array from response
  const animals = response?.data?.animals || [];

  // Create animal mutation with optimistic updates
  const {
    mutate: createAnimal,
    isPending: isCreating,
    error: createError,
  } = useMutation({
    mutationFn: async (animalData: CreateAnimalForm) => {
      const response = await apiClient.post<Animal>(apiEndpoints.animals.create, animalData);
      return response;
    },
    onMutate: async newAnimal => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['animals'] });

      // Snapshot the previous value
      const previousAnimals = queryClient.getQueryData(['animals']);

      // Optimistically update to the new value
      queryClient.setQueryData(['animals'], old => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            animals: [...old.data.animals, { ...newAnimal, id: 'temp-' + Date.now() }],
          },
        };
      });

      // Return a context object with the snapshotted value
      return { previousAnimals };
    },
    onError: (err, newAnimal, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(['animals'], context?.previousAnimals);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['animals'] });
    },
  });

  // Update animal mutation with optimistic updates
  const {
    mutate: updateAnimal,
    isPending: isUpdating,
    error: updateError,
  } = useMutation({
    mutationFn: async ({ id, ...animalData }: UpdateAnimalForm) => {
      const response = await apiClient.put<Animal>(apiEndpoints.animals.update(id), animalData);
      return response;
    },
    onMutate: async updatedAnimal => {
      await queryClient.cancelQueries({ queryKey: ['animals'] });

      const previousAnimals = queryClient.getQueryData(['animals']);

      queryClient.setQueryData(['animals'], old => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            animals: old.data.animals.map(animal =>
              animal.id === updatedAnimal.id ? { ...animal, ...updatedAnimal } : animal
            ),
          },
        };
      });

      return { previousAnimals };
    },
    onError: (err, updatedAnimal, context) => {
      queryClient.setQueryData(['animals'], context?.previousAnimals);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
    },
  });

  // Delete animal mutation with rollback support
  const {
    mutate: deleteAnimal,
    isPending: isDeleting,
    error: deleteError,
  } = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(apiEndpoints.animals.delete(id));
      return id;
    },
    onMutate: async animalId => {
      await queryClient.cancelQueries({ queryKey: ['animals'] });

      const previousAnimals = queryClient.getQueryData(['animals']);

      queryClient.setQueryData(['animals'], old => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            animals: old.data.animals.filter(animal => animal.id !== animalId),
          },
        };
      });

      return { previousAnimals };
    },
    onError: (err, animalId, context) => {
      queryClient.setQueryData(['animals'], context?.previousAnimals);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
    },
  });

  // Real-time updates subscription
  React.useEffect(() => {
    const handleAnimalUpdate = (event: any) => {
      const { type, data } = event;

      switch (type) {
        case 'animal.created':
          queryClient.setQueryData(['animals'], old => {
            if (!old) return old;
            return {
              ...old,
              data: {
                ...old.data,
                animals: [data, ...old.data.animals],
              },
            };
          });
          break;

        case 'animal.updated':
          queryClient.setQueryData(['animals'], old => {
            if (!old) return old;
            return {
              ...old,
              data: {
                ...old.data,
                animals: old.data.animals.map(animal =>
                  animal.id === data.id ? { ...animal, ...data } : animal
                ),
              },
            };
          });
          break;

        case 'animal.deleted':
          queryClient.setQueryData(['animals'], old => {
            if (!old) return old;
            return {
              ...old,
              data: {
                ...old.data,
                animals: old.data.animals.filter(animal => animal.id !== data.id),
              },
            };
          });
          break;
      }
    };

    // Subscribe to animal-related WebSocket events
    subscribe('animals', handleAnimalUpdate);

    // Cleanup subscription on unmount
    return () => {
      unsubscribe('animals', handleAnimalUpdate);
    };
  }, [subscribe, unsubscribe, queryClient]);

  return {
    animals: animals || [],
    infiniteData,
    isLoading,
    error,
    refetch,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
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

// Optimized hook for animal details with intelligent caching
export function useOptimizedAnimal(animalId: string) {
  const queryClient = useQueryClient();
  const apiClient = useApiClient();

  const query = useQuery({
    queryKey: ['animals', animalId],
    queryFn: async () => {
      const response = await apiClient.get<Animal>(apiEndpoints.animals.get(animalId));
      return response;
    },
    enabled: !!animalId,
    staleTime: cacheConfig.staleTime.long,
    gcTime: cacheConfig.staleTime.long,
    retry: 2,
  });

  // Prefetch related data
  const prefetchAnimalHealth = React.useCallback(async () => {
    await queryClient.prefetchQuery({
      queryKey: ['animals', animalId, 'health'],
      queryFn: async () => {
        const response = await apiClient.get<AnimalHealth>(
          `${apiEndpoints.animals.get(animalId)}/health`
        );
        return response;
      },
      staleTime: cacheConfig.staleTime.short,
    });
  }, [queryClient, apiClient, animalId]);

  return {
    ...query,
    prefetchAnimalHealth,
  };
}

// Performance monitoring hook
export function useAnimalsPerformance() {
  const queryClient = useQueryClient();

  const getCacheMetrics = React.useCallback(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    const animalQueries = queries.filter(query => query.queryKey[0] === 'animals');

    return {
      totalAnimalQueries: animalQueries.length,
      activeQueries: animalQueries.filter(q => q.getObserversCount() > 0).length,
      staleQueries: animalQueries.filter(q => q.isStale()).length,
      errorQueries: animalQueries.filter(
        q => q.getObserversCount() > 0 && q.getObserversCount() === 0 && q.error
      ).length,
    };
  }, [queryClient]);

  const clearAnimalCache = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['animals'] });
  }, [queryClient]);

  return {
    getCacheMetrics,
    clearAnimalCache,
  };
}

// Types for the optimized hooks
export interface CreateAnimalForm {
  farm_id: string;
  name: string;
  species: string;
  breed?: string;
  identification_tag?: string;
  birth_date?: string;
  sex?: string;
  health_status?: string;
  current_location?: string;
  pasture_id?: number;
  production_type?: string;
  status?: 'active' | 'sold' | 'deceased';
  current_weight?: number;
  target_weight?: number;
  vaccination_status?: string;
  acquisition_date: string;
  acquisition_cost?: number;
}

export interface UpdateAnimalForm extends Partial<CreateAnimalForm> {
  id: string;
}
