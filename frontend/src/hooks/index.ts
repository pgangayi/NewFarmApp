/**
 * HOOKS BARREL EXPORT
 * ===================
 * This file provides a single import point for all custom hooks.
 * Core data hooks are now provided by the unified API layer with
 * legacy-compatible interfaces where needed.
 */

import { apiClient } from '../api';

// ============================================================================
// RE-EXPORTS FROM LEGACY COMPATIBILITY LAYER
// (These provide backward-compatible interfaces using the new API layer)
// ============================================================================

export {
  useFarm,
  useAnimals,
  useCrops,
  useCropsStats,
  useTasks,
  useInventory,
  useLowStockItems,
} from './legacyHooks';

// ============================================================================
// SPECIALIZED HOOKS (Migrated to API layer)
// ============================================================================

export {
  // Irrigation
  useIrrigation,
  useIrrigationByFarm,
  useIrrigationAnalytics,
  useIrrigationRecommendations,

  // Pest & Disease
  usePestDisease,
  usePestDiseaseByFarm,
  usePreventionCalendar,

  // Soil Health
  useSoilHealth,
  useSoilTestsByFarm,
  useSoilHealthMetrics,

  // Crop Rotation
  useRotation,
  useRotationByFarm,

  // Offline
  useOfflineQueue,
} from '../api';

// ============================================================================
// UTILITY HOOKS
// ============================================================================

export { useTheme } from './useTheme';
export { useDebounce } from './useDebounce';

// ============================================================================
// AUTH
// ============================================================================

export { useAuth, AuthProvider } from './AuthContext';

// ============================================================================
// API CLIENT
// ============================================================================

// Legacy hook wrapper that returns the singleton client
export const useApiClient = () => apiClient;
