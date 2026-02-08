/**
 * Sync Queue Service
 * Manages the queue of pending operations with IndexedDB persistence
 */

import { offlineStorage } from './offlineStorage';
import { SyncQueueItem } from '../types/offline';
import { SyncOperationType, SyncResourceType } from '../types/trip';
import { retryWithBackoff, getUserFriendlyErrorMessage } from '../utils/errorHandling';

export interface SyncQueueOptions {
  maxRetries?: number;
  retryDelay?: number;
  onProgress?: (completed: number, total: number) => void;
  onItemSuccess?: (item: SyncQueueItem) => void;
  onItemError?: (item: SyncQueueItem, error: Error) => void;
}

class SyncQueueService {
  private isProcessing = false;
  private processingItem: SyncQueueItem | null = null;

  /**
   * Add an operation to the sync queue
   */
  async addToQueue(
    operation: SyncOperationType,
    resourceType: SyncResourceType,
    resourceId: string,
    data: any
  ): Promise<SyncQueueItem> {
    return await offlineStorage.addToSyncQueue(operation, resourceType, resourceId, data);
  }

  /**
   * Get all pending items in the queue
   */
  async getQueue(): Promise<SyncQueueItem[]> {
    return await offlineStorage.getSyncQueue();
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    failed: number;
  }> {
    const queue = await this.getQueue();
    return {
      total: queue.length,
      pending: queue.filter(item => item.status === 'pending').length,
      processing: queue.filter(item => item.status === 'processing').length,
      failed: queue.filter(item => item.status === 'failed').length,
    };
  }

  /**
   * Process all items in the queue
   */
  async processQueue(
    syncFn: (item: SyncQueueItem) => Promise<void>,
    options: SyncQueueOptions = {}
  ): Promise<void> {
    if (this.isProcessing) {
      console.log('Queue is already being processed');
      return;
    }

    this.isProcessing = true;

    try {
      const queue = await this.getQueue();
      const pendingItems = queue.filter(
        item => item.status === 'pending' || item.status === 'failed'
      );

      let completed = 0;
      const total = pendingItems.length;

      for (const item of pendingItems) {
        this.processingItem = item;
        
        try {
          // Update status to processing
          item.status = 'processing';
          await offlineStorage.updateSyncQueueItem(item);

          // Process the item with retry logic
          await retryWithBackoff(
            () => syncFn(item),
            {
              maxRetries: options.maxRetries ?? 3,
              retryDelay: options.retryDelay ?? 1000,
              onRetry: (error, attempt) => {
                console.log(`Retrying sync for ${item.id}, attempt ${attempt}`, error);
                item.retry_count = attempt;
              },
            }
          );

          // Mark as completed and remove from queue
          item.status = 'completed';
          await offlineStorage.removeSyncQueueItem(item.id);
          
          completed++;
          options.onProgress?.(completed, total);
          options.onItemSuccess?.(item);
        } catch (error) {
          // Mark as failed
          item.status = 'failed';
          item.error_message = getUserFriendlyErrorMessage(error as Error);
          item.last_error = item.error_message; // Backward compatibility
          await offlineStorage.updateSyncQueueItem(item);
          
          options.onItemError?.(item, error as Error);
          console.error(`Failed to sync item ${item.id}:`, error);
        }
      }
    } finally {
      this.isProcessing = false;
      this.processingItem = null;
    }
  }

  /**
   * Process a single item from the queue
   */
  async processItem(
    itemId: string,
    syncFn: (item: SyncQueueItem) => Promise<void>,
    options: SyncQueueOptions = {}
  ): Promise<void> {
    const queue = await this.getQueue();
    const item = queue.find(q => q.id === itemId);

    if (!item) {
      throw new Error(`Queue item ${itemId} not found`);
    }

    try {
      item.status = 'processing';
      await offlineStorage.updateSyncQueueItem(item);

      await retryWithBackoff(
        () => syncFn(item),
        {
          maxRetries: options.maxRetries ?? 3,
          retryDelay: options.retryDelay ?? 1000,
        }
      );

      item.status = 'completed';
      await offlineStorage.removeSyncQueueItem(item.id);
      options.onItemSuccess?.(item);
    } catch (error) {
      item.status = 'failed';
      item.error_message = getUserFriendlyErrorMessage(error as Error);
      item.last_error = item.error_message; // Backward compatibility
      await offlineStorage.updateSyncQueueItem(item);
      options.onItemError?.(item, error as Error);
      throw error;
    }
  }

  /**
   * Remove an item from the queue
   */
  async removeItem(itemId: string): Promise<void> {
    await offlineStorage.removeSyncQueueItem(itemId);
  }

  /**
   * Clear all completed items from the queue
   */
  async clearCompleted(): Promise<void> {
    await offlineStorage.clearCompletedSyncItems();
  }

  /**
   * Check if queue is currently processing
   */
  isQueueProcessing(): boolean {
    return this.isProcessing;
  }

  /**
   * Get the currently processing item
   */
  getCurrentItem(): SyncQueueItem | null {
    return this.processingItem;
  }
}

export const syncQueueService = new SyncQueueService();
export default syncQueueService;
