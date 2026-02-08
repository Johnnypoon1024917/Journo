/**
 * Unit tests for useHealthMonitor hook
 * 
 * Tests React hook integration with HealthMonitor service
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useHealthMonitor,
  useServiceChanges,
  useFeatureEnabled,
} from '../useHealthMonitor';
import { healthMonitor } from '../../services/healthMonitor';

// Mock the health monitor
vi.mock('../../services/healthMonitor', () => ({
  healthMonitor: {
    getOverallHealth: vi.fn(() => ({
      isOnline: true,
      overallStatus: 'healthy',
      services: {},
      lastUpdated: new Date(),
    })),
    subscribe: vi.fn((callback) => {
      callback({
        isOnline: true,
        overallStatus: 'healthy',
        services: {},
        lastUpdated: new Date(),
      });
      return () => {};
    }),
    subscribeToChanges: vi.fn(() => () => {}),
    isFeatureEnabled: vi.fn(() => true),
    getFeatures: vi.fn(() => new Map()),
    monitorServices: vi.fn(),
    stopMonitoring: vi.fn(),
  },
}));

describe('useHealthMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial health status', () => {
    const { result } = renderHook(() => useHealthMonitor());

    expect(result.current.health).toBeDefined();
    expect(result.current.health.overallStatus).toBe('healthy');
    expect(result.current.isMonitoring).toBe(false);
  });

  it('should subscribe to health updates on mount', () => {
    renderHook(() => useHealthMonitor());

    expect(healthMonitor.subscribe).toHaveBeenCalled();
  });

  it('should unsubscribe on unmount', () => {
    const unsubscribe = vi.fn();
    (healthMonitor.subscribe as any).mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useHealthMonitor());

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });

  it('should start monitoring', () => {
    const { result } = renderHook(() => useHealthMonitor());

    act(() => {
      result.current.startMonitoring();
    });

    expect(healthMonitor.monitorServices).toHaveBeenCalled();
    expect(result.current.isMonitoring).toBe(true);
  });

  it('should stop monitoring', () => {
    const { result } = renderHook(() => useHealthMonitor());

    act(() => {
      result.current.startMonitoring();
    });

    act(() => {
      result.current.stopMonitoring();
    });

    expect(healthMonitor.stopMonitoring).toHaveBeenCalled();
    expect(result.current.isMonitoring).toBe(false);
  });

  it('should check if feature is enabled', () => {
    (healthMonitor.isFeatureEnabled as any).mockReturnValue(true);

    const { result } = renderHook(() => useHealthMonitor());

    const isEnabled = result.current.isFeatureEnabled('destination-suggestions');

    expect(isEnabled).toBe(true);
    expect(healthMonitor.isFeatureEnabled).toHaveBeenCalledWith(
      'destination-suggestions'
    );
  });

  it('should return features map', () => {
    const mockFeatures = new Map([
      ['feature1', { name: 'feature1', requiredServices: [], enabled: true, offlineCapable: false }],
    ]);
    (healthMonitor.getFeatures as any).mockReturnValue(mockFeatures);

    const { result } = renderHook(() => useHealthMonitor());

    expect(result.current.features).toBe(mockFeatures);
  });

  it('should update health when service status changes', async () => {
    let subscribeCallback: any;
    (healthMonitor.subscribe as any).mockImplementation((callback) => {
      subscribeCallback = callback;
      callback({
        isOnline: true,
        overallStatus: 'healthy',
        services: {},
        lastUpdated: new Date(),
      });
      return () => {};
    });

    const { result } = renderHook(() => useHealthMonitor());

    expect(result.current.health.overallStatus).toBe('healthy');

    // Simulate health update
    act(() => {
      subscribeCallback({
        isOnline: true,
        overallStatus: 'degraded',
        services: {},
        lastUpdated: new Date(),
      });
    });

    await waitFor(() => {
      expect(result.current.health.overallStatus).toBe('degraded');
    });
  });
});

describe('useServiceChanges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should subscribe to service changes', () => {
    const onServiceChange = vi.fn();

    renderHook(() => useServiceChanges(onServiceChange));

    expect(healthMonitor.subscribeToChanges).toHaveBeenCalled();
  });

  it('should unsubscribe on unmount', () => {
    const unsubscribe = vi.fn();
    (healthMonitor.subscribeToChanges as any).mockReturnValue(unsubscribe);

    const onServiceChange = vi.fn();
    const { unmount } = renderHook(() => useServiceChanges(onServiceChange));

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });

  it('should call callback when service changes', () => {
    let changeCallback: any;
    (healthMonitor.subscribeToChanges as any).mockImplementation((callback) => {
      changeCallback = callback;
      return () => {};
    });

    const onServiceChange = vi.fn();
    renderHook(() => useServiceChanges(onServiceChange));

    const changes = [
      {
        service: 'api',
        previousStatus: true,
        currentStatus: false,
        timestamp: new Date(),
        message: 'Service down',
      },
    ];

    act(() => {
      changeCallback(changes);
    });

    expect(onServiceChange).toHaveBeenCalledWith(changes);
  });
});

describe('useFeatureEnabled', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return feature enabled status', () => {
    (healthMonitor.isFeatureEnabled as any).mockReturnValue(true);

    const { result } = renderHook(() =>
      useFeatureEnabled('destination-suggestions')
    );

    expect(result.current).toBe(true);
  });

  it('should update when feature status changes', async () => {
    let subscribeCallback: any;
    (healthMonitor.subscribe as any).mockImplementation((callback) => {
      subscribeCallback = callback;
      return () => {};
    });

    (healthMonitor.isFeatureEnabled as any)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);

    const { result } = renderHook(() =>
      useFeatureEnabled('destination-suggestions')
    );

    expect(result.current).toBe(true);

    // Simulate health update that changes feature status
    act(() => {
      subscribeCallback({
        isOnline: true,
        overallStatus: 'degraded',
        services: {},
        lastUpdated: new Date(),
      });
    });

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it('should unsubscribe on unmount', () => {
    const unsubscribe = vi.fn();
    (healthMonitor.subscribe as any).mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() =>
      useFeatureEnabled('destination-suggestions')
    );

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});
