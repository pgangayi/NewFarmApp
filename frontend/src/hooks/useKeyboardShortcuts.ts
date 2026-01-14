// Keyboard shortcuts system for enhanced user productivity
// Provides customizable keyboard shortcuts across the entire application

import { useEffect, useCallback, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export interface KeyboardShortcut {
  id: string;
  name: string;
  description: string;
  key: string;
  modifiers: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  action: () => void | Promise<void>;
  context?: string; // Route or component context where this shortcut is active
  global?: boolean; // Available everywhere
  enabled: boolean;
  category: 'navigation' | 'actions' | 'data' | 'system' | 'accessibility';
  priority: number; // Higher priority shortcuts override lower ones
  lastUsed?: Date;
  usageCount: number;
}

export interface ShortcutContext {
  route: string;
  component?: string;
  isActive: boolean;
}

export interface KeyboardShortcutSettings {
  enabled: boolean;
  showTooltips: boolean;
  soundEnabled: boolean;
  globalShortcuts: {
    enabled: boolean;
    interceptInInputs: boolean;
  };
  customShortcuts: Record<string, string>; // shortcutId -> key combination
  disabledContexts: string[]; // Contexts where shortcuts are disabled
}

const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  // Navigation shortcuts
  {
    id: 'go-home',
    name: 'Go to Dashboard',
    description: 'Navigate to the main dashboard',
    key: 'h',
    modifiers: ['ctrl'],
    action: () => {},
    category: 'navigation',
    priority: 10,
    usageCount: 0,
    enabled: true,
  },
  {
    id: 'go-animals',
    name: 'Go to Animals',
    description: 'Navigate to animals management',
    key: 'a',
    modifiers: ['ctrl'],
    action: () => {},
    category: 'navigation',
    priority: 10,
    usageCount: 0,
    enabled: true,
  },
  {
    id: 'go-crops',
    name: 'Go to Crops',
    description: 'Navigate to crops management',
    key: 'c',
    modifiers: ['ctrl'],
    action: () => {},
    category: 'navigation',
    priority: 10,
    usageCount: 0,
    enabled: true,
  },
  {
    id: 'go-tasks',
    name: 'Go to Tasks',
    description: 'Navigate to tasks management',
    key: 't',
    modifiers: ['ctrl'],
    action: () => {},
    category: 'navigation',
    priority: 10,
    usageCount: 0,
    enabled: true,
  },
  {
    id: 'go-inventory',
    name: 'Go to Inventory',
    description: 'Navigate to inventory management',
    key: 'i',
    modifiers: ['ctrl'],
    action: () => {},
    category: 'navigation',
    priority: 10,
    usageCount: 0,
    enabled: true,
  },
  {
    id: 'go-weather',
    name: 'Go to Weather',
    description: 'Navigate to weather information',
    key: 'w',
    modifiers: ['ctrl'],
    action: () => {},
    category: 'navigation',
    priority: 10,
    usageCount: 0,
    enabled: true,
  },
  {
    id: 'go-search',
    name: 'Global Search',
    description: 'Open global search',
    key: 'k',
    modifiers: ['ctrl'],
    action: () => {},
    category: 'navigation',
    priority: 15,
    usageCount: 0,
    enabled: true,
  },

  // Action shortcuts
  {
    id: 'create-new',
    name: 'Create New Item',
    description: 'Create a new item (varies by context)',
    key: 'n',
    modifiers: ['ctrl'],
    action: () => {},
    category: 'actions',
    priority: 20,
    usageCount: 0,
    enabled: true,
  },
  {
    id: 'save',
    name: 'Save',
    description: 'Save current changes',
    key: 's',
    modifiers: ['ctrl'],
    action: () => {},
    category: 'actions',
    priority: 25,
    usageCount: 0,
    enabled: true,
  },
  {
    id: 'delete',
    name: 'Delete',
    description: 'Delete selected item',
    key: 'Delete',
    modifiers: ['ctrl'],
    action: () => {},
    category: 'actions',
    priority: 20,
    usageCount: 0,
    enabled: true,
  },
  {
    id: 'duplicate',
    name: 'Duplicate',
    description: 'Duplicate selected item',
    key: 'd',
    modifiers: ['ctrl'],
    action: () => {},
    category: 'actions',
    priority: 15,
    usageCount: 0,
    enabled: true,
  },

  // Data shortcuts
  {
    id: 'refresh',
    name: 'Refresh',
    description: 'Refresh current data',
    key: 'r',
    modifiers: ['ctrl'],
    action: () => {},
    category: 'data',
    priority: 10,
    usageCount: 0,
    enabled: true,
  },
  {
    id: 'export',
    name: 'Export',
    description: 'Export current data',
    key: 'e',
    modifiers: ['ctrl'],
    action: () => {},
    category: 'data',
    priority: 10,
    usageCount: 0,
    enabled: true,
  },
  {
    id: 'import',
    name: 'Import',
    description: 'Import data',
    key: 'i',
    modifiers: ['ctrl', 'shift'],
    action: () => {},
    category: 'data',
    priority: 10,
    usageCount: 0,
    enabled: true,
  },

  // System shortcuts
  {
    id: 'help',
    name: 'Show Help',
    description: 'Show keyboard shortcuts help',
    key: '?',
    modifiers: ['ctrl'],
    action: () => {},
    category: 'system',
    priority: 5,
    usageCount: 0,
    enabled: true,
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Open settings',
    key: ',',
    modifiers: ['ctrl'],
    action: () => {},
    category: 'system',
    priority: 10,
    usageCount: 0,
    enabled: true,
  },
  {
    id: 'close-modal',
    name: 'Close Modal',
    description: 'Close current modal or dialog',
    key: 'Escape',
    modifiers: [],
    action: () => {},
    category: 'system',
    priority: 30,
    usageCount: 0,
    enabled: true,
  },

  // Accessibility shortcuts
  {
    id: 'focus-search',
    name: 'Focus Search',
    description: 'Focus the search input',
    key: '/',
    modifiers: [],
    action: () => {},
    category: 'accessibility',
    priority: 10,
    usageCount: 0,
    enabled: true,
  },
  {
    id: 'skip-to-content',
    name: 'Skip to Content',
    description: 'Skip to main content',
    key: 'Tab',
    modifiers: ['ctrl'],
    action: () => {},
    category: 'accessibility',
    priority: 5,
    usageCount: 0,
    enabled: true,
  },
];

const DEFAULT_SETTINGS: KeyboardShortcutSettings = {
  enabled: true,
  showTooltips: true,
  soundEnabled: false,
  globalShortcuts: {
    enabled: true,
    interceptInInputs: false,
  },
  customShortcuts: {},
  disabledContexts: [],
};

export function useKeyboardShortcuts() {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>(DEFAULT_SHORTCUTS);
  const [settings, setSettings] = useState<KeyboardShortcutSettings>(DEFAULT_SETTINGS);
  const [isListening, setIsListening] = useState(false);
  const [currentContext, setCurrentContext] = useState<ShortcutContext>({
    route: '/',
    isActive: true,
  });

  const navigate = useNavigate();
  const location = useLocation();
  const activeInputs = useRef<Set<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>>(
    new Set()
  );
  const eventListeners = useRef<{
    keydown: (e: KeyboardEvent) => void;
    click: (e: MouseEvent) => void;
  } | null>(null);

  // Update current context based on location
  useEffect(() => {
    setCurrentContext({
      route: location.pathname,
      isActive: true,
    });
  }, [location.pathname]);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('farm:keyboard-shortcuts');
    if (saved) {
      try {
        const { shortcuts: savedShortcuts, settings: savedSettings } = JSON.parse(saved);
        if (savedShortcuts) {
          setShortcuts(prev =>
            prev.map(shortcut => ({
              ...shortcut,
              ...(savedShortcuts.find((s: any) => s.id === shortcut.id) || {}),
            }))
          );
        }
        if (savedSettings) {
          setSettings({ ...DEFAULT_SETTINGS, ...savedSettings });
        }
      } catch (error) {
        console.error('Error loading keyboard shortcut settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    const toSave = {
      shortcuts: shortcuts.map(s => ({
        id: s.id,
        key: s.key,
        modifiers: s.modifiers,
        enabled: s.enabled,
        usageCount: s.usageCount,
        lastUsed: s.lastUsed,
      })),
      settings,
    };
    localStorage.setItem('farm:keyboard-shortcuts', JSON.stringify(toSave));
  }, [shortcuts, settings]);

  // Track active input elements
  useEffect(() => {
    const trackInput = (element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => {
      activeInputs.current.add(element);
    };

    const untrackInput = (element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => {
      activeInputs.current.delete(element);
    };

    // Use event delegation to track input focus/blur
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        trackInput(target);
      }
    };

    const handleBlur = (e: FocusEvent) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        untrackInput(target);
      }
    };

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, []);

  // Check if an element is an input
  const isInput = useCallback((element: HTMLElement | null): boolean => {
    if (!element) return false;
    const htmlElement = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    return activeInputs.current.has(htmlElement);
  }, []);

  // Handle keyboard events
  const handleKeydown = useCallback(
    (event: KeyboardEvent) => {
      if (!settings.enabled || isListening) return;

      // Don't intercept if typing in input fields (unless explicitly enabled)
      if (!settings.globalShortcuts.interceptInInputs && isInput(event.target as HTMLElement)) {
        return;
      }

      // Check if we're in a disabled context
      if (settings.disabledContexts.includes(currentContext.route)) {
        return;
      }

      // Get applicable shortcuts
      const applicableShortcuts = shortcuts.filter(shortcut => {
        if (!shortcut.enabled) return false;
        if (shortcut.context && !currentContext.route.startsWith(shortcut.context)) return false;
        return true;
      });

      // Find matching shortcut
      const matchingShortcut = applicableShortcuts.find(shortcut => {
        return matchesShortcut(event, shortcut);
      });

      if (matchingShortcut) {
        event.preventDefault();
        event.stopPropagation();

        // Execute shortcut
        try {
          matchingShortcut.action();
          updateShortcutUsage(matchingShortcut.id);
        } catch (error) {
          console.error('Error executing keyboard shortcut:', error);
        }
      }
    },
    [settings, currentContext, shortcuts, isListening, isInput]
  );

  // Check if an event matches a shortcut
  const matchesShortcut = useCallback(
    (event: KeyboardEvent, shortcut: KeyboardShortcut): boolean => {
      const { key, modifiers } = shortcut;

      // Check main key
      if (event.key.toLowerCase() !== key.toLowerCase()) {
        return false;
      }

      // Check modifiers
      const hasCtrl = event.ctrlKey || event.metaKey; // meta for Mac
      const hasAlt = event.altKey;
      const hasShift = event.shiftKey;

      const ctrlPressed = modifiers.includes('ctrl') || modifiers.includes('meta');
      const altPressed = modifiers.includes('alt');
      const shiftPressed = modifiers.includes('shift');

      return hasCtrl === ctrlPressed && hasAlt === altPressed && hasShift === shiftPressed;
    },
    []
  );

  // Update shortcut usage statistics
  const updateShortcutUsage = useCallback((shortcutId: string) => {
    setShortcuts(prev =>
      prev.map(shortcut =>
        shortcut.id === shortcutId
          ? {
              ...shortcut,
              usageCount: shortcut.usageCount + 1,
              lastUsed: new Date(),
            }
          : shortcut
      )
    );
  }, []);

  // Start listening for shortcut customization
  const startListening = useCallback(() => {
    setIsListening(true);
  }, []);

  // Stop listening for shortcut customization
  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  // Register a new shortcut
  const registerShortcut = useCallback((shortcut: Omit<KeyboardShortcut, 'usageCount'>) => {
    setShortcuts(prev => {
      const existing = prev.find(s => s.id === shortcut.id);
      if (existing) {
        return prev.map(s =>
          s.id === shortcut.id ? { ...shortcut, usageCount: s.usageCount } : s
        );
      }
      return [...prev, { ...shortcut, usageCount: 0 }];
    });
  }, []);

  // Unregister a shortcut
  const unregisterShortcut = useCallback((shortcutId: string) => {
    setShortcuts(prev => prev.filter(s => s.id !== shortcutId));
  }, []);

  // Update a shortcut
  const updateShortcut = useCallback((shortcutId: string, updates: Partial<KeyboardShortcut>) => {
    setShortcuts(prev =>
      prev.map(shortcut => (shortcut.id === shortcutId ? { ...shortcut, ...updates } : shortcut))
    );
  }, []);

  // Enable/disable a shortcut
  const toggleShortcut = useCallback((shortcutId: string) => {
    setShortcuts(prev =>
      prev.map(shortcut =>
        shortcut.id === shortcutId ? { ...shortcut, enabled: !shortcut.enabled } : shortcut
      )
    );
  }, []);

  // Update settings
  const updateSettings = useCallback((updates: Partial<KeyboardShortcutSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  // Disable context
  const disableContext = useCallback((context: string) => {
    setSettings(prev => ({
      ...prev,
      disabledContexts: [...prev.disabledContexts, context],
    }));
  }, []);

  // Enable context
  const enableContext = useCallback((context: string) => {
    setSettings(prev => ({
      ...prev,
      disabledContexts: prev.disabledContexts.filter(c => c !== context),
    }));
  }, []);

  // Get shortcuts for current context
  const getContextShortcuts = useCallback(() => {
    return shortcuts
      .filter(shortcut => {
        if (!shortcut.enabled) return false;
        if (shortcut.context && !currentContext.route.startsWith(shortcut.context)) return false;
        return true;
      })
      .sort((a, b) => b.priority - a.priority);
  }, [shortcuts, currentContext]);

  // Get shortcut by ID
  const getShortcut = useCallback(
    (shortcutId: string) => {
      return shortcuts.find(s => s.id === shortcutId);
    },
    [shortcuts]
  );

  // Get shortcuts by category
  const getShortcutsByCategory = useCallback(
    (category: KeyboardShortcut['category']) => {
      return getContextShortcuts().filter(s => s.category === category);
    },
    [getContextShortcuts]
  );

  // Format shortcut for display
  const formatShortcut = useCallback((shortcut: KeyboardShortcut) => {
    const parts = [];
    if (shortcut.modifiers.includes('ctrl') || shortcut.modifiers.includes('meta')) {
      parts.push('Ctrl');
    }
    if (shortcut.modifiers.includes('alt')) {
      parts.push('Alt');
    }
    if (shortcut.modifiers.includes('shift')) {
      parts.push('Shift');
    }
    parts.push(shortcut.key.toUpperCase());
    return parts.join('+');
  }, []);

  // Get most used shortcuts
  const getMostUsedShortcuts = useCallback(
    (limit = 10) => {
      return getContextShortcuts()
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, limit);
    },
    [getContextShortcuts]
  );

  // Reset usage statistics
  const resetUsageStats = useCallback(() => {
    setShortcuts(prev =>
      prev.map(shortcut => ({
        ...shortcut,
        usageCount: 0,
        lastUsed: undefined,
      }))
    );
  }, []);

  // Test if a key combination is available
  const isKeyCombinationAvailable = useCallback(
    (key: string, modifiers: KeyboardShortcut['modifiers'], excludeId?: string) => {
      return !getContextShortcuts().some(shortcut => {
        if (shortcut.id === excludeId) return false;
        if (shortcut.key.toLowerCase() !== key.toLowerCase()) return false;

        const shortcutMods = shortcut.modifiers;
        const hasCtrl = shortcutMods.includes('ctrl') || shortcutMods.includes('meta');
        const hasAlt = shortcutMods.includes('alt');
        const hasShift = shortcutMods.includes('shift');

        const ctrlPressed = modifiers.includes('ctrl') || modifiers.includes('meta');
        const altPressed = modifiers.includes('alt');
        const shiftPressed = modifiers.includes('shift');

        return hasCtrl === ctrlPressed && hasAlt === altPressed && hasShift === shiftPressed;
      });
    },
    [getContextShortcuts]
  );

  // Attach global event listeners
  useEffect(() => {
    if (!settings.enabled) return;

    const handleKeydownEvent = (e: KeyboardEvent) => handleKeydown(e);

    // Attach to document for global listening
    document.addEventListener('keydown', handleKeydownEvent, true);

    return () => {
      document.removeEventListener('keydown', handleKeydownEvent, true);
    };
  }, [settings.enabled, handleKeydown]);

  return {
    // State
    shortcuts,
    settings,
    isListening,
    currentContext,

    // Actions
    registerShortcut,
    unregisterShortcut,
    updateShortcut,
    toggleShortcut,
    updateSettings,
    startListening,
    stopListening,
    disableContext,
    enableContext,
    resetUsageStats,

    // Utilities
    getContextShortcuts,
    getShortcut,
    getShortcutsByCategory,
    formatShortcut,
    getMostUsedShortcuts,
    isKeyCombinationAvailable,

    // Getters
    shortcutsByCategory: {
      navigation: getShortcutsByCategory('navigation'),
      actions: getShortcutsByCategory('actions'),
      data: getShortcutsByCategory('data'),
      system: getShortcutsByCategory('system'),
      accessibility: getShortcutsByCategory('accessibility'),
    },
  };
}

// Helper hook for component-specific shortcuts
export function useComponentShortcuts(componentName: string) {
  const keyboardShortcuts = useKeyboardShortcuts();

  useEffect(() => {
    keyboardShortcuts.updateSettings({
      disabledContexts: keyboardShortcuts.settings.disabledContexts.filter(
        context => !context.includes(componentName)
      ),
    });
  }, [componentName]);

  return keyboardShortcuts;
}

export default useKeyboardShortcuts;
