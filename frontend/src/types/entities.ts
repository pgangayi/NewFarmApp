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

export interface Field {
  id: string;
  farm_id: string;
  name: string;
  area_hectares: number;
  crop_type?: string;
  soil_type?: string;
  field_number?: string;
  irrigation_system?: string;
  drainage_quality?: string;
  accessibility_score?: number;
  environmental_factors?: string;
  maintenance_schedule?: string;
  current_cover_crop?: string;
  field_capacity?: number;
  notes?: string;
  farm_name?: string;
  crop_count?: number;
  avg_profitability?: number;
  best_yield_per_hectare?: number;
  avg_ph_level?: number;
  pending_tasks?: number;
  created_at: string;
  updated_at?: string;
}

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
  name: string;
  species: string;
  breed?: string;
  identification_tag?: string;
  birth_date?: string;
  sex?: string;
  health_status?: string;
  // New intake management fields
  intake_type?: 'Birth' | 'Purchase' | 'Transfer';
  intake_date?: string;
  purchase_price?: number;
  seller_details?: string;
  // New pedigree fields
  father_id?: string;
  mother_id?: string;
  // New location tracking
  current_location_id?: string;
  // Legacy fields (keeping for backward compatibility)
  current_location?: string;
  pasture_id?: number;
  production_type?: string;
  status?: 'active' | 'sold' | 'deceased';
  current_weight?: number;
  target_weight?: number;
  vaccination_status?: string;
  last_vet_check?: string;
  acquisition_date?: string;
  acquisition_cost?: number;
  genetic_profile?: string;
  created_at: string;
  updated_at?: string;
  // Computed/joined fields
  farm_name?: string;
  location_name?: string;
  location_type?: string;
  father_name?: string;
  mother_name?: string;
  breed_origin?: string;
  breed_purpose?: string;
  breed_avg_weight?: number;
  temperament?: string;
  health_records_count?: number;
  production_records_count?: number;
  breeding_records_count?: number;
  movement_count?: number;
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
// LOCATIONS & MOVEMENTS
// ============================================================================

export interface Location {
  id: string;
  farm_id: string;
  name: string;
  type: 'barn' | 'pasture' | 'field' | 'stable' | 'corral' | 'other';
  description?: string;
  capacity?: number;
  current_occupancy?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  created_at: string;
  updated_at?: string;
}

export interface AnimalMovement {
  id: string;
  animal_id: string;
  source_location_id?: string;
  destination_location_id: string;
  movement_date: string;
  recorded_by: string;
  notes?: string;
  created_at: string;
}

// ============================================================================
// PEDIGREE & BREEDING
// ============================================================================

export interface PedigreeNode {
  id: string;
  name: string;
  sex?: string;
  generation: number;
  parents?: {
    father?: PedigreeNode;
    mother?: PedigreeNode;
  };
}

export interface LivestockStats {
  total_animals: number;
  by_species: Array<{
    species: string;
    count: number;
  }>;
  by_health_status: Array<{
    health_status: string;
    count: number;
  }>;
  by_location: Array<{
    location_name: string;
    count: number;
  }>;
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
  filters?: Record<string, unknown>;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ApiErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  details?: unknown;
  timestamp: string;
}
