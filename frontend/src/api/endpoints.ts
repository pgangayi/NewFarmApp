/**
 * API DOMAIN SERVICES
 * ====================
 * Clean domain-specific API service functions.
 * Each entity has a dedicated API object with CRUD operations.
 */

import { ApiClient } from './client';
import { ENDPOINTS } from './config';
import type {
  Farm,
  Livestock,
  LivestockStatus,
  LivestockStats,
  LivestockHealth,
  LivestockMovement,
  // Knowledge Base
  Breed,
  FeedItem,
  GrowthStandard,
  Strain,
  Chemical,
  Disease,
  Treatment,
  PlantingGuide,
  PestIdentifier,
  // Other existing types
  Crop,
  Task,
  Location,
  Field,
  FinanceRecord,
  FinanceSummary,
  InventoryItem,
  InventoryAlert,
  CreateRequest,
  UpdateRequest,
  QueryFilters,
  ApiResponse,
  User,
} from './types';

// Initialize the API client
const api = new ApiClient();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function buildQueryString(params?: QueryFilters): string {
  if (!params || Object.keys(params).length === 0) return '';
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  });
  return `?${searchParams.toString()}`;
}

// ============================================================================
// FARMS API
// ============================================================================

export const farmsApi = {
  getAll: async (filters?: QueryFilters): Promise<Farm[]> => {
    const qs = buildQueryString(filters);
    const response = await api.get<ApiResponse<Farm[]>>(`${ENDPOINTS.farms.list}${qs}`);
    return response.data || (response as unknown as Farm[]);
  },

  getById: async (id: string): Promise<Farm | null> => {
    try {
      const response = await api.get<ApiResponse<Farm>>(ENDPOINTS.farms.get(id));
      return response.data || (response as unknown as Farm) || null;
    } catch {
      return null;
    }
  },

  create: async (data: CreateRequest<Farm>): Promise<Farm> => {
    const response = await api.post<ApiResponse<Farm>>(ENDPOINTS.farms.create, data);
    return response.data || (response as unknown as Farm);
  },

  update: async (id: string, data: UpdateRequest<Farm>): Promise<Farm> => {
    const response = await api.patch<ApiResponse<Farm>>(ENDPOINTS.farms.update(id), data);
    return response.data || (response as unknown as Farm);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(ENDPOINTS.farms.delete(id));
  },
};

// ============================================================================
// LIVESTOCK API (formerly ANIMALS)
// ============================================================================

export const livestockApi = {
  getAll: async (farmId?: string): Promise<Livestock[]> => {
    const qs = farmId ? `?farm_id=${farmId}` : '';
    const response = await api.get<ApiResponse<{ animals: Livestock[] }>>( // Backend might still return { "animals": [] } or updated to "livestock"
      `${ENDPOINTS.livestock.list}${qs}`
    );
    // Handle both { data: { animals: [] } }, { data: { livestock: [] } } and direct array responses
    // @ts-expect-error - Handling transition period where backend might return different structures
    if (response.data?.livestock) return response.data.livestock;
    if (response.data?.animals) return response.data.animals;
    if (Array.isArray(response.data)) return response.data;
    return [];
  },

  getById: async (id: string): Promise<Livestock | null> => {
    try {
      const response = await api.get<ApiResponse<Livestock>>(ENDPOINTS.livestock.get(id));
      return response.data || (response as unknown as Livestock) || null;
    } catch {
      return null;
    }
  },

  create: async (data: CreateRequest<Livestock>): Promise<Livestock> => {
    const response = await api.post<ApiResponse<Livestock>>(ENDPOINTS.livestock.create, data);
    return response.data || (response as unknown as Livestock);
  },

  update: async (id: string, data: UpdateRequest<Livestock>): Promise<Livestock> => {
    const response = await api.put<ApiResponse<Livestock>>(ENDPOINTS.livestock.update(id), data);
    return response.data || (response as unknown as Livestock);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(ENDPOINTS.livestock.delete(id));
  },

  getStats: async (): Promise<LivestockStats> => {
    const response = await api.get<ApiResponse<LivestockStats>>(ENDPOINTS.livestock.stats);
    return response.data || (response as unknown as LivestockStats);
  },

  getHealth: async (id: string): Promise<LivestockHealth | null> => {
    try {
      const response = await api.get<ApiResponse<LivestockHealth>>(ENDPOINTS.livestock.health(id));
      return response.data || null;
    } catch {
      return null;
    }
  },

  getMovements: async (id: string): Promise<LivestockMovement[]> => {
    const response = await api.get<ApiResponse<LivestockMovement[]>>(
      ENDPOINTS.livestock.movements(id)
    );
    return response.data || [];
  },

  createMovement: async (
    livestockId: string,
    data: { destination_location_id: string; movement_date: string; notes?: string }
  ): Promise<LivestockMovement> => {
    const response = await api.post<ApiResponse<LivestockMovement>>(
      ENDPOINTS.livestock.movements(livestockId),
      data
    );
    return response.data || (response as unknown as LivestockMovement);
  },
};

// Legacy alias
export const animalsApi = livestockApi;

// ============================================================================
// CROPS API
// ============================================================================

export const cropsApi = {
  getAll: async (farmId?: string): Promise<Crop[]> => {
    const qs = farmId ? `?farm_id=${farmId}` : '';
    const response = await api.get<ApiResponse<Crop[]>>(`${ENDPOINTS.crops.list}${qs}`);
    return response.data || (response as unknown as Crop[]) || [];
  },

  getById: async (id: string): Promise<Crop | null> => {
    try {
      const response = await api.get<ApiResponse<Crop>>(ENDPOINTS.crops.get(id));
      return response.data || (response as unknown as Crop) || null;
    } catch {
      return null;
    }
  },

  create: async (data: CreateRequest<Crop>): Promise<Crop> => {
    const response = await api.post<ApiResponse<Crop>>(ENDPOINTS.crops.create, data);
    return response.data || (response as unknown as Crop);
  },

  update: async (id: string, data: UpdateRequest<Crop>): Promise<Crop> => {
    const response = await api.put<ApiResponse<Crop>>(ENDPOINTS.crops.update(id), data);
    return response.data || (response as unknown as Crop);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(ENDPOINTS.crops.delete(id));
  },
};

// ============================================================================
// FIELDS API
// ============================================================================

export const fieldsApi = {
  getAll: async (farmId?: string): Promise<Field[]> => {
    const qs = farmId ? `?farm_id=${farmId}` : '';
    const response = await api.get<ApiResponse<Field[]>>(`${ENDPOINTS.fields.list}${qs}`);
    return response.data || (response as unknown as Field[]) || [];
  },

  getById: async (id: string): Promise<Field | null> => {
    try {
      const response = await api.get<ApiResponse<Field>>(ENDPOINTS.fields.get(id));
      return response.data || (response as unknown as Field) || null;
    } catch {
      return null;
    }
  },

  create: async (data: CreateRequest<Field>): Promise<Field> => {
    const response = await api.post<ApiResponse<Field>>(ENDPOINTS.fields.create, data);
    return response.data || (response as unknown as Field);
  },

  update: async (id: string, data: UpdateRequest<Field>): Promise<Field> => {
    const response = await api.put<ApiResponse<Field>>(ENDPOINTS.fields.update(id), data);
    return response.data || (response as unknown as Field);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(ENDPOINTS.fields.delete(id));
  },
};

// ============================================================================
// TASKS API
// ============================================================================

export const tasksApi = {
  getAll: async (filters?: QueryFilters): Promise<Task[]> => {
    const qs = buildQueryString(filters);
    const response = await api.get<ApiResponse<Task[]>>(`${ENDPOINTS.tasks.list}${qs}`);
    return response.data || (response as unknown as Task[]) || [];
  },

  getById: async (id: string): Promise<Task | null> => {
    try {
      const response = await api.get<ApiResponse<Task>>(ENDPOINTS.tasks.get(id));
      return response.data || (response as unknown as Task) || null;
    } catch {
      return null;
    }
  },

  create: async (data: CreateRequest<Task>): Promise<Task> => {
    const response = await api.post<ApiResponse<Task>>(ENDPOINTS.tasks.create, data);
    return response.data || (response as unknown as Task);
  },

  update: async (id: string, data: UpdateRequest<Task>): Promise<Task> => {
    const response = await api.patch<ApiResponse<Task>>(ENDPOINTS.tasks.update(id), data);
    return response.data || (response as unknown as Task);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(ENDPOINTS.tasks.delete(id));
  },

  complete: async (id: string): Promise<Task> => {
    return tasksApi.update(id, { status: 'completed' });
  },
};

// ============================================================================
// LOCATIONS API
// ============================================================================

export const locationsApi = {
  getAll: async (farmId?: string): Promise<Location[]> => {
    const qs = farmId ? `?farm_id=${farmId}` : '';
    const response = await api.get<ApiResponse<Location[]>>(`${ENDPOINTS.locations.list}${qs}`);
    return response.data || (response as unknown as Location[]) || [];
  },

  getById: async (id: string): Promise<Location | null> => {
    try {
      const response = await api.get<ApiResponse<Location>>(ENDPOINTS.locations.get(id));
      return response.data || (response as unknown as Location) || null;
    } catch {
      return null;
    }
  },

  create: async (data: CreateRequest<Location>): Promise<Location> => {
    const response = await api.post<ApiResponse<Location>>(ENDPOINTS.locations.create, data);
    return response.data || (response as unknown as Location);
  },

  update: async (id: string, data: UpdateRequest<Location>): Promise<Location> => {
    const response = await api.patch<ApiResponse<Location>>(ENDPOINTS.locations.update(id), data);
    return response.data || (response as unknown as Location);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(ENDPOINTS.locations.delete(id));
  },
};

// ============================================================================
// FINANCE API
// ============================================================================

export const financeApi = {
  getAll: async (filters?: QueryFilters): Promise<FinanceRecord[]> => {
    const qs = buildQueryString(filters);
    const response = await api.get<ApiResponse<FinanceRecord[]>>(`${ENDPOINTS.finance.list}${qs}`);
    return response.data || (response as unknown as FinanceRecord[]) || [];
  },

  getById: async (id: string): Promise<FinanceRecord | null> => {
    try {
      const response = await api.get<ApiResponse<FinanceRecord>>(ENDPOINTS.finance.get(id));
      return response.data || (response as unknown as FinanceRecord) || null;
    } catch {
      return null;
    }
  },

  create: async (data: CreateRequest<FinanceRecord>): Promise<FinanceRecord> => {
    const response = await api.post<ApiResponse<FinanceRecord>>(ENDPOINTS.finance.create, data);
    return response.data || (response as unknown as FinanceRecord);
  },

  update: async (id: string, data: UpdateRequest<FinanceRecord>): Promise<FinanceRecord> => {
    const response = await api.patch<ApiResponse<FinanceRecord>>(
      ENDPOINTS.finance.update(id),
      data
    );
    return response.data || (response as unknown as FinanceRecord);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(ENDPOINTS.finance.delete(id));
  },

  getSummary: async (
    farmId: string,
    period?: 'week' | 'month' | 'year'
  ): Promise<FinanceSummary> => {
    const qs = `?farm_id=${farmId}${period ? `&period=${period}` : ''}`;
    const response = await api.get<ApiResponse<FinanceSummary>>(
      `${ENDPOINTS.finance.summary}${qs}`
    );
    return response.data || (response as unknown as FinanceSummary);
  },
};

// ============================================================================
// INVENTORY API
// ============================================================================

export const inventoryApi = {
  getAll: async (farmId?: string): Promise<InventoryItem[]> => {
    const qs = farmId ? `?farm_id=${farmId}` : '';
    const response = await api.get<ApiResponse<InventoryItem[]>>(
      `${ENDPOINTS.inventory.list}${qs}`
    );
    return response.data || (response as unknown as InventoryItem[]) || [];
  },

  getById: async (id: string): Promise<InventoryItem | null> => {
    try {
      const response = await api.get<ApiResponse<InventoryItem>>(ENDPOINTS.inventory.get(id));
      return response.data || (response as unknown as InventoryItem) || null;
    } catch {
      return null;
    }
  },

  create: async (data: CreateRequest<InventoryItem>): Promise<InventoryItem> => {
    const response = await api.post<ApiResponse<InventoryItem>>(ENDPOINTS.inventory.create, data);
    return response.data || (response as unknown as InventoryItem);
  },

  update: async (id: string, data: UpdateRequest<InventoryItem>): Promise<InventoryItem> => {
    const response = await api.patch<ApiResponse<InventoryItem>>(
      ENDPOINTS.inventory.update(id),
      data
    );
    return response.data || (response as unknown as InventoryItem);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(ENDPOINTS.inventory.delete(id));
  },

  getLowStock: async (): Promise<InventoryItem[]> => {
    const response = await api.get<ApiResponse<InventoryItem[]>>(ENDPOINTS.inventory.lowStock);
    return response.data || [];
  },

  getAlerts: async (): Promise<InventoryAlert[]> => {
    const response = await api.get<ApiResponse<InventoryAlert[]>>(ENDPOINTS.inventory.alerts);
    return response.data || [];
  },
};

// ============================================================================
// AUTH API
// ============================================================================

export const authApi = {
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    const response = await api.post<{ token: string; user: User }>(
      ENDPOINTS.auth.login,
      { email, password },
      { skipAuth: true }
    );
    return response;
  },

  signup: async (data: {
    name: string;
    email: string;
    password: string;
  }): Promise<{ token: string; user: User }> => {
    const response = await api.post<{ token: string; user: User }>(ENDPOINTS.auth.signup, data, {
      skipAuth: true,
    });
    return response;
  },

  me: async (): Promise<User> => {
    const response = await api.get<{ user: User }>(ENDPOINTS.auth.me);
    return response.user;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post(ENDPOINTS.auth.logout, {});
    } catch {
      // Logout should succeed even if API fails
    }
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post(ENDPOINTS.auth.forgotPassword, { email }, { skipAuth: true });
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await api.post(ENDPOINTS.auth.resetPassword, { token, password }, { skipAuth: true });
  },
};

// ============================================================================
// HEALTH API
// ============================================================================

export const healthApi = {
  check: async (): Promise<{ status: string }> => {
    const response = await api.get<{ status: string }>(ENDPOINTS.health, { skipAuth: true });
    return response;
  },
};

// ============================================================================
// REFERENCE / KNOWLEDGE BASE API
// ============================================================================

export const referenceApi = {
  getBreeds: async (species?: string): Promise<Breed[]> => {
    const qs = species ? `?species=${species}` : '';
    const response = await api.get<ApiResponse<Breed[]>>(`${ENDPOINTS.reference.breeds}${qs}`);
    return response.data || [];
  },

  getStrains: async (cropType?: string): Promise<Strain[]> => {
    const qs = cropType ? `?crop_type=${cropType}` : '';
    const response = await api.get<ApiResponse<Strain[]>>(`${ENDPOINTS.reference.strains}${qs}`);
    return response.data || [];
  },

  getFeedItems: async (category?: string): Promise<FeedItem[]> => {
    const qs = category ? `?category=${category}` : '';
    const response = await api.get<ApiResponse<FeedItem[]>>(`${ENDPOINTS.reference.feed}${qs}`);
    return response.data || [];
  },

  getChemicals: async (type?: string): Promise<Chemical[]> => {
    const qs = type ? `?type=${type}` : '';
    const response = await api.get<ApiResponse<Chemical[]>>(
      `${ENDPOINTS.reference.chemicals}${qs}`
    );
    return response.data || [];
  },

  getDiseases: async (species?: string): Promise<Disease[]> => {
    const qs = species ? `?species=${species}` : '';
    const response = await api.get<ApiResponse<Disease[]>>(`${ENDPOINTS.reference.diseases}${qs}`);
    return response.data || [];
  },

  getTreatments: async (diseaseId?: string): Promise<Treatment[]> => {
    const qs = diseaseId ? `?disease_id=${diseaseId}` : '';
    const response = await api.get<ApiResponse<Treatment[]>>(
      `${ENDPOINTS.reference.treatments}${qs}`
    );
    return response.data || [];
  },

  getGrowthStandards: async (breedId: string): Promise<GrowthStandard[]> => {
    const response = await api.get<ApiResponse<GrowthStandard[]>>(
      `${ENDPOINTS.reference.growthStandards}?breed_id=${breedId}`
    );
    return response.data || [];
  },

  getPlantingGuides: async (region?: string): Promise<PlantingGuide[]> => {
    const qs = region ? `?region=${region}` : '';
    const response = await api.get<ApiResponse<PlantingGuide[]>>(
      `${ENDPOINTS.reference.plantingGuides}${qs}`
    );
    return response.data || [];
  },

  getPestIdentifiers: async (cropType?: string): Promise<PestIdentifier[]> => {
    const qs = cropType ? `?crop_type=${cropType}` : '';
    const response = await api.get<ApiResponse<PestIdentifier[]>>(
      `${ENDPOINTS.reference.pestIdentifiers}${qs}`
    );
    return response.data || [];
  },
};

// ============================================================================
// UNIFIED EXPORT
// ============================================================================

export const apiServices = {
  farms: farmsApi,
  livestock: livestockApi,
  animals: livestockApi, // Legacy alias
  crops: cropsApi,
  fields: fieldsApi,
  tasks: tasksApi,
  locations: locationsApi,
  finance: financeApi,
  inventory: inventoryApi,
  auth: authApi,
  health: healthApi,
  reference: referenceApi,
};

export default apiServices;
