import { apiClient } from '../../lib/cloudflare';
import { InventoryItem } from '../../api/types';

/**
 * DOMAIN SERVICE: Inventory
 * -------------------------
 * Handles business logic for inventory management.
 */

const BASE_PATH = '/api/inventory';

export class InventoryService {
  static async getInventoryByFarm(farmId?: string): Promise<InventoryItem[]> {
    const items = await apiClient.get<InventoryItem[]>(BASE_PATH);
    if (farmId) {
      return items.filter(i => i.farm_id === farmId);
    }
    return items;
  }

  static async getInventoryItemById(id: string): Promise<InventoryItem | null> {
    return apiClient.get<InventoryItem>(`${BASE_PATH}?id=${id}`);
  }

  static async getLowStockItems(): Promise<InventoryItem[]> {
    return apiClient.get<InventoryItem[]>(`${BASE_PATH}?low_stock=true`);
  }

  static async createInventoryItem(
    payload: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>
  ): Promise<InventoryItem> {
    return apiClient.post<InventoryItem>(BASE_PATH, payload);
  }

  static async updateInventoryItem(id: string, updates: Partial<InventoryItem>) {
    return apiClient.put<InventoryItem>('/api/inventory', { id, ...updates });
  }

  static async deleteInventoryItem(id: string) {
    await apiClient.delete(`/api/inventory?id=${id}`);
    return true;
  }
}
