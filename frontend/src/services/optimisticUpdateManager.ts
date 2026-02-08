/**
 * OptimisticUpdateManager
 * Handles optimistic UI updates with rollback capability
 */

import { offlineStorage } from './offlineStorage';
import { SyncOperationType, SyncResourceType } from '../types/trip';

export interface OptimisticUpdate<T = any> {
  id: string;
  type: 'place_reorder' | 'place_update' | 'place_delete' | 'place_create';
  optimisticData: T;
  originalData: T;
  timestamp: Date;
  status: 'pending' | 'processing' | 'success' | 'failed';
  error?: Error;
  retryCount: number;
}

export interface UpdateOptions {
  maxRetries?: number;
  retryDelay?: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onRollback?: () => void;
}

class OptimisticUpdateManagerService {
  private updates: Map<string, OptimisticUpdate> = new Map();
  private queue: string[] = [];
  private isProcessing = false;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;

  /**
   * Apply an optimistic update with automatic rollback on failure
   */
  async applyUpdate<T>(
    id: string,
    type: OptimisticUpdate['type'],
    optimisticData: T,
    originalData: T,
    updateFn: () => Promise<T>,
    options: UpdateOptions = {}
  ): Promise<void> {
    const update: OptimisticUpdate<T> = {
      id,
      type,
      optimisticData,
      originalData,
      timestamp: new Date(),
      status: 'pending',
      retryCount: 0,
    };

    this.updates.set(id, update);
    this.queue.push(id);

    // Add to IndexedDB sync queue
    await this.addToSyncQueue(type, id, optimisticData);

    // Process the queue
    this.processQueue(updateFn, options);
  }

  /**
   * Process the update queue sequentially
   */
  private async processQueue<T>(
    updateFn: () => Promise<T>,
    options: UpdateOptions
  ): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const updateId = this.queue[0];
      const update = this.updates.get(updateId);

      if (!update) {
        this.queue.shift();
        continue;
      }

      update.status = 'processing';

      try {
        await updateFn();
        update.status = 'success';
        
        // Remove from sync queue
        await this.removeFromSyncQueue(updateId);
        
        // Call success callback
        options.onSuccess?.();
        
        // Remove from queue and updates
        this.queue.shift();
        this.updates.delete(updateId);
      } catch (error) {
        update.error = error as Error;
        update.retryCount++;

        const maxRetries = options.maxRetries ?? this.MAX_RETRIES;

        if (update.retryCount < maxRetries) {
          // Retry after delay
          update.status = 'pending';
          const delay = options.retryDelay ?? this.RETRY_DELAY;
          await new Promise(resolve => setTimeout(resolve, delay * update.retryCount));
        } else {
          // Max retries reached, rollback
          update.status = 'failed';
          await this.rollback(updateId);
          options.onError?.(error as Error);
          options.onRollback?.();
          
          // Remove from queue
          this.queue.shift();
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Rollback an update to its original state
   */
  async rollback(updateId: string): Promise<void> {
    const update = this.updates.get(updateId);
    if (!update) {
      return;
    }

    // Remove from sync queue
    await this.removeFromSyncQueue(updateId);
    
    // Remove from updates
    this.updates.delete(updateId);
  }

  /**
   * Get the current status of an update
   */
  getUpdateStatus(updateId: string): OptimisticUpdate['status'] | null {
    return this.updates.get(updateId)?.status ?? null;
  }

  /**
   * Check if an update is pending
   */
  isUpdatePending(updateId: string): boolean {
    const update = this.updates.get(updateId);
    return update?.status === 'pending' || update?.status === 'processing';
  }

  /**
   * Get all pending updates
   */
  getPendingUpdates(): OptimisticUpdate[] {
    return Array.from(this.updates.values()).filter(
      update => update.status === 'pending' || update.status === 'processing'
    );
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    pending: number;
    processing: number;
    failed: number;
    isProcessing: boolean;
  } {
    const updates = Array.from(this.updates.values());
    return {
      pending: updates.filter(u => u.status === 'pending').length,
      processing: updates.filter(u => u.status === 'processing').length,
      failed: updates.filter(u => u.status === 'failed').length,
      isProcessing: this.isProcessing,
    };
  }

  /**
   * Clear all updates
   */
  clear(): void {
    this.updates.clear();
    this.queue = [];
    this.isProcessing = false;
  }

  /**
   * Add update to IndexedDB sync queue
   */
  private async addToSyncQueue(
    type: OptimisticUpdate['type'],
    resourceId: string,
    data: any
  ): Promise<void> {
    const operationMap: Record<OptimisticUpdate['type'], SyncOperationType> = {
      place_create: 'place_create',
      place_update: 'place_update',
      place_delete: 'place_delete',
      place_reorder: 'place_reorder',
    };

    const operation = operationMap[type];
    const resourceType: SyncResourceType = 'place';

    await offlineStorage.addToSyncQueue(operation, resourceType, resourceId, data);
  }

  /**
   * Remove update from IndexedDB sync queue
   */
  private async removeFromSyncQueue(updateId: string): Promise<void> {
    const queue = await offlineStorage.getSyncQueue();
    const item = queue.find(q => q.resource_id === updateId);
    if (item) {
      await offlineStorage.removeSyncQueueItem(item.id);
    }
  }
}

export const optimisticUpdateManager = new OptimisticUpdateManagerService();
export default optimisticUpdateManager;
