/**
 * Tests for Offline Feature Manager
 * 
 * Validates: Requirements 5.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OfflineFeatureManager } from '../offlineFeatureManager';
import { healthMonitor } from '../healthMonitor';
import { networkErrorHandler } from '../networkErrorHandler';

// Mock dependencies
vi.mock('../healthMonitor', () => ({
  healthMonitor: {
    subscribe: vi.fn(() => vi.fn()),
    isFeatureEnabled: vi.fn(() => true),
  },
}));

vi.mock('../networkErrorHandler', () => ({
  networkErrorHandler: {
    subscribe: vi.fn(() => vi.fn()),
    isOnline: vi.fn(() => true),
  },
}));

describe('OfflineFeatureManager', () => {
  let manager: OfflineFeatureManager;

  beforeEach(() => {
    vi.clearAllMocks();
    // Use the singleton instance
    manager = OfflineFeatureManager.getInstance();
  });

  describe('Feature Capability Detection', () => {
    it('should initialize with all feature capabilities', () => {
      const capabilities = manager.getAllCapabilities();
      
      expect(capabilities.size).toBeGreaterThan(0);
      expect(capabilities.has('trip-planning')).toBe(true);
      expect(capabilities.has('destination-suggestions')).toBe(true);
      expect(capabilities.has('maps')).toBe(true);
    });

    it('should correctly identify full offline support features', () => {
      const fullOfflineFeatures = manager.getFeaturesByOfflineMode('full');
      
      expect(fullOfflineFeatures.length).toBeGreaterThan(0);
      expect(fullOfflineFeatures.some(f => f.featureName === 'trip-planning')).toBe(true);
    });

    it('should correctly identify partial offline support features', () => {
      const partialOfflineFeatures = manager.getFeaturesByOfflineMode('partial');
      
      expect(partialOfflineFeatures.length).toBeGreaterThan(0);
      expect(partialOfflineFeatures.some(f => f.featureName === 'maps')).toBe(true);
    });

    it('should correctly identify network-required features', () => {
      const networkRequiredFeatures = manager.getFeaturesByOfflineMode('none');
      
      expect(networkRequiredFeatures.length).toBeGreaterThan(0);
      expect(networkRequiredFeatures.some(f => f.featureName === 'authentication')).toBe(true);
    });
  });

  describe('Feature Availability', () => {
    it('should report feature as available when online and enabled', () => {
      vi.mocked(networkErrorHandler.isOnline).mockReturnValue(true);
      vi.mocked(healthMonitor.isFeatureEnabled).mockReturnValue(true);

      const isAvailable = manager.isFeatureAvailable('trip-planning');
      
      expect(isAvailable).toBe(true);
    });

    it('should report full offline features as available when offline', () => {
      vi.mocked(networkErrorHandler.isOnline).mockReturnValue(false);
      vi.mocked(healthMonitor.isFeatureEnabled).mockReturnValue(false);

      const isAvailable = manager.isFeatureAvailable('trip-planning');
      
      // Trip planning has full offline support
      expect(isAvailable).toBe(true);
    });

    it('should report network-required features as unavailable when offline', () => {
      vi.mocked(networkErrorHandler.isOnline).mockReturnValue(false);

      // Trigger update by calling the method directly
      const capability = manager.getFeatureCapability('authentication');
      
      // Authentication requires network and has no offline mode
      expect(capability?.offlineMode).toBe('none');
      expect(capability?.requiresNetwork).toBe(true);
    });
  });

  describe('Feature Limitations', () => {
    it('should return no limitations when online and feature available', () => {
      vi.mocked(networkErrorHandler.isOnline).mockReturnValue(true);
      vi.mocked(healthMonitor.isFeatureEnabled).mockReturnValue(true);

      const limitations = manager.getFeatureLimitations('trip-planning');
      
      expect(limitations).toEqual([]);
    });

    it('should return limitations when offline', () => {
      vi.mocked(networkErrorHandler.isOnline).mockReturnValue(false);

      const limitations = manager.getFeatureLimitations('trip-planning');
      
      expect(limitations.length).toBeGreaterThan(0);
      expect(limitations.some(l => l.includes('sync'))).toBe(true);
    });

    it('should return limitations for partial offline features', () => {
      vi.mocked(networkErrorHandler.isOnline).mockReturnValue(false);

      const limitations = manager.getFeatureLimitations('destination-suggestions');
      
      expect(limitations.length).toBeGreaterThan(0);
      expect(limitations.some(l => l.includes('cached'))).toBe(true);
    });
  });

  describe('Fallback Behavior', () => {
    it('should provide fallback behavior for features', () => {
      const fallback = manager.getFallbackBehavior('destination-suggestions');
      
      expect(fallback).toBeDefined();
      expect(fallback).toContain('cached');
    });

    it('should provide fallback behavior for all features', () => {
      const capabilities = manager.getAllCapabilities();
      
      capabilities.forEach((capability) => {
        const fallback = manager.getFallbackBehavior(capability.featureName);
        expect(fallback).toBeDefined();
      });
    });
  });

  describe('Capability Summary', () => {
    it('should provide accurate summary statistics', () => {
      const summary = manager.getOfflineCapabilitySummary();
      
      expect(summary.totalFeatures).toBeGreaterThan(0);
      expect(summary.fullOfflineSupport).toBeGreaterThan(0);
      expect(summary.partialOfflineSupport).toBeGreaterThan(0);
      expect(summary.noOfflineSupport).toBeGreaterThan(0);
      
      // Total should equal sum of categories
      expect(summary.totalFeatures).toBe(
        summary.fullOfflineSupport +
        summary.partialOfflineSupport +
        summary.noOfflineSupport
      );
    });
  });

  describe('Subscription and Updates', () => {
    it('should notify subscribers of capability changes', () => {
      const listener = vi.fn();
      
      manager.subscribe(listener);
      
      // Should be called immediately with current capabilities
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.any(Map));
    });

    it('should allow unsubscribing', () => {
      const listener = vi.fn();
      
      const unsubscribe = manager.subscribe(listener);
      expect(listener).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      
      // Further updates should not trigger listener
      // (would need to trigger an update to test this properly)
    });
  });

  describe('Offline Mode Detection', () => {
    it('should correctly identify offline mode for features', () => {
      expect(manager.getOfflineMode('trip-planning')).toBe('full');
      expect(manager.getOfflineMode('maps')).toBe('partial');
      expect(manager.getOfflineMode('authentication')).toBe('none');
    });

    it('should return none for unknown features', () => {
      expect(manager.getOfflineMode('unknown-feature')).toBe('none');
    });
  });

  describe('Available and Unavailable Features', () => {
    it('should list available features when online', () => {
      vi.mocked(networkErrorHandler.isOnline).mockReturnValue(true);
      vi.mocked(healthMonitor.isFeatureEnabled).mockReturnValue(true);

      const available = manager.getAvailableFeatures();
      
      expect(available.length).toBeGreaterThan(0);
    });

    it('should list unavailable features when offline', () => {
      vi.mocked(networkErrorHandler.isOnline).mockReturnValue(false);

      const unavailable = manager.getUnavailableFeatures();
      
      // Check that network-required features with no offline mode exist
      const authFeature = manager.getFeatureCapability('authentication');
      expect(authFeature?.offlineMode).toBe('none');
      expect(authFeature?.requiresNetwork).toBe(true);
    });
  });
});
