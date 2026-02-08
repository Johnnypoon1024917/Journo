import { placeService } from './placeService';
import { offlineStorage } from './offlineStorage';
import { useOfflineStore } from '../stores/offlineStore';
import { Place, CreatePlaceDto, UpdatePlaceDto } from '../types/trip';
import { OfflinePlace } from '../types/offline';
import { generateOfflineId, isOfflineId, markAsOfflineCreated, markAsOfflineModified } from '../utils/offlineUtils';

/**
 * Offline-aware place service
 * Handles place operations with offline support
 */
class OfflinePlaceService {
  /**
   * Create a new place (works offline)
   */
  async createPlace(data: CreatePlaceDto): Promise<Place> {
    const isOnline = navigator.onLine;

    if (isOnline) {
      try {
        // Try to create online
        const place = await placeService.createPlace(data);
        
        // Save to offline storage
        const offlinePlace = this.convertToOfflinePlace(place);
        await offlineStorage.savePlace(offlinePlace);
        
        return place;
      } catch (error) {
        console.error('Failed to create place online, falling back to offline:', error);
        // Fall through to offline creation
      }
    }

    // Create offline
    const offlineId = generateOfflineId();
    const now = new Date().toISOString();
    
    const offlinePlace: OfflinePlace = markAsOfflineCreated({
      id: offlineId,
      ...data,
      created_at: now,
      updated_at: now,
    });

    // Save to offline storage
    await offlineStorage.savePlace(offlinePlace);

    // Add to sync queue
    await offlineStorage.addToSyncQueue('place_create', 'place', offlineId, data);

    // Update offline store
    useOfflineStore.getState().loadSyncQueue();

    return this.convertFromOfflinePlace(offlinePlace);
  }

  /**
   * Get all places for a day (works offline)
   */
  async getPlacesByDay(dayId: string): Promise<Place[]> {
    const isOnline = navigator.onLine;

    if (isOnline && !isOfflineId(dayId)) {
      try {
        // Fetch from server
        const places = await placeService.getPlacesByDay(dayId);
        
        // Cache in offline storage
        for (const place of places) {
          const offlinePlace = this.convertToOfflinePlace(place);
          await offlineStorage.savePlace(offlinePlace);
        }
        
        return places;
      } catch (error) {
        console.error('Failed to fetch places online:', error);
        // Fall through to offline data
      }
    }

    // Get from offline storage
    const offlinePlaces = await offlineStorage.getPlacesByTripDayId(dayId);
    return offlinePlaces.map(p => this.convertFromOfflinePlace(p));
  }

  /**
   * Update a place (works offline)
   */
  async updatePlace(id: string, data: UpdatePlaceDto): Promise<Place> {
    const isOnline = navigator.onLine;

    if (isOnline && !isOfflineId(id)) {
      try {
        // Update online
        const place = await placeService.updatePlace(id, data);
        
        // Update offline storage
        const offlinePlace = this.convertToOfflinePlace(place);
        await offlineStorage.savePlace(offlinePlace);
        
        return place;
      } catch (error) {
        console.error('Failed to update place online, saving offline:', error);
        // Fall through to offline update
      }
    }

    // Update offline
    const existingPlace = await offlineStorage.getPlace(id);
    if (!existingPlace) {
      throw new Error('Place not found');
    }

    const updatedPlace: OfflinePlace = markAsOfflineModified({
      ...existingPlace,
      ...data,
      updated_at: new Date().toISOString(),
    });

    await offlineStorage.savePlace(updatedPlace);

    // Add to sync queue
    await offlineStorage.addToSyncQueue('place_update', 'place', id, data);

    // Update offline store
    useOfflineStore.getState().loadSyncQueue();

    return this.convertFromOfflinePlace(updatedPlace);
  }

  /**
   * Delete a place (works offline)
   */
  async deletePlace(id: string): Promise<void> {
    const isOnline = navigator.onLine;

    if (isOnline && !isOfflineId(id)) {
      try {
        // Delete online
        await placeService.deletePlace(id);
        
        // Delete from offline storage
        await offlineStorage.deletePlace(id);
        
        return;
      } catch (error) {
        console.error('Failed to delete place online, marking for deletion:', error);
        // Fall through to offline deletion
      }
    }

    // Delete offline
    await offlineStorage.deletePlace(id);

    // Add to sync queue (only if not offline-created)
    if (!isOfflineId(id)) {
      await offlineStorage.addToSyncQueue('place_delete', 'place', id, {});
    }

    // Update offline store
    useOfflineStore.getState().loadSyncQueue();
  }

  /**
   * Update travel time for a place (works offline)
   */
  async updateTravelTime(
    id: string,
    travelData: {
      travel_time_seconds: number | null;
      travel_distance_meters: number | null;
      travel_time_text: string | null;
      travel_distance_text: string | null;
    }
  ): Promise<Place> {
    const isOnline = navigator.onLine;

    if (isOnline && !isOfflineId(id)) {
      try {
        // Update online
        const place = await placeService.updateTravelTime(id, travelData);
        
        // Update offline storage
        const offlinePlace = this.convertToOfflinePlace(place);
        await offlineStorage.savePlace(offlinePlace);
        
        return place;
      } catch (error) {
        console.error('Failed to update travel time online, saving offline:', error);
        // Fall through to offline update
      }
    }

    // Update offline
    const existingPlace = await offlineStorage.getPlace(id);
    if (!existingPlace) {
      throw new Error('Place not found');
    }

    const updatedPlace: OfflinePlace = markAsOfflineModified({
      ...existingPlace,
      travel_time: travelData.travel_time_seconds || undefined,
      travel_distance: travelData.travel_distance_meters || undefined,
      updated_at: new Date().toISOString(),
    });

    await offlineStorage.savePlace(updatedPlace);

    // Add to sync queue
    await offlineStorage.addToSyncQueue('place_update', 'place', id, travelData);

    // Update offline store
    useOfflineStore.getState().loadSyncQueue();

    return this.convertFromOfflinePlace(updatedPlace);
  }

  /**
   * Move a place to a different day or reorder (works offline)
   */
  async movePlace(id: string, targetDayId: string, targetIndex: number): Promise<void> {
    const isOnline = navigator.onLine;

    if (isOnline && !isOfflineId(id)) {
      try {
        // Move online
        await placeService.movePlace(id, targetDayId, targetIndex);
        
        // Update offline storage
        const place = await offlineStorage.getPlace(id);
        if (place) {
          place.trip_day_id = targetDayId;
          place.place_order = targetIndex;
          await offlineStorage.savePlace(place);
        }
        
        return;
      } catch (error) {
        console.error('Failed to move place online, saving offline:', error);
        // Fall through to offline move
      }
    }

    // Move offline
    const place = await offlineStorage.getPlace(id);
    if (!place) {
      throw new Error('Place not found');
    }

    place.trip_day_id = targetDayId;
    place.place_order = targetIndex;
    place._offline_modified = true;
    place.updated_at = new Date().toISOString();

    await offlineStorage.savePlace(place);

    // Add to sync queue
    await offlineStorage.addToSyncQueue('place_update', 'place', id, {
      target_day_id: targetDayId,
      target_index: targetIndex,
    });

    // Update offline store
    useOfflineStore.getState().loadSyncQueue();
  }

  /**
   * Convert Place to OfflinePlace
   */
  private convertToOfflinePlace(place: Place): OfflinePlace {
    return {
      id: place.id,
      trip_day_id: place.trip_day_id,
      name: place.name,
      address: place.address || undefined,
      lat: place.lat || undefined,
      lng: place.lng || undefined,
      time_start: place.time_start || undefined,
      time_end: place.time_end || undefined,
      notes: place.notes || undefined,
      image_url: place.image_url || undefined,
      place_type: place.place_type || undefined,
      sticker: place.sticker || undefined,
      cost: place.cost || undefined,
      cost_currency: place.cost_currency || undefined,
      budget_category: place.budget_category || undefined,
      transport_mode: place.transport_mode || undefined,
      travel_time: place.travel_time_seconds || undefined,
      travel_distance: place.travel_distance_meters || undefined,
      place_order: place.display_order,
      created_at: place.created_at,
      updated_at: place.updated_at || place.created_at,
    };
  }

  /**
   * Convert OfflinePlace to Place
   */
  private convertFromOfflinePlace(offlinePlace: OfflinePlace): Place {
    const { _offline_created, _offline_modified, ...place } = offlinePlace;
    return place as Place;
  }
}

export const offlinePlaceService = new OfflinePlaceService();
export default offlinePlaceService;
