/**
 * Unit tests for SyncConflictService
 * 
 * Validates Requirement 11.6: Detect conflicts during sync and allow user to choose version
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { syncConflictService } from '../syncConflictService';
import { offlineStorage } from '../offlineStorage';

// Mock offlineStorage
vi.mock('../offlineStorage', () => ({
  offlineStorage: {
    saveTrip: vi.fn(),
    savePlace: vi.fn(),
    savePackingItem: vi.fn(),
    saveStoryItem: vi.fn(),
    saveTripDay: vi.fn(),
    addToSyncQueue: vi.fn(),
  },
}));

describe('SyncConflictService', () => {
  beforeEach(() => {
    // Clear all conflicts before each test
    syncConflictService.clearAllConflicts();
    vi.clearAllMocks();
  });

  describe('detectConflict', () => {
    it('should detect conflict when local and server data differ', () => {
      const localData = {
        id: 'trip-1',
        title: 'Local Title',
        destination: 'Tokyo',
        updated_at: '2024-01-01T10:00:00Z',
        _offline_modified: true,
      };

      const serverData = {
        id: 'trip-1',
        title: 'Server Title',
        destination: 'Tokyo',
        updated_at: '2024-01-01T11:00:00Z',
      };

      const hasConflict = syncConflictService.detectConflict(
        localData,
        serverData,
        'trip'
      );

      expect(hasConflict).toBe(true);
    });

    it('should not detect conflict when data is identical', () => {
      const localData = {
        id: 'trip-1',
        title: 'Same Title',
        destination: 'Tokyo',
        updated_at: '2024-01-01T10:00:00Z',
        _offline_modified: true,
      };

      const serverData = {
        id: 'trip-1',
        title: 'Same Title',
        destination: 'Tokyo',
        updated_at: '2024-01-01T10:00:00Z',
      };

      const hasConflict = syncConflictService.detectConflict(
        localData,
        serverData,
        'trip'
      );

      expect(hasConflict).toBe(false);
    });

    it('should not detect conflict when local data was not modified offline', () => {
      const localData = {
        id: 'trip-1',
        title: 'Local Title',
        destination: 'Tokyo',
        updated_at: '2024-01-01T10:00:00Z',
        _offline_modified: false,
      };

      const serverData = {
        id: 'trip-1',
        title: 'Server Title',
        destination: 'Tokyo',
        updated_at: '2024-01-01T11:00:00Z',
      };

      const hasConflict = syncConflictService.detectConflict(
        localData,
        serverData,
        'trip'
      );

      expect(hasConflict).toBe(false);
    });

    it('should not detect conflict when timestamps are very close', () => {
      const localData = {
        id: 'trip-1',
        title: 'Different Title',
        destination: 'Tokyo',
        updated_at: '2024-01-01T10:00:00.000Z',
        _offline_modified: true,
      };

      const serverData = {
        id: 'trip-1',
        title: 'Server Title',
        destination: 'Tokyo',
        updated_at: '2024-01-01T10:00:00.500Z', // 500ms difference
      };

      const hasConflict = syncConflictService.detectConflict(
        localData,
        serverData,
        'trip'
      );

      expect(hasConflict).toBe(false);
    });

    it('should detect conflict for place data', () => {
      const localData = {
        id: 'place-1',
        name: 'Local Place',
        address: '123 Street',
        time_start: '09:00',
        updated_at: '2024-01-01T10:00:00Z',
        _offline_modified: true,
      };

      const serverData = {
        id: 'place-1',
        name: 'Server Place',
        address: '123 Street',
        time_start: '09:00',
        updated_at: '2024-01-01T11:00:00Z',
      };

      const hasConflict = syncConflictService.detectConflict(
        localData,
        serverData,
        'place'
      );

      expect(hasConflict).toBe(true);
    });
  });

  describe('createConflict', () => {
    it('should create a conflict record', () => {
      const localData = {
        id: 'trip-1',
        title: 'Local Title',
        destination: 'Tokyo',
        updated_at: '2024-01-01T10:00:00Z',
      };

      const serverData = {
        id: 'trip-1',
        title: 'Server Title',
        destination: 'Tokyo',
        updated_at: '2024-01-01T11:00:00Z',
      };

      const conflict = syncConflictService.createConflict(
        'trip',
        'trip-1',
        localData,
        serverData
      );

      expect(conflict).toBeDefined();
      expect(conflict.resourceType).toBe('trip');
      expect(conflict.resourceId).toBe('trip-1');
      expect(conflict.resourceName).toBe('Local Title');
      expect(conflict.localData).toEqual(localData);
      expect(conflict.serverData).toEqual(serverData);
    });

    it('should add conflict to pending list', () => {
      const localData = {
        id: 'trip-1',
        title: 'Local Title',
        updated_at: '2024-01-01T10:00:00Z',
      };

      const serverData = {
        id: 'trip-1',
        title: 'Server Title',
        updated_at: '2024-01-01T11:00:00Z',
      };

      syncConflictService.createConflict('trip', 'trip-1', localData, serverData);

      const pending = syncConflictService.getPendingConflicts();
      expect(pending).toHaveLength(1);
      expect(pending[0].resourceId).toBe('trip-1');
    });
  });

  describe('resolveConflict', () => {
    it('should resolve conflict with local version', async () => {
      const localData = {
        id: 'trip-1',
        title: 'Local Title',
        destination: 'Tokyo',
        updated_at: '2024-01-01T10:00:00Z',
      };

      const serverData = {
        id: 'trip-1',
        title: 'Server Title',
        destination: 'Tokyo',
        updated_at: '2024-01-01T11:00:00Z',
      };

      const conflict = syncConflictService.createConflict(
        'trip',
        'trip-1',
        localData,
        serverData
      );

      await syncConflictService.resolveConflict(conflict.id, 'local');

      // Should save local data to offline storage
      expect(offlineStorage.saveTrip).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Local Title',
          _offline_modified: false,
        })
      );

      // Should add to sync queue to push local changes
      expect(offlineStorage.addToSyncQueue).toHaveBeenCalledWith(
        'UPDATE',
        'trip',
        'trip-1',
        localData
      );

      // Should remove from pending conflicts
      const pending = syncConflictService.getPendingConflicts();
      expect(pending).toHaveLength(0);
    });

    it('should resolve conflict with server version', async () => {
      const localData = {
        id: 'trip-1',
        title: 'Local Title',
        destination: 'Tokyo',
        updated_at: '2024-01-01T10:00:00Z',
      };

      const serverData = {
        id: 'trip-1',
        title: 'Server Title',
        destination: 'Tokyo',
        updated_at: '2024-01-01T11:00:00Z',
      };

      const conflict = syncConflictService.createConflict(
        'trip',
        'trip-1',
        localData,
        serverData
      );

      await syncConflictService.resolveConflict(conflict.id, 'server');

      // Should save server data to offline storage
      expect(offlineStorage.saveTrip).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Server Title',
          _offline_modified: false,
        })
      );

      // Should NOT add to sync queue (accepting server version)
      expect(offlineStorage.addToSyncQueue).not.toHaveBeenCalled();

      // Should remove from pending conflicts
      const pending = syncConflictService.getPendingConflicts();
      expect(pending).toHaveLength(0);
    });

    it('should resolve conflict for place resource', async () => {
      const localData = {
        id: 'place-1',
        name: 'Local Place',
        address: '123 Street',
        updated_at: '2024-01-01T10:00:00Z',
      };

      const serverData = {
        id: 'place-1',
        name: 'Server Place',
        address: '456 Avenue',
        updated_at: '2024-01-01T11:00:00Z',
      };

      const conflict = syncConflictService.createConflict(
        'place',
        'place-1',
        localData,
        serverData
      );

      await syncConflictService.resolveConflict(conflict.id, 'server');

      expect(offlineStorage.savePlace).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Server Place',
          _offline_modified: false,
        })
      );
    });
  });

  describe('hasPendingConflicts', () => {
    it('should return false when no conflicts', () => {
      expect(syncConflictService.hasPendingConflicts()).toBe(false);
    });

    it('should return true when conflicts exist', () => {
      syncConflictService.createConflict(
        'trip',
        'trip-1',
        { id: 'trip-1', title: 'Local', updated_at: '2024-01-01T10:00:00Z' },
        { id: 'trip-1', title: 'Server', updated_at: '2024-01-01T11:00:00Z' }
      );

      expect(syncConflictService.hasPendingConflicts()).toBe(true);
    });
  });

  describe('subscribe', () => {
    it('should notify listeners when conflicts change', () => {
      const listener = vi.fn();
      syncConflictService.subscribe(listener);

      syncConflictService.createConflict(
        'trip',
        'trip-1',
        { id: 'trip-1', title: 'Local', updated_at: '2024-01-01T10:00:00Z' },
        { id: 'trip-1', title: 'Server', updated_at: '2024-01-01T11:00:00Z' }
      );

      expect(listener).toHaveBeenCalled();
      const conflicts = listener.mock.calls[0][0];
      expect(conflicts).toHaveLength(1);
    });

    it('should allow unsubscribing', () => {
      const listener = vi.fn();
      const unsubscribe = syncConflictService.subscribe(listener);

      unsubscribe();

      syncConflictService.createConflict(
        'trip',
        'trip-1',
        { id: 'trip-1', title: 'Local', updated_at: '2024-01-01T10:00:00Z' },
        { id: 'trip-1', title: 'Server', updated_at: '2024-01-01T11:00:00Z' }
      );

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('cancelConflict', () => {
    it('should remove conflict without resolving', () => {
      const conflict = syncConflictService.createConflict(
        'trip',
        'trip-1',
        { id: 'trip-1', title: 'Local', updated_at: '2024-01-01T10:00:00Z' },
        { id: 'trip-1', title: 'Server', updated_at: '2024-01-01T11:00:00Z' }
      );

      syncConflictService.cancelConflict(conflict.id);

      expect(syncConflictService.hasPendingConflicts()).toBe(false);
      expect(offlineStorage.saveTrip).not.toHaveBeenCalled();
    });
  });
});
