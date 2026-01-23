import { apiClient } from '../../lib/cloudflare';

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

const BASE_PATH = '/api/farms';

export class FarmService {
  static async getFarmsByOwner(_ownerId: string): Promise<Farm[]> {
    // The backend uses the token to identify the user
    return apiClient.get<Farm[]>(BASE_PATH);
  }

  static async createFarm(payload: Omit<Farm, 'id' | 'created_at' | 'updated_at'>): Promise<Farm> {
    return apiClient.post<Farm>(BASE_PATH, payload);
  }

  static async updateFarm(id: string, updates: Partial<Farm>) {
    return apiClient.put<Farm>(BASE_PATH, { id, ...updates });
  }

  static async deleteFarm(id: string) {
    await apiClient.delete(`/api/farms?id=${id}`);
    return true;
  }
}
