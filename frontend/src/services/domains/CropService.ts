import { DatabaseAdapter } from '../../core/DatabaseAdapter';
import { v4 as uuidv4 } from 'uuid';
import { Crop } from '../../api/types';

/**
 * DOMAIN SERVICE: Crop
 * --------------------
 * Handles business logic for crop management.
 */

export class CropService {
  static async getCropsByFarm(farmId?: string): Promise<Crop[]> {
    await new Promise(r => setTimeout(r, 50));
    if (farmId) {
      return (DatabaseAdapter as any).findMany('crops', (c: any) => c.farm_id === farmId);
    }
    return (DatabaseAdapter as any).findMany('crops', () => true);
  }

  static async getCropById(id: string): Promise<Crop | null> {
    await new Promise(r => setTimeout(r, 50));
    return (DatabaseAdapter as any).findOne('crops', (c: any) => c.id === id);
  }

  static async createCrop(payload: Omit<Crop, 'id' | 'created_at' | 'updated_at'>): Promise<Crop> {
    const newCrop: Crop = {
      id: uuidv4(),
      ...payload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    DatabaseAdapter.insert('crops', newCrop);
    return newCrop;
  }

  static async updateCrop(id: string, updates: Partial<Crop>) {
    return DatabaseAdapter.update('crops', c => c.id === id, {
      ...updates,
      updated_at: new Date().toISOString(),
    });
  }

  static async deleteCrop(id: string) {
    await new Promise(r => setTimeout(r, 50));
    const success = DatabaseAdapter.delete('crops', c => c.id === id);
    if (!success) {
      throw new Error('Crop not found');
    }
    return true;
  }
}
