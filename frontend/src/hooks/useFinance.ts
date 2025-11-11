import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '../lib/api/client';
import { FinanceEntry, FinanceReport } from '../types/entities';
import { apiEndpoints, cacheConfig } from '../config/env';

export interface CreateFinanceForm {
  farm_id: string;
  entry_type: 'income' | 'expense' | 'adjustment';
  category: string;
  amount: number;
  currency?: string;
  description?: string;
  reference_id?: string;
  reference_type?: 'operation' | 'inventory' | 'sale' | 'expense' | 'other';
  entry_date: string;
}

export interface UpdateFinanceForm extends Partial<CreateFinanceForm> {
  id: string;
}

/**
 * Main hook for finance management
 * Provides query, create, update, delete operations with React Query
 */
export function useFinance() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  // Fetch all finance entries
  const {
    data: entries,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['finance'],
    queryFn: async () => {
      const response = await apiClient.get<FinanceEntry[]>(apiEndpoints.finance.entries);
      return response;
    },
    staleTime: cacheConfig.staleTime.medium,
    gcTime: cacheConfig.gcTime.medium,
    retry: 2,
  });

  // Create finance entry mutation
  const {
    mutate: createEntry,
    isPending: isCreating,
    error: createError,
  } = useMutation({
    mutationFn: async (entryData: CreateFinanceForm) => {
      const response = await apiClient.post<FinanceEntry>(apiEndpoints.finance.entries, entryData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance'] });
    },
  });

  // Update finance entry mutation
  const {
    mutate: updateEntry,
    isPending: isUpdating,
    error: updateError,
  } = useMutation({
    mutationFn: async ({ id, ...entryData }: UpdateFinanceForm) => {
      const response = await apiClient.put<FinanceEntry>(
        `${apiEndpoints.finance.entries}/${id}`,
        entryData
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance'] });
    },
  });

  // Delete finance entry mutation
  const {
    mutate: deleteEntry,
    isPending: isDeleting,
    error: deleteError,
  } = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`${apiEndpoints.finance.entries}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance'] });
    },
  });

  return {
    entries: entries || [],
    isLoading,
    error,
    refetch,
    createEntry,
    updateEntry,
    deleteEntry,
    isCreating,
    isUpdating,
    isDeleting,
    createError,
    updateError,
    deleteError,
  };
}

/**
 * Hook for fetching finance entries by farm
 */
export function useFinanceByFarm(farmId: string) {
  const apiClient = getApiClient();

  const {
    data: entries,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['finance', 'farm', farmId],
    queryFn: async () => {
      const response = await apiClient.get<FinanceEntry[]>(
        `${apiEndpoints.finance.entries}?farm_id=${farmId}`
      );
      return response;
    },
    staleTime: cacheConfig.staleTime.medium,
    gcTime: cacheConfig.gcTime.medium,
    retry: 2,
    enabled: !!farmId,
  });

  return { entries: entries || [], isLoading, error, refetch };
}

/**
 * Hook for finance report generation
 */
export function useFinanceReport(type?: string) {
  const apiClient = getApiClient();

  const {
    data: report,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['finance', 'report', type],
    queryFn: async () => {
      const endpoint = type ? apiEndpoints.finance.reports(type) : apiEndpoints.finance.entries;
      const response = await apiClient.get<FinanceReport>(endpoint);
      return response;
    },
    staleTime: cacheConfig.staleTime.long,
    gcTime: cacheConfig.gcTime.long,
    retry: 2,
    enabled: !!type,
  });

  return { report, isLoading, error, refetch };
}

/**
 * Hook for finance statistics
 */
export function useFinanceStats() {
  const { entries } = useFinance();

  const stats = {
    total_entries: entries.length,
    total_income: entries
      .filter(e => e.entry_type === 'income')
      .reduce((sum, e) => sum + (e.amount || 0), 0),
    total_expenses: entries
      .filter(e => e.entry_type === 'expense')
      .reduce((sum, e) => sum + (e.amount || 0), 0),
    net_profit: 0,
    by_category: {} as Record<string, number>,
    by_type: {
      income: entries.filter(e => e.entry_type === 'income').length,
      expense: entries.filter(e => e.entry_type === 'expense').length,
      adjustment: entries.filter(e => e.entry_type === 'adjustment').length,
    },
  };

  // Calculate net profit
  stats.net_profit = stats.total_income - stats.total_expenses;

  // Group by category
  entries.forEach(entry => {
    const cat = entry.category || 'Uncategorized';
    stats.by_category[cat] = (stats.by_category[cat] || 0) + entry.amount;
  });

  return stats;
}
