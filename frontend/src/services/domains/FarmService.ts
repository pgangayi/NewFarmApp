import { DatabaseAdapter } from '../../core/DatabaseAdapter';
import { v4 as uuidv4 } from 'uuid';

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
  static async getFarmsByOwner(ownerId: string): Promise<Farm[]> {
    // Simulate async
    await new Promise(r => setTimeout(r, 50));
    return (DatabaseAdapter as any).findMany('farms', (f: any) => f.owner_id === ownerId);
  }

  static async createFarm(payload: Omit<Farm, 'id' | 'created_at' | 'updated_at'>): Promise<Farm> {
    const newFarm: Farm = {
      id: uuidv4(),
      ...payload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    DatabaseAdapter.insert('farms', newFarm);
    return newFarm;
  }

  static async updateFarm(id: string, updates: Partial<Farm>) {
    return DatabaseAdapter.update('farms', f => f.id === id, {
      ...updates,
      updated_at: new Date().toISOString(),
    });
  }

  static async deleteFarm(id: string) {
    await new Promise(r => setTimeout(r, 50)); // Simulate async
    const success = DatabaseAdapter.delete('farms', f => f.id === id);
    if (!success) {
      throw new Error('Farm not found');
    }
    return true;
  }
}
