import { useState, useEffect, useCallback } from 'react';

type Theme =
  | 'light'
  | 'dark'
  | 'system'
  | 'spring'
  | 'summer'
  | 'autumn'
  | 'winter'
  | 'high-contrast';
type ThemeMode = 'automatic' | 'manual';

interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

const themeConfigs: Record<Theme, ThemeConfig> = {
  light: {
    primary: '#3b82f6',
    secondary: '#6b7280',
    accent: '#8b5cf6',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1f2937',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
  },
  dark: {
    primary: '#60a5fa',
    secondary: '#9ca3af',
    accent: '#a78bfa',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f8fafc',
    textSecondary: '#cbd5e1',
    border: '#334155',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#22d3ee',
  },
  spring: {
    primary: '#10b981',
    secondary: '#84cc16',
    accent: '#06b6d4',
    background: '#f0fdf4',
    surface: '#dcfce7',
    text: '#14532d',
    textSecondary: '#166534',
    border: '#bbf7d0',
    success: '#22c55e',
    warning: '#eab308',
    error: '#ef4444',
    info: '#06b6d4',
  },
  summer: {
    primary: '#f59e0b',
    secondary: '#ea580c',
    accent: '#dc2626',
    background: '#fffbeb',
    surface: '#fef3c7',
    text: '#78350f',
    textSecondary: '#92400e',
    border: '#fde68a',
    success: '#16a34a',
    warning: '#f59e0b',
    error: '#dc2626',
    info: '#0891b2',
  },
  autumn: {
    primary: '#ea580c',
    secondary: '#c2410c',
    accent: '#b91c1c',
    background: '#fef2f2',
    surface: '#fee2e2',
    text: '#7c2d12',
    textSecondary: '#9a3412',
    border: '#fca5a5',
    success: '#15803d',
    warning: '#d97706',
    error: '#b91c1c',
    info: '#0c4a6e',
  },
  winter: {
    primary: '#0284c7',
    secondary: '#6366f1',
    accent: '#7c3aed',
    background: '#f8fafc',
    surface: '#e2e8f0',
    text: '#0f172a',
    textSecondary: '#1e293b',
    border: '#cbd5e1',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    info: '#0284c7',
  },
  'high-contrast': {
    primary: '#0000ff',
    secondary: '#000000',
    accent: '#ff00ff',
    background: '#ffffff',
    surface: '#f0f0f0',
    text: '#000000',
    textSecondary: '#333333',
    border: '#000000',
    success: '#008000',
    warning: '#ff8c00',
    error: '#ff0000',
    info: '#0000ff',
  },
  system: {
    primary: '#3b82f6',
    secondary: '#6b7280',
    accent: '#8b5cf6',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1f2937',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
  },
};

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme;
    return stored || 'system';
  });

  const [mode, setMode] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('theme-mode') as ThemeMode;
    return stored || 'automatic';
  });

  const getCurrentSeason = useCallback((): Theme => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }, []);

  const getSunriseSunsetTheme = useCallback((): Theme => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 18) return 'light';
    return 'dark';
  }, []);

  const getAutomaticTheme = useCallback((): Theme => {
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    }
    return theme;
  }, [theme]);

  const applyThemeToDocument = useCallback(
    (newTheme: Theme, newMode?: ThemeMode) => {
      let appliedTheme: Theme;

      if (newMode === 'automatic' || mode === 'automatic') {
        if (newTheme === 'system') {
          appliedTheme = getSunriseSunsetTheme();
        } else if (['spring', 'summer', 'autumn', 'winter'].includes(newTheme)) {
          appliedTheme = newTheme;
        } else {
          appliedTheme = getAutomaticTheme();
        }
      } else {
        appliedTheme = newTheme;
      }

      const config = themeConfigs[appliedTheme];
      const root = document.documentElement;

      // Apply CSS custom properties
      Object.entries(config).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value);
      });

      // Set data attributes
      root.setAttribute('data-theme', appliedTheme);
      root.setAttribute('data-theme-mode', newMode || mode);

      // Store preferences
      localStorage.setItem('theme', newTheme);
      if (newMode) {
        localStorage.setItem('theme-mode', newMode);
        setMode(newMode);
      }

      setThemeState(newTheme);

      // Apply high contrast styles if needed
      if (appliedTheme === 'high-contrast') {
        root.style.setProperty('--font-weight-base', '600');
        root.style.setProperty('--border-width-base', '2px');
      } else {
        root.style.removeProperty('--font-weight-base');
        root.style.removeProperty('--border-width-base');
      }
    },
    [mode, getAutomaticTheme, getSunriseSunsetTheme]
  );

  const setTheme = useCallback(
    (newTheme: Theme) => {
      applyThemeToDocument(newTheme);
    },
    [applyThemeToDocument]
  );

  const setThemeMode = useCallback(
    (newMode: ThemeMode) => {
      applyThemeToDocument(theme, newMode);
    },
    [applyThemeToDocument, theme]
  );

  const toggleTheme = useCallback(() => {
    const themes: Theme[] = ['light', 'dark', 'spring', 'summer', 'autumn', 'winter'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme!);
  }, [theme, setTheme]);

  const getThemeConfig = useCallback(() => {
    return themeConfigs[theme];
  }, [theme]);

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme, applyThemeToDocument]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system' && mode === 'automatic') {
        applyThemeToDocument(theme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, mode, applyThemeToDocument]);

  // Auto-switch based on time for automatic mode
  useEffect(() => {
    if (mode === 'automatic') {
      const interval = setInterval(() => {
        if (theme === 'system') {
          applyThemeToDocument(theme);
        }
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
    return undefined;
  }, [mode, theme, applyThemeToDocument]);

  return {
    theme,
    mode,
    setTheme,
    setThemeMode,
    toggleTheme,
    getThemeConfig,
    getCurrentSeason,
    availableThemes: Object.keys(themeConfigs) as Theme[],
    seasonalThemes: ['spring', 'summer', 'autumn', 'winter'] as Theme[],
    isSystem: theme === 'system',
    isAutomatic: mode === 'automatic',
    isHighContrast: theme === 'high-contrast',
  };
}
