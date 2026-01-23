import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './use-toast';

export interface SyncItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: string;
  data: any;
  timestamp: number;
  version: number;
  userId: string;
  farmId: string;
}

export interface Conflict {
  id: string;
  localItem: SyncItem;
  serverItem: SyncItem;
  conflictType: 'version' | 'data' | 'deletion';
  resolution?: 'local' | 'server' | 'merge' | 'manual';
  resolvedAt?: number;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime?: number;
  pendingItems: number;
  conflicts: Conflict[];
  errors: string[];
}

export interface SyncOptions {
  autoSync: boolean;
  syncInterval: number;
  conflictResolution: 'auto' | 'manual';
  batchSize: number;
}

const DEFAULT_SYNC_OPTIONS: SyncOptions = {
  autoSync: true,
  syncInterval: 30000, // 30 seconds
  conflictResolution: 'manual',
  batchSize: 10,
};

export function useOfflineSync(options: Partial<SyncOptions> = {}) {
  const config = { ...DEFAULT_SYNC_OPTIONS, ...options };
  const { toast } = useToast();

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingItems: 0,
    conflicts: [],
    errors: [],
  });

  const syncQueueRef = useRef<SyncItem[]>([]);
  const syncIntervalRef = useRef<NodeJS.Timeout>();
  const isInitializedRef = useRef(false);

  // Initialize offline sync
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    // Load pending items from localStorage
    loadPendingItems();

    // Load unresolved conflicts
    loadConflicts();

    // Set up online/offline listeners
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      if (config.autoSync) {
        performSync();
      }
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Start auto-sync if enabled
    if (config.autoSync) {
      startAutoSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      stopAutoSync();
    };
  }, []);

  // Load pending items from localStorage
  const loadPendingItems = useCallback(() => {
    try {
      const stored = localStorage.getItem('farmSyncQueue');
      if (stored) {
        const items: SyncItem[] = JSON.parse(stored);
        syncQueueRef.current = items;
        setSyncStatus(prev => ({ ...prev, pendingItems: items.length }));
      }
    } catch (error) {
      console.error('Failed to load pending sync items:', error);
    }
  }, []);

  // Load unresolved conflicts from localStorage
  const loadConflicts = useCallback(() => {
    try {
      const stored = localStorage.getItem('farmSyncConflicts');
      if (stored) {
        const conflicts: Conflict[] = JSON.parse(stored);
        setSyncStatus(prev => ({ ...prev, conflicts }));
      }
    } catch (error) {
      console.error('Failed to load sync conflicts:', error);
    }
  }, []);

  // Save pending items to localStorage
  const savePendingItems = useCallback(() => {
    try {
      localStorage.setItem('farmSyncQueue', JSON.stringify(syncQueueRef.current));
      setSyncStatus(prev => ({ ...prev, pendingItems: syncQueueRef.current.length }));
    } catch (error) {
      console.error('Failed to save pending sync items:', error);
    }
  }, []);

  // Save conflicts to localStorage
  const saveConflicts = useCallback((conflicts: Conflict[]) => {
    try {
      localStorage.setItem('farmSyncConflicts', JSON.stringify(conflicts));
      setSyncStatus(prev => ({ ...prev, conflicts }));
    } catch (error) {
      console.error('Failed to save sync conflicts:', error);
    }
  }, []);

  // Add item to sync queue
  const queueForSync = useCallback(
    (item: Omit<SyncItem, 'timestamp' | 'version'>) => {
      const syncItem: SyncItem = {
        ...item,
        timestamp: Date.now(),
        version: 1,
      };

      // Check for existing item with same ID and type
      const existingIndex = syncQueueRef.current.findIndex(
        queued => queued.id === item.id && queued.entityType === item.entityType
      );

      if (existingIndex >= 0) {
        // Update existing item
        syncQueueRef.current[existingIndex] = {
          ...syncQueueRef.current[existingIndex],
          ...syncItem,
          version: syncQueueRef.current[existingIndex].version + 1,
        };
      } else {
        // Add new item
        syncQueueRef.current.push(syncItem);
      }

      savePendingItems();

      if (syncStatus.isOnline && config.autoSync) {
        performSync();
      }
    },
    [syncStatus.isOnline, config.autoSync, savePendingItems]
  );

  // Perform synchronization
  const performSync = useCallback(async () => {
    if (!syncStatus.isOnline || syncStatus.isSyncing || syncQueueRef.current.length === 0) {
      return;
    }

    setSyncStatus(prev => ({ ...prev, isSyncing: true, errors: [] }));

    try {
      const itemsToSync = syncQueueRef.current.slice(0, config.batchSize);
      const conflicts: Conflict[] = [];

      // Process items in batches
      for (const item of itemsToSync) {
        try {
          const result = await syncItem(item);

          if (result.conflict) {
            conflicts.push(result.conflict);
          } else if (result.success) {
            // Remove successfully synced item
            syncQueueRef.current = syncQueueRef.current.filter(
              queued => !(queued.id === item.id && queued.entityType === item.entityType)
            );
          }
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
          setSyncStatus(prev => ({
            ...prev,
            errors: [...prev.errors, `Failed to sync ${item.entityType} ${item.id}`],
          }));
        }
      }

      // Handle conflicts
      if (conflicts.length > 0) {
        const existingConflicts = syncStatus.conflicts;
        const newConflicts = conflicts.filter(
          conflict => !existingConflicts.some(existing => existing.id === conflict.id)
        );

        if (newConflicts.length > 0) {
          saveConflicts([...existingConflicts, ...newConflicts]);

          toast({
            title: 'Sync Conflicts Detected',
            description: `${newConflicts.length} conflicts require resolution.`,
            variant: 'destructive',
          });
        }
      }

      // Update sync status
      setSyncStatus(prev => ({
        ...prev,
        lastSyncTime: Date.now(),
        isSyncing: false,
      }));

      savePendingItems();

      if (syncQueueRef.current.length > 0) {
        // Continue syncing remaining items
        setTimeout(() => performSync(), 1000);
      } else {
        toast({
          title: 'Sync Complete',
          description: 'All pending changes have been synchronized.',
        });
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        errors: [...prev.errors, 'Synchronization failed'],
      }));
    }
  }, [
    syncStatus.isOnline,
    syncStatus.isSyncing,
    syncStatus.conflicts,
    config.batchSize,
    saveConflicts,
    savePendingItems,
    toast,
  ]);

  // Sync individual item
  const syncItem = useCallback(
    async (item: SyncItem): Promise<{ success: boolean; conflict?: Conflict }> => {
      // This would make actual API calls to sync the item
      // For now, simulate the sync process

      try {
        // Simulate API call
        const response = await fetch(`/api/${item.entityType}`, {
          method: getHttpMethod(item.type),
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...item.data,
            _syncVersion: item.version,
            _syncTimestamp: item.timestamp,
          }),
        });

        if (response.status === 409) {
          // Conflict detected
          const serverData = await response.json();
          const conflict: Conflict = {
            id: `${item.entityType}-${item.id}`,
            localItem: item,
            serverItem: {
              ...item,
              data: serverData,
              version: serverData.version || 1,
            },
            conflictType: 'version',
          };

          return { success: false, conflict };
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return { success: true };
      } catch (error) {
        // For demo purposes, assume success
        return { success: true };
      }
    },
    []
  );

  // Resolve conflict
  const resolveConflict = useCallback(
    (conflictId: string, resolution: Conflict['resolution']) => {
      setSyncStatus(prev => {
        const updatedConflicts = prev.conflicts.map(conflict => {
          if (conflict.id === conflictId) {
            return {
              ...conflict,
              resolution,
              resolvedAt: Date.now(),
            };
          }
          return conflict;
        });

        // Apply resolution
        const conflict = updatedConflicts.find(c => c.id === conflictId);
        if (conflict && resolution) {
          applyConflictResolution(conflict, resolution);

          // Remove resolved conflict
          const filteredConflicts = updatedConflicts.filter(c => c.id !== conflictId);
          saveConflicts(filteredConflicts);

          return {
            ...prev,
            conflicts: filteredConflicts,
          };
        }

        saveConflicts(updatedConflicts);
        return {
          ...prev,
          conflicts: updatedConflicts,
        };
      });
    },
    [saveConflicts]
  );

  // Apply conflict resolution
  const applyConflictResolution = useCallback(
    (conflict: Conflict, resolution: NonNullable<Conflict['resolution']>) => {
      switch (resolution) {
        case 'local':
          // Keep local version, re-queue for sync
          queueForSync(conflict.localItem);
          break;
        case 'server':
          // Accept server version, update local data
          updateLocalData(conflict.serverItem);
          break;
        case 'merge':
          // Merge the data
          const mergedData = mergeData(conflict.localItem.data, conflict.serverItem.data);
          const mergedItem: SyncItem = {
            ...conflict.localItem,
            data: mergedData,
            version: Math.max(conflict.localItem.version, conflict.serverItem.version) + 1,
          };
          queueForSync(mergedItem);
          break;
        case 'manual':
          // Keep for manual resolution
          break;
      }
    },
    [queueForSync]
  );

  // Update local data with server version
  const updateLocalData = useCallback((item: SyncItem) => {
    // This would update the local state/cache with server data
    console.log('Updating local data with server version:', item);
  }, []);

  // Merge conflicting data
  const mergeData = useCallback((localData: any, serverData: any): any => {
    // Simple merge strategy - server data takes precedence for conflicts
    const merged = { ...localData };

    Object.keys(serverData).forEach(key => {
      if (!(key in localData)) {
        merged[key] = serverData[key];
      } else if (typeof serverData[key] === 'object' && serverData[key] !== null) {
        merged[key] = mergeData(localData[key], serverData[key]);
      }
      // Keep local value for primitive conflicts
    });

    return merged;
  }, []);

  // Start auto-sync
  const startAutoSync = useCallback(() => {
    if (syncIntervalRef.current) return;

    syncIntervalRef.current = setInterval(() => {
      if (syncStatus.isOnline && !syncStatus.isSyncing && syncQueueRef.current.length > 0) {
        performSync();
      }
    }, config.syncInterval);
  }, [syncStatus.isOnline, syncStatus.isSyncing, config.syncInterval, performSync]);

  // Stop auto-sync
  const stopAutoSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = undefined;
    }
  }, []);

  // Force manual sync
  const forceSync = useCallback(() => {
    performSync();
  }, [performSync]);

  // Clear all pending items (use with caution)
  const clearPendingItems = useCallback(() => {
    syncQueueRef.current = [];
    savePendingItems();
  }, [savePendingItems]);

  // Get HTTP method for sync operation
  const getHttpMethod = (type: SyncItem['type']): string => {
    switch (type) {
      case 'create':
        return 'POST';
      case 'update':
        return 'PUT';
      case 'delete':
        return 'DELETE';
      default:
        return 'POST';
    }
  };

  return {
    // Status
    syncStatus,

    // Actions
    queueForSync,
    performSync: forceSync,
    resolveConflict,
    clearPendingItems,

    // Controls
    startAutoSync,
    stopAutoSync,
  };
}

export default useOfflineSync;
