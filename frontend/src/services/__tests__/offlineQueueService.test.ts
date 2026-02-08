/**
 * Unit tests for OfflineQueueService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OfflineQueueService } from '../offlineQueueService';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock fetch
global.fetch = vi.fn();

describe('OfflineQueueService', () => {
  let service: OfflineQueueService;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    
    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    // Reset fetch mock
    vi.clearAllMocks();
    
    // Create new service instance
    service = new OfflineQueueService();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('queueAction', () => {
    it('should queue an action with generated id and timestamp', () => {
      const action = {
        tripId: 'trip-123',
        action: 'create',
        endpoint: '/api/trips/trip-123/collaborators',
        method: 'POST' as const,
        data: { email: 'test@example.com', role: 'editor' },
      };

      const queuedItem = service.queueAction(action);

      expect(queuedItem.id).toBeDefined();
      expect(queuedItem.timestamp).toBeDefined();
      expect(queuedItem.retryCount).toBe(0);
      expect(queuedItem.status).toBe('pending');
      expect(queuedItem.tripId).toBe('trip-123');
      expect(queuedItem.action).toBe('create');
    });

    it('should save queued action to localStorage', () => {
      const action = {
        tripId: 'trip-123',
        action: 'update',
        endpoint: '/api/trips/trip-123/collaborators/user-456',
        method: 'PATCH' as const,
        data: { role: 'viewer' },
      };

      service.queueAction(action);

      const stored = localStorageMock.getItem('collaboration_offline_queue');
      expect(stored).toBeDefined();
      
      const queue = JSON.parse(stored!);
      expect(queue).toHaveLength(1);
      expect(queue[0].tripId).toBe('trip-123');
    });

    it('should add multiple actions to queue', () => {
      service.queueAction({
        tripId: 'trip-1',
        action: 'create',
        endpoint: '/api/activity-log',
        method: 'POST',
        data: { action: 'place_added' },
      });

      service.queueAction({
        tripId: 'trip-1',
        action: 'update',
        endpoint: '/api/notifications/notif-1',
        method: 'PATCH',
        data: { is_read: true },
      });

      const queue = service.getQueue();
      expect(queue).toHaveLength(2);
    });
  });

  describe('getQueueStatus', () => {
    it('should return correct queue status', () => {
      service.queueAction({
        tripId: 'trip-1',
        action: 'create',
        endpoint: '/api/test',
        method: 'POST',
        data: {},
      });

      const status = service.getQueueStatus();

      expect(status.isOnline).toBe(true);
      expect(status.isSyncing).toBe(false);
      expect(status.pendingCount).toBe(1);
      expect(status.failedCount).toBe(0);
    });

    it('should count failed items correctly', () => {
      const item = service.queueAction({
        tripId: 'trip-1',
        action: 'create',
        endpoint: '/api/test',
        method: 'POST',
        data: {},
      });

      // Manually mark as failed for testing
      const queue = service.getQueue();
      queue[0].status = 'failed';
      
      // Save back to localStorage
      localStorageMock.setItem('collaboration_offline_queue', JSON.stringify(queue));
      
      // Create new service to reload from localStorage
      const newService = new OfflineQueueService();
      const status = newService.getQueueStatus();

      expect(status.failedCount).toBe(1);
      expect(status.pendingCount).toBe(0);
    });
  });

  describe('clearQueue', () => {
    it('should remove all items from queue', () => {
      service.queueAction({
        tripId: 'trip-1',
        action: 'create',
        endpoint: '/api/test',
        method: 'POST',
        data: {},
      });

      service.queueAction({
        tripId: 'trip-2',
        action: 'delete',
        endpoint: '/api/test/2',
        method: 'DELETE',
        data: {},
      });

      expect(service.getQueue()).toHaveLength(2);

      service.clearQueue();

      expect(service.getQueue()).toHaveLength(0);
      
      const stored = localStorageMock.getItem('collaboration_offline_queue');
      const queue = JSON.parse(stored!);
      expect(queue).toHaveLength(0);
    });
  });

  describe('getQueue', () => {
    it('should return all queue items', () => {
      service.queueAction({
        tripId: 'trip-1',
        action: 'create',
        endpoint: '/api/test',
        method: 'POST',
        data: { name: 'Test 1' },
      });

      service.queueAction({
        tripId: 'trip-2',
        action: 'update',
        endpoint: '/api/test/2',
        method: 'PATCH',
        data: { name: 'Test 2' },
      });

      const queue = service.getQueue();

      expect(queue).toHaveLength(2);
      expect(queue[0].data.name).toBe('Test 1');
      expect(queue[1].data.name).toBe('Test 2');
    });

    it('should return a copy of the queue', () => {
      service.queueAction({
        tripId: 'trip-1',
        action: 'create',
        endpoint: '/api/test',
        method: 'POST',
        data: {},
      });

      const queue1 = service.getQueue();
      const queue2 = service.getQueue();

      expect(queue1).not.toBe(queue2);
      expect(queue1).toEqual(queue2);
    });
  });

  describe('getFailedItems', () => {
    it('should return only failed items', () => {
      service.queueAction({
        tripId: 'trip-1',
        action: 'create',
        endpoint: '/api/test',
        method: 'POST',
        data: {},
      });

      const item2 = service.queueAction({
        tripId: 'trip-2',
        action: 'update',
        endpoint: '/api/test/2',
        method: 'PATCH',
        data: {},
      });

      // Manually mark second item as failed
      const queue = service.getQueue();
      queue[1].status = 'failed';
      localStorageMock.setItem('collaboration_offline_queue', JSON.stringify(queue));

      // Reload service
      const newService = new OfflineQueueService();
      const failedItems = newService.getFailedItems();

      expect(failedItems).toHaveLength(1);
      expect(failedItems[0].tripId).toBe('trip-2');
    });
  });

  describe('removeItem', () => {
    it('should remove specific item from queue', () => {
      const item1 = service.queueAction({
        tripId: 'trip-1',
        action: 'create',
        endpoint: '/api/test',
        method: 'POST',
        data: {},
      });

      const item2 = service.queueAction({
        tripId: 'trip-2',
        action: 'update',
        endpoint: '/api/test/2',
        method: 'PATCH',
        data: {},
      });

      expect(service.getQueue()).toHaveLength(2);

      service.removeItem(item1.id);

      const queue = service.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].id).toBe(item2.id);
    });
  });

  describe('syncQueue', () => {
    it('should not sync when offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const newService = new OfflineQueueService();
      
      newService.queueAction({
        tripId: 'trip-1',
        action: 'create',
        endpoint: '/api/test',
        method: 'POST',
        data: {},
      });

      await newService.syncQueue();

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should not sync when already syncing', async () => {
      service.queueAction({
        tripId: 'trip-1',
        action: 'create',
        endpoint: '/api/test',
        method: 'POST',
        data: {},
      });

      // Start first sync
      const syncPromise1 = service.syncQueue();
      
      // Try to start second sync immediately
      const syncPromise2 = service.syncQueue();

      await Promise.all([syncPromise1, syncPromise2]);

      // Should only call fetch once
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should sync pending items successfully', async () => {
      // Mock successful fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      service.queueAction({
        tripId: 'trip-1',
        action: 'create',
        endpoint: '/api/test',
        method: 'POST',
        data: { name: 'Test' },
      });

      await service.syncQueue();

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(service.getQueue()).toHaveLength(0); // Synced items removed
    });

    it('should mark item as failed after 3 retries', async () => {
      // Mock failed fetch
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const item = service.queueAction({
        tripId: 'trip-1',
        action: 'create',
        endpoint: '/api/test',
        method: 'POST',
        data: {},
      });

      // Sync 3 times
      await service.syncQueue();
      await service.syncQueue();
      await service.syncQueue();

      const queue = service.getQueue();
      expect(queue[0].status).toBe('failed');
      expect(queue[0].retryCount).toBe(3);
    });

    it('should include auth token in request headers', async () => {
      // Mock auth token in localStorage
      localStorageMock.setItem(
        'auth-storage',
        JSON.stringify({ state: { accessToken: 'test-token-123' } })
      );

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      service.queueAction({
        tripId: 'trip-1',
        action: 'create',
        endpoint: '/api/test',
        method: 'POST',
        data: {},
      });

      await service.syncQueue();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token-123',
          }),
        })
      );
    });
  });

  describe('retryItem', () => {
    it('should reset retry count and status for failed item', async () => {
      const item = service.queueAction({
        tripId: 'trip-1',
        action: 'create',
        endpoint: '/api/test',
        method: 'POST',
        data: {},
      });

      // Manually mark as failed
      const queue = service.getQueue();
      queue[0].status = 'failed';
      queue[0].retryCount = 3;
      localStorageMock.setItem('collaboration_offline_queue', JSON.stringify(queue));

      // Reload service
      const newService = new OfflineQueueService();

      // Mock successful fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await newService.retryItem(item.id);

      const updatedQueue = newService.getQueue();
      expect(updatedQueue).toHaveLength(0); // Should be synced and removed
    });

    it('should throw error if item not found', async () => {
      await expect(service.retryItem('non-existent-id')).rejects.toThrow(
        'Queue item non-existent-id not found'
      );
    });

    it('should throw error if item is not in failed state', async () => {
      const item = service.queueAction({
        tripId: 'trip-1',
        action: 'create',
        endpoint: '/api/test',
        method: 'POST',
        data: {},
      });

      await expect(service.retryItem(item.id)).rejects.toThrow(
        `Queue item ${item.id} is not in failed state`
      );
    });
  });

  describe('online/offline events', () => {
    it('should update online status when going offline', () => {
      expect(service.isOnlineStatus()).toBe(true);

      // Simulate offline event
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));

      expect(service.isOnlineStatus()).toBe(false);
    });

    it('should trigger sync when coming back online', async () => {
      vi.useFakeTimers();

      service.queueAction({
        tripId: 'trip-1',
        action: 'create',
        endpoint: '/api/test',
        method: 'POST',
        data: {},
      });

      // Mock successful fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Simulate online event
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));

      // Fast-forward timers to trigger delayed sync
      vi.advanceTimersByTime(1000);

      await vi.runAllTimersAsync();

      expect(global.fetch).toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('localStorage persistence', () => {
    it('should load queue from localStorage on initialization', () => {
      const existingQueue = [
        {
          id: 'item-1',
          tripId: 'trip-1',
          action: 'create',
          endpoint: '/api/test',
          method: 'POST',
          data: {},
          timestamp: new Date().toISOString(),
          retryCount: 0,
          status: 'pending',
        },
      ];

      localStorageMock.setItem(
        'collaboration_offline_queue',
        JSON.stringify(existingQueue)
      );

      const newService = new OfflineQueueService();
      const queue = newService.getQueue();

      expect(queue).toHaveLength(1);
      expect(queue[0].id).toBe('item-1');
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorageMock.setItem('collaboration_offline_queue', 'invalid json');

      const newService = new OfflineQueueService();
      const queue = newService.getQueue();

      expect(queue).toHaveLength(0);
    });

    it('should handle localStorage quota exceeded error', () => {
      const originalSetItem = localStorageMock.setItem;
      
      // Mock quota exceeded error
      localStorageMock.setItem = vi.fn(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      // Should not throw
      expect(() => {
        service.queueAction({
          tripId: 'trip-1',
          action: 'create',
          endpoint: '/api/test',
          method: 'POST',
          data: {},
        });
      }).not.toThrow();

      // Restore original
      localStorageMock.setItem = originalSetItem;
    });
  });

  describe('conflict resolution', () => {
    it('should use last-write-wins strategy', async () => {
      // Mock successful fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, updated_at: new Date().toISOString() }),
      });

      service.queueAction({
        tripId: 'trip-1',
        action: 'update',
        endpoint: '/api/trips/trip-1/collaborators/user-1',
        method: 'PATCH',
        data: { role: 'viewer' },
      });

      await service.syncQueue();

      // The service should send the request with the data as-is
      // Server will handle conflict resolution based on timestamp
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ role: 'viewer' }),
        })
      );
    });
  });
});
