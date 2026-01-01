import type { InventoryItem } from '../../api/types';

export interface ExtendedInventoryItem extends InventoryItem {
  // Add any UI-specific fields if necessary
}

export interface Supplier {
  id: string;
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  category: string;
}

export interface InventoryAlert {
  id: string;
  item_id: string;
  item_name: string;
  type: 'low_stock' | 'expiring_soon' | 'out_of_stock';
  message: string;
  created_at: string;
  resolved: boolean;
}

export interface InventoryFormData {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  location: string;
  min_stock_level: number;
  expiry_date?: string;
  supplier_id?: string;
  notes?: string;
  farm_id: string;
}
