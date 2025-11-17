/**
 * Centralized environment configuration with runtime validation
 */

import { z } from 'zod';

// Define environment schema with Zod for validation
const envSchema = z.object({
  // API Configuration
  VITE_API_BASE_URL: z.string().default(''),
  VITE_API_TIMEOUT_MS: z.string().transform(Number).default('30000'),
  VITE_API_RETRY_ATTEMPTS: z.string().transform(Number).default('3'),

  // Third-party Services (Optional)
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_MAPBOX_TOKEN: z.string().optional(),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  VITE_APP_VERSION: z.string().default('0.1.0'),
});

/**
 * Parsed and validated environment variables
 */
export const env = envSchema.parse(import.meta.env);

/**
 * Centralized API endpoints
 * Single source of truth for all API routes
 */
export const apiEndpoints = {
  // Auth endpoints
  auth: {
    login: '/api/auth/login',
    signup: '/api/auth/signup',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
    me: '/api/auth/me',
  },

  // Farm endpoints
  farms: {
    list: '/api/farms',
    create: '/api/farms',
    get: (id: string) => `/api/farms/${id}`,
    update: (id: string) => `/api/farms/${id}`,
    delete: (id: string) => `/api/farms/${id}`,
  },

  // Field endpoints
  fields: {
    list: '/api/fields',
    create: '/api/fields',
    get: (id: string) => `/api/fields?id=${id}`,
    update: '/api/fields',
    delete: (id: string) => `/api/fields?id=${id}`,
    soilAnalysis: '/api/fields/soil-analysis',
    equipment: '/api/fields/equipment',
  },

  // Inventory endpoints
  inventory: {
    list: '/api/inventory-enhanced',
    create: '/api/inventory-enhanced',
    update: '/api/inventory-enhanced',
    delete: (id: string) => `/api/inventory-enhanced?id=${id}`,
    lowStock: '/api/inventory-enhanced?low_stock=true',
    alerts: '/api/inventory/alerts',
  },

  // Crop endpoints
  crops: {
    list: '/api/crops',
    create: '/api/crops',
    get: (id: string) => `/api/crops/${id}`,
    update: (id: string) => `/api/crops/${id}`,
    delete: (id: string) => `/api/crops/${id}`,
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
    planning: '/api/crops/planning',
  },

  // Animal endpoints
  animals: {
    list: '/api/livestock',
    create: '/api/livestock',
    get: (id: string) => `/api/livestock/${id}`,
    update: (id: string) => `/api/livestock/${id}`,
    delete: (id: string) => `/api/livestock/${id}`,
    stats: '/api/livestock/stats',
    pedigree: (id: string) => `/api/livestock/${id}/pedigree`,
    movements: (id: string) => `/api/livestock/${id}/movements`,
  },

  // Task endpoints
  tasks: {
    list: '/api/tasks',
    create: '/api/tasks',
    get: (id: string) => `/api/tasks/${id}`,
    update: (id: string) => `/api/tasks/${id}`,
    delete: (id: string) => `/api/tasks/${id}`,
  },

  // Finance endpoints
  finance: {
    entries: '/api/finance-enhanced',
    reports: (type: string) => `/api/finance-enhanced/reports/${type}`,
  },

  // Operations endpoints
  operations: {
    applyTreatment: '/api/operations/apply-treatment-cloudflare',
  },
} as const;

/**
 * Feature flags for conditional feature availability
 */
export const features = {
  offlineMode: true,
  mapbox: !!env.VITE_MAPBOX_TOKEN,
  sentry: !!env.VITE_SENTRY_DSN,
  analytics: true,
  PWA: true,
} as const;

/**
 * Application configuration
 */
export const appConfig = {
  name: 'Farmers Boot',
  version: env.VITE_APP_VERSION,
  environment: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
} as const;

/**
 * API client configuration
 */
export const apiConfig = {
  baseUrl: env.VITE_API_BASE_URL,
  timeout: env.VITE_API_TIMEOUT_MS,
  retryAttempts: env.VITE_API_RETRY_ATTEMPTS,
} as const;

/**
 * Cache configuration (for React Query)
 */
export const cacheConfig = {
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
} as const;

/**
 * Storage keys for localStorage
 */
export const storageKeys = {
  theme: 'app:theme',
  auth: 'app:auth',
  farmId: 'app:farmId',
  offlineQueue: 'app:offlineQueue',
  lastSync: 'app:lastSync',
} as const;

export default {
  env,
  apiEndpoints,
  features,
  appConfig,
  apiConfig,
  cacheConfig,
  storageKeys,
};
