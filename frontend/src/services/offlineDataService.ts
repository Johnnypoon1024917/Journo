/**
 * Offline Data Service
 * Handles fetching and displaying data with offline support
 */

import { offlineStorage } from './offlineStorage';
import { serviceWorkerManager } from './serviceWorkerManager';
import { useOfflineStore } from '../stores/offlineStore';

export interface DataFetchOptions {
  cacheFirst?: boolean; // Try cache before network
  cacheName?: string;
  token?: string;
  forceRefresh?: boolean; // Skip cache and fetch from network
}

export interface DataFetchResult<T> {
  data: T | null;
  fromCache: boolean;
  lastUpdated: Date | null;
  error: string | null;
}

class OfflineDataService {
  /**
   * Fetch data with offline support
   * Tries network first, falls back to cache if offline
   */
  async fetchWithOfflineSupport<T>(
    url: string,
    options: DataFetchOptions = {}
  ): Promise<DataFetchResult<T>> {
    const { cacheFirst = false, cacheName, token, forceRefresh = false } = options;
    const isOnline = navigator.onLine;

    // If cache first is enabled and we're offline, try cache immediately
    if ((cacheFirst || !isOnline) && !forceRefresh) {
      const cachedResult = await this.fetchFromCache<T>(url, cacheName);
      if (cachedResult.data) {
        // If offline, return cached data
        if (!isOnline) {
          return cachedResult;
        }
        // If online and cache first, return cached data but fetch in background
        this.fetchFromNetwork<T>(url, token, cacheName).catch(console.error);
        return cachedResult;
      }
    }

    // Try network first
    if (isOnline && !forceRefresh) {
      try {
        const networkResult = await this.fetchFromNetwork<T>(url, token, cacheName);
        return networkResult;
      } catch (error) {
        console.error('Network fetch failed, trying cache:', error);
        // Fall back to cache
        const cachedResult = await this.fetchFromCache<T>(url, cacheName);
        if (cachedResult.data) {
          return cachedResult;
        }
        // No cache available, return error
        return {
          data: null,
          fromCache: false,
          lastUpdated: null,
          error: error instanceof Error ? error.message : 'Failed to fetch data',
        };
      }
    }

    // Offline and no cache
    const cachedResult = await this.fetchFromCache<T>(url, cacheName);
    if (cachedResult.data) {
      return cachedResult;
    }

    return {
      data: null,
      fromCache: false,
      lastUpdated: null,
      error: 'No data available offline',
    };
  }

  /**
   * Fetch from network and cache the response
   */
  private async fetchFromNetwork<T>(
    url: string,
    token?: string,
    cacheName?: string
  ): Promise<DataFetchResult<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Cache the response
    if (cacheName && 'caches' in window) {
      try {
        const cache = await caches.open(cacheName);
        await cache.put(url, response.clone());
      } catch (error) {
        console.error('Failed to cache response:', error);
      }
    }

    return {
      data,
      fromCache: false,
      lastUpdated: new Date(),
      error: null,
    };
  }

  /**
   * Fetch from cache
   */
  private async fetchFromCache<T>(
    url: string,
    cacheName?: string
  ): Promise<DataFetchResult<T>> {
    if (!('caches' in window)) {
      return {
        data: null,
        fromCache: false,
        lastUpdated: null,
        error: 'Cache not supported',
      };
    }

    try {
      const response = await serviceWorkerManager.getCachedResponse(url, cacheName);

      if (!response) {
        return {
          data: null,
          fromCache: false,
          lastUpdated: null,
          error: 'No cached data',
        };
      }

      const data = await response.json();
      const dateHeader = response.headers.get('date');
      const lastUpdated = dateHeader ? new Date(dateHeader) : null;

      return {
        data,
        fromCache: true,
        lastUpdated,
        error: null,
      };
    } catch (error) {
      console.error('Failed to fetch from cache:', error);
      return {
        data: null,
        fromCache: false,
        lastUpdated: null,
        error: error instanceof Error ? error.message : 'Failed to read cache',
      };
    }
  }

  /**
   * Prefetch and cache data for offline use
   */
  async prefetchData(url: string, token?: string, cacheName?: string): Promise<boolean> {
    try {
      await this.fetchFromNetwork(url, token, cacheName);
      return true;
    } catch (error) {
      console.error('Failed to prefetch data:', error);
      return false;
    }
  }

  /**
   * Prefetch multiple URLs
   */
  async prefetchMultiple(
    urls: string[],
    token?: string,
    cacheName?: string
  ): Promise<{ success: number; failed: number }> {
    const result = { success: 0, failed: 0 };

    for (const url of urls) {
      const success = await this.prefetchData(url, token, cacheName);
      if (success) {
        result.success++;
      } else {
        result.failed++;
      }
    }

    return result;
  }

  /**
   * Check if data is cached
   */
  async isCached(url: string, cacheName?: string): Promise<boolean> {
    return await serviceWorkerManager.isUrlCached(url, cacheName);
  }

  /**
   * Get cache age
   */
  async getCacheAge(url: string, cacheName?: string): Promise<number | null> {
    const response = await serviceWorkerManager.getCachedResponse(url, cacheName);
    if (!response) {
      return null;
    }

    const dateHeader = response.headers.get('date');
    if (!dateHeader) {
      return null;
    }

    const cacheDate = new Date(dateHeader);
    const now = new Date();
    return now.getTime() - cacheDate.getTime(); // Age in milliseconds
  }

  /**
   * Invalidate cache for a URL
   */
  async invalidateCache(url: string, cacheName?: string): Promise<boolean> {
    if (!('caches' in window)) {
      return false;
    }

    try {
      if (cacheName) {
        const cache = await caches.open(cacheName);
        return await cache.delete(url);
      } else {
        // Try all caches
        const cacheNames = await caches.keys();
        let deleted = false;
        for (const name of cacheNames) {
          const cache = await caches.open(name);
          const result = await cache.delete(url);
          if (result) {
            deleted = true;
          }
        }
        return deleted;
      }
    } catch (error) {
      console.error('Failed to invalidate cache:', error);
      return false;
    }
  }
}

export const offlineDataService = new OfflineDataService();
export default offlineDataService;
