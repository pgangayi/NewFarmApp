// Unified CRUD system for consistent data operations across the entire application
// Provides standardized create, read, update, delete operations with caching, validation, and error handling

import { useState, useCallback, useRef, useMemo } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  UseMutationResult,
} from '@tanstack/react-query';
import { z } from 'zod';
import { useSmartDataValidation } from './useSmartDataValidation'; // Assuming this hook exists

export type CRUDOperation = 'create' | 'read' | 'update' | 'delete' | 'list' | 'bulk' | 'infinite';
export type QueryStrategy =
  | 'cache-first'
  | 'network-first'
  | 'cache-only'
  | 'network-only'
  | 'stale-while-revalidate';

export interface CRUDConfig<T> {
  entityType: string;
  endpoint: string;
  validationSchema?: z.ZodSchema<T>;
  defaultSort?: { field: keyof T; order: 'asc' | 'desc' };
  defaultPageSize?: number;
  // queryKey: (filters?: unknown) => string[]; // Removed, hook generates query keys internally
  optimisticUpdates?: boolean;
  gcTime?: number;
  staleTime?: number;
  retryAttempts?: number;
}

export interface CRUDFilters {
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: { field: string; order: 'asc' | 'desc' };
  filters?: Record<string, unknown>;
  dateRange?: { start: Date; end: Date };
  status?: string[];
}

// Simplified CRUDResult for the consumer, using TanStack Query's types internally
export type CRUDListResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export interface CRUDState<T> {
  selectedItems: Set<string>;
  editingItem: T | null;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isBulkOperating: boolean;
  filters: CRUDFilters;
  sort: { field: string; order: 'asc' | 'desc' };
  viewMode: 'list' | 'grid' | 'table';
  lastOperation: CRUDOperation | null;
  operationError: Error | null;
}

// Type for the mutation variables
type CreateItemData<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;
type UpdateItemData<T> = { id: string; data: Partial<T> };
type BulkOperationData = {
  operation: 'delete' | 'update' | 'export';
  ids: string[];
  data?: unknown;
};

// Optimistic Update interface is internal, so we can omit it here.

export function useUnifiedCRUD<T extends { id: string; created_at?: Date; updated_at?: Date }>(
  config: CRUDConfig<T>
) {
  // Core state
  const [state, setState] = useState<CRUDState<T>>({
    selectedItems: new Set(),
    editingItem: null,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    isBulkOperating: false,
    filters: {},
    sort:
      config.defaultSort &&
      typeof config.defaultSort.field === 'string' &&
      typeof config.defaultSort.order === 'string'
        ? { field: config.defaultSort.field, order: config.defaultSort.order as 'asc' | 'desc' }
        : { field: 'created_at' as string, order: 'desc' as const },
    viewMode: 'list',
    lastOperation: null,
    operationError: null,
  });

  // Hooks and utilities
  const queryClient = useQueryClient();
  const { validateData } = useSmartDataValidation();

  // Query key factory
  const getQueryKey = useCallback(
    (operation: CRUDOperation, filters: CRUDFilters = {}): string[] => {
      // Use explicit filters if provided, otherwise use internal state filters for the UI list
      const currentFilters =
        operation === 'list' || operation === 'infinite'
          ? { ...state.filters, ...filters }
          : filters;

      return [
        config.entityType,
        operation,
        JSON.stringify(currentFilters),
        JSON.stringify(state.sort),
      ];
    },
    [config.entityType, state.filters, state.sort]
  );

  // Base query function
  const queryFunction = useCallback(
    async (key: string[], filters: CRUDFilters = {}) => {
      const endpoint = config.endpoint;

      // Build query parameters
      const params = new URLSearchParams();

      // Prioritize passed filters over state.filters for the actual fetch
      const currentFilters = { ...state.filters, ...filters };

      if (currentFilters.search) params.set('search', currentFilters.search);
      if (currentFilters.page) params.set('page', currentFilters.page.toString());
      if (currentFilters.pageSize) params.set('pageSize', currentFilters.pageSize.toString());

      const currentSort = currentFilters.sort || state.sort;
      params.set('sort', currentSort.field);
      params.set('order', currentSort.order);

      // Add custom filters
      Object.entries(currentFilters.filters || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, Array.isArray(value) ? value.join(',') : value.toString());
        }
      });

      // Add date range
      if (currentFilters.dateRange) {
        params.set('startDate', currentFilters.dateRange.start.toISOString());
        params.set('endDate', currentFilters.dateRange.end.toISOString());
      }

      if (currentFilters.status) {
        params.set('status', currentFilters.status.join(','));
      }

      const url = `${endpoint}?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch ${config.entityType}: ${response.statusText}`);
      }

      return response.json() as Promise<CRUDListResult<T>>;
    },
    [config.endpoint, state.filters, state.sort]
  );

  // --- QUERIES ---

  const useGetItem = (id: string) => {
    return useQuery<T>({
      queryKey: [config.entityType, 'item', id],
      queryFn: async () => {
        const response = await fetch(`${config.endpoint}/${id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${config.entityType} item: ${response.statusText}`);
        }
        return (await response.json()) as T;
      },
      enabled: !!id,
      staleTime: config.staleTime || 5 * 60 * 1000,
      gcTime: config.gcTime || 30 * 60 * 1000,
      retry: config.retryAttempts || 3,
    });
  };

  const useGetItems = (filters?: CRUDFilters) => {
    const key = getQueryKey('list', filters);
    return useQuery<CRUDListResult<T>>({
      queryKey: key,
      queryFn: () => queryFunction(key, filters),
      staleTime: config.staleTime || 5 * 60 * 1000,
      gcTime: config.gcTime || 30 * 60 * 1000,
      retry: config.retryAttempts || 3,
    });
  };

  const useGetInfiniteItems = (filters?: CRUDFilters) => {
    const key = getQueryKey('infinite', filters);
    return useInfiniteQuery<CRUDListResult<T>>({
      queryKey: key,
      queryFn: ({ pageParam = 1 }) => queryFunction(key, { ...filters, page: pageParam as number }),
      getNextPageParam: lastPage => {
        if (lastPage.hasNextPage) {
          return (lastPage.page || 1) + 1;
        }
        return undefined;
      },
      initialPageParam: 1,
      staleTime: config.staleTime || 5 * 60 * 1000,
      gcTime: config.gcTime || 30 * 60 * 1000,
    });
  };

  // --- MUTATIONS ---

  const createItemMutation: UseMutationResult<T, Error, CreateItemData<T>> = useMutation({
    mutationFn: async itemData => {
      // Zod Validation
      if (config.validationSchema) {
        try {
          config.validationSchema.parse(itemData);
        } catch (error) {
          if (error instanceof z.ZodError) {
            throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`);
          }
          throw error;
        }
      }

      // Smart validation
      try {
        const validationResult = await validateData(itemData, {
          entityType: config.entityType,
          operation: 'create',
          data: itemData,
          timestamp: new Date(),
        });

        if (!validationResult.isValid) {
          throw new Error(
            `Data validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`
          );
        }
      } catch (error) {
        console.warn('Smart validation failed:', error);
      }

      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create ${config.entityType}: ${response.statusText}`);
      }

      return (await response.json()) as T;
    },
    onMutate: async newItem => {
      if (!config.optimisticUpdates) return;

      await queryClient.cancelQueries({ queryKey: [config.entityType] });

      const listQueryKey = getQueryKey('list');
      const previousItems = queryClient.getQueryData<CRUDListResult<T>>(listQueryKey);

      const optimisticItem = {
        ...newItem,
        id: `temp-${Date.now()}`,
        created_at: new Date(),
        updated_at: new Date(),
      } as T;

      queryClient.setQueryData<CRUDListResult<T>>(listQueryKey, old => {
        if (!old)
          return {
            items: [optimisticItem],
            total: 1,
            page: 1,
            pageSize: config.defaultPageSize || 10,
            hasNextPage: false,
            hasPreviousPage: false,
          };
        return {
          ...old,
          items: [optimisticItem, ...old.items].slice(0, old.pageSize), // Ensure list size is maintained
          total: (old.total || 0) + 1,
        };
      });

      setState(prev => ({ ...prev, isCreating: true, lastOperation: 'create' }));

      return { previousItems };
    },
    onError: (err, newItem, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(getQueryKey('list'), context.previousItems);
      }
      setState(prev => ({ ...prev, operationError: err, isCreating: false }));
    },
    onSuccess: () => {
      setState(prev => ({ ...prev, isCreating: false, lastOperation: 'create' }));
      queryClient.invalidateQueries({ queryKey: [config.entityType] });
    },
  });

  // --- ACTIONS ---

  const actions = {
    createItem: createItemMutation.mutateAsync,
    updateItem: useCallback(
      async (id: string, data: Partial<T>) => {
        const response = await fetch(`${config.endpoint}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`Failed to update ${config.entityType}: ${response.statusText}`);
        }

        return response.json() as Promise<T>;
      },
      [config.endpoint]
    ),

    deleteItem: useCallback(
      async (id: string) => {
        const response = await fetch(`${config.endpoint}/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`Failed to delete ${config.entityType}: ${response.statusText}`);
        }
      },
      [config.endpoint]
    ),
  };

  // --- STATE MANAGEMENT ---

  const setFilters = useCallback((filters: CRUDFilters) => {
    setState(prev => ({ ...prev, filters }));
  }, []);

  const setSort = useCallback((sort: { field: string; order: 'asc' | 'desc' }) => {
    setState(prev => ({ ...prev, sort }));
  }, []);

  const selectItem = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      selectedItems: new Set([...prev.selectedItems, id]),
    }));
  }, []);

  const deselectItem = useCallback((id: string) => {
    setState(prev => {
      const newSelected = new Set(prev.selectedItems);
      newSelected.delete(id);
      return { ...prev, selectedItems: newSelected };
    });
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedItems: new Set() }));
  }, []);

  // --- RETURN ---

  return {
    // State
    state,

    // Queries
    useGetItem,
    useGetItems,
    useGetInfiniteItems,

    // Mutations
    createItem: actions.createItem,
    updateItem: actions.updateItem,
    deleteItem: actions.deleteItem,

    // State actions
    setFilters,
    setSort,
    selectItem,
    deselectItem,
    clearSelection,

    // Utilities
    getQueryKey,
  };
}
