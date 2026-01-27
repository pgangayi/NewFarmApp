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
  farms: (() => {
    const base = '/farms';
    return {
      list: base,
      details: (id: string) => `${base}/${id}`,
      create: base,
      update: (id: string) => `${base}/${id}`,
      delete: (id: string) => `${base}/${id}`,
    };
  })(),
  fields: (() => {
    const base = '/fields';
    return {
      list: base,
      details: (id: string) => `${base}/${id}`,
      create: base,
      update: (id: string) => `${base}/${id}`,
      delete: (id: string) => `${base}/${id}`,
      soilAnalysis: `${base}/soil-analysis`,
    };
  })(),
  weather: {
    farm: '/weather/farm',
    impact: '/weather/impact-analysis',
    recommendations: '/weather/recommendations',
  },
  crops: (() => {
    const base = '/crops';
    return {
      list: base,
      details: (id: string) => `${base}/${id}`,
      create: base,
      update: (id: string) => `${base}/${id}`,
      delete: (id: string) => `${base}/${id}`,
      history: `${base}/history`,
      planning: `${base}/planning`,
    };
  })(),
  livestock: (() => {
    const base = '/livestock';
    return {
      list: base,
      create: base,
      update: base,
      delete: (id: string) => `${base}/${id}`,
      history: `${base}/history`,
    };
  })(),
  tasks: (() => {
    const base = '/tasks';
    return {
      list: base,
      create: base,
      update: base,
      delete: (id: string) => `${base}/${id}`,
      complete: (id: string) => `${base}/${id}/complete`,
    };
  })(),
  inventory: (() => {
    const base = '/inventory';
    return {
      list: base,
      details: (id: string) => `${base}/${id}`,
      create: base,
      update: (id: string) => `${base}/${id}`,
      delete: (id: string) => `${base}/${id}`,
      alerts: `${base}/alerts`,
    };
  })(),
  finance: (() => {
    const base = '/finance';
    return {
      list: base,
      create: base,
      update: base,
      delete: (id: string) => `${base}/${id}`,
      report: `${base}/report`,
      stats: `${base}/stats`,
    };
  })(),
  animals: (() => {
    const base = '/livestock';
    return {
      list: base,
      details: (id: string) => `${base}/${id}`,
      create: base,
      update: (id: string) => `${base}/${id}`,
      delete: (id: string) => `${base}/${id}`,
      analytics: `${base}/stats`,
      healthRecords: (animalId: string, recordId?: string) =>
        recordId
          ? `${base}/${animalId}/health-records/${recordId}`
          : `${base}/${animalId}/health-records`,
      production: (animalId: string, recordId?: string) =>
        recordId ? `${base}/${animalId}/production/${recordId}` : `${base}/${animalId}/production`,
      breeding: (animalId: string, recordId?: string) =>
        recordId ? `${base}/${animalId}/breeding/${recordId}` : `${base}/${animalId}/breeding`,
    };
  })(),
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
