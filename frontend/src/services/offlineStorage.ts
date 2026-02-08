import localforage from 'localforage';
import {
  OfflineTrip,
  OfflineTripDay,
  OfflinePlace,
  OfflineStoryItem,
  OfflinePackingItem,
  SyncQueueItem,
  PendingUpload,
  NetworkStatus,
} from '../types/offline';
import { SyncOperationType, SyncResourceType } from '../types/trip';

// Configure localforage instances for different data types
const tripsStore = localforage.createInstance({
  name: 'journo',
  storeName: 'trips',
});

const tripDaysStore = localforage.createInstance({
  name: 'journo',
  storeName: 'trip_days',
});

const placesStore = localforage.createInstance({
  name: 'journo',
  storeName: 'places',
});

const storyItemsStore = localforage.createInstance({
  name: 'journo',
  storeName: 'story_items',
});

const packingItemsStore = localforage.createInstance({
  name: 'journo',
  storeName: 'packing_items',
});

const syncQueueStore = localforage.createInstance({
  name: 'journo',
  storeName: 'sync_queue',
});

const pendingUploadsStore = localforage.createInstance({
  name: 'journo',
  storeName: 'pending_uploads',
});

const metadataStore = localforage.createInstance({
  name: 'journo',
  storeName: 'metadata',
});

/**
 * Offline Storage Service
 * Provides methods for storing and retrieving data locally
 */
class OfflineStorageService {
  // ============ TRIPS ============
  
  async saveTrip(trip: OfflineTrip): Promise<void> {
    await tripsStore.setItem(trip.id, trip);
  }

  async getTrip(tripId: string): Promise<OfflineTrip | null> {
    return await tripsStore.getItem<OfflineTrip>(tripId);
  }

  async getAllTrips(): Promise<OfflineTrip[]> {
    const trips: OfflineTrip[] = [];
    await tripsStore.iterate<OfflineTrip, void>((trip) => {
      trips.push(trip);
    });
    return trips.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async deleteTrip(tripId: string): Promise<void> {
    await tripsStore.removeItem(tripId);
    // Also delete related data
    await this.deleteTripDaysByTripId(tripId);
    await this.deleteStoryItemsByTripId(tripId);
    await this.deletePackingItemsByTripId(tripId);
  }

  // ============ TRIP DAYS ============
  
  async saveTripDay(tripDay: OfflineTripDay): Promise<void> {
    await tripDaysStore.setItem(tripDay.id, tripDay);
  }

  async getTripDay(tripDayId: string): Promise<OfflineTripDay | null> {
    return await tripDaysStore.getItem<OfflineTripDay>(tripDayId);
  }

  async getTripDaysByTripId(tripId: string): Promise<OfflineTripDay[]> {
    const tripDays: OfflineTripDay[] = [];
    await tripDaysStore.iterate<OfflineTripDay, void>((tripDay) => {
      if (tripDay.trip_id === tripId) {
        tripDays.push(tripDay);
      }
    });
    return tripDays.sort((a, b) => a.day_number - b.day_number);
  }

  async deleteTripDay(tripDayId: string): Promise<void> {
    await tripDaysStore.removeItem(tripDayId);
    // Also delete related places
    await this.deletePlacesByTripDayId(tripDayId);
  }

  async deleteTripDaysByTripId(tripId: string): Promise<void> {
    const tripDays = await this.getTripDaysByTripId(tripId);
    for (const tripDay of tripDays) {
      await this.deleteTripDay(tripDay.id);
    }
  }

  // ============ PLACES ============
  
  async savePlace(place: OfflinePlace): Promise<void> {
    await placesStore.setItem(place.id, place);
  }

  async getPlace(placeId: string): Promise<OfflinePlace | null> {
    return await placesStore.getItem<OfflinePlace>(placeId);
  }

  async getPlacesByTripDayId(tripDayId: string): Promise<OfflinePlace[]> {
    const places: OfflinePlace[] = [];
    await placesStore.iterate<OfflinePlace, void>((place) => {
      if (place.trip_day_id === tripDayId) {
        places.push(place);
      }
    });
    return places.sort((a, b) => (a.place_order || 0) - (b.place_order || 0));
  }

  async deletePlace(placeId: string): Promise<void> {
    await placesStore.removeItem(placeId);
  }

  async deletePlacesByTripDayId(tripDayId: string): Promise<void> {
    const places = await this.getPlacesByTripDayId(tripDayId);
    for (const place of places) {
      await this.deletePlace(place.id);
    }
  }

  // ============ STORY ITEMS ============
  
  async saveStoryItem(storyItem: OfflineStoryItem): Promise<void> {
    await storyItemsStore.setItem(storyItem.id, storyItem);
  }

  async getStoryItem(storyItemId: string): Promise<OfflineStoryItem | null> {
    return await storyItemsStore.getItem<OfflineStoryItem>(storyItemId);
  }

  async getStoryItemsByTripId(tripId: string): Promise<OfflineStoryItem[]> {
    const storyItems: OfflineStoryItem[] = [];
    await storyItemsStore.iterate<OfflineStoryItem, void>((storyItem) => {
      if (storyItem.trip_id === tripId) {
        storyItems.push(storyItem);
      }
    });
    return storyItems.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async deleteStoryItem(storyItemId: string): Promise<void> {
    await storyItemsStore.removeItem(storyItemId);
  }

  async deleteStoryItemsByTripId(tripId: string): Promise<void> {
    const storyItems = await this.getStoryItemsByTripId(tripId);
    for (const storyItem of storyItems) {
      await this.deleteStoryItem(storyItem.id);
    }
  }

  // ============ PACKING ITEMS ============
  
  async savePackingItem(packingItem: OfflinePackingItem): Promise<void> {
    await packingItemsStore.setItem(packingItem.id, packingItem);
  }

  async getPackingItem(packingItemId: string): Promise<OfflinePackingItem | null> {
    return await packingItemsStore.getItem<OfflinePackingItem>(packingItemId);
  }

  async getPackingItemsByTripId(tripId: string): Promise<OfflinePackingItem[]> {
    const packingItems: OfflinePackingItem[] = [];
    await packingItemsStore.iterate<OfflinePackingItem, void>((packingItem) => {
      if (packingItem.trip_id === tripId) {
        packingItems.push(packingItem);
      }
    });
    return packingItems;
  }

  async deletePackingItem(packingItemId: string): Promise<void> {
    await packingItemsStore.removeItem(packingItemId);
  }

  async deletePackingItemsByTripId(tripId: string): Promise<void> {
    const packingItems = await this.getPackingItemsByTripId(tripId);
    for (const packingItem of packingItems) {
      await this.deletePackingItem(packingItem.id);
    }
  }

  // ============ SYNC QUEUE ============
  
  async addToSyncQueue(
    operation: SyncOperationType,
    resourceType: SyncResourceType,
    resourceId: string,
    data: any
  ): Promise<SyncQueueItem> {
    const queueItem: SyncQueueItem = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation_type: operation,
      resource_type: resourceType,
      resource_id: resourceId,
      data,
      user_id: 'offline-user', // Will be updated when syncing
      status: 'pending',
      retry_count: 0,
      error_message: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Backward compatibility
      operation: operation,
    };
    
    await syncQueueStore.setItem(queueItem.id, queueItem);
    return queueItem;
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const queue: SyncQueueItem[] = [];
    await syncQueueStore.iterate<SyncQueueItem, void>((item) => {
      if (item.status === 'pending' || item.status === 'failed') {
        queue.push(item);
      }
    });
    return queue.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }

  async updateSyncQueueItem(queueItem: SyncQueueItem): Promise<void> {
    await syncQueueStore.setItem(queueItem.id, queueItem);
  }

  async removeSyncQueueItem(queueItemId: string): Promise<void> {
    await syncQueueStore.removeItem(queueItemId);
  }

  async clearCompletedSyncItems(): Promise<void> {
    const itemsToRemove: string[] = [];
    await syncQueueStore.iterate<SyncQueueItem, void>((item, key) => {
      if (item.status === 'completed') {
        itemsToRemove.push(key);
      }
    });
    
    for (const key of itemsToRemove) {
      await syncQueueStore.removeItem(key);
    }
  }

  // ============ PENDING UPLOADS ============
  
  async addPendingUpload(upload: PendingUpload): Promise<void> {
    await pendingUploadsStore.setItem(upload.id, upload);
  }

  async getPendingUploads(): Promise<PendingUpload[]> {
    const uploads: PendingUpload[] = [];
    await pendingUploadsStore.iterate<PendingUpload, void>((upload) => {
      uploads.push(upload);
    });
    return uploads.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }

  async removePendingUpload(uploadId: string): Promise<void> {
    await pendingUploadsStore.removeItem(uploadId);
  }

  // ============ METADATA ============
  
  async getNetworkStatus(): Promise<NetworkStatus> {
    const status = await metadataStore.getItem<NetworkStatus>('network_status');
    return status || { isOnline: navigator.onLine };
  }

  async setNetworkStatus(status: NetworkStatus): Promise<void> {
    await metadataStore.setItem('network_status', status);
  }

  async getLastSyncTime(): Promise<string | null> {
    return await metadataStore.getItem<string>('last_sync_time');
  }

  async setLastSyncTime(time: string): Promise<void> {
    await metadataStore.setItem('last_sync_time', time);
  }

  // ============ UTILITY ============
  
  // Generic storage methods for compatibility
  async getItem<T = any>(key: string): Promise<T | null> {
    return await metadataStore.getItem<T>(key);
  }

  async setItem<T = any>(key: string, value: T): Promise<void> {
    await metadataStore.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await metadataStore.removeItem(key);
  }

  async clearAllData(): Promise<void> {
    await tripsStore.clear();
    await tripDaysStore.clear();
    await placesStore.clear();
    await storyItemsStore.clear();
    await packingItemsStore.clear();
    await syncQueueStore.clear();
    await pendingUploadsStore.clear();
    await metadataStore.clear();
  }

  async getStorageSize(): Promise<number> {
    // Estimate storage size (not exact, but gives an idea)
    let size = 0;
    
    const stores = [
      tripsStore,
      tripDaysStore,
      placesStore,
      storyItemsStore,
      packingItemsStore,
      syncQueueStore,
      pendingUploadsStore,
      metadataStore,
    ];
    
    for (const store of stores) {
      await store.iterate((value) => {
        size += JSON.stringify(value).length;
      });
    }
    
    return size;
  }
}

export const offlineStorage = new OfflineStorageService();
export default offlineStorage;
