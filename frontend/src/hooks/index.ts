// Barrel export for all hooks
// This file provides a single import point for all custom hooks

// Authentication and user management
export { useAuth } from './useAuth';

// Farm management
export { useFarm } from './useFarm';

// Core data hooks
export { useAnimals } from './useAnimals';
export { useCrops } from './useCrops';
export { useFinance } from './useFinance';
export { useInventory } from './useInventory';
export { useTasks } from './useTasks';

// Specialized hooks
export { useIrrigation } from './useIrrigation';
export { useOfflineQueue } from './useOfflineQueue';
export { usePestDisease } from './usePestDisease';
export { useRotation } from './useRotation';
export { useSoilHealth } from './useSoilHealth';

// UI and utilities
export { useTheme } from './useTheme';