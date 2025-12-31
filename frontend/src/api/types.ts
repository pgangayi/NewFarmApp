/**
 * UNIFIED API TYPES
 * ==================
 * Single source of truth for all entity types.
 * Re-exports types from the comprehensive entities.ts for backward compatibility.
 */

// ============================================================================
// BASE TYPES
// ============================================================================

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// Query filters
export interface QueryFilters {
  farm_id?: string;
  status?: string;
  search?: string;
  from_date?: string;
  to_date?: string;
  [key: string]: string | undefined;
}

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

export interface AuthSession {
  access_token: string;
  csrf_token?: string;
  expires_at?: number;
}

export interface AuthResponse {
  user: User;
  session: AuthSession;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
}

// ============================================================================
// FARM
// ============================================================================

export interface Farm extends BaseEntity {
  name: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  area_hectares?: number;
  owner_id: string;
}

export interface FarmFormData {
  name: string;
  location?: string;
  area_hectares?: number;
  timezone?: string;
}

// ============================================================================
// LOCATION (Paddock, Field, Barn, etc.)
// ============================================================================

export interface Location extends BaseEntity {
  name: string;
  type: 'paddock' | 'field' | 'barn' | 'storage' | 'pasture' | 'stable' | 'corral' | 'other';
  area_hectares?: number;
  latitude?: number;
  longitude?: number;
  farm_id: string;
  notes?: string;
  description?: string;
  capacity?: number;
  current_occupancy?: number;
}

// ============================================================================
// FIELD (Crop growing area)
// ============================================================================

export interface Field extends BaseEntity {
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
  geometry?: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][]; // GeoJSON format: [[[lng, lat], ...]]
  };
  // Computed fields
  farm_name?: string;
  crop_count?: number;
  avg_profitability?: number;
  best_yield_per_hectare?: number;
  avg_ph_level?: number;
  pending_tasks?: number;
}

// ============================================================================
// LIVESTOCK (formerly ANIMAL)
// ============================================================================

export type LivestockStatus = 'active' | 'sold' | 'deceased' | 'transferred';
export type LivestockSex = 'male' | 'female' | 'unknown';
export type HealthStatus = 'healthy' | 'sick' | 'recovering' | 'quarantine';
export type IntakeType = 'Birth' | 'Purchase' | 'Transfer';

// Legacy aliases
export type AnimalStatus = LivestockStatus;
export type AnimalSex = LivestockSex;

export interface Livestock extends BaseEntity {
  farm_id: string;
  name: string;
  species: string;
  breed?: string; // Legacy string
  breed_id?: string; // Reference to Breed entity
  breed_name?: string;
  tag_number?: string;
  identification_tag?: string;
  birth_date?: string;
  sex?: LivestockSex;
  gender?: 'male' | 'female'; // Legacy alias
  status: LivestockStatus;
  health_status?: HealthStatus;
  current_weight?: number;
  target_weight?: number;
  current_location_id?: string;
  current_location?: string; // Legacy
  notes?: string;
  // Intake management
  intake_type?: IntakeType;
  intake_date?: string;
  purchase_price?: number;
  seller_details?: string;
  // Pedigree
  father_id?: string;
  mother_id?: string;
  genetic_data?: Record<string, any>; // Specific genetic markers or traits
  // Legacy fields
  pasture_id?: number;
  production_type?: string;
  vaccination_status?: string;
  acquisition_date?: string;
  acquisition_cost?: number;
}

// Legacy alias
export type Animal = Livestock;

export interface LivestockHealth {
  id: string;
  livestock_id: string;
  animal_id?: string; // Legacy alias
  checkup_date: string;
  weight?: number;
  temperature?: number;
  heart_rate?: number;
  condition_score?: number;
  notes?: string;
  vet_name?: string;
  next_checkup?: string;
}

export type AnimalHealth = LivestockHealth;

export interface LivestockMovement {
  id: string;
  livestock_id: string;
  animal_id?: string; // Legacy alias
  from_location_id?: string;
  to_location_id: string;
  movement_date: string;
  reason?: string;
  notes?: string;
  created_at: string;
}

export type AnimalMovement = LivestockMovement;

export interface PedigreeNode {
  livestock: Livestock;
  animal?: Livestock; // Legacy alias
  father?: PedigreeNode;
  mother?: PedigreeNode;
}

export interface LivestockStats {
  totalCount: number;
  bySpecies: Record<string, number>;
  byStatus: Record<string, number>;
  byHealthStatus: Record<string, number>;
  recentBirths: number;
  recentDeaths: number;
  averageAge?: number;
}

// ============================================================================
// CROP
// ============================================================================

export type CropStatus = 'planned' | 'planted' | 'growing' | 'harvested' | 'active' | 'failed';
export type CropHealthStatus = 'healthy' | 'needs attention' | 'critical';

export interface Crop extends BaseEntity {
  farm_id: string;
  field_id?: string;
  name: string;
  crop_type?: string;
  variety?: string; // Legacy string
  strain_id?: string; // Reference to Strain entity
  strain_name?: string;
  planting_date?: string;
  expected_harvest_date?: string;
  actual_harvest_date?: string;
  status: CropStatus;
  health_status?: CropHealthStatus;
  area_hectares?: number;
  notes?: string;
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

export interface CropActivity {
  id: string;
  crop_id: string;
  activity_type: string;
  activity_date: string;
  description?: string;
  cost?: number;
  notes?: string;
  created_at: string;
}

// ============================================================================
// TASK
// ============================================================================

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Task extends BaseEntity {
  farm_id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_to?: string;
  category?: string;
  related_entity_type?: 'animal' | 'crop' | 'field' | 'equipment';
  related_entity_id?: string;
  completed_at?: string;
  notes?: string;
}

// ============================================================================
// FINANCE
// ============================================================================

export type TransactionType = 'income' | 'expense';

export interface FinanceRecord extends BaseEntity {
  farm_id: string;
  type: TransactionType;
  category: string;
  amount: number;
  currency?: string;
  date: string;
  description?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  receipt_url?: string;
  notes?: string;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  byCategory: Record<string, number>;
  period?: string;
}

// ============================================================================
// INVENTORY
// ============================================================================

export type InventoryCategory = 'feed' | 'medicine' | 'equipment' | 'seed' | 'fertilizer' | 'other';

export interface InventoryItem extends BaseEntity {
  farm_id: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  minimum_quantity?: number;
  cost_per_unit?: number;
  supplier?: string;
  expiry_date?: string;
  location?: string;
  notes?: string;
}

export interface InventoryAlert {
  item_id: string;
  item_name: string;
  alert_type: 'low_stock' | 'expiring' | 'expired';
  current_quantity?: number;
  minimum_quantity?: number;
  expiry_date?: string;
}

// ============================================================================
// KNOWLEDGE BASE & REFERENCE
// ============================================================================

export interface Breed extends BaseEntity {
  name: string;
  species: string;
  description?: string;
  characteristics?: string[];
  optimal_climate?: string;
  growth_rate_info?: string;
}

export interface FeedItem extends BaseEntity {
  name: string;
  category: 'grain' | 'forage' | 'supplement' | 'mineral' | 'protein';
  nutritional_value?: {
    protein_percent?: number;
    fiber_percent?: number;
    energy_mj?: number;
  };
  unit: string;
  cost_per_unit?: number;
}

export interface GrowthStandard extends BaseEntity {
  breed_id?: string;
  species: string;
  age_weeks: number;
  min_weight_kg: number;
  max_weight_kg: number;
  target_weight_kg: number;
}

export interface Strain extends BaseEntity {
  name: string;
  crop_type: string;
  description?: string;
  days_to_maturity?: number;
  resistance_profile?: string[]; // e.g., ["drought", "pest_x"]
  optimal_conditions?: string;
}

export interface Disease extends BaseEntity {
  name: string;
  affected_entities: ('livestock' | 'crop')[];
  species_affected?: string[]; // e.g., ["cattle", "sheep"] or ["maize"]
  symptoms: string[];
  description?: string;
  prevention_measures?: string[];
  treatment_recommendations?: string[];
}

export interface Treatment extends BaseEntity {
  name: string;
  type: 'medication' | 'procedure' | 'chemical' | 'cultural';
  description?: string;
  target_diseases?: string[]; // IDs or names
  dosage_instructions?: string;
  withdrawal_period_days?: number;
}

export interface Chemical extends BaseEntity {
  name: string;
  type: 'pesticide' | 'herbicide' | 'fungicide' | 'fertilizer';
  active_ingredients?: string[];
  safety_interval_days?: number; // Re-entry interval
  target_pests?: string[];
  manufacturer?: string;
  safety_instructions?: string;
}

export interface PlantingGuide extends BaseEntity {
  crop_type: string;
  region: string;
  planting_window_start: string; // MM-DD
  planting_window_end: string;
  harvest_window_start?: string;
  ideal_season?: string;
  planting_depth_cm?: number;
  spacing_cm?: number;
  notes?: string;
}

export interface PestIdentifier extends BaseEntity {
  name: string;
  type: 'pest' | 'weed' | 'beneficial';
  affected_crops?: string[];
  identification_traits: string[];
  images?: string[];
}

// ============================================================================
// CRUD HELPERS
// ============================================================================

export type CreateRequest<T extends BaseEntity> = Omit<T, 'id' | 'created_at' | 'updated_at'>;
export type UpdateRequest<T extends BaseEntity> = Partial<
  Omit<T, 'id' | 'created_at' | 'updated_at'>
>;

// ============================================================================
// MODAL FIELD (for UnifiedModal)
// ============================================================================

export interface ModalField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  step?: string;
  rows?: number;
  options?: Array<{ value: string; label: string }>;
  defaultValue?: string | number | boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

// ============================================================================
// IRRIGATION
// ============================================================================

export interface CreateIrrigationForm {
  farm_id: string;
  field_id: string;
  crop_type: string;
  irrigation_type: string;
  frequency_days: number;
  duration_minutes: number;
  water_amount_liters: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  start_date?: string;
}

export interface UpdateIrrigationForm extends Partial<CreateIrrigationForm> {
  id: string;
  status?: 'active' | 'paused' | 'completed';
}

export interface IrrigationSchedule {
  id: string;
  farm_id: string;
  field_id: string;
  crop_type: string;
  irrigation_type: string;
  frequency_days: number;
  duration_minutes: number;
  water_amount_liters: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  next_watering_date: string;
  status: 'active' | 'paused' | 'completed';
  field_name: string;
  is_active: boolean;
}

export interface IrrigationAnalytics {
  total_water_usage: number;
  efficiency_score: number;
  cost_savings: number;
  next_schedules: IrrigationSchedule[];
  recommendations: string[];
}

// ============================================================================
// PEST & DISEASE
// ============================================================================

export interface CreatePestIssueForm {
  farm_id: string;
  field_id: string;
  issue_type: 'pest' | 'disease';
  crop_type: string;
  pest_name?: string;
  disease_name?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affected_area_percent: number;
  discovery_date?: string;
  outbreak_date?: string;
  status?:
    | 'active'
    | 'treated'
    | 'resolved'
    | 'monitoring'
    | 'treating'
    | 'controlled'
    | 'contained';
  description: string;
  growth_stage?: string;
  treatment_applied?: string;
  treatment_date?: string;
  cost_incurred?: number;
}

export interface UpdatePestIssueForm extends Partial<CreatePestIssueForm> {
  id: string;
  issue_type: 'pest' | 'disease';
}

export interface PestIssue {
  id: string;
  farm_id: string;
  field_id: string;
  crop_type: string;
  pest_name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affected_area_percent: number;
  discovery_date: string;
  status: 'active' | 'treated' | 'resolved' | 'escalated';
  treatment_applied?: string;
  treatment_date?: string;
  cost_incurred?: number;
  field_name: string;
  description: string;
  created_at: string;
}

export interface DiseaseOutbreak {
  id: string;
  farm_id: string;
  field_id: string;
  crop_type: string;
  disease_name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affected_area_percent: number;
  outbreak_date: string;
  status: 'monitoring' | 'treating' | 'controlled' | 'contained';
  growth_stage: string;
  weather_factors?: string;
  treatment_effectiveness?: number;
  field_name: string;
  description: string;
  created_at: string;
}

export interface PreventionTask {
  id: string;
  task_name: string;
  field_id: string;
  field_name: string;
  scheduled_date: string;
  priority: 'low' | 'medium' | 'high';
  description?: string;
  is_completed: boolean;
}

// ============================================================================
// SOIL HEALTH
// ============================================================================

export interface CreateSoilTestForm {
  farm_id: string;
  field_id: string;
  test_type: 'lab' | 'home' | 'professional';
  test_date?: string;
  ph_level: number;
  organic_matter_percent: number;
  nitrogen_ppm: number;
  phosphorus_ppm: number;
  potassium_ppm: number;
  soil_type?: 'sandy' | 'clay' | 'loam' | 'silt' | 'peat';
  texture?: string;
  notes?: string;
  lab_name?: string;
}

export interface UpdateSoilTestForm extends Partial<CreateSoilTestForm> {
  id: string;
}

export interface SoilTestResult {
  id: string;
  farm_id: string;
  field_id: string;
  test_date: string;
  test_type: 'lab' | 'home' | 'professional';
  ph_level: number;
  organic_matter_percent: number;
  nitrogen_ppm: number;
  phosphorus_ppm: number;
  potassium_ppm: number;
  soil_type?: 'sandy' | 'clay' | 'loam' | 'silt' | 'peat';
  texture?: string;
  notes?: string;
  lab_name?: string;
  field_name: string;
  is_active: boolean;
  created_at: string;
  recommendations?: string[];
}

export interface SoilHealthMetrics {
  overall_health_score: number;
  ph_balance: 'acidic' | 'neutral' | 'alkaline';
  nutrient_status: 'deficient' | 'adequate' | 'excessive';
  organic_matter_status: 'low' | 'moderate' | 'high';
  last_test_date: string | null;
  next_test_recommended: string;
  trends: {
    ph_trend: 'improving' | 'declining' | 'stable';
    organic_matter_trend: 'improving' | 'declining' | 'stable';
    nutrient_trend: 'improving' | 'declining' | 'stable';
  };
}

// ============================================================================
// CROP ROTATION
// ============================================================================

export interface CreateRotationForm {
  farm_id: string;
  field_id: string;
  crop_sequence: Array<{
    year: number;
    crop_type: string;
    variety?: string;
    planting_date: string;
    harvest_date: string;
    status: 'planned' | 'planted' | 'harvested';
  }>;
  notes?: string;
}

export interface UpdateRotationForm extends Partial<CreateRotationForm> {
  id: string;
}

export interface RotationPlan {
  id: string;
  farm_id: string;
  field_id: string;
  crop_sequence: Array<{
    year: number;
    crop_type: string;
    variety?: string;
    planting_date: string;
    harvest_date: string;
    status: 'planned' | 'planted' | 'harvested';
  }>;
  field_name: string;
  is_active: boolean;
  created_at: string;
  notes?: string;
}

// ============================================================================
// IRRIGATION
// ============================================================================

export interface CreateIrrigationForm {
  farm_id: string;
  field_id: string;
  crop_type: string;
  irrigation_type: string;
  frequency_days: number;
  duration_minutes: number;
  water_amount_liters: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  start_date?: string;
}

export interface UpdateIrrigationForm extends Partial<CreateIrrigationForm> {
  id: string;
  status?: 'active' | 'paused' | 'completed';
}

export interface IrrigationSchedule {
  id: string;
  farm_id: string;
  field_id: string;
  crop_type: string;
  irrigation_type: string;
  frequency_days: number;
  duration_minutes: number;
  water_amount_liters: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  next_watering_date: string;
  status: 'active' | 'paused' | 'completed';
  field_name: string;
  is_active: boolean;
}

export interface IrrigationAnalytics {
  total_water_usage: number;
  efficiency_score: number;
  cost_savings: number;
  next_schedules: IrrigationSchedule[];
  recommendations: string[];
}

// ============================================================================
// PEST & DISEASE
// ============================================================================

export interface CreatePestIssueForm {
  farm_id: string;
  field_id: string;
  issue_type: 'pest' | 'disease';
  crop_type: string;
  pest_name?: string;
  disease_name?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affected_area_percent: number;
  discovery_date?: string;
  outbreak_date?: string;
  status?:
    | 'active'
    | 'treated'
    | 'resolved'
    | 'monitoring'
    | 'treating'
    | 'controlled'
    | 'contained';
  description: string;
  growth_stage?: string;
  treatment_applied?: string;
  treatment_date?: string;
  cost_incurred?: number;
}

export interface UpdatePestIssueForm extends Partial<CreatePestIssueForm> {
  id: string;
  issue_type: 'pest' | 'disease';
}

export interface PestIssue {
  id: string;
  farm_id: string;
  field_id: string;
  crop_type: string;
  pest_name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affected_area_percent: number;
  discovery_date: string;
  status: 'active' | 'treated' | 'resolved' | 'escalated';
  treatment_applied?: string;
  treatment_date?: string;
  cost_incurred?: number;
  field_name: string;
  description: string;
  created_at: string;
}

export interface DiseaseOutbreak {
  id: string;
  farm_id: string;
  field_id: string;
  crop_type: string;
  disease_name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affected_area_percent: number;
  outbreak_date: string;
  status: 'monitoring' | 'treating' | 'controlled' | 'contained';
  growth_stage: string;
  weather_factors?: string;
  treatment_effectiveness?: number;
  field_name: string;
  description: string;
  created_at: string;
}

export interface PreventionTask {
  id: string;
  task_name: string;
  field_id: string;
  field_name: string;
  scheduled_date: string;
  priority: 'low' | 'medium' | 'high';
  description?: string;
  is_completed: boolean;
}

// ============================================================================
// SOIL HEALTH
// ============================================================================

export interface CreateSoilTestForm {
  farm_id: string;
  field_id: string;
  test_type: 'lab' | 'home' | 'professional';
  test_date?: string;
  ph_level: number;
  organic_matter_percent: number;
  nitrogen_ppm: number;
  phosphorus_ppm: number;
  potassium_ppm: number;
  soil_type?: 'sandy' | 'clay' | 'loam' | 'silt' | 'peat';
  texture?: string;
  notes?: string;
  lab_name?: string;
}

export interface UpdateSoilTestForm extends Partial<CreateSoilTestForm> {
  id: string;
}

export interface SoilTestResult {
  id: string;
  farm_id: string;
  field_id: string;
  test_date: string;
  test_type: 'lab' | 'home' | 'professional';
  ph_level: number;
  organic_matter_percent: number;
  nitrogen_ppm: number;
  phosphorus_ppm: number;
  potassium_ppm: number;
  soil_type?: 'sandy' | 'clay' | 'loam' | 'silt' | 'peat';
  texture?: string;
  notes?: string;
  lab_name?: string;
  field_name: string;
  is_active: boolean;
  created_at: string;
  recommendations?: string[];
}

export interface SoilHealthMetrics {
  overall_health_score: number;
  ph_balance: 'acidic' | 'neutral' | 'alkaline';
  nutrient_status: 'deficient' | 'adequate' | 'excessive';
  organic_matter_status: 'low' | 'moderate' | 'high';
  last_test_date: string | null;
  next_test_recommended: string;
  trends: {
    ph_trend: 'improving' | 'declining' | 'stable';
    organic_matter_trend: 'improving' | 'declining' | 'stable';
    nutrient_trend: 'improving' | 'declining' | 'stable';
  };
}

// ============================================================================
// CROP ROTATION
// ============================================================================

export interface CreateRotationForm {
  farm_id: string;
  field_id: string;
  crop_sequence: Array<{
    year: number;
    crop_type: string;
    variety?: string;
    planting_date: string;
    harvest_date: string;
    status: 'planned' | 'planted' | 'harvested';
  }>;
  notes?: string;
}

export interface UpdateRotationForm extends Partial<CreateRotationForm> {
  id: string;
}

export interface RotationPlan {
  id: string;
  farm_id: string;
  field_id: string;
  crop_sequence: Array<{
    year: number;
    crop_type: string;
    variety?: string;
    planting_date: string;
    harvest_date: string;
    status: 'planned' | 'planted' | 'harvested';
  }>;
  field_name: string;
  is_active: boolean;
  created_at: string;
  notes?: string;
}
