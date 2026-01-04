import { create } from 'zustand';

export interface OfflineOperation {
  id?: number;
  type:
    | 'create_inventory_item'
    | 'update_inventory_item'
    | 'delete_inventory_item'
    | 'apply_treatment';
  payload: unknown;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed' | 'conflict';
  error?: string;
  conflictData?: unknown;
}

interface OfflineQueueState {
  isOnline: boolean;
  queueLength: number;
  conflicts: OfflineOperation[];
  setIsOnline: (online: boolean) => void;
  setQueueLength: (length: number) => void;
  setConflicts: (conflicts: OfflineOperation[]) => void;
  updateQueueStats: (length: number, conflicts: OfflineOperation[]) => void;
}

export const useOfflineQueueStore = create<OfflineQueueState>(set => ({
  isOnline: navigator.onLine,
  queueLength: 0,
  conflicts: [],
  setIsOnline: online => set({ isOnline: online }),
  setQueueLength: length => set({ queueLength: length }),
  setConflicts: conflicts => set({ conflicts }),
  updateQueueStats: (length, conflicts) => set({ queueLength: length, conflicts }),
}));

// Hook to use the offline queue with additional functionality
export const useOfflineQueue = () => {
  const { isOnline, queueLength, conflicts, setConflicts } = useOfflineQueueStore();

  const resolveConflict = (opId: number, resolution: 'overwrite' | 'discard' | 'merge') => {
    // Filter out the resolved conflict
    const updatedConflicts = conflicts.filter(c => c.id !== opId);
    setConflicts(updatedConflicts);

    // Handle the resolution logic here
    console.log(`Resolving conflict ${opId} with resolution: ${resolution}`);
    // TODO: Implement actual conflict resolution logic
    // This should:
    // 1. Apply the chosen resolution strategy (overwrite/discard/merge)
    // 2. Sync with the backend API
    // 3. Update local state accordingly
    // 4. Handle any errors during resolution
    // See tracking issue for implementation plan
  };

  return {
    isOnline,
    queueLength,
    conflicts,
    resolveConflict,
  };
};
