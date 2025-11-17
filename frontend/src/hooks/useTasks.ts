import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from './useApiClient';
import { Task, Operation } from '../types/entities';
import { apiEndpoints, cacheConfig } from '../config/env';

export interface CreateTaskForm {
  farm_id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  due_date: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export interface UpdateTaskForm extends Partial<CreateTaskForm> {
  id: string;
}

/**
 * Main hook for task management
 * Provides query, create, update, delete operations with React Query
 */
export function useTasks() {
  const queryClient = useQueryClient();
  const apiClient = useApiClient();

  // Fetch all tasks
  const {
    data: tasks,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await apiClient.get<Task[]>(apiEndpoints.tasks.list);
      return response;
    },
    staleTime: cacheConfig.staleTime.short,
    gcTime: cacheConfig.gcTime.short,
    retry: 2,
  });

  // Create task mutation
  const {
    mutate: createTask,
    isPending: isCreating,
    error: createError,
  } = useMutation({
    mutationFn: async (taskData: CreateTaskForm) => {
      const response = await apiClient.post<Task>(apiEndpoints.tasks.create, taskData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Update task mutation
  const {
    mutate: updateTask,
    isPending: isUpdating,
    error: updateError,
  } = useMutation({
    mutationFn: async ({ id, ...taskData }: UpdateTaskForm) => {
      const response = await apiClient.put<Task>(apiEndpoints.tasks.update(id), taskData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Delete task mutation
  const {
    mutate: deleteTask,
    isPending: isDeleting,
    error: deleteError,
  } = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(apiEndpoints.tasks.delete(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return {
    tasks: tasks || [],
    isLoading,
    error,
    refetch,
    createTask,
    updateTask,
    deleteTask,
    isCreating,
    isUpdating,
    isDeleting,
    createError,
    updateError,
    deleteError,
  };
}

/**
 * Hook for fetching pending tasks
 */
export function usePendingTasks() {
  const { tasks } = useTasks();

  const pendingTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');

  return {
    tasks: pendingTasks,
    count: pendingTasks.length,
  };
}

/**
 * Hook for task operations/treatments
 */
export function useTaskOperations(taskId: string) {
  const apiClient = useApiClient();

  const {
    data: operations,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tasks', 'operations', taskId],
    queryFn: async () => {
      const response = await apiClient.get<Operation[]>(
        `${apiEndpoints.tasks.get(taskId)}/operations`
      );
      return response;
    },
    staleTime: cacheConfig.staleTime.short,
    gcTime: cacheConfig.gcTime.short,
    retry: 2,
    enabled: !!taskId,
  });

  return { operations: operations || [], isLoading, error, refetch };
}

/**
 * Hook for task statistics
 */
export function useTasksStats() {
  const { tasks } = useTasks();

  const stats = {
    total: tasks.length,
    byStatus: {
      pending: tasks.filter(t => t.status === 'pending').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length,
    },
    byPriority: {
      low: tasks.filter(t => t.priority === 'low').length,
      normal: tasks.filter(t => t.priority === 'normal').length,
      high: tasks.filter(t => t.priority === 'high').length,
      urgent: tasks.filter(t => t.priority === 'urgent').length,
    },
    overdueCount: tasks.filter(t => {
      if (!t.due_date || t.status === 'completed' || t.status === 'cancelled') return false;
      return new Date(t.due_date) < new Date();
    }).length,
    completionRate:
      tasks.length > 0
        ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100
        : 0,
  };

  return stats;
}
