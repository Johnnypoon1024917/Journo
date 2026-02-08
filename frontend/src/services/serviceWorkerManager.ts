/**
 * Service Worker Manager
 * Provides utilities for managing service worker caching and offline functionality
 */

export interface CacheStatus {
  tripDataCached: boolean;
  documentsCached: boolean;
  staticAssetsCached: boolean;
  totalCacheSize: number;
  lastCacheUpdate: Date | null;
}

export interface CacheOptions {
  cacheName: string;
  maxAge?: number; // in seconds
  maxEntries?: number;
}

class ServiceWorkerManager {
  private readonly CACHE_NAMES = {
    TRIP_DATA: 'trip-data-cache',
    TRIP_DETAILS: 'trip-details-cache',
    TRIP_ITEMS: 'trip-items-cache',
    DOCUMENTS: 'documents-cache',
    STICKERS: 'stickers-cache',
    STATIC: 'workbox-precache',
  } as const;

  /**
   * Check if service worker is supported and registered
   */
  isServiceWorkerSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  /**
   * Get service worker registration
   */
  async getRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isServiceWorkerSupported()) {
      return null;
    }

    try {
      return await navigator.serviceWorker.ready;
    } catch (error) {
      console.error('Failed to get service worker registration:', error);
      return null;
    }
  }

  /**
   * Manually cache a URL
   */
  async cacheUrl(url: string, cacheName: string = this.CACHE_NAMES.TRIP_DATA): Promise<boolean> {
    if (!('caches' in window)) {
      return false;
    }

    try {
      const cache = await caches.open(cacheName);
      await cache.add(url);
      return true;
    } catch (error) {
      console.error(`Failed to cache URL ${url}:`, error);
      return false;
    }
  }

  /**
   * Manually cache multiple URLs
   */
  async cacheUrls(urls: string[], cacheName: string = this.CACHE_NAMES.TRIP_DATA): Promise<number> {
    if (!('caches' in window)) {
      return 0;
    }

    let cachedCount = 0;
    const cache = await caches.open(cacheName);

    for (const url of urls) {
      try {
        await cache.add(url);
        cachedCount++;
      } catch (error) {
        console.error(`Failed to cache URL ${url}:`, error);
      }
    }

    return cachedCount;
  }

  /**
   * Cache trip data for offline access
   */
  async cacheTripData(tripId: string, token: string): Promise<boolean> {
    const urls = [
      `/api/trips/${tripId}`,
      `/api/trips/${tripId}/days`,
      `/api/trips/${tripId}/places`,
      `/api/trips/${tripId}/collaborators`,
    ];

    try {
      const cache = await caches.open(this.CACHE_NAMES.TRIP_DATA);
      
      for (const url of urls) {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          await cache.put(url, response.clone());
        }
      }

      return true;
    } catch (error) {
      console.error(`Failed to cache trip data for ${tripId}:`, error);
      return false;
    }
  }

  /**
   * Cache uploaded documents
   */
  async cacheDocument(documentUrl: string): Promise<boolean> {
    return await this.cacheUrl(documentUrl, this.CACHE_NAMES.DOCUMENTS);
  }

  /**
   * Get cache status
   */
  async getCacheStatus(): Promise<CacheStatus> {
    if (!('caches' in window)) {
      return {
        tripDataCached: false,
        documentsCached: false,
        staticAssetsCached: false,
        totalCacheSize: 0,
        lastCacheUpdate: null,
      };
    }

    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;
      let lastUpdate: Date | null = null;

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        for (const request of keys) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            totalSize += blob.size;
            
            const dateHeader = response.headers.get('date');
            if (dateHeader) {
              const date = new Date(dateHeader);
              if (!lastUpdate || date > lastUpdate) {
                lastUpdate = date;
              }
            }
          }
        }
      }

      return {
        tripDataCached: cacheNames.some(name => 
          name.includes('trip-data') || name.includes('trip-details')
        ),
        documentsCached: cacheNames.includes(this.CACHE_NAMES.DOCUMENTS),
        staticAssetsCached: cacheNames.some(name => name.includes('precache')),
        totalCacheSize: totalSize,
        lastCacheUpdate: lastUpdate,
      };
    } catch (error) {
      console.error('Failed to get cache status:', error);
      return {
        tripDataCached: false,
        documentsCached: false,
        staticAssetsCached: false,
        totalCacheSize: 0,
        lastCacheUpdate: null,
      };
    }
  }

  /**
   * Clear specific cache
   */
  async clearCache(cacheName: string): Promise<boolean> {
    if (!('caches' in window)) {
      return false;
    }

    try {
      return await caches.delete(cacheName);
    } catch (error) {
      console.error(`Failed to clear cache ${cacheName}:`, error);
      return false;
    }
  }

  /**
   * Clear all caches
   */
  async clearAllCaches(): Promise<number> {
    if (!('caches' in window)) {
      return 0;
    }

    try {
      const cacheNames = await caches.keys();
      let clearedCount = 0;

      for (const cacheName of cacheNames) {
        const deleted = await caches.delete(cacheName);
        if (deleted) {
          clearedCount++;
        }
      }

      return clearedCount;
    } catch (error) {
      console.error('Failed to clear all caches:', error);
      return 0;
    }
  }

  /**
   * Clear old cache entries
   */
  async clearOldCacheEntries(cacheName: string, maxAge: number): Promise<number> {
    if (!('caches' in window)) {
      return 0;
    }

    try {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      const now = Date.now();
      let deletedCount = 0;

      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const dateHeader = response.headers.get('date');
          if (dateHeader) {
            const cacheDate = new Date(dateHeader).getTime();
            const age = (now - cacheDate) / 1000; // age in seconds

            if (age > maxAge) {
              await cache.delete(request);
              deletedCount++;
            }
          }
        }
      }

      return deletedCount;
    } catch (error) {
      console.error(`Failed to clear old cache entries from ${cacheName}:`, error);
      return 0;
    }
  }

  /**
   * Prefetch trip data for offline use
   */
  async prefetchTripData(tripIds: string[], token: string): Promise<{
    success: number;
    failed: number;
  }> {
    const result = { success: 0, failed: 0 };

    for (const tripId of tripIds) {
      const cached = await this.cacheTripData(tripId, token);
      if (cached) {
        result.success++;
      } else {
        result.failed++;
      }
    }

    return result;
  }

  /**
   * Check if a URL is cached
   */
  async isUrlCached(url: string, cacheName?: string): Promise<boolean> {
    if (!('caches' in window)) {
      return false;
    }

    try {
      if (cacheName) {
        const cache = await caches.open(cacheName);
        const response = await cache.match(url);
        return !!response;
      } else {
        const response = await caches.match(url);
        return !!response;
      }
    } catch (error) {
      console.error(`Failed to check if URL is cached: ${url}`, error);
      return false;
    }
  }

  /**
   * Get cached response for a URL
   */
  async getCachedResponse(url: string, cacheName?: string): Promise<Response | null> {
    if (!('caches' in window)) {
      return null;
    }

    try {
      if (cacheName) {
        const cache = await caches.open(cacheName);
        return await cache.match(url) || null;
      } else {
        return await caches.match(url) || null;
      }
    } catch (error) {
      console.error(`Failed to get cached response for ${url}:`, error);
      return null;
    }
  }

  /**
   * Update service worker
   */
  async updateServiceWorker(): Promise<boolean> {
    const registration = await this.getRegistration();
    if (!registration) {
      return false;
    }

    try {
      await registration.update();
      return true;
    } catch (error) {
      console.error('Failed to update service worker:', error);
      return false;
    }
  }

  /**
   * Skip waiting and activate new service worker
   */
  async skipWaitingAndActivate(): Promise<boolean> {
    const registration = await this.getRegistration();
    if (!registration || !registration.waiting) {
      return false;
    }

    try {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      return true;
    } catch (error) {
      console.error('Failed to skip waiting:', error);
      return false;
    }
  }
}

export const serviceWorkerManager = new ServiceWorkerManager();
export default serviceWorkerManager;
