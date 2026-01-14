/**
 * API INDEX
 * =========
 * Central barrel export for all API functionality
 */

// ============================================================================
// HTTP CLIENT
// ============================================================================

export { apiClient } from '../lib/cloudflare';

// ============================================================================
// TYPES
// ============================================================================

export type {
  // Base types
  BaseEntity,
  ApiResponse,
  PaginationParams,
  PaginatedResponse,
  QueryFilters,
  CreateRequest,
  UpdateRequest,

  // Auth types
  User,
  AuthSession,
  AuthResponse,
  LoginCredentials,
  SignupData,

  // Entity types
  Farm,
  FarmFormData,
  Location,
  Field,
  Animal,
  Livestock,
  Breed,
  AnimalStatus,
  AnimalSex,
  HealthStatus,
  IntakeType,
  AnimalHealth,
  AnimalMovement,
  PedigreeNode,
  LivestockStats,
  Crop,
  CropStatus,
  CropHealthStatus,
  CropTreatment,
  CropActivity,
  Task,
  TaskPriority,
  TaskStatus,
  FinanceRecord,
  FinanceSummary,
  TransactionType,
  InventoryItem,
  InventoryAlert,
  InventoryCategory,
  Supplier,

  // UI types
  ModalField,
} from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

export { CACHE_CONFIG, QUERY_KEYS, API_ENDPOINTS } from './constants';

// ============================================================================
// HOOKS - FARMS
// ============================================================================

export {
  useFarms,
  useFarm,
  useFarmWithSelection,
  useCreateFarm,
  useUpdateFarm,
  useDeleteFarm,
} from './hooks/useFarms';

// ============================================================================
// HOOKS - ANIMALS/LIVESTOCK
// ============================================================================

export {
  useAnimals,
  useAnimal,
  useCreateAnimal,
  useUpdateAnimal,
  useDeleteAnimal,
  useLivestock,
  useCreateLivestock,
  useUpdateLivestock,
  useDeleteLivestock,
  useBreeds,
  useAddBreed,
} from './hooks/useAnimals';

// ============================================================================
// HOOKS - CROPS
// ============================================================================

export {
  useCrops,
  useCrop,
  useStrains,
  useCreateCrop,
  useUpdateCrop,
  useDeleteCrop,
  useCropVarieties,
  useAddCropVariety,
} from './hooks/useCrops';

export { useRotations, useCreateRotation, useDeleteRotation } from './hooks/useRotations';

export { usePestDisease, useCreatePestDisease, useDeletePestDisease } from './hooks/usePestDisease';

// ============================================================================
// HOOKS - TASKS
// ============================================================================

export {
  useTasks,
  useTask,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useStartTimeLog,
  useStopTimeLog,
} from './hooks/useTasks';

// ============================================================================
// HOOKS - INVENTORY
// ============================================================================

export {
  useInventory,
  useInventoryItem,
  useInventoryLowStock,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
} from './hooks/useInventory';

// ============================================================================
// HOOKS - LOCATIONS
// ============================================================================

export {
  useLocations,
  useLocation,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
} from './hooks/useLocations';

// ============================================================================
// HOOKS - FINANCE
// ============================================================================

export {
  useFinance,
  useFinanceSummary,
  useBudgets,
  useFinanceRecord,
  useCreateFinanceRecord,
  useUpdateFinanceRecord,
  useDeleteFinanceRecord,
} from './hooks/useFinance';

export { useIrrigation } from './hooks/useIrrigation';
