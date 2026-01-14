import { apiClient } from '../../lib/cloudflare';
import { ENDPOINTS as apiEndpoints } from '../../api/config';

/**
 * DOMAIN SERVICE: Farm
 * --------------------
 * Handles business logic for farm management.
 */

export interface Farm {
  id: string;
  name: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  area_hectares?: number;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export class FarmService {
  static async getFarmsByOwner(_ownerId: string): Promise<Farm[]> {
    // The backend uses the token to identify the user
    return apiClient.get<Farm[]>(apiEndpoints.farms.list);
  }

  static async createFarm(payload: Omit<Farm, 'id' | 'created_at' | 'updated_at'>): Promise<Farm> {
    return apiClient.post<Farm>(apiEndpoints.farms.create, payload);
  }

  static async updateFarm(id: string, updates: Partial<Farm>) {
    return apiClient.put<Farm>(apiEndpoints.farms.update(id), updates);
  }

  static async deleteFarm(id: string) {
    await apiClient.delete(apiEndpoints.farms.delete(id));
    return true;
  }
}
