import { useState, useEffect, useRef, useCallback } from 'react';

interface Notification {
  id: string;
  type: 'weather' | 'inventory' | 'task' | 'animal' | 'crop' | 'system' | 'reminder';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  data?: unknown;
  timestamp: Date;
  read: boolean;
  actionable: boolean;
  actionUrl?: string;
  actionLabel?: string;
  expiresAt?: Date;
  dismissed: boolean;
  userId?: string;
  farmId?: string;
}

interface NotificationPreferences {
  weather: boolean;
  inventory: boolean;
  tasks: boolean;
  animals: boolean;
  crops: boolean;
  system: boolean;
  reminders: boolean;
  email: boolean;
  push: boolean;
  desktop: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  maxPerDay: number;
  quietPeriodStart?: Date;
}

interface NotificationRule {
  id: string;
  name: string;
  type: string;
  condition: (data: unknown) => boolean;
  action: (context: unknown) => Omit<Notification, 'id' | 'timestamp' | 'read' | 'dismissed'>;
  enabled: boolean;
  priority: 'low' | 'medium' | 'high';
  cooldown?: number;
  lastTriggered?: Date;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  weather: true,
  inventory: true,
  tasks: true,
  animals: true,
  crops: true,
  system: true,
  reminders: true,
  email: false,
  push: true,
  desktop: true,
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '08:00',
  },
  frequency: 'immediate',
  maxPerDay: 50,
};

const NOTIFICATION_RULES: NotificationRule[] = [
  {
    id: 'low-stock',
    name: 'Low Stock Alert',
    type: 'inventory',
    condition: data => data.quantity <= data.minStock && data.quantity > 0,
    action: context => ({
      type: 'inventory',
      title: 'Low Stock Warning',
      message: `${context.name} is running low (${context.quantity} remaining)`,
      priority: 'medium',
      category: 'inventory',
      data: context,
      actionable: true,
      actionUrl: `/inventory/${context.id}`,
      actionLabel: 'Restock',
    }),
    enabled: true,
    priority: 'medium',
    cooldown: 60,
  },
  {
    id: 'overdue-task',
    name: 'Overdue Task',
    type: 'task',
    condition: data => new Date(data.dueDate) < new Date() && data.status !== 'completed',
    action: context => ({
      type: 'task',
      title: 'Overdue Task',
      message: `Task "${context.title}" is overdue`,
      priority: 'high',
      category: 'tasks',
      data: context,
      actionable: true,
      actionUrl: `/tasks/${context.id}`,
      actionLabel: 'Update Task',
    }),
    enabled: true,
    priority: 'high',
    cooldown: 30,
  },
  {
    id: 'animal-health',
    name: 'Animal Health Alert',
    type: 'animal',
    condition: data => data.healthStatus === 'sick',
    action: context => ({
      type: 'animal',
      title: 'Animal Health Concern',
      message: `${context.name} needs medical attention`,
      priority: 'high',
      category: 'animals',
      data: context,
      actionable: true,
      actionUrl: `/animals/${context.id}`,
      actionLabel: 'View Details',
    }),
    enabled: true,
    priority: 'high',
    cooldown: 120,
  },
  {
    id: 'weather-alert',
    name: 'Weather Alert',
    type: 'weather',
    condition: data => data.temperature > 40 || data.temperature < 0,
    action: context => ({
      type: 'weather',
      title: 'Weather Alert',
      message: `Temperature extreme: ${context.temperature}°C`,
      priority: 'urgent',
      category: 'weather',
      data: context,
      actionable: true,
      actionUrl: '/weather',
      actionLabel: 'View Weather',
    }),
    enabled: true,
    priority: 'high',
    cooldown: 60,
  },
  {
    id: 'crop-maturity',
    name: 'Crop Maturity',
    type: 'crop',
    condition: data => data.daysToHarvest <= 7 && data.daysToHarvest >= 0,
    action: context => ({
      type: 'crop',
      title: 'Crop Ready for Harvest',
      message: `${context.name} will be ready for harvest in ${context.daysToHarvest} days`,
      priority: 'medium',
      category: 'crops',
      data: context,
      actionable: true,
      actionUrl: `/crops/${context.id}`,
      actionLabel: 'View Crop',
    }),
    enabled: true,
    priority: 'medium',
    cooldown: 360,
  },
];

export function useSmartNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isEnabled, setIsEnabled] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const notificationQueue = useRef<Notification[]>([]);
  const checkIntervals = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('farm:notification-preferences');
    if (saved) {
      try {
        setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(saved) });
      } catch (error) {
        console.error('Error loading notification preferences:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('farm:notification-preferences', JSON.stringify(preferences));
  }, [preferences]);

  const isQuietHours = useCallback(() => {
    if (!preferences.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const start = preferences.quietHours.start;
    const end = preferences.quietHours.end;

    if (start <= end) {
      return currentTime >= start && currentTime <= end;
    } else {
      return currentTime >= start || currentTime <= end;
    }
  }, [preferences.quietHours]);

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'dismissed'>) => {
      const newNotification: Notification = {
        ...notification,
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        read: false,
        dismissed: false,
      };

      setNotifications(prev => [newNotification, ...prev].slice(0, 100));
      notificationQueue.current.push(newNotification);

      if (preferences.push && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: newNotification.id,
        });
      }

      return newNotification;
    },
    [preferences.push]
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, dismissed: true } : n)));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    notificationQueue.current = [];
  }, []);

  const updatePreferences = useCallback((newPreferences: Partial<NotificationPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  const checkForNotifications = useCallback(async () => {
    if (!isEnabled || isQuietHours()) return;

    try {
      const [inventoryRes, tasksRes, animalsRes, weatherRes, cropsRes] = await Promise.allSettled([
        fetch('/api/inventory'),
        fetch('/api/tasks'),
        fetch('/api/animals'),
        fetch('/api/weather'),
        fetch('/api/crops'),
      ]);

      const inventory = inventoryRes.status === 'fulfilled' ? await inventoryRes.value.json() : [];
      const tasks = tasksRes.status === 'fulfilled' ? await tasksRes.value.json() : [];
      const animals = animalsRes.status === 'fulfilled' ? await animalsRes.value.json() : [];
      const weather = weatherRes.status === 'fulfilled' ? await weatherRes.value.json() : [];
      const crops = cropsRes.status === 'fulfilled' ? await cropsRes.value.json() : [];

      NOTIFICATION_RULES.filter(rule => rule.enabled).forEach(rule => {
        if (rule.cooldown && rule.lastTriggered) {
          const timeSinceLastTrigger = new Date().getTime() - rule.lastTriggered.getTime();
          if (timeSinceLastTrigger < rule.cooldown * 60 * 1000) {
            return;
          }
        }

        const dataSets = {
          inventory: inventory.data || [],
          tasks: tasks.data || [],
          animals: animals.data || [],
          weather: weather,
          crops: crops.data || [],
        };

        const relevantData = dataSets[rule.type as keyof typeof dataSets] || [];

        relevantData.forEach((data: unknown) => {
          if (rule.condition(data)) {
            const notification = rule.action(data);
            addNotification(notification);
            rule.lastTriggered = new Date();
          }
        });
      });
    } catch (error) {
      console.error('Error checking for notifications:', error);
    }
  }, [isEnabled, isQuietHours, addNotification]);

  useEffect(() => {
    if (!isEnabled) return;

    checkForNotifications();

    const intervals = {
      immediate: 5 * 60 * 1000,
      hourly: 60 * 60 * 1000,
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
    };

    const intervalTime = intervals[preferences.frequency];
    const interval = setInterval(checkForNotifications, intervalTime);
    checkIntervals.current = [interval];

    return () => {
      checkIntervals.current.forEach(clearInterval);
      checkIntervals.current = [];
    };
  }, [isEnabled, preferences.frequency, checkForNotifications]);

  const refreshNotifications = useCallback(() => {
    setLastCheck(new Date());
    checkForNotifications();
  }, [checkForNotifications]);

  const getNotificationStats = useCallback(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;
    const byType = notifications.reduce(
      (acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return { total, unread, byType };
  }, [notifications]);

  return {
    notifications: notifications.filter(n => !n.dismissed),
    preferences,
    isEnabled,
    lastCheck,
    setIsEnabled,
    addNotification,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll,
    updatePreferences,
    requestNotificationPermission,
    refreshNotifications,
    getNotificationStats,
  };
}

export default useSmartNotifications;
export type { Notification, NotificationPreferences, NotificationRule };
