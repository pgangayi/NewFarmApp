/**
 * UI Component Types
 * Centralized type definitions for React components and UI state
 */

// ============================================================================
// COMPONENT PROPS INTERFACES
// ============================================================================

export interface AnimalCardProps {
  animal: import('./entities').Animal;
  onEdit: (animal: import('./entities').Animal) => void;
  onDelete: (animal: import('./entities').Animal) => void;
}

export interface FilterState {
  search: string;
  species: string;
  breed: string;
  health_status: string;
  sex: string;
  production_type: string;
  status: string;
  location: string;
  intake_type: string;
  pedigree_search: string;
  sort_by: string;
  sort_order: 'asc' | 'desc';
}

// ============================================================================
// FORM INTERFACES
// ============================================================================

export interface FieldFormDataInternal {
  farm_id: number;
  name: string;
  area_hectares: number | null;
  crop_type: string | null;
  notes: string | null;
  soil_type: string | null;
  field_capacity: number | null;
  current_cover_crop: string | null;
  irrigation_system: string | null;
  drainage_quality: string | null;
  accessibility_score: number | null;
  environmental_factors: string | null;
  maintenance_schedule: string | null;
}

// ============================================================================
// DATA INTERFACES
// ============================================================================

export interface SoilAnalysisData {
  field_id: number;
  analysis_date: string;
  ph_level: number | null;
  nitrogen_content: number | null;
  phosphorus_content: number | null;
  potassium_content: number | null;
  organic_matter: number | null;
  soil_moisture: number | null;
  temperature: number | null;
  salinity: number | null;
  recommendations: string | null;
}

// ============================================================================
// ERROR HANDLING INTERFACES
// ============================================================================

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo?: import('react').ErrorInfo;
}

export interface ErrorBoundaryProps {
  children: import('react').ReactNode;
  fallback?: import('react').ReactNode;
  onError?: (error: Error, errorInfo: import('react').ErrorInfo) => void;
}

// ============================================================================
// TESTING INTERFACES
// ============================================================================

export interface MockApiResponse<T = unknown> {
  data?: T;
  error?: string;
  success: boolean;
  message?: string;
  statusCode?: number;
}

export interface TestUser {
  id: string;
  email: string;
  name?: string;
  role?: 'admin' | 'user' | 'farmer';
}

export interface TestFarm {
  id: string;
  name: string;
  owner_id: string;
  location?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type SortOrder = 'asc' | 'desc';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface TableColumn<T = unknown> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: T[keyof T], item: T) => import('react').ReactNode;
}
