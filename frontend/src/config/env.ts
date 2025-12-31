/**
 * ENVIRONMENT CONFIGURATION
 * =========================
 * Re-exports configuration from the unified API layer.
 * This file exists for backward compatibility.
 *
 * PREFER IMPORTING FROM: @/api or src/api
 */

import { z } from 'zod';

// Define environment schema with Zod for validation
const envSchema = z.object({
  // API Configuration
  VITE_API_BASE_URL: z.string().default(''),
  VITE_API_URL: z.string().optional(),
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

// Re-export from unified API config
export {
  ENDPOINTS as apiEndpoints,
  CACHE_CONFIG as cacheConfig,
  STORAGE_KEYS as storageKeys,
  FEATURES as features,
  API_CONFIG as apiConfig,
} from '../api/config';

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

export default {
  env,
  appConfig,
};
