/**
 * Unit tests for useNetworkStatus hook
 * 
 * Tests network connectivity monitoring
 * Validates: Requirements 4.3
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useNetworkStatus } from '../useNetworkStatus';
import { networkErrorHandler } from '../../services/networkErrorHandler';
import { vi } from 'vitest';

// Mock the network error handler
vi.mock('../../services/networkErrorHandler');

describe('useNetworkStatus', () => {
  let mockSubscribe: ReturnType<typeof vi.fn>;
  let mockGetNetworkState: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSubscribe = vi.fn();
    mockGetNetworkState = vi.fn();

    (networkErrorHandler.subscribe as any) = mockSubscribe;
    (networkErrorHandler.getNetworkState as any) = mockGetNetworkState;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial network state', () => {
    const initialState = {
      isOnline: true,
      status: 'online' as const,
      lastChecked: new Date(),
    };

    mockGetNetworkState.mockReturnValue(initialState);
    mockSubscribe.mockReturnValue(() => {});

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.status).toBe('online');
    expect(result.current.networkState).toEqual(initialState);
  });

  it('should subscribe to network state changes on mount', () => {
    mockGetNetworkState.mockReturnValue({
      isOnline: true,
      status: 'online' as const,
      lastChecked: new Date(),
    });
    mockSubscribe.mockReturnValue(() => {});

    renderHook(() => useNetworkStatus());

    expect(mockSubscribe).toHaveBeenCalledTimes(1);
    expect(mockSubscribe).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should update state when network status changes', async () => {
    const initialState = {
      isOnline: true,
      status: 'online' as const,
      lastChecked: new Date(),
    };

    const offlineState = {
      isOnline: false,
      status: 'offline' as const,
      lastChecked: new Date(),
    };

    mockGetNetworkState.mockReturnValue(initialState);

    let stateChangeCallback: (state: any) => void;
    mockSubscribe.mockImplementation((callback) => {
      stateChangeCallback = callback;
      return () => {};
    });

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(true);

    // Simulate network state change
    act(() => {
      stateChangeCallback(offlineState);
    });

    await waitFor(() => {
      expect(result.current.isOnline).toBe(false);
      expect(result.current.status).toBe('offline');
    });
  });

  it('should unsubscribe on unmount', () => {
    const mockUnsubscribe = vi.fn();
    mockGetNetworkState.mockReturnValue({
      isOnline: true,
      status: 'online' as const,
      lastChecked: new Date(),
    });
    mockSubscribe.mockReturnValue(mockUnsubscribe);

    const { unmount } = renderHook(() => useNetworkStatus());

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('should expose all network state properties', () => {
    const fullState = {
      isOnline: true,
      status: 'online' as const,
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      lastChecked: new Date(),
    };

    mockGetNetworkState.mockReturnValue(fullState);
    mockSubscribe.mockReturnValue(() => {});

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.status).toBe('online');
    expect(result.current.effectiveType).toBe('4g');
    expect(result.current.downlink).toBe(10);
    expect(result.current.rtt).toBe(50);
    expect(result.current.lastChecked).toBeInstanceOf(Date);
    expect(result.current.networkState).toEqual(fullState);
  });

  it('should handle slow connection status', () => {
    const slowState = {
      isOnline: true,
      status: 'slow' as const,
      effectiveType: '2g',
      rtt: 1500,
      lastChecked: new Date(),
    };

    mockGetNetworkState.mockReturnValue(slowState);
    mockSubscribe.mockReturnValue(() => {});

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.status).toBe('slow');
    expect(result.current.effectiveType).toBe('2g');
  });
});
