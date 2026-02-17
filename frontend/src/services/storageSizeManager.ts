/**
 * Storage Size Manager Service
 * 
 * Manages offline storage size limits and implements cache eviction
 * when the 50MB limit is reached.
 * 
 * Validates Requirement 11.10: Store offline data using IndexedDB with a maximum cache size of 50MB
 */

import localforage from 'localforage';
import { offlineStorage } from './offlineStorage';

// 50MB limit in bytes
const MAX_STORAGE_SIZE = 50 * 1024 * 1024; // 50MB

// Warning threshold at 80% of max size
const WARNING_THRESHOLD = MAX_STORAGE_SIZE * 0.8; // 40MB

export interface StorageStats {
  totalSize: number;
  maxSize: number;
  percentUsed: number;
  isNearLimit: boolean;
  isOverLimit: boolean;
  breakdown: {
    trips: number;
    tripDays: number;
    places: number;
    storyItems: number;
    packingItems: number;
    syncQueue: number;
    pendingUploads: number;
    metadata: number;
    offlineQueue: number;
    quickPlan: number;
  };
}

export interface EvictionResult {
  success: boolean;
  bytesFreed: number;
  itemsRemoved: number;
  errors: string[];
}

/**
 * Storage Size Manager Service
 * Tracks and manages offline storage size with automatic eviction
 */
class StorageSizeManagerService {
  private stores = {
    trips: localforage.createInstance({ name: 'journo', storeName: 'trips' }),
    tripDays: localforage.createInstance({ name: 'journo', storeName: 'trip_days' }),
    places: localforage.createInstance({ name: 'journo', storeName: 'places' }),
    storyItems: localforage.createInstance({ name: 'journo', storeName: 'story_items' }),
    packingItems: localforage.createInstance({ name: 'journo', storeName: 'packing_items' }),
    syncQueue: localforage.createInstance({ name: 'journo', storeName: 'sync_queue' }),
    pendingUploads: localforage.createInstance({ name: 'journo', storeName: 'pending_uploads' }),
    metadata: localforage.createInstance({ name: 'journo', storeName: 'metadata' }),
    offlineQueue: localforage.createInstance({ name: 'journo', storeName: 'offline_queue' }),
  };

  /**
   * Get current storage statistics
   * Validates Requirement 11.10: Track total cached data size
   */
  async getStorageStats(): Promise<StorageStats> {
    const breakdown = {
      trips: 0,
      tripDays: 0,
      places: 0,
      storyItems: 0,
      packingItems: 0,
      syncQueue: 0,
      pendingUploads: 0,
      metadata: 0,
      offlineQueue: 0,
      quickPlan: 0,
    };

    // Calculate size for each store
    for (const [storeName, store] of Object.entries(this.stores)) {
      const size = await this.calculateStoreSize(store);
      breakdown[storeName as keyof typeof breakdown] = size;
    }

    // Calculate Quick Plan cache size from metadata store
    breakdown.quickPlan = await this.calculateQuickPlanSize();

    const totalSize = Object.values(breakdown).reduce((sum, size) => sum + size, 0);
    const percentUsed = (totalSize / MAX_STORAGE_SIZE) * 100;

    return {
      totalSize,
      maxSize: MAX_STORAGE_SIZE,
      percentUsed,
      isNearLimit: totalSize >= WARNING_THRESHOLD,
      isOverLimit: totalSize > MAX_STORAGE_SIZE,
      breakdown,
    };
  }

  /**
   * Calculate the size of a specific store
   */
  private async calculateStoreSize(store: LocalForage): Promise<number> {
    let size = 0;
    
    try {
      await store.iterate((value) => {
        size += this.estimateObjectSize(value);
      });
    } catch (error) {
      console.error('Error calculating store size:', error);
    }
    
    return size;
  }

  /**
   * Calculate Quick Plan cache size
   */
  private async calculateQuickPlanSize(): Promise<number> {
    let size = 0;
    
    try {
      const metadataStore = this.stores.metadata;
      
      // Get Quick Plan related items
      const quickPlanKeys = [
        'quickplan_suggestions',
        'quickplan_trips',
        'quickplan_preferences',
        'quickplan_generation_cache',
      ];

      for (const key of quickPlanKeys) {
        const value = await metadataStore.getItem(key);
        if (value) {
          size += this.estimateObjectSize(value);
        }
      }

      // Also check for individual suggestion caches
      await metadataStore.iterate((value, key) => {
        if (key.startsWith('quickplan_suggestions_')) {
          size += this.estimateObjectSize(value);
        }
      });
    } catch (error) {
      console.error('Error calculating Quick Plan size:', error);
    }
    
    return size;
  }

  /**
   * Estimate the size of an object in bytes
   */
  private estimateObjectSize(obj: any): number {
    try {
      return new Blob([JSON.stringify(obj)]).size;
    } catch (error) {
      // Fallback to string length estimation
      return JSON.stringify(obj).length * 2; // Approximate UTF-16 encoding
    }
  }

  /**
   * Check if storage operation would exceed limit
   * Validates Requirement 11.10: Enforce 50MB limit
   */
  async wouldExceedLimit(additionalBytes: number): Promise<boolean> {
    const stats = await this.getStorageStats();
    return (stats.totalSize + additionalBytes) > MAX_STORAGE_SIZE;
  }

  /**
   * Perform cache eviction to free up space
   * Validates Requirement 11.10: Implement cache eviction when limit reached
   * 
   * Eviction strategy (in order of priority):
   * 1. Completed sync queue items
   * 2. Expired Quick Plan suggestions
   * 3. Oldest Quick Plan suggestions
   * 4. Oldest story items
   * 5. Oldest trips (excluding those with pending sync)
   */
  async evictCache(targetBytes: number): Promise<EvictionResult> {
    const result: EvictionResult = {
      success: false,
      bytesFreed: 0,
      itemsRemoved: 0,
      errors: [],
    };

    try {
      // Step 1: Remove completed sync queue items
      const syncQueueFreed = await this.evictCompletedSyncItems();
      result.bytesFreed += syncQueueFreed.bytesFreed;
      result.itemsRemoved += syncQueueFreed.itemsRemoved;

      if (result.bytesFreed >= targetBytes) {
        result.success = true;
        return result;
      }

      // Step 2: Remove expired Quick Plan suggestions
      const expiredQuickPlanFreed = await this.evictExpiredQuickPlanCache();
      result.bytesFreed += expiredQuickPlanFreed.bytesFreed;
      result.itemsRemoved += expiredQuickPlanFreed.itemsRemoved;

      if (result.bytesFreed >= targetBytes) {
        result.success = true;
        return result;
      }

      // Step 3: Remove oldest Quick Plan suggestions
      const oldQuickPlanFreed = await this.evictOldestQuickPlanCache(targetBytes - result.bytesFreed);
      result.bytesFreed += oldQuickPlanFreed.bytesFreed;
      result.itemsRemoved += oldQuickPlanFreed.itemsRemoved;

      if (result.bytesFreed >= targetBytes) {
        result.success = true;
        return result;
      }

      // Step 4: Remove oldest story items
      const storyItemsFreed = await this.evictOldestStoryItems(targetBytes - result.bytesFreed);
      result.bytesFreed += storyItemsFreed.bytesFreed;
      result.itemsRemoved += storyItemsFreed.itemsRemoved;

      if (result.bytesFreed >= targetBytes) {
        result.success = true;
        return result;
      }

      // Step 5: Remove oldest trips (excluding those with pending sync)
      const tripsFreed = await this.evictOldestTrips(targetBytes - result.bytesFreed);
      result.bytesFreed += tripsFreed.bytesFreed;
      result.itemsRemoved += tripsFreed.itemsRemoved;

      result.success = result.bytesFreed >= targetBytes;
    } catch (error) {
      console.error('Error during cache eviction:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  /**
   * Evict completed sync queue items
   */
  private async evictCompletedSyncItems(): Promise<{ bytesFreed: number; itemsRemoved: number }> {
    let bytesFreed = 0;
    let itemsRemoved = 0;

    try {
      const syncQueueStore = this.stores.syncQueue;
      const itemsToRemove: string[] = [];

      await syncQueueStore.iterate((value: any, key) => {
        if (value.status === 'completed' || value.status === 'synced') {
          itemsToRemove.push(key);
          bytesFreed += this.estimateObjectSize(value);
        }
      });

      for (const key of itemsToRemove) {
        await syncQueueStore.removeItem(key);
        itemsRemoved++;
      }

      console.log(`Evicted ${itemsRemoved} completed sync items, freed ${bytesFreed} bytes`);
    } catch (error) {
      console.error('Error evicting completed sync items:', error);
    }

    return { bytesFreed, itemsRemoved };
  }

  /**
   * Evict expired Quick Plan cache
   */
  private async evictExpiredQuickPlanCache(): Promise<{ bytesFreed: number; itemsRemoved: number }> {
    let bytesFreed = 0;
    let itemsRemoved = 0;

    try {
      const metadataStore = this.stores.metadata;
      const generationCache = await metadataStore.getItem<Record<string, any>>('quickplan_generation_cache') || {};
      const now = new Date();

      for (const [requestHash, metadata] of Object.entries(generationCache)) {
        if (metadata.expiresAt && new Date(metadata.expiresAt) < now) {
          const cacheKey = `quickplan_suggestions_${requestHash}`;
          const cachedData = await metadataStore.getItem(cacheKey);
          
          if (cachedData) {
            bytesFreed += this.estimateObjectSize(cachedData);
            await metadataStore.removeItem(cacheKey);
            itemsRemoved++;
          }

          delete generationCache[requestHash];
        }
      }

      await metadataStore.setItem('quickplan_generation_cache', generationCache);
      console.log(`Evicted ${itemsRemoved} expired Quick Plan caches, freed ${bytesFreed} bytes`);
    } catch (error) {
      console.error('Error evicting expired Quick Plan cache:', error);
    }

    return { bytesFreed, itemsRemoved };
  }

  /**
   * Evict oldest Quick Plan cache entries
   */
  private async evictOldestQuickPlanCache(targetBytes: number): Promise<{ bytesFreed: number; itemsRemoved: number }> {
    let bytesFreed = 0;
    let itemsRemoved = 0;

    try {
      const metadataStore = this.stores.metadata;
      const generationCache = await metadataStore.getItem<Record<string, any>>('quickplan_generation_cache') || {};

      // Sort by cachedAt timestamp (oldest first)
      const sortedEntries = Object.entries(generationCache).sort((a, b) => {
        const timeA = new Date(a[1].cachedAt).getTime();
        const timeB = new Date(b[1].cachedAt).getTime();
        return timeA - timeB;
      });

      for (const [requestHash] of sortedEntries) {
        if (bytesFreed >= targetBytes) break;

        const cacheKey = `quickplan_suggestions_${requestHash}`;
        const cachedData = await metadataStore.getItem(cacheKey);
        
        if (cachedData) {
          bytesFreed += this.estimateObjectSize(cachedData);
          await metadataStore.removeItem(cacheKey);
          itemsRemoved++;
        }

        delete generationCache[requestHash];
      }

      await metadataStore.setItem('quickplan_generation_cache', generationCache);
      console.log(`Evicted ${itemsRemoved} oldest Quick Plan caches, freed ${bytesFreed} bytes`);
    } catch (error) {
      console.error('Error evicting oldest Quick Plan cache:', error);
    }

    return { bytesFreed, itemsRemoved };
  }

  /**
   * Evict oldest story items
   */
  private async evictOldestStoryItems(targetBytes: number): Promise<{ bytesFreed: number; itemsRemoved: number }> {
    let bytesFreed = 0;
    let itemsRemoved = 0;

    try {
      const storyItemsStore = this.stores.storyItems;
      const storyItems: Array<{ key: string; value: any; createdAt: Date }> = [];

      await storyItemsStore.iterate((value: any, key) => {
        storyItems.push({
          key,
          value,
          createdAt: new Date(value.created_at),
        });
      });

      // Sort by created_at (oldest first)
      storyItems.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      for (const item of storyItems) {
        if (bytesFreed >= targetBytes) break;

        bytesFreed += this.estimateObjectSize(item.value);
        await storyItemsStore.removeItem(item.key);
        itemsRemoved++;
      }

      console.log(`Evicted ${itemsRemoved} oldest story items, freed ${bytesFreed} bytes`);
    } catch (error) {
      console.error('Error evicting oldest story items:', error);
    }

    return { bytesFreed, itemsRemoved };
  }

  /**
   * Evict oldest trips (excluding those with pending sync)
   */
  private async evictOldestTrips(targetBytes: number): Promise<{ bytesFreed: number; itemsRemoved: number }> {
    let bytesFreed = 0;
    let itemsRemoved = 0;

    try {
      const tripsStore = this.stores.trips;
      const syncQueueStore = this.stores.syncQueue;
      
      // Get trip IDs with pending sync
      const pendingTripIds = new Set<string>();
      await syncQueueStore.iterate((value: any) => {
        if (value.status === 'pending' && value.resource_type === 'trip') {
          pendingTripIds.add(value.resource_id);
        }
      });

      const trips: Array<{ key: string; value: any; createdAt: Date }> = [];

      await tripsStore.iterate((value: any, key) => {
        // Skip trips with pending sync
        if (!pendingTripIds.has(key)) {
          trips.push({
            key,
            value,
            createdAt: new Date(value.created_at),
          });
        }
      });

      // Sort by created_at (oldest first)
      trips.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      for (const trip of trips) {
        if (bytesFreed >= targetBytes) break;

        // Calculate trip size including related data
        const tripSize = await this.calculateTripSize(trip.key);
        
        // Delete trip and related data
        await offlineStorage.deleteTrip(trip.key);
        
        bytesFreed += tripSize;
        itemsRemoved++;
      }

      console.log(`Evicted ${itemsRemoved} oldest trips, freed ${bytesFreed} bytes`);
    } catch (error) {
      console.error('Error evicting oldest trips:', error);
    }

    return { bytesFreed, itemsRemoved };
  }

  /**
   * Calculate total size of a trip including related data
   */
  private async calculateTripSize(tripId: string): Promise<number> {
    let size = 0;

    try {
      // Trip itself
      const trip = await this.stores.trips.getItem(tripId);
      if (trip) {
        size += this.estimateObjectSize(trip);
      }

      // Trip days
      await this.stores.tripDays.iterate((value: any) => {
        if (value.trip_id === tripId) {
          size += this.estimateObjectSize(value);
        }
      });

      // Places
      await this.stores.places.iterate((value: any) => {
        if (value.trip_id === tripId) {
          size += this.estimateObjectSize(value);
        }
      });

      // Story items
      await this.stores.storyItems.iterate((value: any) => {
        if (value.trip_id === tripId) {
          size += this.estimateObjectSize(value);
        }
      });

      // Packing items
      await this.stores.packingItems.iterate((value: any) => {
        if (value.trip_id === tripId) {
          size += this.estimateObjectSize(value);
        }
      });
    } catch (error) {
      console.error('Error calculating trip size:', error);
    }

    return size;
  }

  /**
   * Automatically manage storage size before write operations
   * Validates Requirement 11.10: Enforce 50MB limit
   */
  async ensureSpaceAvailable(requiredBytes: number): Promise<boolean> {
    const stats = await this.getStorageStats();
    
    // If we're not near the limit, allow the operation
    if (stats.totalSize + requiredBytes <= MAX_STORAGE_SIZE) {
      return true;
    }

    // Calculate how much space we need to free
    const bytesToFree = (stats.totalSize + requiredBytes) - MAX_STORAGE_SIZE + (1024 * 1024); // Add 1MB buffer

    console.log(`Storage limit would be exceeded. Attempting to free ${bytesToFree} bytes...`);

    // Attempt eviction
    const evictionResult = await this.evictCache(bytesToFree);

    if (evictionResult.success) {
      console.log(`Successfully freed ${evictionResult.bytesFreed} bytes by removing ${evictionResult.itemsRemoved} items`);
      return true;
    }

    console.error('Failed to free enough space for operation');
    return false;
  }

  /**
   * Get human-readable storage size
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

export const storageSizeManager = new StorageSizeManagerService();
export default storageSizeManager;
