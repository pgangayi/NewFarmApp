import { useEffect } from 'react';
import Dexie from 'dexie';
import { useOfflineQueueStore } from '../stores/offlineQueueStore';

interface OfflineOperation {
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

class OfflineQueueDB extends Dexie {
  operations: Dexie.Table<OfflineOperation, number>;

  constructor() {
    super('FarmersBootOffline');
    this.version(2).stores({
      operations: '++id, type, timestamp, retryCount, status',
    });
    this.operations = this.table('operations');
  }
}

const db = new OfflineQueueDB();

export function useOfflineQueue() {
  const { isOnline, queueLength, conflicts, setIsOnline, updateQueueStats } =
    useOfflineQueueStore();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial queue length and conflicts
    updateStats();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateStats = async () => {
    const count = await db.operations.where('status').equals('pending').count();
    const conflictOps = await db.operations.where('status').equals('conflict').toArray();
    updateQueueStats(count, conflictOps);
  };

  const addToQueue = async (type: OfflineOperation['type'], payload: unknown) => {
    await db.operations.add({
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    });
    updateStats();
  };

  const processQueue = async () => {
    if (!isOnline) return;

    const operations = await db.operations.where('status').equals('pending').sortBy('timestamp');

    for (const op of operations) {
      try {
        await db.operations.update(op.id!, { status: 'syncing' });

        const result = await processOperation(op);

        if (result.success) {
          await db.operations.delete(op.id!);
        } else if (result.conflict) {
          await db.operations.update(op.id!, {
            status: 'conflict',
            error: result.error,
            conflictData: result.conflictData,
          });
        } else {
          await db.operations.update(op.id!, {
            status: 'failed',
            retryCount: op.retryCount + 1,
            error: result.error,
          });
        }
      } catch (error) {
        await db.operations.update(op.id!, {
          status: 'failed',
          retryCount: op.retryCount + 1,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    updateStats();
  };

  const processOperation = async (op: OfflineOperation) => {
    const token = localStorage.getItem('authToken');
    if (!token) return { success: false, error: 'No auth token' };

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    try {
      switch (op.type) {
        case 'create_inventory_item':
          const createRes = await fetch('/api/inventory/items', {
            method: 'POST',
            headers,
            body: JSON.stringify(op.payload),
          });
          if (createRes.status === 409) {
            const conflictData = await createRes.json();
            return { success: false, conflict: true, error: 'Item already exists', conflictData };
          }
          if (!createRes.ok) throw new Error(`HTTP ${createRes.status}`);
          return { success: true };

        case 'update_inventory_item':
          const updateRes = await fetch(`/api/inventory/items/${op.payload.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(op.payload),
          });
          if (updateRes.status === 409) {
            const conflictData = await updateRes.json();
            return {
              success: false,
              conflict: true,
              error: 'Item was modified by another user',
              conflictData,
            };
          }
          if (!updateRes.ok) throw new Error(`HTTP ${updateRes.status}`);
          return { success: true };

        case 'delete_inventory_item':
          const deleteRes = await fetch(`/api/inventory/items/${op.payload.id}`, {
            method: 'DELETE',
            headers,
          });
          if (!deleteRes.ok) throw new Error(`HTTP ${deleteRes.status}`);
          return { success: true };

        case 'apply_treatment':
          const treatmentRes = await fetch('/api/operations/apply-treatment', {
            method: 'POST',
            headers: {
              ...headers,
              'Idempotency-Key': op.payload.idempotencyKey || `offline-${op.timestamp}`,
            },
            body: JSON.stringify(op.payload),
          });
          if (treatmentRes.status === 409) {
            const conflictData = await treatmentRes.json();
            return {
              success: false,
              conflict: true,
              error: 'Insufficient inventory',
              conflictData,
            };
          }
          if (!treatmentRes.ok) throw new Error(`HTTP ${treatmentRes.status}`);
          return { success: true };

        default:
          throw new Error(`Unknown operation type: ${op.type}`);
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  };

  const resolveConflict = async (
    opId: number,
    resolution: 'overwrite' | 'discard' | 'merge',
    updatedPayload?: unknown
  ) => {
    const op = await db.operations.get(opId);
    if (!op) return;

    if (resolution === 'discard') {
      await db.operations.delete(opId);
    } else if (resolution === 'overwrite') {
      await db.operations.update(opId, {
        status: 'pending',
        payload: updatedPayload || op.payload,
        retryCount: 0,
        error: undefined,
        conflictData: undefined,
      });
    } else if (resolution === 'merge') {
      // For merge, we'd need specific logic per operation type
      // For now, treat as overwrite
      await db.operations.update(opId, {
        status: 'pending',
        payload: updatedPayload || op.payload,
        retryCount: 0,
        error: undefined,
        conflictData: undefined,
      });
    }

    updateStats();
  };

  useEffect(() => {
    if (isOnline && queueLength > 0) {
      processQueue();
    }
  }, [isOnline, queueLength]);

  return { addToQueue, queueLength, isOnline, conflicts, resolveConflict };
}
