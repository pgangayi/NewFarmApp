/**
 * HOOKS BARREL EXPORT
 * ===================
 * This file provides a single import point for all custom hooks.
 */

// ============================================================================
// RE-EXPORTS FROM NEW API LAYER
// ============================================================================

export {
  // Farms
  useFarms,
  useFarm,
  useFarmWithSelection,
  useCreateFarm,
  useUpdateFarm,
  useDeleteFarm,

  // Animals
  useAnimals,
  useCreateAnimal,
  useUpdateAnimal,
  useDeleteAnimal,

  // Crops
  useCrops,
  useCreateCrop,
  useUpdateCrop,
  useDeleteCrop,
  useStrains,

  // Tasks
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,

  // Inventory
  useInventory,
  useInventoryLowStock,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,

  // Locations
  useLocations,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,

  // Finance
  useFinance,
  useFinanceSummary,
  useCreateFinanceRecord,
  useUpdateFinanceRecord,
  useDeleteFinanceRecord,

  // API Client
  apiClient,
} from '../api';

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

// Re-export specialized hooks that aren't entity CRUD
// (These hooks are kept in the hooks/ directory for specialized functionality)

// ============================================================================
// UTILITY HOOKS
// ============================================================================

export { useTheme } from './useTheme';
export { useDebounce } from './useDebounce';

// ============================================================================
// AUTH
// ============================================================================

export { useAuth, AuthProvider } from './AuthContext';
