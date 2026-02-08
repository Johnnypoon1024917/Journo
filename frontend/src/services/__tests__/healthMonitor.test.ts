/**
 * Unit tests for HealthMonitor service
 * 
 * Tests service health monitoring, feature management, and notifications
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HealthMonitor, ServiceChange } from '../healthMonitor';
import { networkErrorHandler } from '../networkErrorHandler';

// Mock network error handler
vi.mock('../networkErrorHandler', () => ({
  networkErrorHandler: {
    isOnline: vi.fn(() => true),
    subscribe: vi.fn(() => () => {}),
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('HealthMonitor', () => {
  let healthMonitor: HealthMonitor;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    (networkErrorHandler.isOnline as any).mockReturnValue(true);
    
    // Create a fresh instance for each test
    healthMonitor = new (HealthMonitor as any)();
  });

  afterEach(() => {
    healthMonitor.destroy();
  });

  describe('Service Health Checking', () => {
    it('should check service health successfully', async () => {
      // Mock successful response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const status = await healthMonitor.checkServiceHealth('api');

      expect(status.isHealthy).toBe(true);
      expect(status.responseTime).toBeGreaterThanOrEqual(0);
      expect(status.errorCount).toBe(0);
      expect(status.consecutiveFailures).toBe(0);
    });

    it('should detect service failures', async () => {
      // Mock failed response
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      const status = await healthMonitor.checkServiceHealth('api');

      expect(status.isHealthy).toBe(false);
      expect(status.errorCount).toBeGreaterThan(0);
      expect(status.consecutiveFailures).toBeGreaterThan(0);
    });

    it('should handle network errors', async () => {
      // Mock network error
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const status = await healthMonitor.checkServiceHealth('api');

      expect(status.isHealthy).toBe(false);
      expect(status.errorCount).toBeGreaterThan(0);
    });

    it('should handle timeout errors', async () => {
      // Mock timeout
      (global.fetch as any).mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), 100);
          })
      );

      const status = await healthMonitor.checkServiceHealth('api');

      expect(status.isHealthy).toBe(false);
    });
  });

  describe('Overall Health Status', () => {
    it('should report healthy status when all services are healthy', () => {
      const health = healthMonitor.getOverallHealth();

      expect(health.isOnline).toBe(true);
      expect(health.overallStatus).toBe('healthy');
    });

    it('should report degraded status when some services are unhealthy', () => {
      // Mark one service as unhealthy
      healthMonitor.updateServiceStatus('api', {
        isHealthy: false,
        responseTime: 0,
        lastChecked: new Date(),
        errorCount: 1,
        consecutiveFailures: 1,
      });

      const health = healthMonitor.getOverallHealth();

      expect(health.overallStatus).toBe('degraded');
    });

    it('should report offline status when network is offline', () => {
      (networkErrorHandler.isOnline as any).mockReturnValue(false);

      const health = healthMonitor.getOverallHealth();

      expect(health.isOnline).toBe(false);
      expect(health.overallStatus).toBe('offline');
    });
  });

  describe('Feature Management', () => {
    it('should enable features when required services are healthy', () => {
      const isEnabled = healthMonitor.isFeatureEnabled('destination-suggestions');

      expect(isEnabled).toBe(true);
    });

    it('should disable features when required services are unhealthy', () => {
      // Mark destination service as unhealthy
      healthMonitor.updateServiceStatus('destinations', {
        isHealthy: false,
        responseTime: 0,
        lastChecked: new Date(),
        errorCount: 1,
        consecutiveFailures: 3,
      });

      const isEnabled = healthMonitor.isFeatureEnabled('destination-suggestions');

      expect(isEnabled).toBe(false);
    });

    it('should keep offline-capable features enabled when offline', () => {
      (networkErrorHandler.isOnline as any).mockReturnValue(false);
      healthMonitor.enableOfflineMode();

      const tripPlanningEnabled = healthMonitor.isFeatureEnabled('trip-planning');
      const destinationsEnabled = healthMonitor.isFeatureEnabled('destination-suggestions');

      expect(tripPlanningEnabled).toBe(true); // offline-capable
      expect(destinationsEnabled).toBe(false); // not offline-capable
    });

    it('should get all features with their status', () => {
      const features = healthMonitor.getFeatures();

      expect(features.size).toBeGreaterThan(0);
      expect(features.has('destination-suggestions')).toBe(true);
      expect(features.has('trip-planning')).toBe(true);
    });
  });

  describe('Service Change Notifications', () => {
    it('should notify listeners when service status changes', () => {
      return new Promise<void>((resolve) => {
        const changes: ServiceChange[] = [];

        healthMonitor.subscribeToChanges((serviceChanges) => {
          changes.push(...serviceChanges);
          
          if (changes.length > 0) {
            expect(changes[0].service).toBe('api');
            expect(changes[0].previousStatus).toBe(true);
            expect(changes[0].currentStatus).toBe(false);
            resolve();
          }
        });

        // Trigger a status change
        healthMonitor.updateServiceStatus('api', {
          isHealthy: false,
          responseTime: 0,
          lastChecked: new Date(),
          errorCount: 1,
          consecutiveFailures: 3,
        });
      });
    });

    it('should not notify when status does not change', () => {
      const listener = vi.fn();
      healthMonitor.subscribeToChanges(listener);

      // Update with same status
      healthMonitor.updateServiceStatus('api', {
        isHealthy: true,
        responseTime: 100,
        lastChecked: new Date(),
        errorCount: 0,
        consecutiveFailures: 0,
      });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Health Monitoring', () => {
    it('should start monitoring services', () => {
      healthMonitor.monitorServices();

      // Monitoring should be active
      expect(healthMonitor['isMonitoring']).toBe(true);
    });

    it('should stop monitoring services', () => {
      healthMonitor.monitorServices();
      healthMonitor.stopMonitoring();

      expect(healthMonitor['isMonitoring']).toBe(false);
    });

    it('should not start monitoring twice', () => {
      healthMonitor.monitorServices();
      const firstInterval = healthMonitor['monitoringInterval'];
      
      healthMonitor.monitorServices();
      const secondInterval = healthMonitor['monitoringInterval'];

      expect(firstInterval).toBe(secondInterval);
    });
  });

  describe('Offline Mode', () => {
    it('should enable offline mode', () => {
      healthMonitor.enableOfflineMode();

      const tripPlanningEnabled = healthMonitor.isFeatureEnabled('trip-planning');
      const destinationsEnabled = healthMonitor.isFeatureEnabled('destination-suggestions');

      expect(tripPlanningEnabled).toBe(true); // offline-capable
      expect(destinationsEnabled).toBe(false); // not offline-capable
    });

    it('should disable offline mode', () => {
      healthMonitor.enableOfflineMode();
      healthMonitor.disableOfflineMode();

      // All features should be re-enabled
      const features = healthMonitor.getFeatures();
      features.forEach((feature) => {
        expect(feature.enabled).toBe(true);
      });
    });

    it('should notify when entering offline mode', () => {
      return new Promise<void>((resolve) => {
        healthMonitor.subscribeToChanges((changes) => {
          if (changes.length > 0 && changes[0].service === 'network') {
            expect(changes[0].currentStatus).toBe(false);
            expect(changes[0].message).toContain('offline');
            resolve();
          }
        });

        healthMonitor.enableOfflineMode();
      });
    });

    it('should notify when exiting offline mode', () => {
      return new Promise<void>((resolve) => {
        healthMonitor.enableOfflineMode();

        healthMonitor.subscribeToChanges((changes) => {
          if (changes.length > 0 && changes[0].service === 'network') {
            expect(changes[0].currentStatus).toBe(true);
            expect(changes[0].message).toContain('online');
            resolve();
          }
        });

        healthMonitor.disableOfflineMode();
      });
    });
  });

  describe('Subscription Management', () => {
    it('should subscribe to health updates', () => {
      return new Promise<void>((resolve) => {
        let unsubscribe: (() => void) | null = null;
        
        unsubscribe = healthMonitor.subscribe((health) => {
          expect(health).toBeDefined();
          expect(health.overallStatus).toBeDefined();
          if (unsubscribe) {
            unsubscribe();
          }
          resolve();
        });
      });
    });

    it('should unsubscribe from health updates', () => {
      const listener = vi.fn();
      const unsubscribe = healthMonitor.subscribe(listener);

      // Should be called immediately with current health
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      listener.mockClear();

      // Trigger an update
      healthMonitor.updateServiceStatus('api', {
        isHealthy: false,
        responseTime: 0,
        lastChecked: new Date(),
        errorCount: 1,
        consecutiveFailures: 1,
      });

      // Should not be called after unsubscribe
      expect(listener).not.toHaveBeenCalled();
    });

    it('should unsubscribe from change notifications', () => {
      const listener = vi.fn();
      const unsubscribe = healthMonitor.subscribeToChanges(listener);

      unsubscribe();

      // Trigger a change
      healthMonitor.updateServiceStatus('api', {
        isHealthy: false,
        responseTime: 0,
        lastChecked: new Date(),
        errorCount: 1,
        consecutiveFailures: 3,
      });

      // Should not be called after unsubscribe
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Configuration', () => {
    it('should allow configuration of health check settings', () => {
      healthMonitor.configure({
        interval: 60000,
        timeout: 10000,
        failureThreshold: 5,
      });

      expect(healthMonitor['config'].interval).toBe(60000);
      expect(healthMonitor['config'].timeout).toBe(10000);
      expect(healthMonitor['config'].failureThreshold).toBe(5);
    });

    it('should restart monitoring with new config', () => {
      healthMonitor.monitorServices();
      const stopSpy = vi.spyOn(healthMonitor, 'stopMonitoring');
      const startSpy = vi.spyOn(healthMonitor, 'monitorServices');

      healthMonitor.configure({ interval: 60000 });

      expect(stopSpy).toHaveBeenCalled();
      expect(startSpy).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should clean up resources on destroy', () => {
      healthMonitor.monitorServices();
      
      const subscriberCount = healthMonitor['listeners'].size;
      healthMonitor.subscribe(() => {});
      
      expect(healthMonitor['listeners'].size).toBe(subscriberCount + 1);

      healthMonitor.destroy();

      expect(healthMonitor['isMonitoring']).toBe(false);
      expect(healthMonitor['listeners'].size).toBe(0);
      expect(healthMonitor['changeListeners'].size).toBe(0);
    });
  });
});
