import { AnimalService } from '../domains/AnimalService';
import { Animal } from '../../api/types';

/**
 * ADAPTER LAYER: Animal Service
 * -----------------------------
 * Orchestrates animal operations client-side.
 */

export class AnimalServiceAdapter {
  static async getAnimals(farm_id?: string) {
    return AnimalService.getAnimalsByFarm(farm_id);
  }

  static async getAnimal(id: string) {
    return AnimalService.getAnimalById(id);
  }

  static async createAnimal(payload: Omit<Animal, 'id' | 'created_at' | 'updated_at'>) {
    return AnimalService.createAnimal(payload);
  }

  static async updateAnimal(id: string, updates: Partial<Animal>) {
    return AnimalService.updateAnimal(id, updates);
  }

  static async deleteAnimal(id: string) {
    return AnimalService.deleteAnimal(id);
  }
}
