/**
 * ENTITY TYPES
 * ============
 * Re-exports types from the unified API layer.
 * This file exists for backward compatibility with existing imports.
 *
 * PREFER IMPORTING FROM: @/api or src/api
 */

// Re-export all types from the unified API layer
export type {
  // Base
  BaseEntity,
  ApiResponse,
  PaginationParams,
  PaginatedResponse,
  QueryFilters,
  CreateRequest,
  UpdateRequest,

  // Auth
  User,
  AuthSession,
  AuthResponse,
  LoginCredentials,
  SignupData,

  // Farm
  Farm,
  FarmFormData,

  // Location
  Location,

  // Field
  Field,

  // Animal
  Animal,
  AnimalStatus,
  AnimalSex,
  HealthStatus,
  IntakeType,
  AnimalHealth,
  AnimalMovement,
  PedigreeNode,
  LivestockStats,

  // Crop
  Crop,
  CropStatus,
  CropHealthStatus,
  CropTreatment,
  CropActivity,

  // Task
  Task,
  TaskPriority,
  TaskStatus,

  // Finance
  FinanceRecord,
  FinanceSummary,
  TransactionType,

  // Inventory
  InventoryItem,
  InventoryAlert,
  InventoryCategory,

  // UI
  ModalField,
} from '../api/types';
