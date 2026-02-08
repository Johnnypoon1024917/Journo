/**
 * useNetworkStatus Hook
 * 
 * React hook for monitoring network connectivity status and handling network errors
 * 
 * Validates: Requirements 4.3
 */

import { useState, useEffect } from 'react';
import { networkErrorHandler, NetworkState } from '../services/networkErrorHandler';

export const useNetworkStatus = () => {
  const [networkState, setNetworkState] = useState<NetworkState>(
    networkErrorHandler.getNetworkState()
  );

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = networkErrorHandler.subscribe((state) => {
      setNetworkState(state);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  return {
    isOnline: networkState.isOnline,
    status: networkState.status,
    effectiveType: networkState.effectiveType,
    downlink: networkState.downlink,
    rtt: networkState.rtt,
    lastChecked: networkState.lastChecked,
    networkState,
  };
};
