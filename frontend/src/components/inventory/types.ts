export interface InventoryItem {
  id: number;
  farm_id: number;
  name: string;
  sku?: string;
  qty: number;
  unit: string;
  reorder_threshold: number;
  category?: string;
  supplier_info?: string;
  storage_requirements?: string;
  expiration_date?: string;
  quality_grade?: string;
  minimum_order_quantity?: number;
  maximum_order_quantity?: number;
  current_cost_per_unit?: number;
  preferred_supplier_id?: number;
  stock_status: 'normal' | 'low' | 'critical';
  farm_name: string;
  transaction_count?: number;
  total_usage?: number;
  total_additions?: number;
  latest_cost_per_unit?: number;
  avg_cost_per_unit?: number;
  alerts?: InventoryAlert[];
  cost_history?: CostHistory[];
  created_at: string;
  updated_at?: string;
}

export interface InventoryAlert {
  id: number;
  inventory_item_id: number;
  alert_type: string;
  alert_date: string;
  current_quantity: number;
  threshold_quantity: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  resolved_date?: string;
  notes?: string;
  item_name?: string;
  farm_name?: string;
}

export interface CostHistory {
  id: number;
  inventory_item_id: number;
  cost_date: string;
  unit_cost: number;
  supplier_id?: number;
  quantity_purchased?: number;
  total_cost: number;
  cost_reason?: string;
  notes?: string;
}

export interface Supplier {
  id: number;
  farm_id: number;
  supplier_name: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  payment_terms?: string;
  lead_time_days?: number;
  reliability_rating?: number;
  product_categories?: string;
  pricing_structure?: string;
  delivery_schedule?: string;
  active: boolean;
  notes?: string;
  farm_name?: string;
  total_orders?: number;
  completed_orders?: number;
}

export interface InventoryFormData {
  farm_id: number;
  name: string;
  sku?: string;
  qty: number;
  unit: string;
  reorder_threshold: number;
  category: string;
  supplier_info?: string;
  storage_requirements?: string;
  expiration_date?: string;
  quality_grade?: string;
  minimum_order_quantity?: number;
  maximum_order_quantity?: number;
  current_cost_per_unit?: number;
  preferred_supplier_id?: number;
}
