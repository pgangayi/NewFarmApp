import { apiClient } from '../../lib/cloudflare';
import { InventoryItem } from '../../api/types';
import { ENDPOINTS as apiEndpoints } from '../../api/config';

/**
 * DOMAIN SERVICE: Inventory
 * -------------------------
 * Handles business logic for inventory management.
 */

export class InventoryService {
  static async getInventoryByFarm(farmId?: string): Promise<InventoryItem[]> {
    const query = farmId ? `?farm_id=${farmId}` : '';
    // Use generic type and handle potential { data: ... } wrapper if needed,
    // similar to AnimalService.
    // If apiClient returns T directly, and backend returns array, this is fine.
    // If backend returns { data: [] }, we need to handle it.
    // Given the component was fetching /inventory/items and getting data directly (implied by data.map),
    // let's assume /inventory returns array or { data: array }.
    // Safe approach:
    const response = await apiClient.get<any>(`${apiEndpoints.inventory.list}${query}`);
    return response.data || response || [];
  }

  static async getInventoryItemById(id: string): Promise<InventoryItem | null> {
    return apiClient.get<InventoryItem>(apiEndpoints.inventory.details(id));
  }

  static async getLowStockItems(): Promise<InventoryItem[]> {
    return apiClient.get<InventoryItem[]>(`${apiEndpoints.inventory.list}?low_stock=true`);
  }

  static async createInventoryItem(
    payload: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>
  ): Promise<InventoryItem> {
    return apiClient.post<InventoryItem>(apiEndpoints.inventory.create, payload);
  }

  static async updateInventoryItem(id: string, updates: Partial<InventoryItem>) {
    return apiClient.put<InventoryItem>(apiEndpoints.inventory.update(id), updates);
  }

  static async deleteInventoryItem(id: string) {
    await apiClient.delete(apiEndpoints.inventory.delete(id));
    return true;
  }
}
