import { DatabaseAdapter } from '../../core/DatabaseAdapter';
import { v4 as uuidv4 } from 'uuid';
import { Animal } from '../../api/types';

/**
 * DOMAIN SERVICE: Animal
 * ----------------------
 * Handles business logic for animal management.
 */

export class AnimalService {
  static async getAnimalsByFarm(farmId?: string): Promise<Animal[]> {
    // Simulate async
    await new Promise(r => setTimeout(r, 50));
    if (farmId) {
      return (DatabaseAdapter as any).findMany('animals', (a: any) => a.farm_id === farmId);
    }
    return (DatabaseAdapter as any).findMany('animals', () => true);
  }

  static async getAnimalById(id: string): Promise<Animal | null> {
    await new Promise(r => setTimeout(r, 50));
    return (DatabaseAdapter as any).findOne('animals', (a: any) => a.id === id);
  }

  static async createAnimal(
    payload: Omit<Animal, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Animal> {
    const newAnimal: Animal = {
      id: uuidv4(),
      ...payload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    DatabaseAdapter.insert('animals', newAnimal);
    return newAnimal;
  }

  static async updateAnimal(id: string, updates: Partial<Animal>) {
    return DatabaseAdapter.update('animals', a => a.id === id, {
      ...updates,
      updated_at: new Date().toISOString(),
    });
  }

  static async deleteAnimal(id: string) {
    await new Promise(r => setTimeout(r, 50));
    const success = DatabaseAdapter.delete('animals', a => a.id === id);
    if (!success) {
      throw new Error('Animal not found');
    }
    return true;
  }
}
