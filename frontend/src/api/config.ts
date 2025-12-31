/**
 * API CONFIGURATION
 * =================
 * Single source of truth for all API configuration:
 * - Base URL
 * - API Mode (local/remote/hybrid)
 * - All endpoint definitions
 * - Storage keys
 * - Cache configuration
 */

// ============================================================================
// ENVIRONMENT & MODE
// ============================================================================

export type ApiMode = 'local' | 'remote' | 'hybrid';

let currentApiMode: ApiMode = 'local'; // Default to local-first

/**
 * Get base URL based on environment
 */
const getBaseUrl = (): string => {
  // Check environment variables
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim();
  }

  // Development default
  if (import.meta.env.DEV) {
    return 'http://localhost:8787';
  }

  // Production - same origin or empty
  return '';
};

export const API_BASE_URL = getBaseUrl();

/**
 * Get/Set API mode
 */
export function getApiMode(): ApiMode {
  return currentApiMode;
}

export function setApiMode(mode: ApiMode): void {
  currentApiMode = mode;
  if (import.meta.env.DEV) {
    console.log(`[API] Mode set to: ${mode}`);
  }
}

export function shouldUseLocalStorage(): boolean {
  return currentApiMode === 'local' || currentApiMode === 'hybrid';
}

export function shouldUseRemoteApi(): boolean {
  return currentApiMode === 'remote' || currentApiMode === 'hybrid';
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const ENDPOINTS = {
  // ---- Authentication ----
  auth: {
    login: '/api/auth/login',
    signup: '/api/auth/signup',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
    me: '/api/auth/me',
    forgotPassword: '/api/auth/forgot-password',
    resetPassword: '/api/auth/reset-password',
  },

  // ---- Health ----
  health: '/api/health',

  // ---- Farms ----
  farms: {
    list: '/api/farms',
    create: '/api/farms',
    get: (id: string) => `/api/farms/${id}`,
    update: (id: string) => `/api/farms/${id}`,
    delete: (id: string) => `/api/farms/${id}`,
  },

  // ---- Locations ----
  locations: {
    list: '/api/locations',
    create: '/api/locations',
    get: (id: string) => `/api/locations/${id}`,
    update: (id: string) => `/api/locations/${id}`,
    delete: (id: string) => `/api/locations/${id}`,
  },

  // ---- Fields ----
  fields: {
    list: '/api/fields',
    create: '/api/fields',
    get: (id: string) => `/api/fields/${id}`,
    update: (id: string) => `/api/fields/${id}`,
    delete: (id: string) => `/api/fields/${id}`,
    soilAnalysis: '/api/fields/soil-analysis',
    equipment: '/api/fields/equipment',
  },

  // ---- Livestock (formerly Animals) ----
  livestock: {
    list: '/api/livestock',
    create: '/api/livestock',
    get: (id: string) => `/api/livestock/${id}`,
    update: (id: string) => `/api/livestock/${id}`,
    delete: (id: string) => `/api/livestock/${id}`,
    // Stats & Analytics
    stats: '/api/livestock/stats',
    analytics: '/api/livestock/analytics',
    // Sub-resources
    pedigree: (id: string) => `/api/livestock/${id}/pedigree`,
    movements: (id: string) => `/api/livestock/${id}/movements`,
    health: (id: string) => `/api/livestock/${id}/health`,
    healthRecords: (id: string, recordId?: string) =>
      recordId
        ? `/api/livestock/${id}/health-records/${recordId}`
        : `/api/livestock/${id}/health-records`,
    production: (id: string, recordId?: string) =>
      recordId ? `/api/livestock/${id}/production/${recordId}` : `/api/livestock/${id}/production`,
    breeding: (id: string, recordId?: string) =>
      recordId ? `/api/livestock/${id}/breeding/${recordId}` : `/api/livestock/${id}/breeding`,
  },

  // ---- Knowledge Base & Reference ----
  reference: {
    breeds: '/api/reference/breeds',
    strains: '/api/reference/strains',
    feed: '/api/reference/feed',
    chemicals: '/api/reference/chemicals',
    diseases: '/api/reference/diseases',
    treatments: '/api/reference/treatments',
    growthStandards: '/api/reference/growth-standards',
    plantingGuides: '/api/reference/planting-guides',
    pestIdentifiers: '/api/reference/pest-identifiers',
  },

  // ---- Crops ----
  crops: {
    list: '/api/crops',
    create: '/api/crops',
    get: (id: string) => `/api/crops/${id}`,
    update: (id: string) => `/api/crops/${id}`,
    delete: (id: string) => `/api/crops/${id}`,
    planning: '/api/crops/planning',
    activities: {
      list: '/api/crop-activities',
      create: '/api/crop-activities',
      get: (id: string) => `/api/crop-activities/${id}`,
      update: (id: string) => `/api/crop-activities/${id}`,
      delete: (id: string) => `/api/crop-activities/${id}`,
    },
    observations: {
      list: '/api/crop-observations',
      create: '/api/crop-observations',
      get: (id: string) => `/api/crop-observations/${id}`,
      update: (id: string) => `/api/crop-observations/${id}`,
      delete: (id: string) => `/api/crop-observations/${id}`,
    },
    yields: {
      list: '/api/crop-yields',
      create: '/api/crop-yields',
      get: (id: string) => `/api/crop-yields/${id}`,
      update: (id: string) => `/api/crop-yields/${id}`,
      delete: (id: string) => `/api/crop-yields/${id}`,
    },
  },

  // ---- Tasks ----
  tasks: {
    list: '/api/tasks-enhanced',
    create: '/api/tasks-enhanced',
    get: (id: string) => `/api/tasks-enhanced/${id}`,
    update: (id: string) => `/api/tasks-enhanced/${id}`,
    delete: (id: string) => `/api/tasks-enhanced/${id}`,
  },

  // ---- Finance ----
  finance: {
    list: '/api/finance-enhanced',
    create: '/api/finance-enhanced',
    get: (id: string) => `/api/finance-enhanced/${id}`,
    update: (id: string) => `/api/finance-enhanced/${id}`,
    delete: (id: string) => `/api/finance-enhanced/${id}`,
    summary: '/api/finance-enhanced/summary',
    reports: (type: string) => `/api/finance-enhanced/reports/${type}`,
  },

  // ---- Inventory ----
  inventory: {
    list: '/api/inventory-enhanced',
    create: '/api/inventory-enhanced',
    get: (id: string) => `/api/inventory-enhanced/${id}`,
    update: (id: string) => `/api/inventory-enhanced/${id}`,
    delete: (id: string) => `/api/inventory-enhanced/${id}`,
    lowStock: '/api/inventory-enhanced?low_stock=true',
    alerts: '/api/inventory/alerts',
  },

  // ---- Operations ----
  operations: {
    applyTreatment: '/api/operations/apply-treatment',
  },

  // ---- Analytics ----
  analytics: {
    dashboard: '/api/analytics',
    engine: '/api/analytics-engine',
  },
} as const;

// ============================================================================
// STORAGE KEYS (for localStorage)
// ============================================================================

export const STORAGE_KEYS = {
  // Auth
  authToken: 'auth_token',
  authUser: 'auth_user',

  // App State
  theme: 'app_theme',
  currentFarmId: 'app_current_farm_id',

  // Offline/Sync
  offlineQueue: 'app_offline_queue',
  lastSync: 'app_last_sync',

  // Local-first data
  // Local-first data
  farms: 'app_farms',
  livestock: 'app_livestock',
  animals: 'app_livestock', // Legacy alias
  crops: 'app_crops',
  tasks: 'app_tasks',
  locations: 'app_locations',
  fields: 'app_fields',
  finance: 'app_finance',
  inventory: 'app_inventory',
  // Reference Data
  reference: 'app_reference',
} as const;

// ============================================================================
// CACHE CONFIGURATION (React Query)
// ============================================================================

export const CACHE_CONFIG = {
  staleTime: {
    short: 1000 * 60 * 5, // 5 minutes
    medium: 1000 * 60 * 30, // 30 minutes
    long: 1000 * 60 * 60, // 1 hour
  },
  gcTime: {
    short: 1000 * 60 * 10, // 10 minutes
    medium: 1000 * 60 * 60, // 1 hour
    long: 1000 * 60 * 60 * 24, // 24 hours
  },
  retry: {
    count: 3,
    delay: (attempt: number) => Math.min(1000 * 2 ** attempt, 30000),
  },
} as const;

// ============================================================================
// API CLIENT CONFIG
// ============================================================================

export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  timeout: 30000,
  retryAttempts: 3,
} as const;

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const FEATURES = {
  offlineMode: true,
  localFirst: true,
  mapbox: !!import.meta.env.VITE_MAPBOX_TOKEN,
  sentry: !!import.meta.env.VITE_SENTRY_DSN,
  analytics: true,
  pwa: true,
} as const;

// ============================================================================
// LEGACY EXPORT (for backward compatibility with old apiEndpoints)
// ============================================================================

export const apiEndpoints = ENDPOINTS;
export const cacheConfig = CACHE_CONFIG;
export const storageKeys = STORAGE_KEYS;
