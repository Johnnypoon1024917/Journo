import { tripService, TripResponse, PaginatedTripsResponse } from './tripService';
import { offlineStorage } from './offlineStorage';
import { useOfflineStore } from '../stores/offlineStore';
import { Trip, CreateTripDto, UpdateTripDto } from '../types/trip';
import { OfflineTrip } from '../types/offline';
import { generateOfflineId, isOfflineId, markAsOfflineCreated, markAsOfflineModified } from '../utils/offlineUtils';

/**
 * Offline-aware trip service
 * Handles trip operations with offline support
 */
class OfflineTripService {
  /**
   * Create a new trip (works offline)
   */
  async createTrip(tripData: CreateTripDto, token: string): Promise<TripResponse> {
    const isOnline = navigator.onLine;

    if (isOnline) {
      try {
        // Try to create online
        const response = await tripService.createTrip(tripData, token);
        
        // Save to offline storage for caching
        const offlineTrip = this.convertToOfflineTrip(response.data);
        await offlineStorage.saveTrip(offlineTrip);
        
        return response;
      } catch (error) {
        console.error('Failed to create trip online, falling back to offline:', error);
        // Fall through to offline creation
      }
    }

    // Create offline
    const offlineId = generateOfflineId();
    const now = new Date().toISOString();
    
    const offlineTrip: OfflineTrip = markAsOfflineCreated({
      id: offlineId,
      title: tripData.title,
      destination: tripData.destination || '',
      start_date: tripData.start_date || '',
      end_date: tripData.end_date || '',
      cover_image_url: tripData.cover_image_url,
      theme: tripData.theme || 'default',
      owner_id: '', // Will be set during sync
      is_public: tripData.is_public ?? true,
      is_community: false,
      share_token: generateOfflineId(), // Temporary token
      total_budget: tripData.total_budget,
      currency_code: tripData.currency_code || 'USD',
      likes_count: 0,
      views_count: 0,
      created_at: now,
      updated_at: now,
    });

    // Save to offline storage
    await offlineStorage.saveTrip(offlineTrip);

    // Add to sync queue
    await offlineStorage.addToSyncQueue('trip_update', 'trip', offlineId, tripData);

    // Update offline store
    useOfflineStore.getState().loadSyncQueue();

    return {
      success: true,
      data: this.convertFromOfflineTrip(offlineTrip),
      message: 'Trip created offline. Will sync when online.',
    };
  }

  /**
   * Get all trips (includes offline trips)
   */
  async getTrips(page: number = 1, limit: number = 10, token: string): Promise<PaginatedTripsResponse> {
    const isOnline = navigator.onLine;
    let onlineTrips: Trip[] = [];
    let pagination = {
      page,
      limit,
      total: 0,
      total_pages: 0,
      has_next: false,
      has_prev: false,
    };

    if (isOnline) {
      try {
        // Fetch from server
        const response = await tripService.getTrips(page, limit, token);
        onlineTrips = response.data;
        pagination = response.pagination;

        // Cache trips in offline storage
        for (const trip of onlineTrips) {
          const offlineTrip = this.convertToOfflineTrip(trip);
          await offlineStorage.saveTrip(offlineTrip);
        }
      } catch (error) {
        console.error('Failed to fetch trips online:', error);
      }
    }

    // Get offline trips
    const offlineTrips = await offlineStorage.getAllTrips();
    
    // Merge online and offline trips, removing duplicates
    const tripMap = new Map<string, Trip>();
    
    // Add online trips first
    for (const trip of onlineTrips) {
      tripMap.set(trip.id, trip);
    }
    
    // Add offline trips (only if not already in map or if offline-created)
    for (const offlineTrip of offlineTrips) {
      if (!tripMap.has(offlineTrip.id) || offlineTrip._offline_created) {
        tripMap.set(offlineTrip.id, this.convertFromOfflineTrip(offlineTrip));
      }
    }

    const allTrips = Array.from(tripMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return {
      success: true,
      data: allTrips,
      pagination: {
        ...pagination,
        total: allTrips.length,
      },
    };
  }

  /**
   * Get a single trip by ID (works offline)
   */
  async getTripById(tripId: string, token: string): Promise<TripResponse> {
    const isOnline = navigator.onLine;

    // Check offline storage first
    const offlineTrip = await offlineStorage.getTrip(tripId);

    if (isOnline && !isOfflineId(tripId)) {
      try {
        // Fetch from server
        const response = await tripService.getTripById(tripId, token);
        
        // Update offline storage
        const updatedOfflineTrip = this.convertToOfflineTrip(response.data);
        await offlineStorage.saveTrip(updatedOfflineTrip);
        
        return response;
      } catch (error) {
        console.error('Failed to fetch trip online:', error);
        // Fall through to offline data
      }
    }

    // Return offline data
    if (offlineTrip) {
      return {
        success: true,
        data: this.convertFromOfflineTrip(offlineTrip),
      };
    }

    throw new Error('Trip not found');
  }

  /**
   * Update a trip (works offline)
   */
  async updateTrip(tripId: string, tripData: UpdateTripDto, token: string): Promise<TripResponse> {
    const isOnline = navigator.onLine;

    if (isOnline && !isOfflineId(tripId)) {
      try {
        // Update online
        const response = await tripService.updateTrip(tripId, tripData, token);
        
        // Update offline storage
        const offlineTrip = this.convertToOfflineTrip(response.data);
        await offlineStorage.saveTrip(offlineTrip);
        
        return response;
      } catch (error) {
        console.error('Failed to update trip online, saving offline:', error);
        // Fall through to offline update
      }
    }

    // Update offline
    const existingTrip = await offlineStorage.getTrip(tripId);
    if (!existingTrip) {
      throw new Error('Trip not found');
    }

    const updatedTrip: OfflineTrip = markAsOfflineModified({
      ...existingTrip,
      ...tripData,
      updated_at: new Date().toISOString(),
    });

    await offlineStorage.saveTrip(updatedTrip);

    // Add to sync queue
    await offlineStorage.addToSyncQueue('trip_update', 'trip', tripId, tripData);

    // Update offline store
    useOfflineStore.getState().loadSyncQueue();

    return {
      success: true,
      data: this.convertFromOfflineTrip(updatedTrip),
      message: 'Trip updated offline. Will sync when online.',
    };
  }

  /**
   * Delete a trip (works offline)
   */
  async deleteTrip(tripId: string, token: string): Promise<{ success: boolean; message: string }> {
    const isOnline = navigator.onLine;

    if (isOnline && !isOfflineId(tripId)) {
      try {
        // Delete online
        const response = await tripService.deleteTrip(tripId, token);
        
        // Delete from offline storage
        await offlineStorage.deleteTrip(tripId);
        
        return response;
      } catch (error) {
        console.error('Failed to delete trip online, marking for deletion:', error);
        // Fall through to offline deletion
      }
    }

    // Delete offline
    await offlineStorage.deleteTrip(tripId);

    // Add to sync queue (only if not offline-created)
    if (!isOfflineId(tripId)) {
      await offlineStorage.addToSyncQueue('trip_update', 'trip', tripId, {});
    }

    // Update offline store
    useOfflineStore.getState().loadSyncQueue();

    return {
      success: true,
      message: 'Trip deleted offline. Will sync when online.',
    };
  }

  /**
   * Convert Trip to OfflineTrip
   */
  private convertToOfflineTrip(trip: Trip): OfflineTrip {
    return {
      id: trip.id,
      title: trip.title,
      destination: trip.destination || '',
      start_date: trip.start_date || '',
      end_date: trip.end_date || '',
      cover_image_url: trip.cover_image_url || undefined,
      theme: trip.theme,
      owner_id: trip.owner_id,
      is_public: trip.is_public,
      is_community: trip.is_community,
      share_token: trip.share_token,
      total_budget: trip.total_budget ?? undefined,
      currency_code: trip.currency_code,
      likes_count: trip.likes_count,
      views_count: trip.views_count,
      created_at: trip.created_at,
      updated_at: trip.updated_at || trip.created_at,
    };
  }

  /**
   * Convert OfflineTrip to Trip
   */
  private convertFromOfflineTrip(offlineTrip: OfflineTrip): Trip {
    const { _offline_created, _offline_modified, _last_synced, ...trip } = offlineTrip;
    return trip as Trip;
  }
}

export const offlineTripService = new OfflineTripService();
export default offlineTripService;
