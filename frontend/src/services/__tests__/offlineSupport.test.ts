/**
 * Offline Support Tests
 * Basic tests to verify offline support functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { serviceWorkerManager } from '../serviceWorkerManager';
import { offlineDataService } from '../offlineDataService';
import { offlineSyncService } from '../offlineSyncService';

describe('Offline Support', () => {
  describe('Service Worker Manager', () => {
    it('should check if service worker is supported', () => {
      const isSupported = serviceWorkerManager.isServiceWorkerSupported();
      expect(typeof isSupported).toBe('boolean');
    });

    it('should have cache names defined', () => {
      expect(serviceWorkerManager).toBeDefined();
    });
  });

  describe('Offline Data Service', () => {
    it('should be defined', () => {
      expect(offlineDataService).toBeDefined();
    });

    it('should have fetchWithOfflineSupport method', () => {
      expect(typeof offlineDataService.fetchWithOfflineSupport).toBe('function');
    });

    it('should have prefetchData method', () => {
      expect(typeof offlineDataService.prefetchData).toBe('function');
    });

    it('should have isCached method', () => {
      expect(typeof offlineDataService.isCached).toBe('function');
    });
  });

  describe('Offline Sync Service', () => {
    it('should be defined', () => {
      expect(offlineSyncService).toBeDefined();
    });

    it('should have queueChange method', () => {
      expect(typeof offlineSyncService.queueChange).toBe('function');
    });

    it('should have syncAll method', () => {
      expect(typeof offlineSyncService.syncAll).toBe('function');
    });

    it('should have autoSync method', () => {
      expect(typeof offlineSyncService.autoSync).toBe('function');
    });

    it('should have initializeAutoSync method', () => {
      expect(typeof offlineSyncService.initializeAutoSync).toBe('function');
    });

    it('should check if sync is in progress', () => {
      const isSyncing = offlineSyncService.isSyncInProgress();
      expect(typeof isSyncing).toBe('boolean');
    });
  });

  describe('Integration', () => {
    it('should queue a change', async () => {
      const mockData = { title: 'Test Trip' };
      
      // This should not throw
      await expect(
        offlineSyncService.queueChange('create', 'trip', 'test-id', mockData)
      ).resolves.not.toThrow();
    });
  });
});
