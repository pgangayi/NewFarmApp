// Unified CRUD system for consistent data operations across the entire application
// Provides standardized create, read, update, delete operations with caching, validation, and error handling

import { useState, useCallback, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useSmartDataValidation } from './useSmartDataValidation';

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
  queryKey: (filters?: unknown) => string[];
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

export interface CRUDResult<T> {
  data: T | null;
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isLoading: boolean;
  error: Error | null;
}

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

export interface OptimisticUpdate<T> {
  type: 'create' | 'update' | 'delete' | 'bulk';
  data: T | T[];
  previousData?: T | T[];
  timestamp: number;
}

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
    sort: config.defaultSort || { field: 'created_at' as string, order: 'desc' },
    viewMode: 'list',
    lastOperation: null,
    operationError: null,
  });

  // Hooks and utilities
  const queryClient = useQueryClient();
  const { validateData } = useSmartDataValidation();
  const operationCache = useRef<Map<string, Promise<unknown>>>(new Map());

  // Query key factory
  const getQueryKey = useCallback(
    (operation: CRUDOperation, filters?: CRUDFilters): string[] => {
      return [
        config.entityType,
        operation,
        JSON.stringify(filters || state.filters),
        JSON.stringify(state.sort),
      ];
    },
    [config.entityType, state.filters, state.sort]
  );

  // Base query function
  const queryFunction = useCallback(
    async (key: string[], variables?: unknown) => {
      const endpoint = config.endpoint;
      const filters = variables || state.filters;

      // Build query parameters
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.page) params.set('page', filters.page.toString());
      if (filters.pageSize) params.set('pageSize', filters.pageSize.toString());
      if (filters.sort) {
        params.set('sort', filters.sort.field);
        params.set('order', filters.sort.order);
      }

      // Add custom filters
      Object.entries(filters.filters || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, Array.isArray(value) ? value.join(',') : value.toString());
        }
      });

      // Add date range
      if (filters.dateRange) {
        params.set('startDate', filters.dateRange.start.toISOString());
        params.set('endDate', filters.dateRange.end.toISOString());
      }

      const url = `${endpoint}?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch ${config.entityType}: ${response.statusText}`);
      }

      return response.json();
    },
    [config.endpoint, state.filters]
  );

  // Get single item
  const getItem = useCallback(
    (id: string) => {
      return useQuery({
        queryKey: [config.entityType, 'item', id],
        queryFn: async () => {
          const response = await fetch(`${config.endpoint}/${id}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch ${config.entityType} item: ${response.statusText}`);
          }
          return response.json();
        },
        enabled: !!id,
        staleTime: config.staleTime || 5 * 60 * 1000, // 5 minutes
        gcTime: config.gcTime || 30 * 60 * 1000, // 30 minutes
        retry: config.retryAttempts || 3,
      });
    },
    [config]
  );

  // Get list of items
  const getItems = useCallback(
    (filters?: CRUDFilters) => {
      return useQuery({
        queryKey: getQueryKey('list', filters),
        queryFn: () => queryFunction(getQueryKey('list', filters), filters),
        staleTime: config.staleTime || 5 * 60 * 1000,
        gcTime: config.gcTime || 30 * 60 * 1000,
        retry: config.retryAttempts || 3,
      });
    },
    [queryFunction, getQueryKey, config.staleTime, config.gcTime, config.retryAttempts]
  );

  // Infinite scroll for large lists
  const getInfiniteItems = useCallback(
    (filters?: CRUDFilters) => {
      return useInfiniteQuery({
        queryKey: getQueryKey('infinite', filters),
        queryFn: ({ pageParam = 1 }) =>
          queryFunction(getQueryKey('infinite', filters), { ...filters, page: pageParam }),
        getNextPageParam: (lastPage: unknown) => {
          if (lastPage.hasNextPage) {
            return (lastPage.page || 1) + 1;
          }
          return undefined;
        },
        staleTime: config.staleTime || 5 * 60 * 1000,
        gcTime: config.gcTime || 30 * 60 * 1000,
      });
    },
    [queryFunction, getQueryKey, config.staleTime, config.gcTime]
  );

  // Create item mutation
  const createItemMutation = useCallback(() => {
    return useMutation({
      mutationFn: async (itemData: Omit<T, 'id' | 'created_at' | 'updated_at'>) => {
        // Validate data if schema provided
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

        // Smart validation if available
        try {
          const validationResult = await validateData(itemData, {
            entityType: config.entityType as unknown,
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
          // Continue with creation even if smart validation fails
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

        return response.json();
      },
      onMutate: async newItem => {
        if (!config.optimisticUpdates) return;

        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: [config.entityType] });

        // Snapshot the previous value
        const previousItems = queryClient.getQueryData(getQueryKey('list'));

        // Optimistically update to the new value
        const optimisticItem = {
          ...newItem,
          id: `temp-${Date.now()}`,
          created_at: new Date(),
          updated_at: new Date(),
        };

        queryClient.setQueryData(getQueryKey('list'), (old: unknown) => {
          if (!old) return { items: [optimisticItem], total: 1 };
          return {
            ...old,
            items: [optimisticItem, ...old.items],
            total: (old.total || 0) + 1,
          };
        });

        setState(prev => ({ ...prev, isCreating: true, lastOperation: 'create' }));

        return { previousItems };
      },
      onError: (err, newItem, context) => {
        // Rollback the optimistic update
        if (context?.previousItems) {
          queryClient.setQueryData(getQueryKey('list'), context.previousItems);
        }

        setState(prev => ({
          ...prev,
          isCreating: false,
          operationError: err as Error,
          lastOperation: null,
        }));
      },
      onSuccess: data => {
        // Invalidate and refetch
        queryClient.invalidateQueries({ queryKey: [config.entityType] });

        setState(prev => ({
          ...prev,
          isCreating: false,
          operationError: null,
          lastOperation: null,
        }));
      },
    });
  }, [config, queryClient, validateData, getQueryKey]);

  // Update item mutation
  const updateItemMutation = useCallback(() => {
    return useMutation({
      mutationFn: async ({ id, data }: { id: string; data: Partial<T> }) => {
        // Validate data if schema provided
        if (config.validationSchema) {
          try {
            const partialSchema = config.validationSchema.partial();
            partialSchema.parse(data);
          } catch (error) {
            if (error instanceof z.ZodError) {
              throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`);
            }
            throw error;
          }
        }

        const response = await fetch(`${config.endpoint}/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`Failed to update ${config.entityType}: ${response.statusText}`);
        }

        return response.json();
      },
      onMutate: async ({ id, data }) => {
        if (!config.optimisticUpdates) return;

        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: [config.entityType] });

        // Snapshot the previous value
        const previousItems = queryClient.getQueryData(getQueryKey('list'));

        // Optimistically update
        queryClient.setQueryData(getQueryKey('list'), (old: unknown) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item: T) =>
              item.id === id ? { ...item, ...data, updated_at: new Date() } : item
            ),
          };
        });

        setState(prev => ({
          ...prev,
          isUpdating: true,
          editingItem: null,
          lastOperation: 'update',
        }));

        return { previousItems };
      },
      onError: (err, { id }, context) => {
        if (context?.previousItems) {
          queryClient.setQueryData(getQueryKey('list'), context.previousItems);
        }

        setState(prev => ({
          ...prev,
          isUpdating: false,
          operationError: err as Error,
          lastOperation: null,
        }));
      },
      onSuccess: data => {
        queryClient.invalidateQueries({ queryKey: [config.entityType] });

        setState(prev => ({
          ...prev,
          isUpdating: false,
          operationError: null,
          lastOperation: null,
        }));
      },
    });
  }, [config, queryClient, getQueryKey]);

  // Delete item mutation
  const deleteItemMutation = useCallback(() => {
    return useMutation({
      mutationFn: async (id: string) => {
        const response = await fetch(`${config.endpoint}/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`Failed to delete ${config.entityType}: ${response.statusText}`);
        }

        return response.json();
      },
      onMutate: async id => {
        if (!config.optimisticUpdates) return;

        await queryClient.cancelQueries({ queryKey: [config.entityType] });

        const previousItems = queryClient.getQueryData(getQueryKey('list'));

        queryClient.setQueryData(getQueryKey('list'), (old: unknown) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.filter((item: T) => item.id !== id),
            total: Math.max(0, (old.total || 1) - 1),
          };
        });

        setState(prev => ({
          ...prev,
          isDeleting: true,
          selectedItems: new Set([...prev.selectedItems].filter(itemId => itemId !== id)),
          lastOperation: 'delete',
        }));

        return { previousItems };
      },
      onError: (err, id, context) => {
        if (context?.previousItems) {
          queryClient.setQueryData(getQueryKey('list'), context.previousItems);
        }

        setState(prev => ({
          ...prev,
          isDeleting: false,
          operationError: err as Error,
          lastOperation: null,
        }));
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [config.entityType] });

        setState(prev => ({
          ...prev,
          isDeleting: false,
          operationError: null,
          lastOperation: null,
        }));
      },
    });
  }, [config, queryClient, getQueryKey]);

  // Bulk operations
  const bulkOperationMutation = useCallback(() => {
    return useMutation({
      mutationFn: async ({
        operation,
        ids,
        data,
      }: {
        operation: 'delete' | 'update' | 'export';
        ids: string[];
        data?: unknown;
      }) => {
        const response = await fetch(`${config.endpoint}/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operation,
            ids,
            data,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to perform bulk ${operation}: ${response.statusText}`);
        }

        return response.json();
      },
      onMutate: async ({ operation, ids }) => {
        if (!config.optimisticUpdates) return;

        await queryClient.cancelQueries({ queryKey: [config.entityType] });

        const previousItems = queryClient.getQueryData(getQueryKey('list'));

        queryClient.setQueryData(getQueryKey('list'), (old: unknown) => {
          if (!old) return old;

          if (operation === 'delete') {
            return {
              ...old,
              items: old.items.filter((item: T) => !ids.includes(item.id)),
              total: Math.max(0, (old.total || ids.length) - ids.length),
            };
          }

          return old;
        });

        setState(prev => ({
          ...prev,
          isBulkOperating: true,
          selectedItems: new Set(),
          lastOperation: 'bulk',
        }));

        return { previousItems };
      },
      onError: (err, { operation }, context) => {
        if (context?.previousItems) {
          queryClient.setQueryData(getQueryKey('list'), context.previousItems);
        }

        setState(prev => ({
          ...prev,
          isBulkOperating: false,
          operationError: err as Error,
          lastOperation: null,
        }));
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [config.entityType] });

        setState(prev => ({
          ...prev,
          isBulkOperating: false,
          operationError: null,
          lastOperation: null,
        }));
      },
    });
  }, [config, queryClient, getQueryKey]);

  // State management actions
  const selectItem = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      selectedItems: new Set([...prev.selectedItems, id]),
    }));
  }, []);

  const deselectItem = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      selectedItems: new Set([...prev.selectedItems].filter(itemId => itemId !== id)),
    }));
  }, []);

  const selectAll = useCallback((items: T[]) => {
    setState(prev => ({
      ...prev,
      selectedItems: new Set(items.map(item => item.id)),
    }));
  }, []);

  const deselectAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedItems: new Set(),
    }));
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setState(prev => {
      const newSelected = new Set(prev.selectedItems);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return {
        ...prev,
        selectedItems: newSelected,
      };
    });
  }, []);

  const setEditingItem = useCallback((item: T | null) => {
    setState(prev => ({ ...prev, editingItem: item }));
  }, []);

  const setFilters = useCallback((filters: Partial<CRUDFilters>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...filters },
      selectedItems: new Set(), // Clear selection when filters change
    }));
  }, []);

  const setSort = useCallback((sort: { field: string; order: 'asc' | 'desc' }) => {
    setState(prev => ({ ...prev, sort }));
  }, []);

  const setViewMode = useCallback((viewMode: 'list' | 'grid' | 'table') => {
    setState(prev => ({ ...prev, viewMode }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, operationError: null }));
  }, []);

  // Utility functions
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [config.entityType] });
  }, [queryClient, config.entityType]);

  const refetch = useCallback(() => {
    queryClient.refetchQueries({ queryKey: [config.entityType] });
  }, [queryClient, config.entityType]);

  const clearCache = useCallback(() => {
    queryClient.removeQueries({ queryKey: [config.entityType] });
  }, [queryClient, config.entityType]);

  // Computed values
  const isOperationPending = useMemo(
    () => state.isCreating || state.isUpdating || state.isDeleting || state.isBulkOperating,
    [state]
  );

  const hasSelection = useMemo(() => state.selectedItems.size > 0, [state.selectedItems]);

  const selectedCount = useMemo(() => state.selectedItems.size, [state.selectedItems]);

  const isFiltered = useMemo(() => {
    const { search, filters, dateRange, status } = state.filters;
    return !!(
      search ||
      (filters && Object.keys(filters).length > 0) ||
      dateRange ||
      (status && status.length > 0)
    );
  }, [state.filters]);

  // Return comprehensive interface
  return {
    // Data queries
    getItem,
    getItems,
    getInfiniteItems,

    // Mutations
    createItem: createItemMutation(),
    updateItem: updateItemMutation(),
    deleteItem: deleteItemMutation(),
    bulkOperation: bulkOperationMutation(),

    // State
    state,

    // Actions
    selectItem,
    deselectItem,
    selectAll,
    deselectAll,
    toggleSelection,
    setEditingItem,
    setFilters,
    setSort,
    setViewMode,
    clearError,

    // Utilities
    refresh,
    refetch,
    clearCache,

    // Computed
    isOperationPending,
    hasSelection,
    selectedCount,
    isFiltered,
  };
}

export default useUnifiedCRUD;
