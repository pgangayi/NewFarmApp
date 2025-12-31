/**
 * API REACT QUERY HOOKS
 * =====================
 * Clean React Query hooks for all domain entities.
 * Provides data fetching, mutations, and cache management.
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import {
  farmsApi,
  livestockApi,
  referenceApi,
  cropsApi,
  fieldsApi,
  tasksApi,
  locationsApi,
  financeApi,
  inventoryApi,
} from './endpoints';
import { CACHE_CONFIG } from './config';
import type {
  Farm,
  Livestock,
  LivestockStats,
  CreateRequest,
  UpdateRequest,
  QueryFilters,
  // Reference types
  Breed,
  FeedItem,
  GrowthStandard,
  Strain,
  Chemical,
  Disease,
  Treatment,
  PlantingGuide,
  PestIdentifier,
  // Restored types
  Crop,
  Field,
  Task,
  Location,
  FinanceRecord,
  FinanceSummary,
  InventoryItem,
  InventoryAlert,
} from './types';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const QUERY_KEYS = {
  // Farms
  farms: ['farms'] as const,
  farm: (id: string) => ['farms', id] as const,

  // Livestock
  livestock: (farmId?: string) => ['livestock', { farmId }] as const,
  livestockDetail: (id: string) => ['livestock', 'detail', id] as const,
  livestockStats: ['livestock', 'stats'] as const,
  livestockHealth: (id: string) => ['livestock', 'health', id] as const,
  livestockMovements: (id: string) => ['livestock', 'movements', id] as const,

  // Reference / Knowledge Base
  breeds: (species?: string) => ['reference', 'breeds', { species }] as const,
  strains: (cropType?: string) => ['reference', 'strains', { cropType }] as const,
  feed: (category?: string) => ['reference', 'feed', { category }] as const,
  chemicals: (type?: string) => ['reference', 'chemicals', { type }] as const,
  diseases: (species?: string) => ['reference', 'diseases', { species }] as const,
  treatments: (diseaseId?: string) => ['reference', 'treatments', { diseaseId }] as const,
  growthStandards: (breedId: string) => ['reference', 'growth', breedId] as const,
  plantingGuides: (region?: string) => ['reference', 'planting', { region }] as const,
  pestIdentifiers: (cropType?: string) => ['reference', 'pestID', { cropType }] as const,

  // Legacy Animals (alias to livestock keys if needed, or separate if transition requires)
  animals: (farmId?: string) => ['livestock', { farmId }] as const, // Alias
  animal: (id: string) => ['livestock', 'detail', id] as const, // Alias
  animalStats: ['livestock', 'stats'] as const, // Alias
  animalHealth: (id: string) => ['livestock', 'health', id] as const, // Alias
  animalMovements: (id: string) => ['livestock', 'movements', id] as const, // Alias

  // Crops
  crops: (farmId?: string) => ['crops', { farmId }] as const,
  crop: (id: string) => ['crops', 'detail', id] as const,

  // Fields
  fields: (farmId?: string) => ['fields', { farmId }] as const,
  field: (id: string) => ['fields', 'detail', id] as const,

  // Tasks
  tasks: (filters?: QueryFilters) => ['tasks', filters] as const,
  task: (id: string) => ['tasks', 'detail', id] as const,

  // Locations
  locations: (farmId?: string) => ['locations', { farmId }] as const,
  location: (id: string) => ['locations', 'detail', id] as const,

  // Finance
  finance: (filters?: QueryFilters) => ['finance', filters] as const,
  financeRecord: (id: string) => ['finance', 'detail', id] as const,
  financeSummary: (farmId: string, period?: string) =>
    ['finance', 'summary', farmId, period] as const,

  // Inventory
  inventory: (farmId?: string) => ['inventory', { farmId }] as const,
  inventoryItem: (id: string) => ['inventory', 'detail', id] as const,
  inventoryAlerts: ['inventory', 'alerts'] as const,
  inventoryLowStock: ['inventory', 'lowStock'] as const,
};

// ============================================================================
// FARMS HOOKS
// ============================================================================

export function useFarms(): UseQueryResult<Farm[], Error> {
  return useQuery({
    queryKey: QUERY_KEYS.farms,
    queryFn: () => farmsApi.getAll(),
    staleTime: CACHE_CONFIG.staleTime.medium,
    gcTime: CACHE_CONFIG.gcTime.medium,
  });
}

export function useFarm(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.farm(id),
    queryFn: () => farmsApi.getById(id),
    enabled: !!id,
    staleTime: CACHE_CONFIG.staleTime.medium,
  });
}

export function useCreateFarm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRequest<Farm>) => farmsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.farms });
    },
  });
}

export function useUpdateFarm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRequest<Farm> }) =>
      farmsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.farms });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.farm(id) });
    },
  });
}

export function useDeleteFarm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => farmsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.farms });
    },
  });
}

/**
 * Hook for farm operations with current farm selection (replaces old useFarm hook).
 * Includes localStorage persistence for selected farm.
 */
export function useFarmWithSelection() {
  const queryClient = useQueryClient();
  const [currentFarm, setCurrentFarm] = useState<Farm | null>(null);

  // Load current farm from storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('currentFarm');
      if (stored) {
        setCurrentFarm(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load current farm', e);
    }
  }, []);

  const farmsQuery = useQuery({
    queryKey: QUERY_KEYS.farms,
    queryFn: () => farmsApi.getAll(),
    staleTime: CACHE_CONFIG.staleTime.medium,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateRequest<Farm>) => farmsApi.create(data),
    onSuccess: newFarm => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.farms });
      if (!currentFarm && newFarm) {
        selectFarm(newFarm);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Farm>) => farmsApi.update(id, data),
    onSuccess: updated => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.farms });
      if (currentFarm?.id === updated?.id) {
        setCurrentFarm(updated);
        localStorage.setItem('currentFarm', JSON.stringify(updated));
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => farmsApi.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.farms });
      if (currentFarm?.id === deletedId) {
        setCurrentFarm(null);
        localStorage.removeItem('currentFarm');
      }
    },
  });

  const selectFarm = (farm: Farm | null) => {
    setCurrentFarm(farm);
    if (farm) {
      localStorage.setItem('currentFarm', JSON.stringify(farm));
    } else {
      localStorage.removeItem('currentFarm');
    }
  };

  // Auto-select first farm if none selected
  useEffect(() => {
    if (!currentFarm && farmsQuery.data?.length) {
      selectFarm(farmsQuery.data[0] ?? null);
    }
  }, [currentFarm, farmsQuery.data]);

  return {
    farms: farmsQuery.data || [],
    currentFarm,
    selectFarm,
    isLoading: farmsQuery.isLoading,
    error: farmsQuery.error,
    refetch: farmsQuery.refetch,
    createFarm: createMutation.mutate,
    updateFarm: updateMutation.mutate,
    deleteFarm: deleteMutation.mutate,
  };
}

// ============================================================================
// LIVESTOCK HOOKS (formerly ANIMALS)
// ============================================================================

export function useLivestock(farmId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.livestock(farmId),
    queryFn: () => livestockApi.getAll(farmId),
    staleTime: CACHE_CONFIG.staleTime.medium,
    gcTime: CACHE_CONFIG.gcTime.medium,
  });
}

// Legacy alias
export const useAnimals = useLivestock;

export function useLivestockDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.livestockDetail(id),
    queryFn: () => livestockApi.getById(id),
    enabled: !!id,
  });
}

// Legacy alias
export const useAnimal = useLivestockDetail;

export function useLivestockStats() {
  return useQuery({
    queryKey: QUERY_KEYS.livestockStats,
    queryFn: () => livestockApi.getStats(),
    staleTime: CACHE_CONFIG.staleTime.long,
  });
}

// Legacy alias
export const useAnimalStats = useLivestockStats;

export function useCreateLivestock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRequest<Livestock>) => livestockApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['livestock'] });
      queryClient.invalidateQueries({ queryKey: ['animals'] }); // Legacy
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.livestockStats });
    },
  });
}

// Legacy alias
export const useCreateAnimal = useCreateLivestock;

export function useUpdateLivestock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRequest<Livestock> }) =>
      livestockApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['livestock'] });
      queryClient.invalidateQueries({ queryKey: ['animals'] }); // Legacy
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.livestockDetail(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.livestockStats });
    },
  });
}

// Legacy alias
export const useUpdateAnimal = useUpdateLivestock;

export function useDeleteLivestock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => livestockApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['livestock'] });
      queryClient.invalidateQueries({ queryKey: ['animals'] }); // Legacy
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.livestockStats });
    },
  });
}

// Legacy alias
export const useDeleteAnimal = useDeleteLivestock;

export function useLivestockMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      livestockId,
      data,
    }: {
      livestockId: string;
      data: { destination_location_id: string; movement_date: string; notes?: string };
    }) => livestockApi.createMovement(livestockId, data),
    onSuccess: (_, { livestockId }) => {
      queryClient.invalidateQueries({ queryKey: ['livestock'] });
      queryClient.invalidateQueries({ queryKey: ['animals'] }); // Legacy
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.livestockMovements(livestockId) });
    },
  });
}

// Legacy alias
export const useAnimalMovement = useLivestockMovement;

// ============================================================================
// CROPS HOOKS
// ============================================================================

export function useCrops(farmId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.crops(farmId),
    queryFn: () => cropsApi.getAll(farmId),
    staleTime: CACHE_CONFIG.staleTime.medium,
  });
}

export function useCrop(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.crop(id),
    queryFn: () => cropsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateCrop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRequest<Crop>) => cropsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crops'] });
    },
  });
}

export function useUpdateCrop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRequest<Crop> }) =>
      cropsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['crops'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.crop(id) });
    },
  });
}

export function useDeleteCrop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cropsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crops'] });
    },
  });
}

// ============================================================================
// FIELDS HOOKS
// ============================================================================

export function useFields(farmId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.fields(farmId),
    queryFn: () => fieldsApi.getAll(farmId),
    staleTime: CACHE_CONFIG.staleTime.medium,
  });
}

export function useField(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.field(id),
    queryFn: () => fieldsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRequest<Field>) => fieldsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields'] });
    },
  });
}

export function useUpdateField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRequest<Field> }) =>
      fieldsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.field(id) });
    },
  });
}

export function useDeleteField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fieldsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields'] });
    },
  });
}

// ============================================================================
// TASKS HOOKS
// ============================================================================

export function useTasks(filters?: QueryFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.tasks(filters),
    queryFn: () => tasksApi.getAll(filters),
    staleTime: CACHE_CONFIG.staleTime.short,
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.task(id),
    queryFn: () => tasksApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRequest<Task>) => tasksApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRequest<Task> }) =>
      tasksApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task(id) });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.complete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task(id) });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

// ============================================================================
// LOCATIONS HOOKS
// ============================================================================

export function useLocations(farmId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.locations(farmId),
    queryFn: () => locationsApi.getAll(farmId),
    staleTime: CACHE_CONFIG.staleTime.medium,
  });
}

export function useLocation(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.location(id),
    queryFn: () => locationsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRequest<Location>) => locationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRequest<Location> }) =>
      locationsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.location(id) });
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => locationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}

// ============================================================================
// FINANCE HOOKS
// ============================================================================

export function useFinanceRecords(filters?: QueryFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.finance(filters),
    queryFn: () => financeApi.getAll(filters),
    staleTime: CACHE_CONFIG.staleTime.medium,
  });
}

export function useFinanceSummary(farmId: string, period?: 'week' | 'month' | 'year') {
  return useQuery({
    queryKey: QUERY_KEYS.financeSummary(farmId, period),
    queryFn: () => financeApi.getSummary(farmId, period),
    enabled: !!farmId,
    staleTime: CACHE_CONFIG.staleTime.medium,
  });
}

export function useCreateFinanceRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRequest<FinanceRecord>) => financeApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance'] });
    },
  });
}

export function useUpdateFinanceRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRequest<FinanceRecord> }) =>
      financeApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance'] });
    },
  });
}

export function useDeleteFinanceRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance'] });
    },
  });
}

// ============================================================================
// INVENTORY HOOKS
// ============================================================================

export function useInventory(farmId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.inventory(farmId),
    queryFn: () => inventoryApi.getAll(farmId),
    staleTime: CACHE_CONFIG.staleTime.medium,
  });
}

export function useInventoryAlerts() {
  return useQuery({
    queryKey: QUERY_KEYS.inventoryAlerts,
    queryFn: () => inventoryApi.getAlerts(),
    staleTime: CACHE_CONFIG.staleTime.short,
  });
}

export function useInventoryLowStock() {
  return useQuery({
    queryKey: QUERY_KEYS.inventoryLowStock,
    queryFn: () => inventoryApi.getLowStock(),
    staleTime: CACHE_CONFIG.staleTime.short,
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRequest<InventoryItem>) => inventoryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRequest<InventoryItem> }) =>
      inventoryApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

// ============================================================================
// REFERENCE / KNOWLEDGE BASE HOOKS
// ============================================================================

export function useBreeds(species?: string): UseQueryResult<Breed[], Error> {
  return useQuery({
    queryKey: QUERY_KEYS.breeds(species),
    queryFn: () => referenceApi.getBreeds(species),
    staleTime: CACHE_CONFIG.staleTime.long,
  });
}

export function useStrains(cropType?: string): UseQueryResult<Strain[], Error> {
  return useQuery({
    queryKey: QUERY_KEYS.strains(cropType),
    queryFn: () => referenceApi.getStrains(cropType),
    staleTime: CACHE_CONFIG.staleTime.long,
  });
}

export function useFeedItems(category?: string): UseQueryResult<FeedItem[], Error> {
  return useQuery({
    queryKey: QUERY_KEYS.feed(category),
    queryFn: () => referenceApi.getFeedItems(category),
    staleTime: CACHE_CONFIG.staleTime.long,
  });
}

export function useChemicals(type?: string): UseQueryResult<Chemical[], Error> {
  return useQuery({
    queryKey: QUERY_KEYS.chemicals(type),
    queryFn: () => referenceApi.getChemicals(type),
    staleTime: CACHE_CONFIG.staleTime.long,
  });
}

export function useDiseases(species?: string): UseQueryResult<Disease[], Error> {
  return useQuery({
    queryKey: QUERY_KEYS.diseases(species),
    queryFn: () => referenceApi.getDiseases(species),
    staleTime: CACHE_CONFIG.staleTime.long,
  });
}

export function useTreatments(diseaseId?: string): UseQueryResult<Treatment[], Error> {
  return useQuery({
    queryKey: QUERY_KEYS.treatments(diseaseId),
    queryFn: () => referenceApi.getTreatments(diseaseId),
    enabled: !!diseaseId,
    staleTime: CACHE_CONFIG.staleTime.long,
  });
}

export function useGrowthStandards(breedId?: string): UseQueryResult<GrowthStandard[], Error> {
  return useQuery({
    queryKey: QUERY_KEYS.growthStandards(breedId || ''),
    queryFn: () => referenceApi.getGrowthStandards(breedId || ''),
    enabled: !!breedId,
    staleTime: CACHE_CONFIG.staleTime.long,
  });
}

export function usePlantingGuides(region?: string): UseQueryResult<PlantingGuide[], Error> {
  return useQuery({
    queryKey: QUERY_KEYS.plantingGuides(region),
    queryFn: () => referenceApi.getPlantingGuides(region),
    staleTime: CACHE_CONFIG.staleTime.long,
  });
}

export function usePestIdentifiers(cropType?: string): UseQueryResult<PestIdentifier[], Error> {
  return useQuery({
    queryKey: QUERY_KEYS.pestIdentifiers(cropType),
    queryFn: () => referenceApi.getPestIdentifiers(cropType),
    staleTime: CACHE_CONFIG.staleTime.long,
  });
}
