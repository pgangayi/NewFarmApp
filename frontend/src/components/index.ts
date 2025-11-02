// Barrel export for all components
// This file provides a single import point for all components

// Core components
export { Map } from './Map';

// Management components
export { AIAnalyticsDashboard } from './AIAnalyticsDashboard';
export { AnimalAnalyticsDashboard } from './AnimalAnalyticsDashboard';
export { AnimalBreedingManager } from './AnimalBreedingManager';
export { AnimalHealthManager } from './AnimalHealthManager';
export { AnimalProductionTracker } from './AnimalProductionTracker';
export { AdvancedManagementDashboard } from './AdvancedManagementDashboard';

// Farm and field management
export { FarmLocationManager } from './FarmLocationManager';
export { InventoryList } from './InventoryList';
export { IrrigationOptimizer } from './IrrigationOptimizer';
export { PestDiseaseManager } from './PestDiseaseManager';
export { SoilHealthMonitor } from './SoilHealthMonitor';

// Crop management
export { CropRotationPlanner } from './CropRotationPlanner';

// Weather components
export { WeatherAnalytics } from './WeatherAnalytics';
export { WeatherCalendar } from './WeatherCalendar';
export { WeatherNotifications } from './WeatherNotifications';

// UI components (re-export for convenience)
export * from './ui/badge';
export * from './ui/button';
export * from './ui/card';