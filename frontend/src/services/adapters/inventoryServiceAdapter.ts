import { InventoryService } from '../domains/InventoryService';
import { InventoryItem } from '../../api/types';

/**
 * ADAPTER LAYER: Inventory Service
 * ------------------------------
 * Orchestrates inventory operations client-side.
 */

export class InventoryServiceAdapter {
  static async getInventory(farmId?: string) {
    return InventoryService.getInventoryByFarm(farmId);
  }

  static async getInventoryItem(id: string) {
    return InventoryService.getInventoryItemById(id);
  }

  static async getLowStock() {
    return InventoryService.getLowStockItems();
  }

  static async createInventoryItem(
    payload: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>
  ) {
    return InventoryService.createInventoryItem(payload);
  }

  static async updateInventoryItem(id: string, updates: Partial<InventoryItem>) {
    return InventoryService.updateInventoryItem(id, updates);
  }

  static async deleteInventoryItem(id: string) {
    return InventoryService.deleteInventoryItem(id);
  }
}
