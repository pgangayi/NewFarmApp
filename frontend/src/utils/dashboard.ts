// Color classes for components
export const colorClasses = {
  green: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    icon: 'text-green-600',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    icon: 'text-blue-600',
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    icon: 'text-orange-600',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    icon: 'text-purple-600',
  },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    icon: 'text-emerald-600',
  },
  yellow: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-600',
    icon: 'text-yellow-600',
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    icon: 'text-red-600',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    icon: 'text-amber-600',
  },
};

// Date utilities
export const isDateValid = (dateString: string | undefined): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

export const isOverdue = (dateString: string | undefined, status: string | undefined): boolean => {
  if (!isDateValid(dateString) || status !== 'pending') return false;
  return new Date(dateString as string) < new Date();
};

export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'Not specified';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString();
  } catch {
    return 'Invalid date';
  }
};

// Status formatting
export const formatStatus = (status: string | undefined): string => {
  if (!status) return 'Unknown';
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Farm selection utility
export const getSelectedFarm = <T extends { id?: string }>(
  farms: T[] = [],
  selectedFarmId?: string
): T | undefined => {
  if (!farms || farms.length === 0) return undefined;

  if (selectedFarmId) {
    const farm = farms.find(f => f.id === selectedFarmId);
    if (farm) return farm;
  }

  return farms[0];
};

// Background image loading
export const loadBackgroundImage = (url: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => reject(false);
    img.src = url;
  });
};

// Focus trap for accessibility
export const trapFocus = (element: HTMLElement, event: KeyboardEvent): void => {
  if (event.key !== 'Tab') return;

  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  if (event.shiftKey && document.activeElement === firstElement) {
    lastElement.focus();
    event.preventDefault();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    firstElement.focus();
    event.preventDefault();
  }
};

// Status badge classes
export const getStatusBadgeClasses = (
  status: string | undefined,
  type: 'crop' | 'animal' | 'task'
): string => {
  const statusMap: Record<string, Record<string, string>> = {
    crop: {
      healthy: 'bg-green-100 text-green-700',
      'needs attention': 'bg-amber-100 text-amber-700',
      critical: 'bg-red-100 text-red-700',
    },
    animal: {
      active: 'bg-green-100 text-green-700',
      sold: 'bg-orange-100 text-orange-700',
      deceased: 'bg-red-100 text-red-700',
    },
    task: {
      pending: 'bg-yellow-100 text-yellow-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
    },
  };

  return (status && statusMap[type]?.[status]) || 'bg-gray-100 text-gray-700';
};

// Priority badge classes
export const getPriorityBadgeClasses = (priority: string): string => {
  const priorityMap: Record<string, string> = {
    urgent: 'text-red-600',
    high: 'text-orange-600',
    normal: 'text-blue-600',
    low: 'text-gray-600',
  };

  return priorityMap[priority] || 'text-gray-600';
};

// Logger utility for development
export const logger = {
  debug: (...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.log('[DEBUG]', ...args);
    }
  },
  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args);
  },
  warn: (...args: unknown[]) => {
    console.warn('[WARN]', ...args);
  },
};
