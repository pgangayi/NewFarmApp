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
  error?: string;
  success: boolean;
  timestamp?: string;
}

export interface ApiErrorResponse {
  message: string;
  error: string;
  status_code: number;
  details?: unknown;
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
  has_more: boolean;
}

export interface QueryFilters {
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
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
  expires_at: string;
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
  area_hectares?: number;
  farm_type?: string;
  owner_id?: string;
  timezone?: string;
}

export type FarmFormData = CreateRequest<Farm>;

// ============================================================================
// LOCATION TYPES
// ============================================================================

export interface Location extends BaseEntity {
  farm_id: string;
  name: string;
  location_type: string;
  type: string; // Alias or specific type
  description?: string;
  capacity?: number;
  current_occupancy?: number;
  coordinates?: string;
  size_sqft?: number;
}

export interface Field extends Location {
  soil_type?: string;
  irrigation_type?: string;
  farm_name?: string;
  area_hectares?: number;
  crop_type?: string;
}

// ============================================================================
// WEATHER TYPES
// ============================================================================

export interface WeatherData {
  date: string;
  temp_min: number;
  temp_max: number;
  precipitation: number;
  humidity: number;
  wind_speed: number;
  condition: string;
}

export interface WeatherImpact extends BaseEntity {
  farm_id: string;
  date: string;
  impact_level: 'low' | 'medium' | 'high' | 'critical';
  affected_crops: string[];
  affected_livestock: string[];
  description: string;
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
  record_date: string;
  record_type: string;
  vet_name?: string;
  diagnosis?: string;
  treatment?: string;
  medication?: string;
  dosage?: string;
  cost?: number;
  next_due_date?: string;
  vet_contact?: string;
  notes?: string;
  // Join fields
  animal_name?: string;
  recorded_by_name?: string;
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

export interface ProductionRecord extends BaseEntity {
  animal_id: string;
  production_date: string;
  production_type: string;
  quantity: number;
  unit: string;
  quality_grade?: string;
  price_per_unit?: number;
  total_value?: number;
  market_destination?: string;
  storage_location?: string;
  notes?: string;
  // Joins
  animal_name?: string;
  recorded_by_name?: string;
}

export interface BreedingRecord extends BaseEntity {
  animal_id: string;
  breeding_date: string;
  breeding_method: 'natural' | 'artificial_insemination';
  breeding_type?: string; // UI uses this
  mate_id?: string;
  sire_id?: string | number; // UI uses this
  technician_name?: string;
  notes?: string;
  breeding_notes?: string; // UI uses this
  status: 'pending' | 'confirmed' | 'failed';
  breeding_result?: string; // UI uses this
  expected_due_date?: string;
  expected_calving_date?: string; // UI uses this
  actual_date?: string;
  actual_calving_date?: string; // UI uses this
  offspring_count?: number;
  breeding_fee?: number;
  vet_supervision?: boolean;
  animal_name?: string;
  sire_name?: string;
  created_by_name?: string;
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
  expected_yield?: number;
  actual_yield?: number;
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
  cost?: number;
}

export interface CropPlan extends BaseEntity {
  farm_id: string;
  plan_name: string;
  field_id: string;
  crop_type: string;
  planting_date: string;
  expected_yield_unit: number;
  expected_price_unit: number;
  projected_cost?: number;
  projected_revenue?: number;
  projected_profit?: number;
  activities?: any[]; // Detailed activity plan
  // Join
  field_name?: string;
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
  task_type?: string;
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
  date?: string; // alias for transaction_date
  status?: string;
}

export type FinanceEntry = FinanceRecord;

export interface Operation extends BaseEntity {
  name: string;
  type: string;
  status: string;
  date: string;
  details?: Record<string, unknown>;
}

export interface Treatment extends BaseEntity {
  name: string;
  type: string;
  date: string;
  dosage?: string;
  notes?: string;
  animal_id?: string;
  crop_id?: string;
}

export interface ListOptions {
  label: string;
  value: string | number;
  description?: string;
  icon?: string;
}

export interface FinanceSummary {
  total_income: number;
  total_expenses: number;
  net_profit: number;
  by_category: Record<string, number>;
  period_start: string;
  period_end: string;
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
  minimum_quantity?: number;
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
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  step?: string;
  min?: string;
  rows?: number;
  creatable?: boolean;
  onAdd?: () => void;
}
