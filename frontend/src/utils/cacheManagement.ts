/**
 * Cache management utilities for optimal storage utilization
 */

export interface CacheEntry {
  key: string;
  size: number;
  lastAccessed: string;
  expiresAt?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface CacheStats {
  totalSize: number;
  totalEntries: number;
  oldestEntry: string | null;
  newestEntry: string | null;
  expiredEntries: number;
}

export class CacheManager {
  private static readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly CACHE_CLEANUP_THRESHOLD = 0.8; // Clean up when 80% full
  
  /**
   * Check if cache cleanup is needed
   */
  static async shouldCleanup(): Promise<boolean> {
    const stats = await this.getCacheStats();
    return stats.totalSize > (this.MAX_CACHE_SIZE * this.CACHE_CLEANUP_THRESHOLD);
  }

  /**
   * Get comprehensive cache statistics
   */
  static async getCacheStats(): Promise<CacheStats> {
    const entries = await this.getAllCacheEntries();
    
    if (entries.length === 0) {
      return {
        totalSize: 0,
        totalEntries: 0,
        oldestEntry: null,
        newestEntry: null,
        expiredEntries: 0
      };
    }

    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const now = new Date();
    const expiredEntries = entries.filter(entry => 
      entry.expiresAt && new Date(entry.expiresAt) < now
    ).length;

    const sortedByAccess = entries.sort((a, b) => 
      new Date(a.lastAccessed).getTime() - new Date(b.lastAccessed).getTime()
    );

    return {
      totalSize,
      totalEntries: entries.length,
      oldestEntry: sortedByAccess[0]?.lastAccessed || null,
      newestEntry: sortedByAccess[sortedByAccess.length - 1]?.lastAccessed || null,
      expiredEntries
    };
  }

  /**
   * Get all cache entries with metadata
   */
  static async getAllCacheEntries(): Promise<CacheEntry[]> {
    const entries: CacheEntry[] = [];
    
    // Check localStorage for cache entries
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Only process cache-related keys
      if (this.isCacheKey(key)) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const size = new Blob([value]).size;
            const data = JSON.parse(value);
            
            entries.push({
              key,
              size,
              lastAccessed: data.lastAccessed || data.cachedAt || new Date().toISOString(),
              expiresAt: data.expiresAt,
              priority: this.determinePriority(key, data)
            });
          }
        } catch (error) {
          console.warn(`Error processing cache entry ${key}:`, error);
        }
      }
    }

    return entries;
  }

  /**
   * Determine if a key is cache-related
   */
  private static isCacheKey(key: string): boolean {
    const cacheKeyPrefixes = [
      'quickplan_suggestions_',
      'quickplan_trips',
      'quickplan_generation_cache',
      'trip_',
      'trip_day_',
      'place_',
      'offline_'
    ];

    return cacheKeyPrefixes.some(prefix => key.startsWith(prefix));
  }

  /**
   * Determine cache entry priority
   */
  private static determinePriority(key: string, data: any): 'high' | 'medium' | 'low' {
    // High priority: Recent trips, user preferences
    if (key.includes('quickplan_preferences') || key.includes('user_settings')) {
      return 'high';
    }

    // High priority: Recently accessed trips
    if (key.startsWith('trip_') && data.lastAccessed) {
      const lastAccessed = new Date(data.lastAccessed);
      const daysSinceAccess = (Date.now() - lastAccessed.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceAccess < 7) return 'high';
    }

    // Medium priority: Recent suggestions, offline trips
    if (key.includes('quickplan_suggestions_') || key.includes('offline_')) {
      return 'medium';
    }

    // Low priority: Old cache entries
    return 'low';
  }

  /**
   * Perform intelligent cache cleanup
   */
  static async performCleanup(): Promise<{
    removedEntries: number;
    freedSpace: number;
    errors: string[];
  }> {
    const result = {
      removedEntries: 0,
      freedSpace: 0,
      errors: [] as string[]
    };

    try {
      const entries = await this.getAllCacheEntries();
      const now = new Date();

      // Sort entries by cleanup priority (expired first, then by priority and age)
      const sortedEntries = entries.sort((a, b) => {
        // Expired entries first
        const aExpired = a.expiresAt && new Date(a.expiresAt) < now;
        const bExpired = b.expiresAt && new Date(b.expiresAt) < now;
        
        if (aExpired && !bExpired) return -1;
        if (!aExpired && bExpired) return 1;

        // Then by priority (low priority first for removal)
        const priorityOrder = { low: 0, medium: 1, high: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;

        // Then by age (oldest first)
        return new Date(a.lastAccessed).getTime() - new Date(b.lastAccessed).getTime();
      });

      // Remove entries until we're under the threshold
      const targetSize = this.MAX_CACHE_SIZE * 0.6; // Clean to 60% capacity
      let currentSize = entries.reduce((sum, entry) => sum + entry.size, 0);

      for (const entry of sortedEntries) {
        if (currentSize <= targetSize) break;

        try {
          localStorage.removeItem(entry.key);
          result.removedEntries++;
          result.freedSpace += entry.size;
          currentSize -= entry.size;
        } catch (error) {
          console.error(`Error removing cache entry ${entry.key}:`, error);
          result.errors.push(`Failed to remove ${entry.key}`);
        }
      }

    } catch (error) {
      console.error('Error during cache cleanup:', error);
      result.errors.push(`Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Remove expired cache entries
   */
  static async removeExpiredEntries(): Promise<{
    removedEntries: number;
    freedSpace: number;
    errors: string[];
  }> {
    const result = {
      removedEntries: 0,
      freedSpace: 0,
      errors: [] as string[]
    };

    try {
      const entries = await this.getAllCacheEntries();
      const now = new Date();

      for (const entry of entries) {
        if (entry.expiresAt && new Date(entry.expiresAt) < now) {
          try {
            localStorage.removeItem(entry.key);
            result.removedEntries++;
            result.freedSpace += entry.size;
          } catch (error) {
            console.error(`Error removing expired entry ${entry.key}:`, error);
            result.errors.push(`Failed to remove expired ${entry.key}`);
          }
        }
      }

    } catch (error) {
      console.error('Error removing expired entries:', error);
      result.errors.push(`Expired cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Update last accessed time for a cache entry
   */
  static async updateLastAccessed(key: string): Promise<void> {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        const data = JSON.parse(value);
        data.lastAccessed = new Date().toISOString();
        localStorage.setItem(key, JSON.stringify(data));
      }
    } catch (error) {
      console.error(`Error updating last accessed for ${key}:`, error);
    }
  }

  /**
   * Get cache usage percentage
   */
  static async getCacheUsagePercentage(): Promise<number> {
    const stats = await this.getCacheStats();
    return (stats.totalSize / this.MAX_CACHE_SIZE) * 100;
  }

  /**
   * Check if storage quota is available
   */
  static async checkStorageQuota(): Promise<{
    available: boolean;
    usage: number;
    quota: number;
    percentage: number;
  }> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const percentage = quota > 0 ? (usage / quota) * 100 : 0;

        return {
          available: quota > usage,
          usage,
          quota,
          percentage
        };
      }
    } catch (error) {
      console.error('Error checking storage quota:', error);
    }

    // Fallback for browsers without storage API
    return {
      available: true,
      usage: 0,
      quota: 0,
      percentage: 0
    };
  }

  /**
   * Optimize cache by removing low-priority old entries
   */
  static async optimizeCache(): Promise<{
    optimized: boolean;
    removedEntries: number;
    freedSpace: number;
    message: string;
  }> {
    const shouldCleanup = await this.shouldCleanup();
    
    if (!shouldCleanup) {
      return {
        optimized: false,
        removedEntries: 0,
        freedSpace: 0,
        message: 'Cache optimization not needed'
      };
    }

    const cleanupResult = await this.performCleanup();
    
    return {
      optimized: true,
      removedEntries: cleanupResult.removedEntries,
      freedSpace: cleanupResult.freedSpace,
      message: `Optimized cache: removed ${cleanupResult.removedEntries} entries, freed ${this.formatBytes(cleanupResult.freedSpace)}`
    };
  }

  /**
   * Format bytes to human readable string
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}