const DEFAULT_RELATIVE_BASE = '/api';

const sanitizeBaseUrl = (value?: string | null): string => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return DEFAULT_RELATIVE_BASE;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      const normalizedPath =
        parsed.pathname.endsWith('/') && parsed.pathname !== '/'
          ? parsed.pathname.slice(0, -1)
          : parsed.pathname;
      return `${parsed.origin}${normalizedPath}`;
    } catch (error) {
      console.warn('Invalid VITE_API_BASE_URL provided, falling back to relative /api', error);
      return DEFAULT_RELATIVE_BASE;
    }
  }

  if (trimmed.startsWith('/')) {
    return trimmed.endsWith('/') && trimmed !== '/'
      ? trimmed.slice(0, -1)
      : trimmed || DEFAULT_RELATIVE_BASE;
  }

  console.warn('VITE_API_BASE_URL must be an absolute URL or start with /. Falling back to /api.');
  return DEFAULT_RELATIVE_BASE;
};

const resolvedBaseUrl = sanitizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

export const API_CONFIG = {
  baseUrl: resolvedBaseUrl,
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
    update: (id: string) => `/farms/${id}`,
    delete: (id: string) => `/farms/${id}`,
  },
  fields: {
    list: '/fields',
    details: (id: string) => `/fields/${id}`,
    create: '/fields',
    update: (id: string) => `/fields/${id}`,
    delete: (id: string) => `/fields/${id}`,
    soilAnalysis: '/fields/soil-analysis',
  },
  weather: {
    farm: '/weather/farm',
    impact: '/weather/impact-analysis',
    recommendations: '/weather/recommendations',
  },
  crops: {
    list: '/crops',
    details: (id: string) => `/crops/${id}`,
    create: '/crops',
    update: (id: string) => `/crops/${id}`,
    delete: (id: string) => `/crops/${id}`,
    history: '/crops/history',
    planning: '/crops/planning',
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
    details: (id: string) => `/inventory/${id}`,
    create: '/inventory',
    update: (id: string) => `/inventory/${id}`,
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
  animals: {
    list: '/livestock',
    details: (id: string) => `/livestock/${id}`,
    create: '/livestock',
    update: (id: string) => `/livestock/${id}`,
    delete: (id: string) => `/livestock/${id}`,
    analytics: '/livestock/stats',
    healthRecords: (animalId: string, recordId?: string) =>
      recordId
        ? `/livestock/${animalId}/health-records/${recordId}`
        : `/livestock/${animalId}/health-records`,
    production: (animalId: string, recordId?: string) =>
      recordId
        ? `/livestock/${animalId}/production/${recordId}`
        : `/livestock/${animalId}/production`,
    breeding: (animalId: string, recordId?: string) =>
      recordId ? `/livestock/${animalId}/breeding/${recordId}` : `/livestock/${animalId}/breeding`,
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
