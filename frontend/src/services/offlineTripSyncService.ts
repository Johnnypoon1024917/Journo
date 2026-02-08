import { apiRequest } from './api';
import { offlineStorage } from './offlineStorage';
import { useEnhancedAuthStore } from '../stores/enhancedAuthStore';
import type { Trip, TripWithDays } from '../types/trip';

/**
 * Service for syncing offline-generated trips with the server
 */
export class OfflineTripSyncService {
  
  /**
   * Sync all offline trips to the server
   */
  static async syncAllOfflineTrips(): Promise<{
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
      const offlineTrips = await this.getOfflineTrips();
      
      for (const trip of offlineTrips) {
        try {
          await this.syncTripToServer(trip);
          result.synced++;
          
          // Remove from offline storage after successful sync
          await this.removeOfflineTrip(trip.id);
          
        } catch (error) {
          console.error(`Error syncing trip ${trip.id}:`, error);
          result.failed++;
          result.errors.push(`Failed to sync "${trip.title}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

    } catch (error) {
      console.error('Error during offline trip sync:', error);
      result.errors.push(`Sync process failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Sync a single trip to the server
   */
  static async syncTripToServer(offlineTrip: TripWithDays): Promise<Trip> {
    const { accessToken } = useEnhancedAuthStore.getState();
    
    if (!accessToken) {
      throw new Error('Authentication required for syncing');
    }

    // Convert offline trip to server format
    const tripData = this.convertOfflineTripToServerFormat(offlineTrip);
    
    // Create trip on server
    const response = await apiRequest('/trips', {
      method: 'POST',
      body: JSON.stringify(tripData.trip),
      token: accessToken
    }) as any;

    if (!response.success) {
      throw new Error(response.message || 'Failed to create trip on server');
    }

    const serverTrip = response.data;

    // Create days and places
    for (const dayData of tripData.days) {
      try {
        // Create day
        const dayResponse = await apiRequest('/trip-days', {
          method: 'POST',
          body: JSON.stringify({
            ...dayData.day,
            trip_id: serverTrip.id
          }),
          token: accessToken
        }) as any;

        if (!dayResponse.success) {
          throw new Error(`Failed to create day ${dayData.day.day_number}`);
        }

        const serverDay = dayResponse.data;

        // Create places for this day
        for (const placeData of dayData.places) {
          const placeResponse = await apiRequest('/places', {
            method: 'POST',
            body: JSON.stringify({
              ...placeData,
              trip_day_id: serverDay.id
            }),
            token: accessToken
          }) as any;

          if (!placeResponse.success) {
            console.warn(`Failed to create place ${placeData.name}:`, placeResponse.message);
          }
        }

      } catch (error) {
        console.error(`Error creating day ${dayData.day.day_number}:`, error);
        // Continue with other days even if one fails
      }
    }

    return serverTrip;
  }

  /**
   * Convert offline trip format to server format
   */
  private static convertOfflineTripToServerFormat(offlineTrip: TripWithDays): {
    trip: any;
    days: Array<{
      day: any;
      places: any[];
    }>;
  } {
    // Convert trip data
    const trip = {
      title: offlineTrip.title,
      destination: offlineTrip.destination,
      start_date: offlineTrip.start_date,
      end_date: offlineTrip.end_date,
      theme: offlineTrip.theme,
      total_budget: offlineTrip.total_budget,
      currency_code: offlineTrip.currency_code,
      is_public: offlineTrip.is_public || false,
      is_community: offlineTrip.is_community || false,
      weather_data: offlineTrip.weather_data
    };

    // Convert days and places
    const days = offlineTrip.days.map(day => ({
      day: {
        day_number: day.day_number,
        date: day.date
      },
      places: day.places.map(place => ({
        name: place.name,
        address: place.address,
        lat: place.lat,
        lng: place.lng,
        time_start: place.time_start,
        time_end: place.time_end,
        notes: place.notes,
        image_url: place.image_url,
        place_type: place.place_type,
        sticker: place.sticker,
        cost: place.cost,
        cost_currency: place.cost_currency,
        budget_category: place.budget_category,
        transport_mode: place.transport_mode,
        travel_time_seconds: place.travel_time_seconds,
        travel_distance_meters: place.travel_distance_meters,
        travel_time_text: place.travel_time_text,
        travel_distance_text: place.travel_distance_text,
        display_order: place.display_order,
        calculated_arrival_time: place.calculated_arrival_time
      }))
    }));

    return { trip, days };
  }

  /**
   * Get all offline trips that need syncing
   */
  private static async getOfflineTrips(): Promise<TripWithDays[]> {
    try {
      const offlineTrips = await offlineStorage.getItem('quickplan_trips') || [];
      return offlineTrips.filter((trip: any) => trip.offline && trip.needsSync);
    } catch (error) {
      console.error('Error getting offline trips:', error);
      return [];
    }
  }

  /**
   * Remove offline trip after successful sync
   */
  private static async removeOfflineTrip(tripId: string): Promise<void> {
    try {
      // Remove from offline trips list
      const offlineTrips = await offlineStorage.getItem('quickplan_trips') || [];
      const updatedTrips = offlineTrips.filter((trip: any) => trip.id !== tripId);
      await offlineStorage.setItem('quickplan_trips', updatedTrips);

      // Remove individual trip data
      await offlineStorage.removeItem(`trip_${tripId}`);

      // Remove associated days and places
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith(`trip_day_${tripId}`) || key.includes(`_${tripId}_`))) {
          await offlineStorage.removeItem(key);
        }
      }

    } catch (error) {
      console.error(`Error removing offline trip ${tripId}:`, error);
    }
  }

  /**
   * Check if a trip exists on the server
   */
  static async checkTripExistsOnServer(tripId: string): Promise<boolean> {
    const { accessToken } = useEnhancedAuthStore.getState();
    
    if (!accessToken) {
      return false;
    }

    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error checking trip existence:', error);
      return false;
    }
  }

  /**
   * Mark offline trip as needing sync
   */
  static async markTripForSync(tripId: string): Promise<void> {
    try {
      const trip = await offlineStorage.getItem(`trip_${tripId}`);
      if (trip) {
        trip.needsSync = true;
        trip.lastModified = new Date().toISOString();
        await offlineStorage.setItem(`trip_${tripId}`, trip);
      }
    } catch (error) {
      console.error(`Error marking trip ${tripId} for sync:`, error);
    }
  }

  /**
   * Get sync status for all offline trips
   */
  static async getSyncStatus(): Promise<{
    totalOfflineTrips: number;
    tripsNeedingSync: number;
    lastSyncAttempt: string | null;
    syncErrors: string[];
  }> {
    try {
      const offlineTrips = await this.getOfflineTrips();
      const tripsNeedingSync = offlineTrips.filter(trip => (trip as any).needsSync).length;
      
      // Get last sync attempt from storage
      const syncMetadata = await offlineStorage.getItem('sync_metadata') || {};
      
      return {
        totalOfflineTrips: offlineTrips.length,
        tripsNeedingSync,
        lastSyncAttempt: syncMetadata.lastSyncAttempt || null,
        syncErrors: syncMetadata.syncErrors || []
      };

    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        totalOfflineTrips: 0,
        tripsNeedingSync: 0,
        lastSyncAttempt: null,
        syncErrors: [`Error getting sync status: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Update sync metadata
   */
  private static async updateSyncMetadata(
    syncResult: { synced: number; failed: number; errors: string[] }
  ): Promise<void> {
    try {
      const syncMetadata = {
        lastSyncAttempt: new Date().toISOString(),
        lastSyncResult: syncResult,
        syncErrors: syncResult.errors
      };
      
      await offlineStorage.setItem('sync_metadata', syncMetadata);
    } catch (error) {
      console.error('Error updating sync metadata:', error);
    }
  }

  /**
   * Auto-sync when coming back online
   */
  static async autoSyncOnOnline(): Promise<void> {
    if (!navigator.onLine) {
      return;
    }

    try {
      const syncStatus = await this.getSyncStatus();
      
      if (syncStatus.tripsNeedingSync > 0) {
        console.log(`Auto-syncing ${syncStatus.tripsNeedingSync} offline trips...`);
        
        const result = await this.syncAllOfflineTrips();
        await this.updateSyncMetadata(result);
        
        if (result.synced > 0) {
          console.log(`Successfully auto-synced ${result.synced} trips`);
        }
        
        if (result.failed > 0) {
          console.warn(`Failed to auto-sync ${result.failed} trips:`, result.errors);
        }
      }

    } catch (error) {
      console.error('Error during auto-sync:', error);
    }
  }

  /**
   * Initialize auto-sync listeners
   */
  static initializeAutoSync(): void {
    // Listen for online events
    window.addEventListener('online', () => {
      setTimeout(() => this.autoSyncOnOnline(), 1000); // Delay to ensure connection is stable
    });

    // Periodic sync check (every 5 minutes when online)
    setInterval(() => {
      if (navigator.onLine) {
        this.autoSyncOnOnline();
      }
    }, 5 * 60 * 1000);
  }
}