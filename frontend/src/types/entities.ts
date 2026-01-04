/**
 * Entity Types - Re-exports from API types
 * This file provides a convenient import path for entity types
 */

// Re-export all entity types from the API types
export type {
  // Base types
  BaseEntity,
  ApiResponse,
  PaginatedResponse,
  QueryFilters,
  CreateRequest,
  UpdateRequest,

  // User & Auth
  User,
  AuthSession,
  AuthResponse,
  LoginCredentials,
  SignupData,

  // Farm
  Farm,
  FarmFormData,

  // Location & Field
  Location,
  Field,

  // Animal/Livestock
  Animal,
  Livestock,
  Breed,
  AnimalHealth,
  AnimalMovement,
  AnimalStatus,
  AnimalSex,
  HealthStatus,
  IntakeType,
  PedigreeNode,
  LivestockStats,

  // Crop
  Crop,
  CropTreatment,
  CropActivity,
  CropStatus,
  CropHealthStatus,

  // Task
  Task,
  TaskPriority,
  TaskStatus,

  // Finance
  FinanceRecord,
  FinanceSummary,
  BudgetCategory,
  TransactionType,

  // Inventory
  InventoryItem,
  InventoryCategory,
  InventoryAlert,
  Supplier,
} from '../api/types';

// Additional type aliases for backwards compatibility
export type FinanceEntry = import('../api/types').FinanceRecord;

// Stub types for Operation and Treatment (not defined in API types yet)
export interface Operation {
  id: string;
  name: string;
  type: string;
  date: string;
  [key: string]: unknown;
}

export interface Treatment {
  id: string;
  name: string;
  type: string;
  date: string;
  [key: string]: unknown;
}

export interface InventoryTransaction {
  id: string;
  item_id: string;
  transaction_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  date: string;
  notes?: string;
  [key: string]: unknown;
}

// List options type
export interface ListOptions {
  page?: number;
  limit?: number;
  offset?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: unknown;
}

// API Error Response type
export interface ApiErrorResponse {
  error: string;
  message?: string;
  statusCode?: number;
  details?: unknown;
}
