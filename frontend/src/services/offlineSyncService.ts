/**
 * Offline Sync Service
 * Handles syncing offline changes when connection is restored
 */

import { offlineStorage } from './offlineStorage';
import { syncQueueService } from './syncQueueService';
import { useOfflineStore } from '../stores/offlineStore';
import { useEnhancedAuthStore } from '../stores/enhancedAuthStore';
import { SyncQueueItem } from '../types/offline';
import { apiRequest } from './api';

export interface SyncResult {
  success: number;
  failed: number;
  errors: Array<{ item: SyncQueueItem; error: string }>;
}

export interface SyncOptions {
  onProgress?: (completed: number, total: number) => void;
  onItemSuccess?: (item: SyncQueueItem) => void;
  onItemError?: (item: SyncQueueItem, error: Error) => void;
}

class OfflineSyncService {
  private isSyncing = false;
  private syncListeners: Array<(result: SyncResult) => void> = [];

  /**
   * Queue a change for syncing
   */
  async queueChange(
    operation: 'create' | 'update' | 'delete',
    resourceType: 'trip' | 'trip_day' | 'place' | 'shopping' | 'checklist' | 'budget' | 'booking' | 'member',
    resourceId: string,
    data: any
  ): Promise<void> {
    await offlineStorage.addToSyncQueue(
      `${resourceType}_${operation}` as any,
      resourceType as any,
      resourceId,
      data
    );

    // Update offline store
    useOfflineStore.getState().loadSyncQueue();
  }

  /**
   * Sync all pending changes
   */
  async syncAll(options: SyncOptions = {}): Promise<SyncResult> {
    if (this.isSyncing) {
      throw new Error('Sync already in progress');
    }

    if (!navigator.onLine) {
      throw new Error('Cannot sync while offline');
    }

    this.isSyncing = true;
    const offlineStore = useOfflineStore.getState();
    offlineStore.setSyncStatus(true, 0);

    const result: SyncResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    try {
      const queue = await syncQueueService.getQueue();
      const total = queue.length;

      if (total === 0) {
        return result;
      }

      // Process queue
      await syncQueueService.processQueue(
        async (item) => {
          await this.syncItem(item);
        },
        {
          maxRetries: 3,
          retryDelay: 1000,
          onProgress: (completed, total) => {
            const progress = (completed / total) * 100;
            offlineStore.setSyncStatus(true, progress);
            options.onProgress?.(completed, total);
          },
          onItemSuccess: (item) => {
            result.success++;
            options.onItemSuccess?.(item);
          },
          onItemError: (item, error) => {
            result.failed++;
            result.errors.push({ item, error: error.message });
            options.onItemError?.(item, error);
          },
        }
      );

      // Update last sync time
      offlineStore.setLastSyncTime(new Date().toISOString());

      // Notify listeners
      this.notifySyncListeners(result);

      return result;
    } finally {
      this.isSyncing = false;
      offlineStore.setSyncStatus(false, 0);
      offlineStore.loadSyncQueue();
    }
  }

  /**
   * Sync a single item
   */
  private async syncItem(item: SyncQueueItem): Promise<void> {
    const { accessToken } = useEnhancedAuthStore.getState();

    if (!accessToken) {
      throw new Error('Authentication required for syncing');
    }

    const { operation_type, resource_type, resource_id, data } = item;

    // Determine HTTP method and endpoint
    const { method, endpoint } = this.getRequestDetails(
      operation_type,
      resource_type,
      resource_id
    );

    // Make API request
    const response = await apiRequest(endpoint, {
      method,
      body: method !== 'DELETE' ? JSON.stringify(data) : undefined,
      token: accessToken,
    });

    if (!response.success) {
      throw new Error(response.message || 'Sync failed');
    }

    // Update local storage with server response if needed
    if (response.data) {
      await this.updateLocalData(resource_type, resource_id, response.data);
    }
  }

  /**
   * Get request details for sync operation
   */
  private getRequestDetails(
    operation: string,
    resourceType: string,
    resourceId: string
  ): { method: string; endpoint: string } {
    const isCreate = operation.includes('create');
    const isUpdate = operation.includes('update');
    const isDelete = operation.includes('delete');

    let endpoint = '';
    let method = 'GET';

    switch (resourceType) {
      case 'trip':
        endpoint = isCreate ? '/trips' : `/trips/${resourceId}`;
        method = isCreate ? 'POST' : isUpdate ? 'PUT' : 'DELETE';
        break;
      case 'trip_day':
        endpoint = isCreate ? '/trip-days' : `/trip-days/${resourceId}`;
        method = isCreate ? 'POST' : isUpdate ? 'PUT' : 'DELETE';
        break;
      case 'place':
        endpoint = isCreate ? '/places' : `/places/${resourceId}`;
        method = isCreate ? 'POST' : isUpdate ? 'PUT' : 'DELETE';
        break;
      case 'shopping':
        endpoint = isCreate ? '/shopping' : `/shopping/${resourceId}`;
        method = isCreate ? 'POST' : isUpdate ? 'PUT' : 'DELETE';
        break;
      case 'checklist':
        endpoint = isCreate ? '/checklist' : `/checklist/${resourceId}`;
        method = isCreate ? 'POST' : isUpdate ? 'PUT' : 'DELETE';
        break;
      case 'budget':
        endpoint = isCreate ? '/expenses' : `/expenses/${resourceId}`;
        method = isCreate ? 'POST' : isUpdate ? 'PUT' : 'DELETE';
        break;
      case 'booking':
        endpoint = isCreate ? '/bookings' : `/bookings/${resourceId}`;
        method = isCreate ? 'POST' : isUpdate ? 'PUT' : 'DELETE';
        break;
      case 'member':
        endpoint = isCreate ? '/collaborators' : `/collaborators/${resourceId}`;
        method = isCreate ? 'POST' : isUpdate ? 'PUT' : 'DELETE';
        break;
      default:
        throw new Error(`Unknown resource type: ${resourceType}`);
    }

    return { method, endpoint };
  }

  /**
   * Update local data after successful sync
   */
  private async updateLocalData(
    resourceType: string,
    resourceId: string,
    serverData: any
  ): Promise<void> {
    // Update offline storage with server data
    switch (resourceType) {
      case 'trip':
        await offlineStorage.saveTrip(serverData);
        break;
      case 'trip_day':
        await offlineStorage.saveTripDay(serverData);
        break;
      case 'place':
        await offlineStorage.savePlace(serverData);
        break;
      // Add other resource types as needed
    }
  }

  /**
   * Auto-sync when coming back online
   */
  async autoSync(): Promise<void> {
    if (!navigator.onLine || this.isSyncing) {
      return;
    }

    const queue = await syncQueueService.getQueue();
    if (queue.length === 0) {
      return;
    }

    console.log(`Auto-syncing ${queue.length} pending changes...`);

    try {
      const result = await this.syncAll();
      console.log(`Auto-sync complete: ${result.success} succeeded, ${result.failed} failed`);
    } catch (error) {
      console.error('Auto-sync failed:', error);
    }
  }

  /**
   * Initialize auto-sync listeners
   */
  initializeAutoSync(): void {
    // Listen for online events
    window.addEventListener('online', () => {
      console.log('Connection restored, starting auto-sync...');
      setTimeout(() => this.autoSync(), 1000); // Delay to ensure connection is stable
    });

    // Periodic sync check (every 5 minutes when online)
    setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.autoSync();
      }
    }, 5 * 60 * 1000);

    // Sync on page visibility change (when user returns to tab)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && navigator.onLine && !this.isSyncing) {
        this.autoSync();
      }
    });
  }

  /**
   * Subscribe to sync completion events
   */
  onSyncComplete(callback: (result: SyncResult) => void): () => void {
    this.syncListeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.syncListeners.indexOf(callback);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify sync listeners
   */
  private notifySyncListeners(result: SyncResult): void {
    this.syncListeners.forEach(callback => {
      try {
        callback(result);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  /**
   * Check if sync is in progress
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Get pending changes count
   */
  async getPendingChangesCount(): Promise<number> {
    const queue = await syncQueueService.getQueue();
    return queue.length;
  }

  /**
   * Clear sync queue (use with caution)
   */
  async clearQueue(): Promise<void> {
    await syncQueueService.clearCompleted();
    useOfflineStore.getState().loadSyncQueue();
  }
}

export const offlineSyncService = new OfflineSyncService();
export default offlineSyncService;
