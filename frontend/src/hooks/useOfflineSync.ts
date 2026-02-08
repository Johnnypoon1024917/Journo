/**
 * useOfflineSync Hook
 * React hook for managing offline sync functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineSyncService, SyncResult } from '../services/offlineSyncService';
import { useOfflineStore } from '../stores/offlineStore';

export interface UseOfflineSyncResult {
  isSyncing: boolean;
  pendingChangesCount: number;
  lastSyncTime: string | null;
  syncError: string | null;
  syncProgress: number;
  syncAll: () => Promise<SyncResult>;
  queueChange: (
    operation: 'create' | 'update' | 'delete',
    resourceType: 'trip' | 'trip_day' | 'place' | 'shopping' | 'checklist' | 'budget' | 'booking' | 'member',
    resourceId: string,
    data: any
  ) => Promise<void>;
  clearQueue: () => Promise<void>;
}

export function useOfflineSync(): UseOfflineSyncResult {
  const {
    isSyncing,
    pendingChangesCount,
    lastSyncTime,
    syncError,
    syncProgress,
    loadSyncQueue,
  } = useOfflineStore();

  const [localSyncing, setLocalSyncing] = useState(false);

  // Load sync queue on mount
  useEffect(() => {
    loadSyncQueue();
  }, [loadSyncQueue]);

  // Sync all pending changes
  const syncAll = useCallback(async (): Promise<SyncResult> => {
    setLocalSyncing(true);
    try {
      const result = await offlineSyncService.syncAll({
        onProgress: (completed, total) => {
          console.log(`Sync progress: ${completed}/${total}`);
        },
      });
      return result;
    } finally {
      setLocalSyncing(false);
    }
  }, []);

  // Queue a change
  const queueChange = useCallback(
    async (
      operation: 'create' | 'update' | 'delete',
      resourceType: 'trip' | 'trip_day' | 'place' | 'shopping' | 'checklist' | 'budget' | 'booking' | 'member',
      resourceId: string,
      data: any
    ): Promise<void> => {
      await offlineSyncService.queueChange(operation, resourceType, resourceId, data);
    },
    []
  );

  // Clear queue
  const clearQueue = useCallback(async (): Promise<void> => {
    await offlineSyncService.clearQueue();
  }, []);

  return {
    isSyncing: isSyncing || localSyncing,
    pendingChangesCount,
    lastSyncTime,
    syncError,
    syncProgress,
    syncAll,
    queueChange,
    clearQueue,
  };
}

export default useOfflineSync;
