import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/cloudflare';
import { QUERY_KEYS, CACHE_CONFIG, API_ENDPOINTS } from '../constants';
import type {
  FinanceRecord,
  FinanceSummary,
  BudgetCategory,
  CreateRequest,
  UpdateRequest,
} from '../types';

export function useFinance(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: QUERY_KEYS.finance.list(filters),
    queryFn: async () => {
      let endpoint: string = API_ENDPOINTS.finance.list;

      if (filters?.farm_id) {
        endpoint = `${endpoint}?farm_id=${filters.farm_id as string}`;
      }

      return await apiClient.get<FinanceRecord[]>(endpoint);
    },
    staleTime: CACHE_CONFIG.staleTime.finance,
  });
}

export function useFinanceSummary(farm_id?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.finance.summary(farm_id),
    queryFn: async () => {
      const endpoint = farm_id
        ? `${API_ENDPOINTS.finance.summary}?farm_id=${farm_id}`
        : API_ENDPOINTS.finance.summary;
      return await apiClient.get<FinanceSummary>(endpoint);
    },
    staleTime: CACHE_CONFIG.staleTime.finance,
  });
}

export function useBudgets(farm_id?: string, fiscalYear?: number) {
  return useQuery({
    queryKey: ['finance', 'budgets', farm_id, fiscalYear],
    queryFn: async () => {
      if (!farm_id) return [];
      const year = fiscalYear || new Date().getFullYear();
      return await apiClient.get<BudgetCategory[]>(
        `${API_ENDPOINTS.finance.budgets}?fiscal_year=${year}&farm_id=${farm_id}`
      );
    },
    enabled: !!farm_id,
    staleTime: CACHE_CONFIG.staleTime.finance,
  });
}

export function useFinanceRecord(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.finance.detail(id),
    queryFn: async () => {
      return await apiClient.get<FinanceRecord>(API_ENDPOINTS.finance.detail(id));
    },
    enabled: !!id,
    staleTime: CACHE_CONFIG.staleTime.finance,
  });
}

export function useCreateFinanceRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateRequest<FinanceRecord>) => {
      return await apiClient.post<FinanceRecord>(API_ENDPOINTS.finance.create, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.finance.all });
    },
  });
}

export function useUpdateFinanceRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRequest<FinanceRecord> }) => {
      return await apiClient.put<FinanceRecord>(API_ENDPOINTS.finance.update(id), data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.finance.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.finance.detail(variables.id) });
    },
  });
}

export function useDeleteFinanceRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(API_ENDPOINTS.finance.delete(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.finance.all });
    },
  });
}
