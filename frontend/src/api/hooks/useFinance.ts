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
      let endpoint = API_ENDPOINTS.finance.list;

      if (filters?.farm_id) {
        endpoint = `${endpoint}?farm_id=${filters.farm_id}`;
      }

      const response = await apiClient.get<FinanceRecord[]>(endpoint);
      return response;
    },
    staleTime: CACHE_CONFIG.staleTime.finance,
  });
}

export function useFinanceSummary(farmId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.finance.summary(farmId),
    queryFn: async () => {
      const endpoint = farmId
        ? `${API_ENDPOINTS.finance.summary}?farm_id=${farmId}`
        : API_ENDPOINTS.finance.summary;
      const response = await apiClient.get<FinanceSummary>(endpoint);
      return response;
    },
    staleTime: CACHE_CONFIG.staleTime.finance,
  });
}

export function useBudgets(farmId?: string, fiscalYear?: number) {
  return useQuery({
    queryKey: ['finance', 'budgets', farmId, fiscalYear],
    queryFn: async () => {
      if (!farmId) return [];
      const year = fiscalYear || new Date().getFullYear();
      const response = await apiClient.get<BudgetCategory[]>(
        `/api/finance/budgets?fiscal_year=${year}&farm_id=${farmId}`
      );
      return response;
    },
    enabled: !!farmId,
    staleTime: CACHE_CONFIG.staleTime.finance,
  });
}

export function useFinanceRecord(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.finance.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<FinanceRecord>(API_ENDPOINTS.finance.detail(id));
      return response;
    },
    enabled: !!id,
    staleTime: CACHE_CONFIG.staleTime.finance,
  });
}

export function useCreateFinanceRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateRequest<FinanceRecord>) => {
      const response = await apiClient.post<FinanceRecord>(API_ENDPOINTS.finance.create, data);
      return response;
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
      const response = await apiClient.put<FinanceRecord>(API_ENDPOINTS.finance.update(id), data);
      return response;
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
