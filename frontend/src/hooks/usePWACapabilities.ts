// PWA (Progressive Web App) capabilities for enhanced user experience
// Provides offline functionality, push notifications, app-like experience, and installation

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

const IMAGE_PNG = 'image/png';
const ICON_PURPOSE = 'unknown maskable';

export type PWAInstallState = 'not-installable' | 'installable' | 'installed' | 'installing';

export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  outcome?: 'accepted' | 'dismissed';
}

export interface PWACapabilities {
  isOnline: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  installPrompt: PWAInstallPrompt | null;
  updateAvailable: boolean;
  swRegistration: ServiceWorkerRegistration | null;
  pushPermission: NotificationPermission;
  pushSubscription: PushSubscription | null;
  appVersion: string;
  isStandalone: boolean;
  isStandaloneIos: boolean;
}

export interface OfflineData {
  route: string;
  data: unknown;
  timestamp: number;
  priority: 'low' | 'normal' | 'high';
}

export interface SyncManager {
  id: string;
  type: 'background-sync' | 'periodic-sync' | 'one-time';
  options: unknown;
  registered: boolean;
  lastSync?: Date;
}

export interface PWAConfig {
  appName: string;
  appShortName: string;
  appVersion: string;
  enableNotifications: boolean;
  enableBackgroundSync: boolean;
  enableOfflineMode: boolean;
  maxOfflineDataSize: number; // in MB
  syncInterval: number; // in minutes
  skipWaiting: boolean;
  clientsClaim: boolean;
}

const DEFAULT_PWA_CONFIG: PWAConfig = {
  appName: 'Farmers Boot',
  appShortName: 'FarmersBoot',
  appVersion: '0.1.0',
  enableNotifications: true,
  enableBackgroundSync: true,
  enableOfflineMode: true,
  maxOfflineDataSize: 50, // 50MB
  syncInterval: 15, // 15 minutes
  skipWaiting: true,
  clientsClaim: true,
};

export function usePWACapabilities(customConfig?: Partial<PWAConfig>) {
  const config = useMemo(() => ({ ...DEFAULT_PWA_CONFIG, ...customConfig }), [customConfig]);

  const [capabilities, setCapabilities] = useState<PWACapabilities>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isInstallable: false,
    isInstalled: false,
    installPrompt: null,
    updateAvailable: false,
    swRegistration: null,
    pushPermission:
      typeof window !== 'undefined' && 'Notification' in window
        ? Notification.permission
        : 'denied',
    pushSubscription: null,
    appVersion: config.appVersion,
    isStandalone: false,
    isStandaloneIos: false,
  });

  const [offlineQueue, setOfflineQueue] = useState<
    Array<{ id: string; url: string; data: unknown; timestamp: number }>
  >([]);
  const [offlineData, setOfflineData] = useState<OfflineData[]>([]);
  const [syncManagers, setSyncManagers] = useState<SyncManager[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const installPromptRef = useRef<PWAInstallPrompt | null>(null);

  // Detect if app is running in standalone mode
  const detectStandaloneMode = useCallback(() => {
    if (typeof window === 'undefined') return { isStandalone: false, isStandaloneIos: false };

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isStandaloneIos = (window.navigator as any).standalone === true;
    const isInWebAppiOS = (window.navigator as any).standalone === 'yes';

    return {
      isStandalone: isStandalone || isInWebAppiOS,
      isStandaloneIos: isStandaloneIos || isInWebAppiOS,
    };
  }, []);

  // Handle online/offline status
  const handleOnlineStatus = useCallback(() => {
    setCapabilities(prev => ({
      ...prev,
      isOnline: navigator.onLine,
    }));

    if (navigator.onLine && offlineQueue.length > 0) {
      // Sync offline queue when coming back online
      processOfflineQueue();
    }
  }, [offlineQueue]);

  // Process offline queue
  const processOfflineQueue = useCallback(async () => {
    const queue = [...offlineQueue];
    const processed: string[] = [];

    for (const item of queue) {
      try {
        const response = await fetch(item.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Offline-Sync': 'true',
          },
          body: JSON.stringify(item.data),
        });

        if (response.ok) {
          processed.push(item.id);
        }
      } catch (error) {
        console.error('Failed to sync offline request:', error);
        // Keep failed items in queue for retry
      }
    }

    setOfflineQueue(prev => prev.filter(item => !processed.includes(item.id)));
  }, [offlineQueue]);

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported in this environment');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      swRegistrationRef.current = registration;

      setCapabilities(prev => ({
        ...prev,
        swRegistration: registration,
      }));

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setCapabilities(prev => ({
                ...prev,
                updateAvailable: true,
              }));
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }, []);

  // Setup beforeinstallprompt
  const handleBeforeInstallPrompt = useCallback((e: Event) => {
    e.preventDefault();
    const event = e as any;

    installPromptRef.current = {
      prompt: event.prompt,
      userChoice: event.userChoice,
    };

    setCapabilities(prev => ({
      ...prev,
      isInstallable: true,
      installPrompt: installPromptRef.current,
    }));
  }, []);

  // Install PWA
  const installPWA = useCallback(async (): Promise<boolean> => {
    if (!installPromptRef.current) {
      console.warn('No install prompt available');
      return false;
    }

    try {
      setCapabilities(prev => ({ ...prev, isInstallable: false }));

      await installPromptRef.current.prompt();
      const result = await installPromptRef.current.userChoice;

      setCapabilities(prev => ({
        ...prev,
        isInstallable: false,
        installPrompt: null,
        isInstalled: result.outcome === 'accepted',
      }));

      return result.outcome === 'accepted';
    } catch (error) {
      console.error('PWA installation failed:', error);
      return false;
    }
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    const permission = await Notification.requestPermission();

    setCapabilities(prev => ({
      ...prev,
      pushPermission: permission,
    }));

    return permission;
  }, []);

  // Subscribe to push notifications
  const subscribeToPushNotifications = useCallback(async (): Promise<boolean> => {
    if (!capabilities.swRegistration || Notification.permission !== 'granted') {
      return false;
    }

    try {
      const subscription = await capabilities.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: generateVapidKey(), // This would be your VAPID public key
      });

      setCapabilities(prev => ({
        ...prev,
        pushSubscription: subscription,
      }));

      // Send subscription to server
      await sendSubscriptionToServer(subscription);

      return true;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return false;
    }
  }, [capabilities.swRegistration, capabilities.pushSubscription]);

  // Send push subscription to server
  const sendSubscriptionToServer = useCallback(async (subscription: PushSubscription) => {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }, []);

  // Generate VAPID key (placeholder)
  const generateVapidKey = useCallback(() => {
    // In a real implementation, this would be your actual VAPID public key
    return 'BC4WMDMFZ3aLwGd6Y7xO_JjN1w8F8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8';
  }, []);

  // Register background sync
  const registerBackgroundSync = useCallback(
    async (tag: string, options?: unknown) => {
      if (!capabilities.swRegistration) {
        console.warn('No service worker registration available');
        return false;
      }

      try {
        // Type guard for sync support
        const syncManager = (capabilities.swRegistration as any).sync;
        if (syncManager && typeof syncManager.register === 'function') {
          await syncManager.register(tag);
          return true;
        } else {
          console.warn('Background sync not supported');
          return false;
        }
      } catch (error) {
        console.error('Background sync registration failed:', error);
        return false;
      }
    },
    [capabilities.swRegistration]
  );

  // Store data for offline access
  const storeOfflineData = useCallback(
    (route: string, data: unknown, priority: OfflineData['priority'] = 'normal') => {
      const offlineItem: OfflineData = {
        route,
        data,
        timestamp: Date.now(),
        priority,
      };

      setOfflineData(prev => {
        const updated = [...prev, offlineItem];

        // Implement size limit
        const totalSize = calculateOfflineDataSize(updated);
        if (totalSize > config.maxOfflineDataSize * 1024 * 1024) {
          // Remove lowest priority items first
          const sorted = updated.sort((a, b) => {
            const priorityOrder = { low: 0, normal: 1, high: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          });

          while (
            calculateOfflineDataSize(sorted) > config.maxOfflineDataSize * 1024 * 1024 &&
            sorted.length > 1
          ) {
            sorted.shift();
          }

          return sorted;
        }

        return updated;
      });
    },
    [config.maxOfflineDataSize]
  );

  // Get offline data for route
  const getOfflineData = useCallback(
    (route: string) => {
      return offlineData.filter(item => item.route === route);
    },
    [offlineData]
  );

  // Clear offline data
  const clearOfflineData = useCallback((route?: string) => {
    if (route) {
      setOfflineData(prev => prev.filter(item => item.route !== route));
    } else {
      setOfflineData([]);
    }
  }, []);

  // Calculate offline data size
  const calculateOfflineDataSize = useCallback((data: OfflineData[]): number => {
    return new Blob([JSON.stringify(data)]).size;
  }, []);

  // Add request to offline queue
  const addToOfflineQueue = useCallback((url: string, data: unknown) => {
    const queueItem = {
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url,
      data,
      timestamp: Date.now(),
    };

    setOfflineQueue(prev => [...prev, queueItem]);
  }, []);

  // Get app manifest
  const getAppManifest = useCallback(() => {
    return {
      name: config.appName,
      short_name: config.appShortName,
      version: config.appVersion,
      display: 'standalone',
      start_url: '/',
      scope: '/',
      theme_color: '#059669',
      background_color: '#ffffff',
      description: 'Comprehensive farm management solution',
      icons: [
        {
          src: '/icons/icon-72x72.png',
          sizes: '72x72',
          type: IMAGE_PNG,
          purpose: ICON_PURPOSE,
        },
        {
          src: '/icons/icon-96x96.png',
          sizes: '96x96',
          type: IMAGE_PNG,
          purpose: ICON_PURPOSE,
        },
        {
          src: '/icons/icon-128x128.png',
          sizes: '128x128',
          type: IMAGE_PNG,
          purpose: ICON_PURPOSE,
        },
        {
          src: '/icons/icon-144x144.png',
          sizes: '144x144',
          type: IMAGE_PNG,
          purpose: ICON_PURPOSE,
        },
        {
          src: '/icons/icon-152x152.png',
          sizes: '152x152',
          type: IMAGE_PNG,
          purpose: ICON_PURPOSE,
        },
        {
          src: '/icons/icon-192x192.png',
          sizes: '192x192',
          type: IMAGE_PNG,
          purpose: ICON_PURPOSE,
        },
        {
          src: '/icons/icon-384x384.png',
          sizes: '384x384',
          type: IMAGE_PNG,
          purpose: ICON_PURPOSE,
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: IMAGE_PNG,
          purpose: ICON_PURPOSE,
        },
      ],
      categories: ['productivity', 'business', 'agriculture'],
      screenshots: [
        {
          src: '/screenshots/desktop.png',
          sizes: '1280x720',
          type: 'image/png',
          form_factor: 'wide',
        },
        {
          src: '/screenshots/mobile.png',
          sizes: '375x812',
          type: 'image/png',
          form_factor: 'narrow',
        },
      ],
    };
  }, [config]);

  // Initialize PWA capabilities
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsInitializing(false);
      return;
    }

    const initialize = async () => {
      // Detect standalone mode
      const { isStandalone, isStandaloneIos } = detectStandaloneMode();

      setCapabilities(prev => ({
        ...prev,
        isStandalone,
        isStandaloneIos,
        isInstalled: isStandalone,
      }));

      // Register service worker
      const registration = await registerServiceWorker();

      // Setup install prompt listener
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      // Setup online/offline listeners
      window.addEventListener('online', handleOnlineStatus);
      window.addEventListener('offline', handleOnlineStatus);

      setIsInitializing(false);
    };

    initialize();

    return () => {
      // Cleanup
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, [detectStandaloneMode, registerServiceWorker, handleBeforeInstallPrompt, handleOnlineStatus]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (capabilities.isOnline && offlineQueue.length > 0) {
      processOfflineQueue();
    }
  }, [capabilities.isOnline, offlineQueue.length, processOfflineQueue]);

  // Update capabilities when needed
  useEffect(() => {
    if (installPromptRef.current !== capabilities.installPrompt) {
      installPromptRef.current = capabilities.installPrompt;
    }
  }, [capabilities.installPrompt]);

  return {
    // Capabilities
    capabilities,
    isInitializing,

    // Installation
    installPWA,
    requestNotificationPermission,
    subscribeToPushNotifications,

    // Offline functionality
    storeOfflineData,
    getOfflineData,
    clearOfflineData,
    addToOfflineQueue,
    offlineQueue,
    offlineData,

    // Background sync
    registerBackgroundSync,
    syncManagers,

    // Utilities
    getAppManifest,
    processOfflineQueue,
  };
}

export default usePWACapabilities;
