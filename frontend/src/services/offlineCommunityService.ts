/**
 * Offline Community Service
 * 
 * This service provides offline support for community-related actions
 * such as likes, reposts, bookmarks, and post creation.
 * Uses IndexedDB for persistent storage of queued actions and cached feed data.
 * 
 * Validates Requirements 13.1, 13.3, 13.4, 13.5
 */

import { v4 as uuidv4 } from 'uuid';
import localforage from 'localforage';
import { PostWithEngagement } from '../types/community';

export interface CommunityOfflineAction {
  id: string;
  type: 'like' | 'unlike' | 'repost' | 'unrepost' | 'bookmark' | 'unbookmark' | 'create_post' | 'delete_post';
  postId: string;
  data?: any;
  timestamp: string;
  retryCount: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
}

export interface CachedFeed {
  feedType: 'forYou' | 'following' | 'community';
  communityId?: string;
  posts: PostWithEngagement[];
  cursor: string | null;
  timestamp: string;
}

// Configure IndexedDB stores
const offlineActionsStore = localforage.createInstance({
  name: 'journo',
  storeName: 'community_offline_actions',
  description: 'Offline queue for community actions'
});

const cachedFeedsStore = localforage.createInstance({
  name: 'journo',
  storeName: 'community_cached_feeds',
  description: 'Cached community feed data'
});

/**
 * OfflineCommunityService class
 * Manages offline queue for community actions and feed caching
 * Validates Requirements 13.1, 13.3, 13.4, 13.5
 */
export class OfflineCommunityService {
  private actions: CommunityOfflineAction[] = [];
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private syncInProgress: boolean = false;
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;
  private syncCallbacks: Array<(success: boolean) => void> = [];

  constructor() {
    // Initialize asynchronously
    this.initPromise = this.initialize();

    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Auto-sync on visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline && !this.syncInProgress) {
        this.syncActions();
      }
    });
  }

  /**
   * Initialize the service by loading actions from IndexedDB
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      await this.loadActions();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize offline community service:', error);
      this.initialized = true;
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
   * Validates Requirement 13.1: Queue actions in local storage when offline
   * @param type - The type of action
   * @param postId - The post ID
   * @param data - Optional data for the action
   */
  async queueAction(
    type: CommunityOfflineAction['type'],
    postId: string,
    data?: any
  ): Promise<CommunityOfflineAction> {
    await this.ensureInitialized();
    
    const action: CommunityOfflineAction = {
      id: uuidv4(),
      type,
      postId,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: 'pending',
    };

    this.actions.push(action);
    await this.saveActions();

    console.log(`Queued ${type} action for post ${postId}`);

    // Try to sync immediately if online
    if (this.isOnline && !this.syncInProgress) {
      setTimeout(() => this.syncActions(), 100);
    }

    return action;
  }

  /**
   * Sync all pending actions
   * Validates Requirement 13.3: Sync queued actions on reconnection
   */
  async syncActions(): Promise<{ success: boolean; syncedCount: number; failedCount: number }> {
    await this.ensureInitialized();
    
    if (this.syncInProgress || !this.isOnline || this.actions.length === 0) {
      return { success: true, syncedCount: 0, failedCount: 0 };
    }

    this.syncInProgress = true;
    this.isSyncing = true;

    let syncedCount = 0;
    let failedCount = 0;

    try {
      const itemsToSync = this.actions.filter(
        action => action.status === 'pending' || action.status === 'failed'
      );

      for (const action of itemsToSync) {
        try {
          action.status = 'syncing';
          await this.saveActions();

          await this.executeAction(action);

          action.status = 'synced';
          syncedCount++;
          await this.saveActions();
        } catch (error) {
          console.error(`Failed to sync action ${action.id}:`, error);
          action.retryCount++;

          // Mark as failed after 3 retries
          // Validates Requirement 13.4: Notify user and offer retry on failure
          if (action.retryCount >= 3) {
            action.status = 'failed';
            failedCount++;
            console.error(`Action ${action.id} failed after 3 retries`);
          } else {
            action.status = 'pending';
          }

          await this.saveActions();
        }
      }

      // Remove synced actions
      this.actions = this.actions.filter(action => action.status !== 'synced');
      await this.saveActions();

      console.log(`Sync complete. ${syncedCount} synced, ${failedCount} failed.`);

      // Notify callbacks
      this.syncCallbacks.forEach(cb => cb(failedCount === 0));
      this.syncCallbacks = [];

      return { success: failedCount === 0, syncedCount, failedCount };
    } finally {
      this.syncInProgress = false;
      this.isSyncing = false;
    }
  }

  /**
   * Execute a queued action
   */
  private async executeAction(action: CommunityOfflineAction): Promise<void> {
    const token = this.getAuthToken();
    const baseUrl = this.getApiBaseUrl();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let endpoint: string;
    let method: string;
    let body: any = undefined;

    switch (action.type) {
      case 'like':
        endpoint = `/community/posts/${action.postId}/like`;
        method = 'POST';
        break;
      case 'unlike':
        endpoint = `/community/posts/${action.postId}/like`;
        method = 'DELETE';
        break;
      case 'repost':
        endpoint = `/community/posts/${action.postId}/repost`;
        method = 'POST';
        break;
      case 'unrepost':
        endpoint = `/community/posts/${action.postId}/repost`;
        method = 'DELETE';
        break;
      case 'bookmark':
        endpoint = `/community/posts/${action.postId}/bookmark`;
        method = 'POST';
        break;
      case 'unbookmark':
        endpoint = `/community/posts/${action.postId}/bookmark`;
        method = 'DELETE';
        break;
      case 'create_post':
        endpoint = `/community/posts`;
        method = 'POST';
        body = action.data;
        break;
      case 'delete_post':
        endpoint = `/community/posts/${action.postId}`;
        method = 'DELETE';
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${baseUrl}${endpoint}`, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }
  }

  /**
   * Get all pending actions
   */
  async getPendingActions(): Promise<CommunityOfflineAction[]> {
    await this.ensureInitialized();
    return this.actions.filter(action => action.status === 'pending');
  }

  /**
   * Get all failed actions
   * Validates Requirement 13.4: Notify user of failed actions
   */
  async getFailedActions(): Promise<CommunityOfflineAction[]> {
    await this.ensureInitialized();
    return this.actions.filter(action => action.status === 'failed');
  }

  /**
   * Check if a post has pending actions
   * Used to display pending badge
   */
  async hasPendingAction(postId: string): Promise<boolean> {
    await this.ensureInitialized();
    return this.actions.some(
      action => action.postId === postId && action.status === 'pending'
    );
  }

  /**
   * Retry a specific failed action
   * Validates Requirement 13.4: Offer retry for failed actions
   */
  async retryAction(actionId: string): Promise<void> {
    await this.ensureInitialized();
    
    const action = this.actions.find(a => a.id === actionId);
    if (!action) {
      throw new Error(`Action ${actionId} not found`);
    }

    if (action.status !== 'failed') {
      throw new Error(`Action ${actionId} is not in failed state`);
    }

    action.retryCount = 0;
    action.status = 'pending';
    await this.saveActions();

    await this.syncActions();
  }

  /**
   * Remove a specific action
   */
  async removeAction(actionId: string): Promise<void> {
    await this.ensureInitialized();
    this.actions = this.actions.filter(action => action.id !== actionId);
    await this.saveActions();
  }

  /**
   * Clear all actions
   */
  async clearActions(): Promise<void> {
    await this.ensureInitialized();
    this.actions = [];
    await this.saveActions();
  }

  /**
   * Cache feed data
   * Validates Requirement 13.5: Display cached posts when offline
   */
  async cacheFeed(
    feedType: 'forYou' | 'following' | 'community',
    posts: PostWithEngagement[],
    cursor: string | null,
    communityId?: string
  ): Promise<void> {
    const cacheKey = this.getFeedCacheKey(feedType, communityId);
    const cachedFeed: CachedFeed = {
      feedType,
      communityId,
      posts,
      cursor,
      timestamp: new Date().toISOString(),
    };

    try {
      await cachedFeedsStore.setItem(cacheKey, cachedFeed);
      console.log(`Cached ${posts.length} posts for ${feedType} feed`);
    } catch (error) {
      console.error('Failed to cache feed:', error);
    }
  }

  /**
   * Get cached feed data
   * Validates Requirement 13.5: Display cached posts when offline
   */
  async getCachedFeed(
    feedType: 'forYou' | 'following' | 'community',
    communityId?: string
  ): Promise<CachedFeed | null> {
    const cacheKey = this.getFeedCacheKey(feedType, communityId);
    
    try {
      const cached = await cachedFeedsStore.getItem<CachedFeed>(cacheKey);
      if (cached) {
        console.log(`Retrieved ${cached.posts.length} cached posts for ${feedType} feed`);
        return cached;
      }
    } catch (error) {
      console.error('Failed to get cached feed:', error);
    }
    
    return null;
  }

  /**
   * Clear cached feed data
   */
  async clearCachedFeed(
    feedType: 'forYou' | 'following' | 'community',
    communityId?: string
  ): Promise<void> {
    const cacheKey = this.getFeedCacheKey(feedType, communityId);
    
    try {
      await cachedFeedsStore.removeItem(cacheKey);
    } catch (error) {
      console.error('Failed to clear cached feed:', error);
    }
  }

  /**
   * Clear all cached feeds
   */
  async clearAllCachedFeeds(): Promise<void> {
    try {
      await cachedFeedsStore.clear();
    } catch (error) {
      console.error('Failed to clear all cached feeds:', error);
    }
  }

  /**
   * Register a callback for sync completion
   */
  onSyncComplete(callback: (success: boolean) => void): void {
    this.syncCallbacks.push(callback);
  }

  /**
   * Get sync status
   */
  getSyncStatus(): { isOnline: boolean; isSyncing: boolean; pendingCount: number; failedCount: number } {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: this.actions.filter(a => a.status === 'pending').length,
      failedCount: this.actions.filter(a => a.status === 'failed').length,
    };
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    this.isOnline = true;
    console.log('Back online, syncing community actions...');
    
    setTimeout(() => this.syncActions(), 1000);
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    this.isOnline = false;
    console.log('Offline mode activated for community');
  }

  /**
   * Load actions from IndexedDB
   */
  private async loadActions(): Promise<void> {
    try {
      const stored = await offlineActionsStore.getItem<CommunityOfflineAction[]>('actions');
      if (stored && Array.isArray(stored)) {
        this.actions = stored;
        console.log(`Loaded ${this.actions.length} community actions from IndexedDB`);
      } else {
        this.actions = [];
      }
    } catch (error) {
      console.error('Failed to load community actions:', error);
      this.actions = [];
    }
  }

  /**
   * Save actions to IndexedDB
   */
  private async saveActions(): Promise<void> {
    try {
      await offlineActionsStore.setItem('actions', this.actions);
    } catch (error) {
      console.error('Failed to save community actions:', error);
      
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('IndexedDB quota exceeded, clearing synced actions');
        this.actions = this.actions.filter(action => action.status !== 'synced');
        try {
          await offlineActionsStore.setItem('actions', this.actions);
        } catch (retryError) {
          console.error('Failed to save actions even after cleanup:', retryError);
        }
      }
    }
  }

  /**
   * Get feed cache key
   */
  private getFeedCacheKey(feedType: string, communityId?: string): string {
    return communityId ? `${feedType}_${communityId}` : feedType;
  }

  /**
   * Get auth token
   */
  private getAuthToken(): string | null {
    try {
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
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  }

  /**
   * Check if online
   */
  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Check if syncing
   */
  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }

  /**
   * Cleanup on service destruction
   */
  destroy(): void {
    // Remove event listeners
    window.removeEventListener('online', () => this.handleOnline());
    window.removeEventListener('offline', () => this.handleOffline());
    
    // Clear any pending timers
    this.syncCallbacks = [];
  }
}

// Export singleton instance
export const offlineCommunityService = new OfflineCommunityService();
export default offlineCommunityService;
