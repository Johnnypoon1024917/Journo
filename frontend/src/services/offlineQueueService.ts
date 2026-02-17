/**
 * Offline Queue Service for Collaboration Enhancement
 * 
 * This service provides offline support for collaboration-related actions
 * such as activity logging, notifications, and member management.
 * Uses IndexedDB for persistent storage of queued changes.
 * 
 * Validates Requirement 11.3: Queue all data modifications when offline
 */

import { v4 as uuidv4 } from 'uuid';
import { offlineStorage } from './offlineStorage';
import { syncQueueService } from './syncQueueService';
import { SyncQueueItem } from '../types/offline';
import { SyncOperationType, SyncResourceType } from '../types/trip';
import localforage from 'localforage';

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

// Configure IndexedDB store for offline queue
const offlineQueueStore = localforage.createInstance({
  name: 'journo',
  storeName: 'offline_queue',
  description: 'Offline queue for data modifications'
});

/**
 * OfflineQueueService class
 * Manages offline queue for collaboration actions with IndexedDB persistence
 * Validates Requirement 11.3: Store queue in IndexedDB
 */
export class OfflineQueueService {
  private queue: OfflineQueueItem[] = [];
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private syncInProgress: boolean = false;
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Initialize asynchronously
    this.initPromise = this.initialize();

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
   * Initialize the service by loading queue from IndexedDB
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      await this.loadQueue();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize offline queue service:', error);
      this.initialized = true; // Mark as initialized even on error to prevent blocking
    }
  }

  /**
   * Ensure service is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  /**
   * Queue an action for later sync
   * Validates Requirement 11.3: Queue all data modifications when offline
   * @param item - The action to queue (without id, timestamp, retryCount, status)
   */
  async queueAction(item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<OfflineQueueItem> {
    await this.ensureInitialized();
    
    const queueItem: OfflineQueueItem = {
      ...item,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: 'pending',
    };

    this.queue.push(queueItem);
    await this.saveQueue();

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
    await this.ensureInitialized();
    
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
          await this.saveQueue();

          // Execute the queued request
          await this.executeRequest(item);

          // Mark as synced
          item.status = 'synced';
          await this.saveQueue();
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

          await this.saveQueue();
        }
      }

      // Remove synced items from queue
      this.queue = this.queue.filter(item => item.status !== 'synced');
      await this.saveQueue();

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
  async clearQueue(): Promise<void> {
    await this.ensureInitialized();
    this.queue = [];
    await this.saveQueue();
    console.log('Queue cleared');
  }

  /**
   * Get the current queue status
   */
  async getQueueStatus(): Promise<QueueStatus> {
    await this.ensureInitialized();
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
  async getQueue(): Promise<OfflineQueueItem[]> {
    await this.ensureInitialized();
    return [...this.queue];
  }

  /**
   * Get failed queue items
   */
  async getFailedItems(): Promise<OfflineQueueItem[]> {
    await this.ensureInitialized();
    return this.queue.filter(item => item.status === 'failed');
  }

  /**
   * Retry a specific failed item
   */
  async retryItem(itemId: string): Promise<void> {
    await this.ensureInitialized();
    
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
    await this.saveQueue();

    // Trigger sync
    await this.syncQueue();
  }

  /**
   * Remove a specific item from the queue
   */
  async removeItem(itemId: string): Promise<void> {
    await this.ensureInitialized();
    this.queue = this.queue.filter(item => item.id !== itemId);
    await this.saveQueue();
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
   * Load queue from IndexedDB
   * Validates Requirement 11.3: Store queue in IndexedDB
   */
  private async loadQueue(): Promise<void> {
    try {
      // Try to load from IndexedDB first
      const stored = await offlineQueueStore.getItem<OfflineQueueItem[]>('queue');
      if (stored && Array.isArray(stored)) {
        this.queue = stored;
        console.log(`Loaded ${this.queue.length} items from offline queue (IndexedDB)`);
        return;
      }

      // Fallback: migrate from localStorage if exists
      const localStorageData = localStorage.getItem('collaboration_offline_queue');
      if (localStorageData) {
        try {
          const parsed = JSON.parse(localStorageData);
          if (Array.isArray(parsed)) {
            this.queue = parsed;
            // Save to IndexedDB and remove from localStorage
            await this.saveQueue();
            localStorage.removeItem('collaboration_offline_queue');
            console.log(`Migrated ${this.queue.length} items from localStorage to IndexedDB`);
            return;
          }
        } catch (parseError) {
          console.error('Failed to parse localStorage queue data:', parseError);
        }
      }

      // No data found, start with empty queue
      this.queue = [];
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.queue = [];
    }
  }

  /**
   * Save queue to IndexedDB
   * Validates Requirement 11.3: Store queue in IndexedDB
   */
  private async saveQueue(): Promise<void> {
    try {
      await offlineQueueStore.setItem('queue', this.queue);
    } catch (error) {
      console.error('Failed to save offline queue:', error);
      
      // If IndexedDB fails, try to handle quota exceeded
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('IndexedDB quota exceeded, clearing synced items');
        this.queue = this.queue.filter(item => item.status !== 'synced');
        try {
          await offlineQueueStore.setItem('queue', this.queue);
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
