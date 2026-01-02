import { apiClient } from '../../lib/cloudflare';
import { Crop } from '../../api/types';

/**
 * DOMAIN SERVICE: Crop
 * --------------------
 * Handles business logic for crop management.
 */

export class CropService {
  static async getCropsByFarm(farmId?: string): Promise<Crop[]> {
    const crops = await apiClient.get<Crop[]>('/api/crops');
    if (farmId) {
      return crops.filter(c => c.farm_id === farmId);
    }
    return crops;
  }

  static async getCropById(id: string): Promise<Crop | null> {
    return apiClient.get<Crop>(`/api/crops?id=${id}`);
  }

  static async createCrop(payload: Omit<Crop, 'id' | 'created_at' | 'updated_at'>): Promise<Crop> {
    return apiClient.post<Crop>('/api/crops', payload);
  }

  static async updateCrop(id: string, updates: Partial<Crop>) {
    return apiClient.put<Crop>('/api/crops', { id, ...updates });
  }

  static async deleteCrop(id: string) {
    await apiClient.delete(`/api/crops?id=${id}`);
    return true;
  }
}
