/**
 * TASK HOOKS
 * ==========
 * TanStack Query hooks for task operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/cloudflare';
import { QUERY_KEYS, CACHE_CONFIG, API_ENDPOINTS } from '../constants';
import type { Task, CreateRequest, UpdateRequest } from '../types';

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch all tasks, optionally filtered
 */
export function useTasks(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: QUERY_KEYS.tasks.list(filters),
    queryFn: async () => {
      let endpoint = API_ENDPOINTS.tasks.list;

      // Add farm_id filter if provided
      if (filters?.farm_id) {
        endpoint = `${endpoint}?farm_id=${filters.farm_id}`;
      }

      const response = await apiClient.get<Task[] | { tasks: Task[] }>(endpoint);

      if (Array.isArray(response)) {
        return response;
      }

      // Handle enhanced response with analytics
      if (
        response &&
        typeof response === 'object' &&
        'tasks' in response &&
        Array.isArray((response as any).tasks)
      ) {
        return (response as any).tasks;
      }

      return [];
    },
    staleTime: CACHE_CONFIG.staleTime.tasks,
    gcTime: CACHE_CONFIG.gcTime.default,
  });
}

/**
 * Fetch a single task by ID
 */
export function useTask(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.tasks.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<Task>(API_ENDPOINTS.tasks.detail(id));
      return response;
    },
    enabled: !!id,
    staleTime: CACHE_CONFIG.staleTime.tasks,
    gcTime: CACHE_CONFIG.gcTime.default,
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new task
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRequest<Task>) => {
      const response = await apiClient.post<Task>(API_ENDPOINTS.tasks.create, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.all });
    },
  });
}

/**
 * Update an existing task
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRequest<Task> }) => {
      const response = await apiClient.put<Task>(API_ENDPOINTS.tasks.update(id), data);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.detail(variables.id) });
    },
  });
}

/**
 * Delete a task
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(API_ENDPOINTS.tasks.delete(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.all });
    },
  });
}

export function useStartTimeLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, startTime }: { taskId: string; startTime: string }) => {
      const response = await apiClient.post<{ id: number }>('/api/tasks/time-logs', {
        task_id: taskId,
        start_time: startTime,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.all });
    },
  });
}

export function useStopTimeLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ logId, endTime }: { logId: number; endTime: string }) => {
      const response = await apiClient.put(`/api/tasks/time-logs/${logId}`, {
        end_time: endTime,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.all });
    },
  });
}
