import { apiClient } from '../../lib/cloudflare';
import { Animal } from '../../api/types';

/**
 * DOMAIN SERVICE: Animal
 * ----------------------
 * Handles business logic for animal management.
 */

export class AnimalService {
  static async getAnimalsByFarm(farmId?: string): Promise<Animal[]> {
    const query = farmId ? `?farm_id=${farmId}` : '';
    const response = await apiClient.get<{ data: Animal[] }>(`/api/livestock${query}`);
    return response.data || [];
  }

  static async getAnimalById(id: string): Promise<Animal | null> {
    const response = await apiClient.get<{ data: Animal }>(`/api/livestock/${id}`);
    return response.data || null;
  }

  static async createAnimal(
    payload: Omit<Animal, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Animal> {
    const response = await apiClient.post<{ data: Animal }>('/api/livestock', payload);
    return response.data;
  }

  static async updateAnimal(id: string, updates: Partial<Animal>) {
    const response = await apiClient.put<{ data: Animal }>(`/api/livestock/${id}`, updates);
    return response.data;
  }

  static async deleteAnimal(id: string) {
    await apiClient.delete(`/api/livestock/${id}`);
    return true;
  }
}
