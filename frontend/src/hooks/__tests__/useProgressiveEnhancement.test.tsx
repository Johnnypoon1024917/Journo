/**
 * Tests for useProgressiveEnhancement Hook
 * 
 * Validates: Requirements 9.3, 10.3
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useProgressiveEnhancement,
  useOptimizedImage,
  useBatchSize,
  usePollingInterval,
} from '../useProgressiveEnhancement';
import * as useNetworkStatusModule from '../useNetworkStatus';

// Mock useNetworkStatus
vi.mock('../useNetworkStatus');

describe('useProgressiveEnhancement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Connection Quality Detection', () => {
    it('should detect excellent connection quality', () => {
      vi.mocked(useNetworkStatusModule.useNetworkStatus).mockReturnValue({
        isOnline: true,
        status: 'online',
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        lastChecked: new Date(),
        networkState: {
          isOnline: true,
          status: 'online',
          effectiveType: '4g',
          downlink: 10,
          rtt: 50,
          lastChecked: new Date(),
        },
      });

      const { result } = renderHook(() => useProgressiveEnhancement());

      // With 4G, low RTT (50ms) and high downlink (10), should be excellent
      expect(result.current.connectionQuality).toBe('excellent');
      expect(result.current.imageQuality).toBe('high');
      expect(result.current.enableAnimations).toBe(true);
      expect(result.current.prefetchData).toBe(true);
    });

    it('should detect poor connection quality', () => {
      vi.mocked(useNetworkStatusModule.useNetworkStatus).mockReturnValue({
        isOnline: true,
        status: 'slow',
        effectiveType: '2g',
        downlink: 0.3,
        rtt: 2500,
        lastChecked: new Date(),
        networkState: {
          isOnline: true,
          status: 'slow',
          effectiveType: '2g',
          downlink: 0.3,
          rtt: 2500,
          lastChecked: new Date(),
        },
      });

      const { result } = renderHook(() => useProgressiveEnhancement());

      expect(result.current.connectionQuality).toBe('poor');
      expect(result.current.imageQuality).toBe('low');
      expect(result.current.enableAnimations).toBe(false);
      expect(result.current.prefetchData).toBe(false);
    });

    it('should detect offline status', () => {
      vi.mocked(useNetworkStatusModule.useNetworkStatus).mockReturnValue({
        isOnline: false,
        status: 'offline',
        effectiveType: undefined,
        downlink: undefined,
        rtt: undefined,
        lastChecked: new Date(),
        networkState: {
          isOnline: false,
          status: 'offline',
          lastChecked: new Date(),
        },
      });

      const { result } = renderHook(() => useProgressiveEnhancement());

      expect(result.current.connectionQuality).toBe('offline');
      expect(result.current.imageQuality).toBe('placeholder');
      expect(result.current.enableRealtime).toBe(false);
      expect(result.current.enableAutoRefresh).toBe(false);
    });
  });

  describe('Progressive Enhancement Configuration', () => {
    it('should enable all features for excellent connection', () => {
      vi.mocked(useNetworkStatusModule.useNetworkStatus).mockReturnValue({
        isOnline: true,
        status: 'online',
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        lastChecked: new Date(),
        networkState: {
          isOnline: true,
          status: 'online',
          effectiveType: '4g',
          downlink: 10,
          rtt: 50,
          lastChecked: new Date(),
        },
      });

      const { result } = renderHook(() => useProgressiveEnhancement());

      expect(result.current.enableRealtime).toBe(true);
      expect(result.current.enableAutoRefresh).toBe(true);
      expect(result.current.prefetchData).toBe(true);
      expect(result.current.batchRequests).toBe(false);
    });

    it('should disable expensive features for poor connection', () => {
      vi.mocked(useNetworkStatusModule.useNetworkStatus).mockReturnValue({
        isOnline: true,
        status: 'slow',
        effectiveType: '2g',
        downlink: 0.3,
        rtt: 2500,
        lastChecked: new Date(),
        networkState: {
          isOnline: true,
          status: 'slow',
          effectiveType: '2g',
          downlink: 0.3,
          rtt: 2500,
          lastChecked: new Date(),
        },
      });

      const { result } = renderHook(() => useProgressiveEnhancement());

      expect(result.current.enableRealtime).toBe(false);
      expect(result.current.enableAutoRefresh).toBe(false);
      expect(result.current.prefetchData).toBe(false);
      expect(result.current.batchRequests).toBe(true);
    });

    it('should enable lazy loading for all connection types except excellent', () => {
      const connectionTypes = [
        { effectiveType: '2g', expected: true },
        { effectiveType: '3g', expected: true },
        { effectiveType: '4g', expected: true },
      ];

      connectionTypes.forEach(({ effectiveType, expected }) => {
        vi.mocked(useNetworkStatusModule.useNetworkStatus).mockReturnValue({
          isOnline: true,
          status: 'online',
          effectiveType,
          downlink: 5,
          rtt: 100,
          lastChecked: new Date(),
          networkState: {
            isOnline: true,
            status: 'online',
            effectiveType,
            downlink: 5,
            rtt: 100,
            lastChecked: new Date(),
          },
        });

        const { result } = renderHook(() => useProgressiveEnhancement());
        expect(result.current.lazyLoadImages).toBe(expected);
      });
    });
  });
});

describe('useOptimizedImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return placeholder for offline mode', () => {
    vi.mocked(useNetworkStatusModule.useNetworkStatus).mockReturnValue({
      isOnline: false,
      status: 'offline',
      effectiveType: undefined,
      downlink: undefined,
      rtt: undefined,
      lastChecked: new Date(),
      networkState: {
        isOnline: false,
        status: 'offline',
        lastChecked: new Date(),
      },
    });

    const { result } = renderHook(() =>
      useOptimizedImage('https://example.com/image.jpg', { width: 400, height: 300 })
    );

    expect(result.current).toContain('data:image/svg+xml');
  });

  it('should add quality parameters for low quality', () => {
    vi.mocked(useNetworkStatusModule.useNetworkStatus).mockReturnValue({
      isOnline: true,
      status: 'slow',
      effectiveType: '2g',
      downlink: 0.3,
      rtt: 2500,
      lastChecked: new Date(),
      networkState: {
        isOnline: true,
        status: 'slow',
        effectiveType: '2g',
        downlink: 0.3,
        rtt: 2500,
        lastChecked: new Date(),
      },
    });

    const { result } = renderHook(() =>
      useOptimizedImage('https://example.com/image.jpg')
    );

    expect(result.current).toContain('q=30');
    expect(result.current).toContain('fm=webp');
  });

  it('should return undefined for undefined input', () => {
    vi.mocked(useNetworkStatusModule.useNetworkStatus).mockReturnValue({
      isOnline: true,
      status: 'online',
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      lastChecked: new Date(),
      networkState: {
        isOnline: true,
        status: 'online',
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        lastChecked: new Date(),
      },
    });

    const { result } = renderHook(() => useOptimizedImage(undefined));

    expect(result.current).toBeUndefined();
  });
});

describe('useBatchSize', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 0 for offline', () => {
    vi.mocked(useNetworkStatusModule.useNetworkStatus).mockReturnValue({
      isOnline: false,
      status: 'offline',
      effectiveType: undefined,
      downlink: undefined,
      rtt: undefined,
      lastChecked: new Date(),
      networkState: {
        isOnline: false,
        status: 'offline',
        lastChecked: new Date(),
      },
    });

    const { result } = renderHook(() => useBatchSize(20));

    expect(result.current).toBe(0);
  });

  it('should reduce batch size for poor connection', () => {
    vi.mocked(useNetworkStatusModule.useNetworkStatus).mockReturnValue({
      isOnline: true,
      status: 'slow',
      effectiveType: '2g',
      downlink: 0.3,
      rtt: 2500,
      lastChecked: new Date(),
      networkState: {
        isOnline: true,
        status: 'slow',
        effectiveType: '2g',
        downlink: 0.3,
        rtt: 2500,
        lastChecked: new Date(),
      },
    });

    const { result } = renderHook(() => useBatchSize(20));

    expect(result.current).toBeLessThan(20);
    expect(result.current).toBeGreaterThanOrEqual(5);
  });

  it('should increase batch size for excellent connection', () => {
    vi.mocked(useNetworkStatusModule.useNetworkStatus).mockReturnValue({
      isOnline: true,
      status: 'online',
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      lastChecked: new Date(),
      networkState: {
        isOnline: true,
        status: 'online',
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        lastChecked: new Date(),
      },
    });

    const { result } = renderHook(() => useBatchSize(20));

    // Excellent connection should double the batch size
    expect(result.current).toBe(40);
  });
});

describe('usePollingInterval', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null for offline', () => {
    vi.mocked(useNetworkStatusModule.useNetworkStatus).mockReturnValue({
      isOnline: false,
      status: 'offline',
      effectiveType: undefined,
      downlink: undefined,
      rtt: undefined,
      lastChecked: new Date(),
      networkState: {
        isOnline: false,
        status: 'offline',
        lastChecked: new Date(),
      },
    });

    const { result } = renderHook(() => usePollingInterval(30000));

    expect(result.current).toBeNull();
  });

  it('should disable polling for poor connection', () => {
    vi.mocked(useNetworkStatusModule.useNetworkStatus).mockReturnValue({
      isOnline: true,
      status: 'slow',
      effectiveType: '2g',
      downlink: 0.3,
      rtt: 2500,
      lastChecked: new Date(),
      networkState: {
        isOnline: true,
        status: 'slow',
        effectiveType: '2g',
        downlink: 0.3,
        rtt: 2500,
        lastChecked: new Date(),
      },
    });

    const { result } = renderHook(() => usePollingInterval(30000));

    // Poor connection disables auto-refresh, so polling should be disabled
    expect(result.current).toBeNull();
  });

  it('should decrease interval for excellent connection', () => {
    vi.mocked(useNetworkStatusModule.useNetworkStatus).mockReturnValue({
      isOnline: true,
      status: 'online',
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      lastChecked: new Date(),
      networkState: {
        isOnline: true,
        status: 'online',
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        lastChecked: new Date(),
      },
    });

    const { result } = renderHook(() => usePollingInterval(30000));

    // Excellent connection should halve the interval
    expect(result.current).toBe(15000);
    expect(result.current).toBeGreaterThanOrEqual(10000); // Minimum 10s
  });
});
