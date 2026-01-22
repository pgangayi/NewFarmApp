import { Farm, FarmService } from '../domains/FarmService';

/**
 * ADAPTER LAYER: Farm Service
 * ---------------------------
 * Orchestrates farm operations client-side.
 */

export class FarmServiceAdapter {
  static async getFarms(user_id: string) {
    return FarmService.getFarmsByOwner(user_id);
  }

  static async createFarm(payload: Omit<Farm, 'id' | 'created_at' | 'updated_at'>) {
    return FarmService.createFarm(payload);
  }

  static async updateFarm(id: string, updates: Partial<Farm>) {
    return FarmService.updateFarm(id, updates);
  }

  static async deleteFarm(id: string) {
    return FarmService.deleteFarm(id);
  }
}
