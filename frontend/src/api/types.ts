/**
 * API TYPES
 * =========
 * Centralized type definitions for all API entities and operations
 */

// ============================================================================
// BASE TYPES
// ============================================================================

export interface BaseEntity {
  id: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  timestamp?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface QueryFilters {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: any;
}

export type CreateRequest<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;
export type UpdateRequest<T> = Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>;

// ============================================================================
// USER & AUTH TYPES
// ============================================================================

export interface User extends BaseEntity {
  email: string;
  name: string;
  role?: string;
  avatar?: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}

export interface AuthResponse {
  session: AuthSession;
  message: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData extends LoginCredentials {
  name: string;
}

// ============================================================================
// FARM TYPES
// ============================================================================

export interface Farm extends BaseEntity {
  name: string;
  location?: string;
  size_acres?: number;
  farm_type?: string;
  owner_id?: string;
}

export type FarmFormData = CreateRequest<Farm>;

// ============================================================================
// LOCATION TYPES
// ============================================================================

export interface Location extends BaseEntity {
  farm_id: string;
  name: string;
  location_type: string;
  coordinates?: string;
  size_sqft?: number;
  description?: string;
  capacity?: number;
  current_occupancy?: number;
}

export interface Field extends Location {
  soil_type?: string;
  irrigation_type?: string;
}

// ============================================================================
// ANIMAL/LIVESTOCK TYPES
// ============================================================================

export type AnimalStatus = 'active' | 'sold' | 'deceased' | 'quarantine';
export type AnimalSex = 'male' | 'female' | 'unknown';
export type HealthStatus = 'healthy' | 'sick' | 'injured' | 'recovering';
export type IntakeType = 'birth' | 'purchase' | 'rescue' | 'other';

export interface Animal extends BaseEntity {
  farm_id: string;
  species: string;
  breed?: string;
  identification_tag?: string;
  name?: string;
  sex?: AnimalSex;
  date_of_birth?: string;
  acquisition_date: string;
  acquisition_type?: IntakeType;
  status: AnimalStatus;
  current_weight?: number;
  location_id?: string;
  notes?: string;
}

export interface Livestock extends Animal {
  dam_id?: string;
  sire_id?: string;
  health_status?: HealthStatus;
  vaccination_status?: string;
}

export interface Breed extends BaseEntity {
  name: string;
  species: string;
  characteristics?: string;
}

export interface AnimalHealth extends BaseEntity {
  animal_id: string;
  checkup_date: string;
  weight?: number;
  temperature?: number;
  diagnosis?: string;
  treatment?: string;
  vet_name?: string;
  next_checkup?: string;
}

export interface AnimalMovement extends BaseEntity {
  animal_id: string;
  from_location_id?: string;
  to_location_id: string;
  movement_date: string;
  reason?: string;
}

export interface PedigreeNode {
  id: string;
  name: string;
  breed?: string;
  generation: number;
}

export interface LivestockStats {
  total: number;
  bySpecies: Record<string, number>;
  byStatus: Record<AnimalStatus, number>;
  averageAge: number;
}

// ============================================================================
// CROP TYPES
// ============================================================================

export type CropStatus = 'planned' | 'planted' | 'growing' | 'harvested' | 'failed';
export type CropHealthStatus = 'healthy' | 'stress' | 'disease' | 'pest_damage';

export interface Crop extends BaseEntity {
  farm_id: string;
  field_id?: string;
  crop_type: string;
  variety?: string;
  planting_date?: string;
  expected_harvest_date?: string;
  actual_harvest_date?: string;
  status: CropStatus;
  health_status?: CropHealthStatus;
  area_planted?: number;
  yield_expected?: number;
  yield_actual?: number;
  notes?: string;
  irrigation_schedule?: string;
  name?: string;
}

export interface CropTreatment extends BaseEntity {
  crop_id: string;
  treatment_date: string;
  treatment_type: 'fertilizer' | 'pesticide' | 'herbicide' | 'fungicide' | 'other';
  product_name: string;
  quantity?: number;
  cost?: number;
}

export interface CropActivity extends BaseEntity {
  crop_id: string;
  activity_date: string;
  activity_type: string;
  description: string;
  labor_hours?: number;
}

// ============================================================================
// TASK TYPES
// ============================================================================

export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Task extends BaseEntity {
  farm_id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string;
  assigned_to?: string;
  category?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  completed_at?: string;
}

// ============================================================================
// FINANCE TYPES
// ============================================================================

export type TransactionType = 'income' | 'expense';

export interface FinanceRecord extends BaseEntity {
  farm_id: string;
  type: TransactionType;
  entry_type?: TransactionType; // alias for type
  category: string;
  amount: number;
  transaction_date: string;
  description?: string;
  payment_method?: string;
  related_entity_type?: string;
  related_entity_id?: string;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  byCategory: Record<string, number>;
  periodStart: string;
  periodEnd: string;
}

export interface BudgetCategory extends BaseEntity {
  farm_id: string;
  category: string;
  budget_limit: number;
  spent: number;
  fiscal_year: number;
  period: string;
}

// ============================================================================
// INVENTORY TYPES
// ============================================================================

export type InventoryCategory =
  | 'seed'
  | 'fertilizer'
  | 'equipment'
  | 'feed'
  | 'medicine'
  | 'supply'
  | 'other';

export interface InventoryItem extends BaseEntity {
  farm_id: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  reorder_level?: number;
  cost_per_unit?: number;
  supplier_id?: string;
  location_id?: string;
  expiry_date?: string;
  notes?: string;
}

export interface InventoryAlert extends BaseEntity {
  item_id: string;
  alert_type: 'low_stock' | 'expired' | 'expiring_soon';
  message: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
}

export interface Supplier extends BaseEntity {
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  products_supplied?: string[];
}

// ============================================================================
// UI/FORM TYPES
// ============================================================================

export interface ModalField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
}
