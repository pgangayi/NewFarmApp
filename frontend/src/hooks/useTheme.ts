import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme;
    return stored || 'system';
  });

  const applyThemeToDocument = (newTheme: Theme) => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const appliedTheme = newTheme === 'system' ? (prefersDark ? 'dark' : 'light') : newTheme;
    document.documentElement.setAttribute('data-theme', appliedTheme);
    localStorage.setItem('theme', newTheme);
    setTheme(newTheme);
  };

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  const isSystem = theme === 'system';

  return { theme, setTheme: applyThemeToDocument, isSystem };
}
