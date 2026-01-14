// Floating Action Button component for quick access to common actions
// Provides fast access to frequently used features throughout the app

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface FABAction {
  id: string;
  label: string;
  icon: string;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  onClick: () => void;
  shortcut?: string;
  badge?: number | string;
}

interface FloatingActionButtonProps {
  actions: FABAction[];
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'sm' | 'md' | 'lg';
  theme?: 'default' | 'minimal' | 'glass';
  showOnPages?: string[]; // Route patterns where FAB should be visible
  hiddenOnPages?: string[]; // Route patterns where FAB should be hidden
  autoHide?: boolean; // Auto-hide when scrolling
  zIndex?: number;
}

const DEFAULT_ACTIONS: FABAction[] = [
  {
    id: 'add-animal',
    label: 'Add Animal',
    icon: 'plus',
    color: 'primary',
    onClick: () => {
      /* Navigate to add animal */
    },
    shortcut: 'a',
  },
  {
    id: 'add-crop',
    label: 'Add Crop',
    icon: 'seedling',
    color: 'success',
    onClick: () => {
      /* Navigate to add crop */
    },
    shortcut: 'c',
  },
  {
    id: 'add-task',
    label: 'Add Task',
    icon: 'check',
    color: 'secondary',
    onClick: () => {
      /* Navigate to add task */
    },
    shortcut: 't',
  },
  {
    id: 'quick-scan',
    label: 'Quick Scan',
    icon: 'qrcode',
    color: 'warning',
    onClick: () => {
      /* Open QR/barcode scanner */
    },
    shortcut: 's',
  },
  {
    id: 'emergency',
    label: 'Emergency',
    icon: 'warning',
    color: 'danger',
    onClick: () => {
      /* Open emergency contacts */
    },
    shortcut: 'e',
  },
];

const POSITION_CLASSES = {
  'bottom-right': 'bottom-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'top-right': 'top-6 right-6',
  'top-left': 'top-6 left-6',
};

const SIZE_CLASSES = {
  sm: 'w-12 h-12',
  md: 'w-14 h-14',
  lg: 'w-16 h-16',
};

const THEME_CLASSES = {
  default: 'bg-blue-600 text-white shadow-lg hover:bg-blue-700',
  minimal: 'bg-gray-800 text-white shadow-md hover:bg-gray-700',
  glass:
    'bg-white/80 backdrop-blur-lg text-gray-800 shadow-xl hover:bg-white/90 border border-white/20',
};

const ICON_SIZES = {
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-7 h-7',
};

export function FloatingActionButton({
  actions = DEFAULT_ACTIONS,
  position = 'bottom-right',
  size = 'md',
  theme = 'default',
  showOnPages,
  hiddenOnPages,
  autoHide = false,
  zIndex = 50,
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const fabRef = useRef<HTMLDivElement>(null);
  const actionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Check if FAB should be visible on current page
  const shouldShowFab = () => {
    if (showOnPages && showOnPages.length > 0) {
      return showOnPages.some(pattern => {
        if (pattern.includes('*')) {
          const regex = new RegExp(pattern.replace('*', '.*'));
          return regex.test(location.pathname);
        }
        return location.pathname === pattern;
      });
    }

    if (hiddenOnPages && hiddenOnPages.length > 0) {
      return !hiddenOnPages.some(pattern => {
        if (pattern.includes('*')) {
          const regex = new RegExp(pattern.replace('*', '.*'));
          return regex.test(location.pathname);
        }
        return location.pathname === pattern;
      });
    }

    return true; // Show on all pages by default
  };

  // Auto-hide functionality
  useEffect(() => {
    if (!autoHide) return;

    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      const direction = scrollY > lastScrollY ? 'down' : 'up';

      if (direction === 'down' && scrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(scrollY);
    };

    window.addEventListener('scroll', updateScrollDirection);
    return () => window.removeEventListener('scroll', updateScrollDirection);
  }, [lastScrollY, autoHide]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const shortcut = event.key.toLowerCase();
      const action = actions.find(a => a.shortcut === shortcut);

      if (action) {
        event.preventDefault();
        action.onClick();
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [actions]);

  // Close FAB when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle action focus
  const handleActionKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      actions[index]?.onClick();
      setIsOpen(false);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prevIndex = index > 0 ? index - 1 : actions.length - 1;
      actionRefs.current[prevIndex]?.focus();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = index < actions.length - 1 ? index + 1 : 0;
      actionRefs.current[nextIndex]?.focus();
    } else if (event.key === 'Escape') {
      setIsOpen(false);
      (event.currentTarget as HTMLElement).blur();
    }
  };

  if (!shouldShowFab() || !isVisible) {
    return null;
  }

  return (
    <div
      ref={fabRef}
      className={`fixed ${POSITION_CLASSES[position]} z-${zIndex} flex flex-col items-end space-y-3`}
      style={{ zIndex }}
    >
      {/* Action buttons */}
      {isOpen && (
        <div className="flex flex-col space-y-2 mb-2">
          {actions.map((action, index) => (
            <div
              key={action.id}
              className="flex items-center space-x-2 animate-in slide-in-from-right-2 duration-200"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Action label */}
              <div className="bg-gray-800 text-white text-sm px-3 py-1 rounded-lg shadow-lg whitespace-nowrap">
                {action.label}
                {action.shortcut && <span className="ml-2 text-gray-400">({action.shortcut})</span>}
                {action.badge && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                    {action.badge}
                  </span>
                )}
              </div>

              {/* Action button */}
              <button
                ref={el => (actionRefs.current[index] = el)}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                onKeyDown={e => handleActionKeyDown(e, index)}
                className={`
                  ${SIZE_CLASSES[size]} 
                  rounded-full shadow-lg transition-all duration-200 
                  flex items-center justify-center
                  ${
                    action.color === 'primary'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : action.color === 'secondary'
                        ? 'bg-gray-600 hover:bg-gray-700'
                        : action.color === 'success'
                          ? 'bg-green-600 hover:bg-green-700'
                          : action.color === 'warning'
                            ? 'bg-yellow-600 hover:bg-yellow-700'
                            : action.color === 'danger'
                              ? 'bg-red-600 hover:bg-red-700'
                              : 'bg-gray-600 hover:bg-gray-700'
                  }
                  hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                `}
                aria-label={action.label}
              >
                <Icon name={action.icon} className={ICON_SIZES[size]} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main FAB button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          ${SIZE_CLASSES[size]} 
          ${THEME_CLASSES[theme]}
          rounded-full shadow-lg transition-all duration-200 
          flex items-center justify-center
          hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          ${isOpen ? 'rotate-45' : 'rotate-0'}
        `}
        aria-label="Open quick actions"
      >
        <Icon name={isOpen ? 'x' : 'plus'} className={ICON_SIZES[size]} />
      </button>
    </div>
  );
}

// Icon component
interface IconProps {
  name: string;
  className?: string;
}

function Icon({ name, className = 'w-5 h-5' }: IconProps) {
  const icons: Record<string, string> = {
    plus: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
    x: 'M6 18L18 6M6 6l12 12',
    'plus-circle': 'M12 8v4m-2-2h.01M19 12a7 7 0 11-14 0 7 7 0 0114 0z',
    qrcode:
      'M3 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM15 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4zM3 20a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM19 20a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 011-1h2a1 1 0 011 1v2z',
    check: 'M5 13l4 4L19 7',
    seedling:
      'M12 2v6M5.64 5.64L8.5 8.5M17.36 17.36L20.5 20.5M15 12h6M5.64 18.36L8.5 15.5M17.36 6.64L20.5 3.5M2 12h6m4 0h6M2 2h6m4 0h6',
    warning:
      'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    bell: 'M15 17h5l-5 5v-5zM15 17H9a2 2 0 01-2-2V9a2 2 0 012-2h6m0 0V7a2 2 0 012-2h2.5a2 2 0 012 2v2m-6 0a6 6 0 006 6m0-6a6 6 0 00-6-6',
    search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    settings:
      'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  };

  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d={icons[name] || icons.plus}
      />
    </svg>
  );
}

// Context hook for managing FAB across the app
export function useFloatingActionButton() {
  const [actions, setActions] = useState<FABAction[]>(DEFAULT_ACTIONS);
  const [isVisible, setIsVisible] = useState(true);

  const addAction = (action: FABAction) => {
    setActions(prev => [...prev, action]);
  };

  const removeAction = (actionId: string) => {
    setActions(prev => prev.filter(a => a.id !== actionId));
  };

  const updateAction = (actionId: string, updates: Partial<FABAction>) => {
    setActions(prev => prev.map(a => (a.id === actionId ? { ...a, ...updates } : a)));
  };

  const show = () => setIsVisible(true);
  const hide = () => setIsVisible(false);

  return {
    actions,
    isVisible,
    setActions,
    addAction,
    removeAction,
    updateAction,
    show,
    hide,
  };
}

export default FloatingActionButton;
