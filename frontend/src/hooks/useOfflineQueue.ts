import { useOfflineQueueStore } from '../stores/offlineQueueStore';

export function useOfflineQueue() {
  const { queueLength, isOnline, conflicts, setConflicts } = useOfflineQueueStore();

  const resolveConflict = (opId: number, resolution: 'overwrite' | 'discard' | 'merge') => {
    // TODO: Implement actual conflict resolution logic
    console.log(`Resolving conflict ${opId} with ${resolution}`);

    // For now, just remove the conflict from the list
    setConflicts(conflicts.filter(c => c.id !== opId));
  };

  return {
    queueLength,
    isOnline,
    conflicts,
    resolveConflict,
  };
}
