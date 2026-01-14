// Unified Configuration System
// Centralized configuration management for the entire application

import { featureFlags } from './featureFlags';

const DEFAULT_API_URL = '/';

export interface AppConfig {
  // App Information
  appName: string;
  appVersion: string;
  environment: string;

  // API Configuration
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    enableCaching: boolean;
  };

  // UI Configuration
  ui: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
    dateFormat: string;
    currency: string;
  };

  // Performance Configuration
  performance: {
    enablePerformanceMonitoring: boolean;
    enableAnalytics: boolean;
    cacheTimeout: number;
    maxConcurrentRequests: number;
  };

  // Feature Flags
  features: typeof featureFlags;

  // Development Configuration
  development: {
    enableDebugMode: boolean;
    enableHotReload: boolean;
    enableMockData: boolean;
  };
}

const createAppConfig = (): AppConfig => {
  const environment = import.meta.env.MODE || 'development';
  const isDevelopment = environment === 'development';
  const isProduction = environment === 'production';
  const isTesting = environment === 'testing';

  return {
    // App Information
    appName: 'Farmers Boot',
    appVersion: '1.0.0',
    environment,

    // API Configuration
    api: {
      baseUrl: import.meta.env.VITE_API_BASE_URL || DEFAULT_API_URL,
      timeout: isDevelopment ? 30000 : 45000,
      retryAttempts: isDevelopment ? 3 : 5,
      enableCaching: !isTesting,
    },

    // UI Configuration
    ui: {
      theme: (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system',
      language: localStorage.getItem('language') || 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      dateFormat: 'YYYY-MM-DD',
      currency: 'USD',
    },

    // Performance Configuration
    performance: {
      enablePerformanceMonitoring: featureFlags.enablePerformanceMonitoring && !isTesting,
      enableAnalytics: featureFlags.enableAnalytics && !isTesting,
      cacheTimeout: isDevelopment ? 300000 : 900000, // 5min dev, 15min prod
      maxConcurrentRequests: 5,
    },

    // Feature Flags
    features: featureFlags,

    // Development Configuration
    development: {
      enableDebugMode: isDevelopment,
      enableHotReload: isDevelopment,
      enableMockData: isDevelopment && false, // Disabled for clean code
    },
  };
};

// Environment-specific overrides
const environmentOverrides: Record<string, Partial<AppConfig>> = {
  development: {
    api: {
      baseUrl: DEFAULT_API_URL,
      timeout: 30000,
      retryAttempts: 3,
      enableCaching: true,
    },
    performance: {
      enablePerformanceMonitoring: true,
      enableAnalytics: true,
      cacheTimeout: 300000,
      maxConcurrentRequests: 10,
    },
  },

  production: {
    api: {
      baseUrl: 'https://api.farmersboot.com',
      timeout: 45000,
      retryAttempts: 5,
      enableCaching: true,
    },
    performance: {
      enablePerformanceMonitoring: true,
      enableAnalytics: true,
      cacheTimeout: 900000,
      maxConcurrentRequests: 5,
    },
  },

  testing: {
    api: {
      baseUrl: DEFAULT_API_URL,
      timeout: 10000,
      retryAttempts: 1,
      enableCaching: false,
    },
    performance: {
      enablePerformanceMonitoring: false,
      enableAnalytics: false,
      cacheTimeout: 0,
      maxConcurrentRequests: 2,
    },
  },
};

// Merge base config with environment-specific overrides
const mergeConfigs = (base: AppConfig, override: Partial<AppConfig>): AppConfig => {
  const merged = { ...base } as Record<string, unknown>;

  for (const key in override) {
    const overrideValue = override[key as keyof AppConfig];
    if (
      typeof overrideValue === 'object' &&
      overrideValue !== null &&
      !Array.isArray(overrideValue)
    ) {
      merged[key] = {
        ...((merged[key] as Record<string, unknown>) || {}),
        ...overrideValue,
      };
    } else {
      merged[key] = overrideValue;
    }
  }

  return merged as unknown as AppConfig;
};

// Configuration storage with localStorage persistence
class ConfigManager {
  private config: AppConfig;
  private subscribers: Set<(config: AppConfig) => void> = new Set();

  constructor() {
    const environment = import.meta.env.MODE || 'development';
    const baseConfig = createAppConfig();
    const override = environmentOverrides[environment] || {};

    this.config = mergeConfigs(baseConfig, override);
    this.loadPersistedValues();
  }

  private loadPersistedValues(): void {
    // Load persisted UI settings
    const theme = localStorage.getItem('theme');
    if (theme && ['light', 'dark', 'system'].includes(theme)) {
      this.config.ui.theme = theme as 'light' | 'dark' | 'system';
    }

    const language = localStorage.getItem('language');
    if (language) {
      this.config.ui.language = language;
    }
  }

  getConfig(): AppConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<AppConfig>): void {
    this.config = mergeConfigs(this.config, updates);
    this.notifySubscribers();
    this.persistValues();
  }

  updateUISettings(settings: Partial<AppConfig['ui']>): void {
    this.config.ui = { ...this.config.ui, ...settings };
    this.notifySubscribers();
    this.persistValues();
  }

  private persistValues(): void {
    localStorage.setItem('theme', this.config.ui.theme);
    localStorage.setItem('language', this.config.ui.language);
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(subscriber => {
      subscriber(this.config);
    });
  }

  subscribe(subscriber: (config: AppConfig) => void): () => void {
    this.subscribers.add(subscriber);
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  // Helper methods
  isDevelopment(): boolean {
    return this.config.environment === 'development';
  }

  isProduction(): boolean {
    return this.config.environment === 'production';
  }

  isTesting(): boolean {
    return this.config.environment === 'testing';
  }

  getApiUrl(endpoint: string): string {
    const baseUrl = this.config.api.baseUrl;
    return endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
  }

  isFeatureEnabled(featureFlag: keyof typeof featureFlags): boolean {
    return this.config.features[featureFlag];
  }
}

// Export singleton instance
export const config = new ConfigManager();

// Configuration helpers
export const getConfig = () => config.getConfig();
export const updateConfig = (updates: Partial<AppConfig>) => config.updateConfig(updates);
export const updateUI = (settings: Partial<AppConfig['ui']>) => config.updateUISettings(settings);
export const isFeatureEnabled = (flag: keyof typeof featureFlags) => config.isFeatureEnabled(flag);

export const api = {
  getUrl: (endpoint: string) => config.getApiUrl(endpoint),
  getTimeout: () => getConfig().api.timeout,
  getRetryAttempts: () => getConfig().api.retryAttempts,
  shouldUseCaching: () => getConfig().api.enableCaching,
};

export const ui = {
  getTheme: () => getConfig().ui.theme,
  getLanguage: () => getConfig().ui.language,
  getTimezone: () => getConfig().ui.timezone,
  getDateFormat: () => getConfig().ui.dateFormat,
  getCurrency: () => getConfig().ui.currency,
};

export const performance = {
  shouldMonitor: () => getConfig().performance.enablePerformanceMonitoring,
  shouldTrackAnalytics: () => getConfig().performance.enableAnalytics,
  getCacheTimeout: () => getConfig().performance.cacheTimeout,
  getMaxConcurrentRequests: () => getConfig().performance.maxConcurrentRequests,
};

export const development = {
  shouldDebug: () => getConfig().development.enableDebugMode,
  shouldHotReload: () => getConfig().development.enableHotReload,
  shouldUseMockData: () => getConfig().development.enableMockData,
};

export default config;
