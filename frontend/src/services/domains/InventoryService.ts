import { DatabaseAdapter } from '../../core/DatabaseAdapter';
import { v4 as uuidv4 } from 'uuid';
import { InventoryItem } from '../../api/types';

/**
 * DOMAIN SERVICE: Inventory
 * -------------------------
 * Handles business logic for inventory management.
 */

export class InventoryService {
  static async getInventoryByFarm(farmId?: string): Promise<InventoryItem[]> {
    await new Promise(r => setTimeout(r, 50));
    if (farmId) {
      return (DatabaseAdapter as any).findMany('inventory', (i: any) => i.farm_id === farmId);
    }
    return (DatabaseAdapter as any).findMany('inventory', () => true);
  }

  static async getInventoryItemById(id: string): Promise<InventoryItem | null> {
    await new Promise(r => setTimeout(r, 50));
    return (DatabaseAdapter as any).findOne('inventory', (i: any) => i.id === id);
  }

  static async getLowStockItems(): Promise<InventoryItem[]> {
    // Mock logic for low stock
    return (DatabaseAdapter as any).findMany(
      'inventory',
      (i: any) => (i.quantity || 0) <= (i.reorder_level || 5)
    );
  }

  static async createInventoryItem(
    payload: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>
  ): Promise<InventoryItem> {
    const newItem: InventoryItem = {
      id: uuidv4(),
      ...payload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    DatabaseAdapter.insert('inventory', newItem);
    return newItem;
  }

  static async updateInventoryItem(id: string, updates: Partial<InventoryItem>) {
    return DatabaseAdapter.update('inventory', i => i.id === id, {
      ...updates,
      updated_at: new Date().toISOString(),
    });
  }

  static async deleteInventoryItem(id: string) {
    await new Promise(r => setTimeout(r, 50));
    const success = DatabaseAdapter.delete('inventory', i => i.id === id);
    if (!success) {
      throw new Error('Inventory Item not found');
    }
    return true;
  }
}
