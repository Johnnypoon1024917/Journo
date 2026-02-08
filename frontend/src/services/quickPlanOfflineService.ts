import { offlineStorage } from './offlineStorage';
import { syncService } from './syncService';
import type { Trip, TripWithDays } from '../types/trip';

/**
 * Service for handling offline support and caching for Quick Plan generated trips
 */
export class QuickPlanOfflineService {
  private static readonly CACHE_KEYS = {
    QUICK_PLAN_SUGGESTIONS: 'quickplan_suggestions',
    QUICK_PLAN_TRIPS: 'quickplan_trips',
    QUICK_PLAN_PREFERENCES: 'quickplan_preferences',
    QUICK_PLAN_GENERATION_CACHE: 'quickplan_generation_cache'
  };

  /**
   * Cache Quick Plan suggestions for offline access
   */
  static async cacheSuggestions(
    requestHash: string,
    suggestions: any[],
    expirationHours: number = 24
  ): Promise<void> {
    try {
      const cacheData = {
        requestHash,
        suggestions,
        cachedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + expirationHours * 60 * 60 * 1000).toISOString()
      };

      await offlineStorage.setItem(
        `${this.CACHE_KEYS.QUICK_PLAN_SUGGESTIONS}_${requestHash}`,
        cacheData
      );

      // Also store in generation cache for quick access
      const generationCache = await this.getGenerationCache();
      generationCache[requestHash] = {
        cachedAt: cacheData.cachedAt,
        expiresAt: cacheData.expiresAt,
        suggestionsCount: suggestions.length
      };
      
      await offlineStorage.setItem(this.CACHE_KEYS.QUICK_PLAN_GENERATION_CACHE, generationCache);

    } catch (error) {
      console.error('Error caching Quick Plan suggestions:', error);
    }
  }

  /**
   * Retrieve cached Quick Plan suggestions
   */
  static async getCachedSuggestions(requestHash: string): Promise<any[] | null> {
    try {
      const cacheData = await offlineStorage.getItem(
        `${this.CACHE_KEYS.QUICK_PLAN_SUGGESTIONS}_${requestHash}`
      );

      if (!cacheData) {
        return null;
      }

      // Check if cache is expired
      const now = new Date();
      const expiresAt = new Date(cacheData.expiresAt);

      if (now > expiresAt) {
        // Remove expired cache
        await this.removeCachedSuggestions(requestHash);
        return null;
      }

      return cacheData.suggestions;

    } catch (error) {
      console.error('Error retrieving cached suggestions:', error);
      return null;
    }
  }

  /**
   * Remove cached suggestions
   */
  static async removeCachedSuggestions(requestHash: string): Promise<void> {
    try {
      await offlineStorage.removeItem(
        `${this.CACHE_KEYS.QUICK_PLAN_SUGGESTIONS}_${requestHash}`
      );

      // Also remove from generation cache
      const generationCache = await this.getGenerationCache();
      delete generationCache[requestHash];
      await offlineStorage.setItem(this.CACHE_KEYS.QUICK_PLAN_GENERATION_CACHE, generationCache);

    } catch (error) {
      console.error('Error removing cached suggestions:', error);
    }
  }

  /**
   * Cache a Quick Plan generated trip for offline access
   */
  static async cacheGeneratedTrip(trip: TripWithDays): Promise<void> {
    try {
      // Cache the complete trip data
      await offlineStorage.setItem(`trip_${trip.id}`, trip);

      // Add to Quick Plan trips list
      const quickPlanTrips = await this.getQuickPlanTrips();
      const existingIndex = quickPlanTrips.findIndex(t => t.id === trip.id);
      
      if (existingIndex >= 0) {
        quickPlanTrips[existingIndex] = trip;
      } else {
        quickPlanTrips.push(trip);
      }

      await offlineStorage.setItem(this.CACHE_KEYS.QUICK_PLAN_TRIPS, quickPlanTrips);

      // Cache individual components for better performance
      await this.cacheTripComponents(trip);

    } catch (error) {
      console.error('Error caching Quick Plan generated trip:', error);
    }
  }

  /**
   * Cache individual trip components (days, places) for efficient updates
   */
  private static async cacheTripComponents(trip: TripWithDays): Promise<void> {
    try {
      // Cache trip days
      for (const day of trip.days) {
        await offlineStorage.setItem(`trip_day_${day.id}`, day);
        
        // Cache places for this day
        for (const place of day.places) {
          await offlineStorage.setItem(`place_${place.id}`, place);
        }
      }

    } catch (error) {
      console.error('Error caching trip components:', error);
    }
  }

  /**
   * Get cached Quick Plan trips
   */
  static async getQuickPlanTrips(): Promise<Trip[]> {
    try {
      const trips = await offlineStorage.getItem(this.CACHE_KEYS.QUICK_PLAN_TRIPS);
      return trips || [];
    } catch (error) {
      console.error('Error getting Quick Plan trips:', error);
      return [];
    }
  }

  /**
   * Cache user preferences for Quick Plan
   */
  static async cacheUserPreferences(preferences: {
    defaultBudgetLevel?: 'low' | 'medium' | 'high';
    defaultTravelStyle?: 'relaxed' | 'moderate' | 'fast-paced';
    favoriteInterests?: string[];
    defaultGroupSize?: number;
    defaultTravelerTypes?: string[];
  }): Promise<void> {
    try {
      const existingPrefs = await this.getUserPreferences();
      const updatedPrefs = { ...existingPrefs, ...preferences };
      
      await offlineStorage.setItem(this.CACHE_KEYS.QUICK_PLAN_PREFERENCES, updatedPrefs);
    } catch (error) {
      console.error('Error caching user preferences:', error);
    }
  }

  /**
   * Get cached user preferences
   */
  static async getUserPreferences(): Promise<any> {
    try {
      const preferences = await offlineStorage.getItem(this.CACHE_KEYS.QUICK_PLAN_PREFERENCES);
      return preferences || {};
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return {};
    }
  }

  /**
   * Get generation cache metadata
   */
  private static async getGenerationCache(): Promise<Record<string, any>> {
    try {
      const cache = await offlineStorage.getItem(this.CACHE_KEYS.QUICK_PLAN_GENERATION_CACHE);
      return cache || {};
    } catch (error) {
      console.error('Error getting generation cache:', error);
      return {};
    }
  }

  /**
   * Sync offline-generated trips when coming back online
   */
  static async syncOfflineTrips(): Promise<{
    synced: number;
    failed: number;
    errors: string[];
  }> {
    const result = {
      synced: 0,
      failed: 0,
      errors: [] as string[]
    };

    try {
      const quickPlanTrips = await this.getQuickPlanTrips();
      
      for (const trip of quickPlanTrips) {
        try {
          // Check if trip exists on server
          const exists = await this.checkTripExistsOnServer(trip.id);
          
          if (!exists) {
            // Trip was created offline, sync to server
            await syncService.syncTripToServer(trip);
            result.synced++;
          }
        } catch (error) {
          console.error(`Error syncing trip ${trip.id}:`, error);
          result.failed++;
          result.errors.push(`Failed to sync trip "${trip.title}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

    } catch (error) {
      console.error('Error syncing offline trips:', error);
      result.errors.push(`Sync process failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Check if trip exists on server
   */
  private static async checkTripExistsOnServer(tripId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error checking trip existence:', error);
      return false;
    }
  }

  /**
   * Detect offline mode and provide appropriate feedback
   */
  static async handleOfflineMode(): Promise<{
    isOffline: boolean;
    canUseQuickPlan: boolean;
    cachedSuggestionsCount: number;
    message: string;
  }> {
    const isOffline = !navigator.onLine;
    
    if (!isOffline) {
      return {
        isOffline: false,
        canUseQuickPlan: true,
        cachedSuggestionsCount: 0,
        message: 'Online - full Quick Plan functionality available'
      };
    }

    // Count cached suggestions
    const generationCache = await this.getGenerationCache();
    const cachedSuggestionsCount = Object.keys(generationCache).length;

    return {
      isOffline: true,
      canUseQuickPlan: cachedSuggestionsCount > 0,
      cachedSuggestionsCount,
      message: cachedSuggestionsCount > 0 
        ? `Offline mode - ${cachedSuggestionsCount} cached suggestion(s) available`
        : 'Offline mode - no cached suggestions available. Connect to internet to use Quick Plan.'
    };
  }

  /**
   * Clean up expired cache entries
   */
  static async cleanupExpiredCache(): Promise<{
    removed: number;
    errors: string[];
  }> {
    const result = {
      removed: 0,
      errors: [] as string[]
    };

    try {
      const generationCache = await this.getGenerationCache();
      const now = new Date();
      
      for (const [requestHash, metadata] of Object.entries(generationCache)) {
        try {
          const expiresAt = new Date(metadata.expiresAt);
          
          if (now > expiresAt) {
            await this.removeCachedSuggestions(requestHash);
            result.removed++;
          }
        } catch (error) {
          console.error(`Error cleaning up cache for ${requestHash}:`, error);
          result.errors.push(`Failed to clean up cache for ${requestHash}`);
        }
      }

    } catch (error) {
      console.error('Error during cache cleanup:', error);
      result.errors.push(`Cache cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Get cache storage statistics
   */
  static async getCacheStats(): Promise<{
    totalSuggestions: number;
    totalTrips: number;
    storageUsed: number; // in bytes (approximate)
    oldestCache: string | null;
    newestCache: string | null;
  }> {
    try {
      const generationCache = await this.getGenerationCache();
      const quickPlanTrips = await this.getQuickPlanTrips();
      
      // Calculate approximate storage usage
      const suggestionsSize = JSON.stringify(generationCache).length;
      const tripsSize = JSON.stringify(quickPlanTrips).length;
      const storageUsed = suggestionsSize + tripsSize;

      // Find oldest and newest cache entries
      const cacheEntries = Object.values(generationCache);
      let oldestCache: string | null = null;
      let newestCache: string | null = null;

      if (cacheEntries.length > 0) {
        const sortedEntries = cacheEntries.sort((a, b) => 
          new Date(a.cachedAt).getTime() - new Date(b.cachedAt).getTime()
        );
        
        oldestCache = sortedEntries[0].cachedAt;
        newestCache = sortedEntries[sortedEntries.length - 1].cachedAt;
      }

      return {
        totalSuggestions: Object.keys(generationCache).length,
        totalTrips: quickPlanTrips.length,
        storageUsed,
        oldestCache,
        newestCache
      };

    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalSuggestions: 0,
        totalTrips: 0,
        storageUsed: 0,
        oldestCache: null,
        newestCache: null
      };
    }
  }

  /**
   * Clear all Quick Plan cache data
   */
  static async clearAllCache(): Promise<void> {
    try {
      // Clear suggestions cache
      const generationCache = await this.getGenerationCache();
      for (const requestHash of Object.keys(generationCache)) {
        await this.removeCachedSuggestions(requestHash);
      }

      // Clear trips cache
      await offlineStorage.removeItem(this.CACHE_KEYS.QUICK_PLAN_TRIPS);
      
      // Clear generation cache
      await offlineStorage.removeItem(this.CACHE_KEYS.QUICK_PLAN_GENERATION_CACHE);

      // Note: We don't clear user preferences as they should persist

    } catch (error) {
      console.error('Error clearing Quick Plan cache:', error);
    }
  }

  /**
   * Generate a hash for caching Quick Plan requests
   */
  static generateRequestHash(request: {
    destination: string;
    startDate: string;
    endDate: string;
    interests: any[];
    budgetLevel: string;
    travelStyle: string;
    groupSize: number;
    travelerTypes: any[];
  }): string {
    const hashInput = JSON.stringify({
      destination: request.destination.toLowerCase().trim(),
      startDate: request.startDate,
      endDate: request.endDate,
      interests: request.interests.sort((a, b) => a.id.localeCompare(b.id)),
      budgetLevel: request.budgetLevel,
      travelStyle: request.travelStyle,
      groupSize: request.groupSize,
      travelerTypes: request.travelerTypes.sort((a, b) => a.type.localeCompare(b.type))
    });

    // Simple hash function (in production, use a proper hash library)
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }
}