/**
 * useOfflineData Hook
 * React hook for fetching data with offline support
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineDataService, DataFetchOptions, DataFetchResult } from '../services/offlineDataService';
import { useOfflineStore } from '../stores/offlineStore';

export interface UseOfflineDataOptions<T> extends DataFetchOptions {
  enabled?: boolean; // Whether to fetch automatically
  refetchOnOnline?: boolean; // Refetch when coming back online
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
}

export interface UseOfflineDataResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  fromCache: boolean;
  lastUpdated: Date | null;
  refetch: () => Promise<void>;
  prefetch: () => Promise<boolean>;
  isCached: boolean;
}

export function useOfflineData<T>(
  url: string | null,
  options: UseOfflineDataOptions<T> = {}
): UseOfflineDataResult<T> {
  const {
    enabled = true,
    refetchOnOnline = true,
    onSuccess,
    onError,
    ...fetchOptions
  } = options;

  const { isOnline } = useOfflineStore();
  const [state, setState] = useState<{
    data: T | null;
    isLoading: boolean;
    error: string | null;
    fromCache: boolean;
    lastUpdated: Date | null;
    isCached: boolean;
  }>({
    data: null,
    isLoading: false,
    error: null,
    fromCache: false,
    lastUpdated: null,
    isCached: false,
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!url || !enabled) {
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result: DataFetchResult<T> = await offlineDataService.fetchWithOfflineSupport<T>(
        url,
        fetchOptions
      );

      if (result.error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error,
        }));
        onError?.(result.error);
      } else {
        setState(prev => ({
          ...prev,
          data: result.data,
          isLoading: false,
          error: null,
          fromCache: result.fromCache,
          lastUpdated: result.lastUpdated,
        }));
        if (result.data) {
          onSuccess?.(result.data);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      onError?.(errorMessage);
    }
  }, [url, enabled, fetchOptions, onSuccess, onError]);

  // Check if data is cached
  const checkCache = useCallback(async () => {
    if (!url) {
      return;
    }

    const cached = await offlineDataService.isCached(url, fetchOptions.cacheName);
    setState(prev => ({ ...prev, isCached: cached }));
  }, [url, fetchOptions.cacheName]);

  // Prefetch data
  const prefetch = useCallback(async (): Promise<boolean> => {
    if (!url) {
      return false;
    }

    const success = await offlineDataService.prefetchData(
      url,
      fetchOptions.token,
      fetchOptions.cacheName
    );

    if (success) {
      await checkCache();
    }

    return success;
  }, [url, fetchOptions.token, fetchOptions.cacheName, checkCache]);

  // Initial fetch
  useEffect(() => {
    if (enabled && url) {
      fetchData();
      checkCache();
    }
  }, [url, enabled]); // Only refetch when URL or enabled changes

  // Refetch when coming back online
  useEffect(() => {
    if (refetchOnOnline && isOnline && url && enabled) {
      fetchData();
    }
  }, [isOnline, refetchOnOnline, url, enabled]);

  return {
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
    fromCache: state.fromCache,
    lastUpdated: state.lastUpdated,
    refetch: fetchData,
    prefetch,
    isCached: state.isCached,
  };
}

export default useOfflineData;
