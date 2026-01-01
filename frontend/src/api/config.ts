export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS) || 30000,
  retryAttempts: Number(import.meta.env.VITE_API_RETRY_ATTEMPTS) || 3,
};

export const STORAGE_KEYS = {
  authToken: 'auth_token',
  authUser: 'auth_user',
  theme: 'theme_preference',
  refresh: 'refresh_token',
  language: 'language',
  lastSync: 'last_sync_timestamp',
};

export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    me: '/auth/me',
    resetPassword: '/auth/reset-password',
    verifyEmail: '/auth/verify-email',
  },
  farms: {
    list: '/farms',
    details: (id: string) => `/farms/${id}`,
    create: '/farms',
    update: '/farms', // PUT /farms/:id usually, but let's stick to base
    delete: (id: string) => `/farms/${id}`,
  },
  fields: {
    list: '/fields',
    details: (id: string) => `/fields/${id}`,
    create: '/fields',
    update: '/fields',
    delete: (id: string) => `/fields/${id}`,
    soilAnalysis: '/fields/soil-analysis',
  },
  crops: {
    list: '/crops',
    create: '/crops',
    update: '/crops',
    delete: (id: string) => `/crops/${id}`,
    history: '/crops/history',
  },
  livestock: {
    list: '/livestock',
    create: '/livestock',
    update: '/livestock',
    delete: (id: string) => `/livestock/${id}`,
    history: '/livestock/history',
  },
  tasks: {
    list: '/tasks',
    create: '/tasks',
    update: '/tasks',
    delete: (id: string) => `/tasks/${id}`,
    complete: (id: string) => `/tasks/${id}/complete`,
  },
  inventory: {
    list: '/inventory',
    create: '/inventory',
    update: '/inventory',
    delete: (id: string) => `/inventory/${id}`,
    alerts: '/inventory/alerts',
  },
  finance: {
    list: '/finance',
    create: '/finance',
    update: '/finance',
    delete: (id: string) => `/finance/${id}`,
    report: '/finance/report',
    stats: '/finance/stats',
  },
};

export const CACHE_CONFIG = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxEntries: 100,
};

export const FEATURES = {
  enableAnalytics: true,
  enableOfflineMode: false,
  enablePushNotifications: false,
};
