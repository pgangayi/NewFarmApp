/**
 * API CONSTANTS
 * =============
 * Configuration constants for API caching and query keys
 */

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

export const CACHE_CONFIG = {
  // Stale time: how long data is considered fresh (ms)
  staleTime: {
    default: 5 * 60 * 1000, // 5 minutes
    farms: 10 * 60 * 1000, // 10 minutes (farms change less frequently)
    animals: 5 * 60 * 1000, // 5 minutes
    crops: 5 * 60 * 1000, // 5 minutes
    tasks: 2 * 60 * 1000, // 2 minutes (tasks change more frequently)
    inventory: 3 * 60 * 1000, // 3 minutes
    finance: 10 * 60 * 1000, // 10 minutes
    locations: 10 * 60 * 1000, // 10 minutes
  },

  // GC time: how long to keep inactive data in cache (ms)
  gcTime: {
    default: 30 * 60 * 1000, // 30 minutes
    longLived: 60 * 60 * 1000, // 1 hour
  },

  // Retry configuration
  retry: {
    attempts: 3,
    delay: 1000, // ms
  },
} as const;

// ============================================================================
// QUERY KEY FACTORIES
// ============================================================================

export const QUERY_KEYS = {
  // Farm keys
  farms: {
    all: ['farms'] as const,
    lists: () => [...QUERY_KEYS.farms.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...QUERY_KEYS.farms.lists(), filters] as const,
    details: () => [...QUERY_KEYS.farms.all, 'detail'] as const,
    detail: (id: string) => [...QUERY_KEYS.farms.details(), id] as const,
  },

  // Animal/Livestock keys
  animals: {
    all: ['animals'] as const,
    lists: () => [...QUERY_KEYS.animals.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...QUERY_KEYS.animals.lists(), filters] as const,
    details: () => [...QUERY_KEYS.animals.all, 'detail'] as const,
    detail: (id: string) => [...QUERY_KEYS.animals.details(), id] as const,
    byFarm: (farmId: string) => [...QUERY_KEYS.animals.all, 'farm', farmId] as const,
  },

  // Crop keys
  crops: {
    all: ['crops'] as const,
    lists: () => [...QUERY_KEYS.crops.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...QUERY_KEYS.crops.lists(), filters] as const,
    details: () => [...QUERY_KEYS.crops.all, 'detail'] as const,
    detail: (id: string) => [...QUERY_KEYS.crops.details(), id] as const,
    byFarm: (farmId: string) => [...QUERY_KEYS.crops.all, 'farm', farmId] as const,
    stats: () => [...QUERY_KEYS.crops.all, 'stats'] as const,
  },

  // Task keys
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...QUERY_KEYS.tasks.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...QUERY_KEYS.tasks.lists(), filters] as const,
    details: () => [...QUERY_KEYS.tasks.all, 'detail'] as const,
    detail: (id: string) => [...QUERY_KEYS.tasks.details(), id] as const,
    byFarm: (farmId: string) => [...QUERY_KEYS.tasks.all, 'farm', farmId] as const,
  },

  // Inventory keys
  inventory: {
    all: ['inventory'] as const,
    lists: () => [...QUERY_KEYS.inventory.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...QUERY_KEYS.inventory.lists(), filters] as const,
    details: () => [...QUERY_KEYS.inventory.all, 'detail'] as const,
    detail: (id: string) => [...QUERY_KEYS.inventory.details(), id] as const,
    byFarm: (farmId: string) => [...QUERY_KEYS.inventory.all, 'farm', farmId] as const,
    lowStock: () => [...QUERY_KEYS.inventory.all, 'lowStock'] as const,
    alerts: () => [...QUERY_KEYS.inventory.all, 'alerts'] as const,
  },

  // Location keys
  locations: {
    all: ['locations'] as const,
    lists: () => [...QUERY_KEYS.locations.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...QUERY_KEYS.locations.lists(), filters] as const,
    details: () => [...QUERY_KEYS.locations.all, 'detail'] as const,
    detail: (id: string) => [...QUERY_KEYS.locations.details(), id] as const,
    byFarm: (farmId: string) => [...QUERY_KEYS.locations.all, 'farm', farmId] as const,
  },

  // Finance keys
  finance: {
    all: ['finance'] as const,
    lists: () => [...QUERY_KEYS.finance.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...QUERY_KEYS.finance.lists(), filters] as const,
    details: () => [...QUERY_KEYS.finance.all, 'detail'] as const,
    detail: (id: string) => [...QUERY_KEYS.finance.details(), id] as const,
    summary: (farmId?: string) =>
      farmId
        ? [...QUERY_KEYS.finance.all, 'summary', farmId]
        : ([...QUERY_KEYS.finance.all, 'summary'] as const),
  },

  // Specialized feature keys
  strains: {
    all: ['strains'] as const,
  },

  breeds: {
    all: ['breeds'] as const,
  },
} as const;

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    signup: '/api/auth/signup',
    logout: '/api/auth/logout',
    validate: '/api/auth/validate',
    me: '/api/auth/me',
  },
  farms: {
    base: '/api/farms',
    list: '/api/farms',
    detail: (id: string) => `/api/farms/${id}`,
    create: '/api/farms',
    update: (id: string) => `/api/farms/${id}`,
    delete: (id: string) => `/api/farms/${id}`,
  },
  animals: {
    base: '/api/animals',
    list: '/api/animals',
    detail: (id: string) => `/api/animals/${id}`,
    create: '/api/animals',
    update: (id: string) => `/api/animals/${id}`,
    delete: (id: string) => `/api/animals/${id}`,
  },
  crops: {
    base: '/api/crops',
    list: '/api/crops',
    detail: (id: string) => `/api/crops/${id}`,
    create: '/api/crops',
    update: (id: string) => `/api/crops/${id}`,
    delete: (id: string) => `/api/crops/${id}`,
  },
  tasks: {
    base: '/api/tasks',
    list: '/api/tasks',
    detail: (id: string) => `/api/tasks/${id}`,
    create: '/api/tasks',
    update: (id: string) => `/api/tasks/${id}`,
    delete: (id: string) => `/api/tasks/${id}`,
  },
  inventory: {
    base: '/api/inventory',
    list: '/api/inventory',
    detail: (id: string) => `/api/inventory/${id}`,
    create: '/api/inventory',
    update: (id: string) => `/api/inventory/${id}`,
    delete: (id: string) => `/api/inventory/${id}`,
    lowStock: '/api/inventory/low-stock',
    alerts: '/api/inventory/alerts',
  },
  locations: {
    base: '/api/locations',
    list: '/api/locations',
    detail: (id: string) => `/api/locations/${id}`,
    create: '/api/locations',
    update: (id: string) => `/api/locations/${id}`,
    delete: (id: string) => `/api/locations/${id}`,
  },
  finance: {
    base: '/api/finance',
    list: '/api/finance',
    detail: (id: string) => `/api/finance/${id}`,
    create: '/api/finance',
    update: (id: string) => `/api/finance/${id}`,
    delete: (id: string) => `/api/finance/${id}`,
    summary: '/api/finance/summary',
  },
} as const;
