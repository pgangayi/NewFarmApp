// Feature Flags Configuration
// Centralized configuration for enabling/disabling features

export interface FeatureFlags {
  // Dashboard Features
  enableAdvancedDashboard: boolean;
  enableAIAnalytics: boolean;
  enableAnimalAnalytics: boolean;

  // API Features
  enableEnhancedAPIs: boolean;
  enableAdvancedSearch: boolean;
  enablePredictiveAnalytics: boolean;

  // UI Features
  enableAdvancedWidgets: boolean;
  enableDarkMode: boolean;
  enableOfflineMode: boolean;

  // Module Features
  enableCropRotation: boolean;
  enableSoilHealth: boolean;
  enableIrrigationOptimizer: boolean;
  enableWeatherAnalytics: boolean;
  enablePestDiseaseManagement: boolean;

  // Performance Features
  enableCaching: boolean;
  enablePerformanceMonitoring: boolean;
  enableAnalytics: boolean;
}

// Default feature flags based on environment
const defaultFlags: FeatureFlags = {
  enableAdvancedDashboard: true,
  enableAIAnalytics: true,
  enableAnimalAnalytics: true,
  enableEnhancedAPIs: true,
  enableAdvancedSearch: true,
  enablePredictiveAnalytics: true,
  enableAdvancedWidgets: true,
  enableDarkMode: true,
  enableOfflineMode: true,
  enableCropRotation: true,
  enableSoilHealth: true,
  enableIrrigationOptimizer: true,
  enableWeatherAnalytics: true,
  enablePestDiseaseManagement: true,
  enableCaching: true,
  enablePerformanceMonitoring: true,
  enableAnalytics: true,
};

// Environment-specific overrides
const environmentOverrides: Record<string, Partial<FeatureFlags>> = {
  development: {
    enableAdvancedDashboard: true,
    enableAIAnalytics: true,
    enableEnhancedAPIs: true,
  },
  production: {
    enablePerformanceMonitoring: true,
    enableCaching: true,
  },
  testing: {
    enableAnalytics: false,
    enablePerformanceMonitoring: false,
  },
};

// Get current environment
const getEnvironment = (): string => {
  return (import.meta.env.MODE as string) || 'development';
};

// Merge default flags with environment-specific overrides
const getFeatureFlags = (): FeatureFlags => {
  const env = getEnvironment();
  return {
    ...defaultFlags,
    ...(environmentOverrides[env] || {}),
  };
};

// Export singleton instance
export const featureFlags = getFeatureFlags();

// Helper functions for conditional rendering
export const shouldShowAdvancedDashboard = () => featureFlags.enableAdvancedDashboard;
export const shouldShowAIAnalytics = () => featureFlags.enableAIAnalytics;
export const shouldShowAnimalAnalytics = () => featureFlags.enableAnimalAnalytics;
export const shouldUseEnhancedAPIs = () => featureFlags.enableEnhancedAPIs;
export const shouldEnableAdvancedSearch = () => featureFlags.enableAdvancedSearch;
export const shouldEnablePredictiveAnalytics = () => featureFlags.enablePredictiveAnalytics;

export default featureFlags;
