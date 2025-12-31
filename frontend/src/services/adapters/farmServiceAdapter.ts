import { Farm, FarmService } from '../domains/FarmService';

/**
 * ADAPTER LAYER: Farm Service
 * ---------------------------
 * Orchestrates farm operations client-side.
 */

export class FarmServiceAdapter {
  static async getFarms(userId: string) {
    return FarmService.getFarmsByOwner(userId);
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
