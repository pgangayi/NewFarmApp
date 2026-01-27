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
    byFarm: (farm_id: string) => [...QUERY_KEYS.animals.all, 'farm', farm_id] as const,
  },

  // Crop keys
  crops: {
    all: ['crops'] as const,
    lists: () => [...QUERY_KEYS.crops.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...QUERY_KEYS.crops.lists(), filters] as const,
    details: () => [...QUERY_KEYS.crops.all, 'detail'] as const,
    detail: (id: string) => [...QUERY_KEYS.crops.details(), id] as const,
    byFarm: (farm_id: string) => [...QUERY_KEYS.crops.all, 'farm', farm_id] as const,
    stats: () => [...QUERY_KEYS.crops.all, 'stats'] as const,
  },

  // Task keys
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...QUERY_KEYS.tasks.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...QUERY_KEYS.tasks.lists(), filters] as const,
    details: () => [...QUERY_KEYS.tasks.all, 'detail'] as const,
    detail: (id: string) => [...QUERY_KEYS.tasks.details(), id] as const,
    byFarm: (farm_id: string) => [...QUERY_KEYS.tasks.all, 'farm', farm_id] as const,
  },

  // Inventory keys
  inventory: {
    all: ['inventory'] as const,
    lists: () => [...QUERY_KEYS.inventory.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...QUERY_KEYS.inventory.lists(), filters] as const,
    details: () => [...QUERY_KEYS.inventory.all, 'detail'] as const,
    detail: (id: string) => [...QUERY_KEYS.inventory.details(), id] as const,
    byFarm: (farm_id: string) => [...QUERY_KEYS.inventory.all, 'farm', farm_id] as const,
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
    byFarm: (farm_id: string) => [...QUERY_KEYS.locations.all, 'farm', farm_id] as const,
  },

  // Finance keys
  finance: {
    all: ['finance'] as const,
    lists: () => [...QUERY_KEYS.finance.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...QUERY_KEYS.finance.lists(), filters] as const,
    details: () => [...QUERY_KEYS.finance.all, 'detail'] as const,
    detail: (id: string) => [...QUERY_KEYS.finance.details(), id] as const,
    summary: (farm_id?: string) =>
      farm_id
        ? [...QUERY_KEYS.finance.all, 'summary', farm_id]
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
  farms: (() => {
    const base = '/api/farms';
    return {
      base,
      list: base,
      detail: (id: string) => `${base}/${id}`,
      create: base,
      update: (id: string) => `${base}/${id}`,
      delete: (id: string) => `${base}/${id}`,
    };
  })(),
  animals: (() => {
    const base = '/api/animals';
    return {
      base,
      list: base,
      detail: (id: string) => `${base}/${id}`,
      create: base,
      update: (id: string) => `${base}/${id}`,
      delete: (id: string) => `${base}/${id}`,
    };
  })(),
  crops: (() => {
    const base = '/api/crops';
    return {
      base,
      list: base,
      detail: (id: string) => `${base}/${id}`,
      create: base,
      update: (id: string) => `${base}/${id}`,
      delete: (id: string) => `${base}/${id}`,
    };
  })(),
  tasks: (() => {
    const base = '/api/tasks';
    return {
      base,
      list: base,
      detail: (id: string) => `${base}/${id}`,
      create: base,
      update: (id: string) => `${base}/${id}`,
      delete: (id: string) => `${base}/${id}`,
    };
  })(),
  inventory: (() => {
    const base = '/api/inventory';
    return {
      base,
      list: base,
      detail: (id: string) => `${base}/${id}`,
      create: base,
      update: (id: string) => `${base}/${id}`,
      delete: (id: string) => `${base}/${id}`,
      lowStock: `${base}/low-stock`,
      alerts: `${base}/alerts`,
    };
  })(),
  locations: (() => {
    const base = '/api/locations';
    return {
      base,
      list: base,
      detail: (id: string) => `${base}/${id}`,
      create: base,
      update: (id: string) => `${base}/${id}`,
      delete: (id: string) => `${base}/${id}`,
    };
  })(),
  finance: (() => {
    const base = '/api/finance-enhanced';
    return {
      base,
      list: base,
      detail: (id: string) => `${base}/${id}`,
      create: base,
      update: (id: string) => `${base}/${id}`,
      delete: (id: string) => `${base}/${id}`,
      summary: `${base}/summary`,
      budgets: `${base}/budgets`,
      reports: `${base}/reports`,
      analytics: `${base}/analytics`,
    };
  })(),
} as const;
