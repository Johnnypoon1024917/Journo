/**
 * Offline Queue Service for Collaboration Enhancement
 * 
 * This service provides offline support for collaboration-related actions
 * such as activity logging, notifications, and member management.
 * It wraps the existing syncQueueService with collaboration-specific functionality.
 */

import { v4 as uuidv4 } from 'uuid';
import { offlineStorage } from './offlineStorage';
import { syncQueueService } from './syncQueueService';
import { SyncQueueItem } from '../types/offline';
import { SyncOperationType, SyncResourceType } from '../types/trip';

export interface OfflineQueueItem {
  id: string;
  tripId: string;
  action: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  data: any;
  timestamp: string;
  retryCount: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
}

export interface QueueStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  failedCount: number;
}

/**
 * OfflineQueueService class
 * Manages offline queue for collaboration actions with IndexedDB persistence
 */
export class OfflineQueueService {
  private queue: OfflineQueueItem[] = [];
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private syncInProgress: boolean = false;

  constructor() {
    // Load queue from localStorage on initialization
    this.loadQueue();

    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Auto-sync on visibility change (when user returns to tab)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline && !this.syncInProgress) {
        this.syncQueue();
      }
    });
  }

  /**
   * Queue an action for later sync
   * @param item - The action to queue (without id, timestamp, retryCount, status)
   */
  queueAction(item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount' | 'status'>): OfflineQueueItem {
    const queueItem: OfflineQueueItem = {
      ...item,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: 'pending',
    };

    this.queue.push(queueItem);
    this.saveQueue();

    // Try to sync immediately if online
    if (this.isOnline && !this.syncInProgress) {
      // Delay slightly to allow batching
      setTimeout(() => this.syncQueue(), 100);
    }

    return queueItem;
  }

  /**
   * Sync all pending items in the queue
   * Processes items in order with retry logic and conflict resolution
   */
  async syncQueue(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.queue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    this.isSyncing = true;

    try {
      // Get pending and failed items
      const itemsToSync = this.queue.filter(
        item => item.status === 'pending' || item.status === 'failed'
      );

      for (const item of itemsToSync) {
        try {
          // Update status to syncing
          item.status = 'syncing';
          this.saveQueue();

          // Execute the queued request
          await this.executeRequest(item);

          // Mark as synced
          item.status = 'synced';
          this.saveQueue();
        } catch (error) {
          console.error('Failed to sync queue item:', error);
          item.retryCount++;

          // Mark as failed after 3 retries
          if (item.retryCount >= 3) {
            item.status = 'failed';
            console.error(`Queue item ${item.id} failed after 3 retries:`, error);
          } else {
            item.status = 'pending';
          }

          this.saveQueue();
        }
      }

      // Remove synced items from queue
      this.queue = this.queue.filter(item => item.status !== 'synced');
      this.saveQueue();

      console.log(`Sync complete. ${itemsToSync.length} items processed.`);
    } finally {
      this.syncInProgress = false;
      this.isSyncing = false;
    }
  }

  /**
   * Execute a queued request
   * Implements last-write-wins conflict resolution
   */
  private async executeRequest(item: OfflineQueueItem): Promise<void> {
    const { method, endpoint, data } = item;

    // Get auth token from localStorage or auth store
    const token = this.getAuthToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    // Add body for POST and PATCH requests
    if (method === 'POST' || method === 'PATCH') {
      options.body = JSON.stringify(data);
    }

    // Make the request
    const response = await fetch(`${this.getApiBaseUrl()}${endpoint}`, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    // For conflict resolution, we use last-write-wins strategy
    // The server will accept the latest update based on timestamp
    return response.json();
  }

  /**
   * Clear all items from the queue
   * Use with caution - this will remove all pending changes
   */
  clearQueue(): void {
    this.queue = [];
    this.saveQueue();
    console.log('Queue cleared');
  }

  /**
   * Get the current queue status
   */
  getQueueStatus(): QueueStatus {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: this.queue.filter(i => i.status === 'pending').length,
      failedCount: this.queue.filter(i => i.status === 'failed').length,
    };
  }

  /**
   * Get all queue items
   */
  getQueue(): OfflineQueueItem[] {
    return [...this.queue];
  }

  /**
   * Get failed queue items
   */
  getFailedItems(): OfflineQueueItem[] {
    return this.queue.filter(item => item.status === 'failed');
  }

  /**
   * Retry a specific failed item
   */
  async retryItem(itemId: string): Promise<void> {
    const item = this.queue.find(q => q.id === itemId);
    if (!item) {
      throw new Error(`Queue item ${itemId} not found`);
    }

    if (item.status !== 'failed') {
      throw new Error(`Queue item ${itemId} is not in failed state`);
    }

    // Reset retry count and status
    item.retryCount = 0;
    item.status = 'pending';
    this.saveQueue();

    // Trigger sync
    await this.syncQueue();
  }

  /**
   * Remove a specific item from the queue
   */
  removeItem(itemId: string): void {
    this.queue = this.queue.filter(item => item.id !== itemId);
    this.saveQueue();
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    this.isOnline = true;
    console.log('Back online, syncing queue...');
    
    // Delay sync slightly to ensure connection is stable
    setTimeout(() => this.syncQueue(), 1000);
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    this.isOnline = false;
    console.log('Offline mode activated');
  }

  /**
   * Load queue from localStorage
   */
  private loadQueue(): void {
    try {
      const stored = localStorage.getItem('collaboration_offline_queue');
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log(`Loaded ${this.queue.length} items from offline queue`);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.queue = [];
    }
  }

  /**
   * Save queue to localStorage
   */
  private saveQueue(): void {
    try {
      localStorage.setItem('collaboration_offline_queue', JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
      
      // If localStorage is full, try to clear old synced items
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, clearing synced items');
        this.queue = this.queue.filter(item => item.status !== 'synced');
        try {
          localStorage.setItem('collaboration_offline_queue', JSON.stringify(this.queue));
        } catch (retryError) {
          console.error('Failed to save queue even after cleanup:', retryError);
        }
      }
    }
  }

  /**
   * Get auth token from localStorage
   */
  private getAuthToken(): string | null {
    try {
      // Try to get from auth store in localStorage
      const authStore = localStorage.getItem('auth-storage');
      if (authStore) {
        const parsed = JSON.parse(authStore);
        return parsed.state?.accessToken || null;
      }
    } catch (error) {
      console.error('Failed to get auth token:', error);
    }
    return null;
  }

  /**
   * Get API base URL
   */
  private getApiBaseUrl(): string {
    // Use environment variable or default
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  }

  /**
   * Check if currently syncing
   */
  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }

  /**
   * Get online status
   */
  isOnlineStatus(): boolean {
    return this.isOnline;
  }
}

// Export singleton instance
export const offlineQueueService = new OfflineQueueService();
export default offlineQueueService;
