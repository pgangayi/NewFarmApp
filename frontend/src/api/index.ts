/**
 * UNIFIED API LAYER
 * =================
 * Single entry point for all API operations.
 * Import everything from '@/api' or 'src/api'.
 */

// ============================================================================
// CORE CLIENT
// ============================================================================

export { ApiClient, ApiError, apiClient } from './client';
export type { RequestOptions } from './client';

// ============================================================================
// CONFIGURATION
// ============================================================================

export {
  // Mode management
  getApiMode,
  setApiMode,
  shouldUseLocalStorage,
  shouldUseRemoteApi,
  // Constants
  API_BASE_URL,
  ENDPOINTS,
  STORAGE_KEYS,
  CACHE_CONFIG,
  API_CONFIG,
  FEATURES,
  // Legacy aliases
  apiEndpoints,
  cacheConfig,
  storageKeys,
} from './config';
export type { ApiMode } from './config';

// ============================================================================
// TYPES
// ============================================================================

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

  // Livestock (New)
  Livestock,
  LivestockStatus,
  LivestockSex,
  // LivestockStats was already exported

  // Reference / Knowledge Base
  Breed,
  Strain,
  FeedItem,
  Chemical,
  Disease,
  Treatment,
  GrowthStandard,
  PlantingGuide,
  PestIdentifier,

  // UI
  ModalField,

  // --- Specialized Domain Types ---

  // Irrigation
  CreateIrrigationForm,
  UpdateIrrigationForm,
  IrrigationSchedule,
  IrrigationAnalytics,

  // Pest & Disease
  CreatePestIssueForm,
  UpdatePestIssueForm,
  PestIssue,
  DiseaseOutbreak,
  PreventionTask,

  // Soil Health
  CreateSoilTestForm,
  UpdateSoilTestForm,
  SoilTestResult,
  SoilHealthMetrics,

  // Rotation
  CreateRotationForm,
  UpdateRotationForm,
  RotationPlan,
} from './types';

// ============================================================================
// DOMAIN API SERVICES
// ============================================================================

export {
  farmsApi,
  livestockApi, // Renamed from animalsApi
  animalsApi, // Legacy alias
  referenceApi, // New
  cropsApi,
  fieldsApi,
  tasksApi,
  locationsApi,
  financeApi,
  inventoryApi,
  authApi,
  healthApi,
  apiServices,
} from './endpoints';

// ============================================================================
// REACT QUERY HOOKS (CORE)
// ============================================================================

export {
  // Query keys
  QUERY_KEYS,

  // Farms
  useFarms,
  useFarm,
  useFarmWithSelection,
  useCreateFarm,
  useUpdateFarm,
  useDeleteFarm,

  // Animals / Livestock
  useLivestock, // New
  useLivestockDetail,
  useLivestockStats,
  useCreateLivestock,
  useUpdateLivestock,
  useDeleteLivestock,
  useBreeds,
  useGrowthStandards,
  useFeedItems,
  useDiseases,
  useTreatments,

  // Legacy Animal Hooks (Aliased)
  useAnimals,
  useAnimal,
  useAnimalStats,
  useCreateAnimal,
  useUpdateAnimal,
  useDeleteAnimal,
  useAnimalMovement,

  // New Reference Hooks
  useStrains,
  useChemicals,
  usePestIdentifiers,
  usePlantingGuides,

  // Crops
  useCrops,
  useCrop,
  useCreateCrop,
  useUpdateCrop,
  useDeleteCrop,

  // Fields
  useFields,
  useField,
  useCreateField,
  useUpdateField,
  useDeleteField,

  // Tasks
  useTasks,
  useTask,
  useCreateTask,
  useUpdateTask,
  useCompleteTask,
  useDeleteTask,

  // Locations
  useLocations,
  useLocation,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,

  // Finance
  useFinanceRecords,
  useFinanceSummary,
  useCreateFinanceRecord,
  useUpdateFinanceRecord,
  useDeleteFinanceRecord,

  // Inventory
  useInventory,
  useInventoryAlerts,
  useInventoryLowStock,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
} from './hooks';

// ============================================================================
// REACT QUERY HOOKS (SPECIALIZED)
// ============================================================================

export * from './specializedHooks';
export * from './offlineQueue';
