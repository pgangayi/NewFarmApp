import { CropService } from '../domains/CropService';
import { Crop } from '../../api/types';

/**
 * ADAPTER LAYER: Crop Service
 * ---------------------------
 * Orchestrates crop operations client-side.
 */

export class CropServiceAdapter {
  static async getCrops(farm_id?: string) {
    return CropService.getCropsByFarm(farm_id);
  }

  static async getCrop(id: string) {
    return CropService.getCropById(id);
  }

  static async createCrop(payload: Omit<Crop, 'id' | 'created_at' | 'updated_at'>) {
    return CropService.createCrop(payload);
  }

  static async updateCrop(id: string, updates: Partial<Crop>) {
    return CropService.updateCrop(id, updates);
  }

  static async deleteCrop(id: string) {
    return CropService.deleteCrop(id);
  }
}
