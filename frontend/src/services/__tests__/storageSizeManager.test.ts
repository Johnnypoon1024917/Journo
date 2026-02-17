/**
 * Unit tests for StorageSizeManagerService
 * 
 * Validates Requirement 11.10: Store offline data using IndexedDB with a maximum cache size of 50MB
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { storageSizeManager, StorageStats, EvictionResult } from '../storageSizeManager';
import localforage from 'localforage';

// Mock localforage
vi.mock('localforage');

describe('StorageSizeManagerService', () => {
  let mockStores: Record<string, Map<string, any>>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock storage for each store
    mockStores = {
      trips: new Map(),
      tripDays: new Map(),
      places: new Map(),
      storyItems: new Map(),
      packingItems: new Map(),
      syncQueue: new Map(),
      pendingUploads: new Map(),
      metadata: new Map(),
      offlineQueue: new Map(),
    };

    // Mock localforage.createInstance
    (localforage.createInstance as any).mockImplementation((config: any) => {
      const storeName = config.storeName;
      const store = mockStores[storeName] || new Map();

      return {
        getItem: vi.fn((key: string) => Promise.resolve(store.get(key) || null)),
        setItem: vi.fn((key: string, value: any) => {
          store.set(key, value);
          return Promise.resolve(value);
        }),
        removeItem: vi.fn((key: string) => {
          store.delete(key);
          return Promise.resolve();
        }),
        clear: vi.fn(() => {
          store.clear();
          return Promise.resolve();
        }),
        iterate: vi.fn((callback: (value: any, key: string) => void) => {
          store.forEach((value, key) => callback(value, key));
          return Promise.resolve();
        }),
        keys: vi.fn(() => Promise.resolve(Array.from(store.keys()))),
        length: vi.fn(() => Promise.resolve(store.size)),
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getStorageStats', () => {
    it('should calculate storage statistics correctly', async () => {
      // Add some test data
      mockStores.trips.set('trip1', {
        id: 'trip1',
        title: 'Test Trip',
        created_at: new Date().toISOString(),
      });

      mockStores.storyItems.set('story1', {
        id: 'story1',
        trip_id: 'trip1',
        content: 'Test story',
        created_at: new Date().toISOString(),
      });

      const stats = await storageSizeManager.getStorageStats();

      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('percentUsed');
      expect(stats).toHaveProperty('isNearLimit');
      expect(stats).toHaveProperty('isOverLimit');
      expect(stats).toHaveProperty('breakdown');
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.maxSize).toBe(50 * 1024 * 1024); // 50MB
    });

    it('should detect when storage is near limit', async () => {
      // Add large data to simulate near-limit condition
      const largeData = 'x'.repeat(41 * 1024 * 1024); // 41MB (over 80% threshold)
      mockStores.trips.set('large-trip', {
        id: 'large-trip',
        data: largeData,
      });

      const stats = await storageSizeManager.getStorageStats();

      expect(stats.isNearLimit).toBe(true);
      expect(stats.percentUsed).toBeGreaterThan(80);
    });

    it('should detect when storage is over limit', async () => {
      // Add data exceeding 50MB
      const largeData = 'x'.repeat(51 * 1024 * 1024); // 51MB
      mockStores.trips.set('huge-trip', {
        id: 'huge-trip',
        data: largeData,
      });

      const stats = await storageSizeManager.getStorageStats();

      expect(stats.isOverLimit).toBe(true);
      expect(stats.percentUsed).toBeGreaterThan(100);
    });

    it('should provide breakdown by store type', async () => {
      mockStores.trips.set('trip1', { id: 'trip1', data: 'test' });
      mockStores.storyItems.set('story1', { id: 'story1', data: 'test' });

      const stats = await storageSizeManager.getStorageStats();

      expect(stats.breakdown).toHaveProperty('trips');
      expect(stats.breakdown).toHaveProperty('storyItems');
      expect(stats.breakdown.trips).toBeGreaterThan(0);
      expect(stats.breakdown.storyItems).toBeGreaterThan(0);
    });
  });

  describe('wouldExceedLimit', () => {
    it('should return false when operation would not exceed limit', async () => {
      const result = await storageSizeManager.wouldExceedLimit(1024); // 1KB

      expect(result).toBe(false);
    });

    it('should return true when operation would exceed limit', async () => {
      // Fill storage to near capacity
      const largeData = 'x'.repeat(49 * 1024 * 1024); // 49MB
      mockStores.trips.set('large-trip', { id: 'large-trip', data: largeData });

      // Try to add 2MB more (would exceed 50MB limit)
      const result = await storageSizeManager.wouldExceedLimit(2 * 1024 * 1024);

      expect(result).toBe(true);
    });
  });

  describe('evictCache', () => {
    it('should evict completed sync queue items first', async () => {
      // Add completed sync items
      mockStores.syncQueue.set('sync1', {
        id: 'sync1',
        status: 'completed',
        data: 'x'.repeat(1024), // 1KB
      });
      mockStores.syncQueue.set('sync2', {
        id: 'sync2',
        status: 'synced',
        data: 'x'.repeat(1024), // 1KB
      });
      mockStores.syncQueue.set('sync3', {
        id: 'sync3',
        status: 'pending',
        data: 'x'.repeat(1024), // 1KB
      });

      const result = await storageSizeManager.evictCache(1024);

      expect(result.success).toBe(true);
      expect(result.itemsRemoved).toBeGreaterThan(0);
      expect(result.bytesFreed).toBeGreaterThan(0);
      // Pending item should not be removed
      expect(mockStores.syncQueue.has('sync3')).toBe(true);
    });

    it('should evict expired Quick Plan cache', async () => {
      const now = new Date();
      const expired = new Date(now.getTime() - 25 * 60 * 60 * 1000); // 25 hours ago

      mockStores.metadata.set('quickplan_generation_cache', {
        'hash1': {
          cachedAt: expired.toISOString(),
          expiresAt: expired.toISOString(),
          suggestionsCount: 5,
        },
      });

      mockStores.metadata.set('quickplan_suggestions_hash1', {
        suggestions: ['test1', 'test2'],
      });

      const result = await storageSizeManager.evictCache(100);

      expect(result.itemsRemoved).toBeGreaterThan(0);
    });

    it('should evict oldest Quick Plan cache when needed', async () => {
      const now = new Date();
      const old = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      const recent = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
      const future = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day from now

      mockStores.metadata.set('quickplan_generation_cache', {
        'hash1': {
          cachedAt: old.toISOString(),
          expiresAt: future.toISOString(),
          suggestionsCount: 5,
        },
        'hash2': {
          cachedAt: recent.toISOString(),
          expiresAt: future.toISOString(),
          suggestionsCount: 3,
        },
      });

      mockStores.metadata.set('quickplan_suggestions_hash1', {
        suggestions: 'x'.repeat(1024),
      });
      mockStores.metadata.set('quickplan_suggestions_hash2', {
        suggestions: 'x'.repeat(1024),
      });

      const result = await storageSizeManager.evictCache(1024);

      expect(result.itemsRemoved).toBeGreaterThan(0);
      // Older cache should be evicted first
      const cache = mockStores.metadata.get('quickplan_generation_cache');
      expect(cache).not.toHaveProperty('hash1');
    });

    it('should evict oldest story items when other methods insufficient', async () => {
      const old = new Date('2023-01-01');
      const recent = new Date('2024-01-01');

      mockStores.storyItems.set('story1', {
        id: 'story1',
        created_at: old.toISOString(),
        content: 'x'.repeat(1024),
      });
      mockStores.storyItems.set('story2', {
        id: 'story2',
        created_at: recent.toISOString(),
        content: 'x'.repeat(1024),
      });

      const result = await storageSizeManager.evictCache(1024);

      expect(result.itemsRemoved).toBeGreaterThan(0);
      // Older story should be evicted first
      expect(mockStores.storyItems.has('story1')).toBe(false);
    });

    it('should not evict trips with pending sync', async () => {
      mockStores.trips.set('trip1', {
        id: 'trip1',
        created_at: new Date('2023-01-01').toISOString(),
        data: 'x'.repeat(1024),
      });

      mockStores.syncQueue.set('sync1', {
        id: 'sync1',
        status: 'pending',
        resource_type: 'trip',
        resource_id: 'trip1',
      });

      const result = await storageSizeManager.evictCache(10 * 1024 * 1024);

      // Trip with pending sync should not be removed
      expect(mockStores.trips.has('trip1')).toBe(true);
    });

    it('should return success false when unable to free enough space', async () => {
      // Add only a small amount of data
      mockStores.trips.set('trip1', {
        id: 'trip1',
        data: 'small',
      });

      // Try to free 10MB (more than available)
      const result = await storageSizeManager.evictCache(10 * 1024 * 1024);

      expect(result.success).toBe(false);
    });
  });

  describe('ensureSpaceAvailable', () => {
    it('should return true when space is available', async () => {
      const result = await storageSizeManager.ensureSpaceAvailable(1024);

      expect(result).toBe(true);
    });

    it('should attempt eviction when space is not available', async () => {
      // Fill storage near capacity
      const largeData = 'x'.repeat(49 * 1024 * 1024); // 49MB
      mockStores.trips.set('large-trip', { id: 'large-trip', data: largeData });

      // Add some evictable data
      mockStores.syncQueue.set('sync1', {
        id: 'sync1',
        status: 'completed',
        data: 'x'.repeat(2 * 1024 * 1024), // 2MB
      });

      // Try to add 2MB (would exceed limit, but eviction should free space)
      const result = await storageSizeManager.ensureSpaceAvailable(2 * 1024 * 1024);

      expect(result).toBe(true);
    });

    it('should return false when eviction cannot free enough space', async () => {
      // Fill storage with non-evictable data
      const largeData = 'x'.repeat(49 * 1024 * 1024); // 49MB
      mockStores.trips.set('trip1', { id: 'trip1', data: largeData });

      // Add pending sync to prevent eviction
      mockStores.syncQueue.set('sync1', {
        id: 'sync1',
        status: 'pending',
        resource_type: 'trip',
        resource_id: 'trip1',
      });

      // Try to add 5MB (would exceed limit and cannot evict)
      const result = await storageSizeManager.ensureSpaceAvailable(5 * 1024 * 1024);

      expect(result).toBe(false);
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(storageSizeManager.formatBytes(0)).toBe('0 Bytes');
      expect(storageSizeManager.formatBytes(1024)).toBe('1 KB');
      expect(storageSizeManager.formatBytes(1024 * 1024)).toBe('1 MB');
      expect(storageSizeManager.formatBytes(1536 * 1024)).toBe('1.5 MB');
      expect(storageSizeManager.formatBytes(50 * 1024 * 1024)).toBe('50 MB');
    });
  });

  describe('Storage limit enforcement', () => {
    it('should enforce 50MB limit', async () => {
      const stats = await storageSizeManager.getStorageStats();
      expect(stats.maxSize).toBe(50 * 1024 * 1024);
    });

    it('should detect when at 80% threshold', async () => {
      // Add 40MB of data (80% of 50MB)
      const data = 'x'.repeat(40 * 1024 * 1024);
      mockStores.trips.set('trip1', { id: 'trip1', data });

      const stats = await storageSizeManager.getStorageStats();
      expect(stats.isNearLimit).toBe(true);
      expect(stats.percentUsed).toBeGreaterThanOrEqual(80);
    });

    it('should track total size across all stores', async () => {
      mockStores.trips.set('trip1', { id: 'trip1', data: 'x'.repeat(1024) });
      mockStores.storyItems.set('story1', { id: 'story1', data: 'x'.repeat(1024) });
      mockStores.places.set('place1', { id: 'place1', data: 'x'.repeat(1024) });

      const stats = await storageSizeManager.getStorageStats();
      
      expect(stats.totalSize).toBeGreaterThan(3 * 1024); // At least 3KB
      expect(stats.breakdown.trips).toBeGreaterThan(0);
      expect(stats.breakdown.storyItems).toBeGreaterThan(0);
      expect(stats.breakdown.places).toBeGreaterThan(0);
    });
  });
});
