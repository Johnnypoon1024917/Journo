/**
 * useServiceWorker Hook
 * React hook for managing service worker functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { serviceWorkerManager, CacheStatus } from '../services/serviceWorkerManager';

export interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  cacheStatus: CacheStatus | null;
  isLoading: boolean;
  error: string | null;
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: serviceWorkerManager.isServiceWorkerSupported(),
    isRegistered: false,
    isUpdateAvailable: false,
    cacheStatus: null,
    isLoading: true,
    error: null,
  });

  // Check registration status
  useEffect(() => {
    const checkRegistration = async () => {
      try {
        const registration = await serviceWorkerManager.getRegistration();
        const cacheStatus = await serviceWorkerManager.getCacheStatus();

        setState(prev => ({
          ...prev,
          isRegistered: !!registration,
          isUpdateAvailable: !!registration?.waiting,
          cacheStatus,
          isLoading: false,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to check service worker',
        }));
      }
    };

    checkRegistration();
  }, []);

  // Listen for service worker updates
  useEffect(() => {
    if (!state.isSupported) {
      return;
    }

    const handleUpdateFound = () => {
      setState(prev => ({ ...prev, isUpdateAvailable: true }));
    };

    const handleControllerChange = () => {
      // Service worker has been updated and activated
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Check for updates periodically
    const checkForUpdates = async () => {
      const registration = await serviceWorkerManager.getRegistration();
      if (registration?.waiting) {
        setState(prev => ({ ...prev, isUpdateAvailable: true }));
      }
    };

    const updateInterval = setInterval(checkForUpdates, 60000); // Check every minute

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      clearInterval(updateInterval);
    };
  }, [state.isSupported]);

  // Cache trip data
  const cacheTripData = useCallback(async (tripId: string, token: string): Promise<boolean> => {
    try {
      const success = await serviceWorkerManager.cacheTripData(tripId, token);
      
      // Update cache status
      const cacheStatus = await serviceWorkerManager.getCacheStatus();
      setState(prev => ({ ...prev, cacheStatus }));
      
      return success;
    } catch (error) {
      console.error('Failed to cache trip data:', error);
      return false;
    }
  }, []);

  // Cache document
  const cacheDocument = useCallback(async (documentUrl: string): Promise<boolean> => {
    try {
      const success = await serviceWorkerManager.cacheDocument(documentUrl);
      
      // Update cache status
      const cacheStatus = await serviceWorkerManager.getCacheStatus();
      setState(prev => ({ ...prev, cacheStatus }));
      
      return success;
    } catch (error) {
      console.error('Failed to cache document:', error);
      return false;
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(async (cacheName?: string): Promise<boolean> => {
    try {
      const success = cacheName
        ? await serviceWorkerManager.clearCache(cacheName)
        : (await serviceWorkerManager.clearAllCaches()) > 0;
      
      // Update cache status
      const cacheStatus = await serviceWorkerManager.getCacheStatus();
      setState(prev => ({ ...prev, cacheStatus }));
      
      return success;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }, []);

  // Update service worker
  const updateServiceWorker = useCallback(async (): Promise<boolean> => {
    try {
      const success = await serviceWorkerManager.skipWaitingAndActivate();
      if (success) {
        setState(prev => ({ ...prev, isUpdateAvailable: false }));
      }
      return success;
    } catch (error) {
      console.error('Failed to update service worker:', error);
      return false;
    }
  }, []);

  // Refresh cache status
  const refreshCacheStatus = useCallback(async () => {
    try {
      const cacheStatus = await serviceWorkerManager.getCacheStatus();
      setState(prev => ({ ...prev, cacheStatus }));
    } catch (error) {
      console.error('Failed to refresh cache status:', error);
    }
  }, []);

  return {
    ...state,
    cacheTripData,
    cacheDocument,
    clearCache,
    updateServiceWorker,
    refreshCacheStatus,
  };
}

export default useServiceWorker;
