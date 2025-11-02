/**
 * Entity types for Farmers Boot
 * Single source of truth for all domain models
 */

// ============================================================================
// AUTHENTICATION & USERS
// ============================================================================

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface AuthResponse {
  user: User;
  session: {
    access_token: string;
    refresh_token?: string;
    expires_at?: number;
  };
}

// ============================================================================
// FARMS & FIELDS
// ============================================================================

export interface Farm {
  id: string;
  name: string;
  location: string;
  area_hectares?: number;
  owner_id: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  created_at: string;
  updated_at?: string;
}

export interface Field {
  id: string;
  farm_id: string;
  name: string;
  area_hectares: number;
  crop_type?: string;
  soil_type?: string;
  field_number?: string;
  created_at: string;
  updated_at?: string;
}

// ============================================================================
// CROPS & CROP CYCLES
// ============================================================================

export interface Crop {
  id: string;
  farm_id: string;
  field_id: string;
  name: string;
  crop_type: string;
  variety?: string;
  planting_date: string;
  expected_harvest_date?: string;
  actual_harvest_date?: string;
  status: 'planned' | 'active' | 'harvested' | 'failed';
  health_status?: 'healthy' | 'needs attention' | 'critical';
  created_at: string;
  updated_at?: string;
}

export interface CropTreatment {
  id: string;
  crop_id: string;
  treatment_type: 'pesticide' | 'fertilizer' | 'fungicide' | 'herbicide' | 'irrigation';
  treatment_date: string;
  description?: string;
  applied_by?: string;
  notes?: string;
  created_at: string;
}

// ============================================================================
// ANIMALS & LIVESTOCK
// ============================================================================

export interface Animal {
  id: string;
  farm_id: string;
  animal_type: string;
  breed?: string;
  identification: string;
  date_of_birth?: string;
  acquisition_date: string;
  status: 'active' | 'sold' | 'deceased';
  created_at: string;
  updated_at?: string;
}

export interface AnimalHealth {
  id: string;
  animal_id: string;
  health_status: 'healthy' | 'sick' | 'injured' | 'pregnant';
  notes?: string;
  recorded_date: string;
  created_at: string;
}

// ============================================================================
// INVENTORY
// ============================================================================

export interface InventoryItem {
  id: string;
  farm_id: string;
  name: string;
  category: string;
  sku?: string;
  qty: number;
  unit: string;
  reorder_threshold?: number;
  current_cost_per_unit?: number;
  supplier_info?: string;
  storage_requirements?: string;
  expiration_date?: string;
  quality_grade?: string;
  minimum_order_quantity?: number;
  maximum_order_quantity?: number;
  preferred_supplier_id?: string;
  stock_status?: 'critical' | 'low' | 'normal';
  created_at: string;
  updated_at?: string;
}

export interface InventoryTransaction {
  id: string;
  inventory_item_id: string;
  transaction_type: 'in' | 'out' | 'adjustment';
  qty_delta: number;
  unit_cost?: number;
  notes?: string;
  reference_id?: string;
  reference_type?: 'operation' | 'purchase' | 'manual';
  created_at: string;
}

export interface InventoryAlert {
  id: string;
  inventory_item_id: string;
  alert_type: 'low_stock' | 'expired' | 'damaged' | 'missing';
  alert_date: string;
  current_quantity: number;
  threshold_quantity?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  resolved_date?: string;
  resolved_by?: string;
  notes?: string;
}

// ============================================================================
// FINANCE
// ============================================================================

export interface FinanceEntry {
  id: string;
  farm_id: string;
  entry_type: 'income' | 'expense' | 'adjustment';
  category: string;
  amount: number;
  currency: string;
  description?: string;
  reference_id?: string;
  reference_type?: 'operation' | 'inventory' | 'sale' | 'expense' | 'other';
  entry_date: string;
  created_at: string;
}

export interface FinanceReport {
  period: string;
  total_income: number;
  total_expenses: number;
  net_profit: number;
  entries_count: number;
  by_category: Record<string, number>;
}

// ============================================================================
// TASKS & OPERATIONS
// ============================================================================

export interface Task {
  id: string;
  farm_id: string;
  title: string;
  description?: string;
  task_type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assigned_to?: string;
  due_date: string;
  completed_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface Operation {
  id: string;
  farm_id: string;
  operation_type: string;
  title: string;
  description?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_date: string;
  actual_date?: string;
  created_at: string;
  updated_at?: string;
}

export interface Treatment {
  id: string;
  farm_id: string;
  target_type: 'animal' | 'crop';
  target_id: string;
  treatment_type: string;
  applied_date: string;
  applied_by?: string;
  notes?: string;
  created_at: string;
}

// ============================================================================
// FORMS & UI TYPES
// ============================================================================

export interface CreateFarmForm {
  name: string;
  location: string;
  area_hectares?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

export interface CreateInventoryForm {
  name: string;
  category: string;
  sku?: string;
  qty: number;
  unit: string;
  reorder_threshold?: number;
  current_cost_per_unit?: number;
  supplier_info?: string;
}

export interface CreateTaskForm {
  title: string;
  description?: string;
  task_type: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  due_date: string;
  assigned_to?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
  message?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ListOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ApiErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  details?: any;
  timestamp: string;
}
