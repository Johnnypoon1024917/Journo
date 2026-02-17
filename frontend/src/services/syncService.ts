import { offlineStorage } from './offlineStorage';
import { getAuthToken } from '../utils/auth';
import { tripService } from './tripService';
import { placeService } from './placeService';
import { useOfflineStore } from '../stores/offlineStore';
import { SyncQueueItem } from '../types/offline';
import { calculateBackoffDelay, cleanOfflineMetadata } from '../utils/offlineUtils';
import { analyticsService } from './analyticsService';
import { syncConflictService } from './syncConflictService';

const MAX_RETRIES = 3;
const SYNC_BATCH_SIZE = 5;

/**
 * Sync Service
 * Handles synchronization of offline changes to the server
 */
class SyncService {
  private isSyncing = false;
  private syncAbortController: AbortController | null = null;

  /**
   * Start syncing offline changes
   */
  async startSync(): Promise<void> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    if (!navigator.onLine) {
      console.log('Cannot sync while offline');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      console.log('Cannot sync without authentication token');
      return;
    }

    this.isSyncing = true;
    this.syncAbortController = new AbortController();
    
    const offlineStore = useOfflineStore.getState();
    offlineStore.setSyncStatus(true, 0);
    offlineStore.setSyncError(null);

    try {
      const syncQueue = await offlineStorage.getSyncQueue();
      
      if (syncQueue.length === 0) {
        console.log('No items to sync');
        this.completeSyncSuccess();
        return;
      }

      console.log(`Starting sync of ${syncQueue.length} items`);

      // Track sync started event
      analyticsService.trackOfflineSyncStarted();

      // Process queue in batches
      let processedCount = 0;
      const totalCount = syncQueue.length;

      for (let i = 0; i < syncQueue.length; i += SYNC_BATCH_SIZE) {
        if (this.syncAbortController?.signal.aborted) {
          throw new Error('Sync aborted');
        }

        const batch = syncQueue.slice(i, i + SYNC_BATCH_SIZE);
        
        await Promise.all(
          batch.map(item => this.processSyncItem(item, token))
        );

        processedCount += batch.length;
        const progress = (processedCount / totalCount) * 100;
        offlineStore.setSyncStatus(true, progress);
      }

      // Clean up completed items
      await offlineStorage.clearCompletedSyncItems();

      this.completeSyncSuccess();
    } catch (error: any) {
      console.error('Sync failed:', error);
      offlineStore.setSyncError(error.message || 'Sync failed');
      offlineStore.setSyncStatus(false, 0);
    } finally {
      this.isSyncing = false;
      this.syncAbortController = null;
    }
  }

  /**
   * Stop ongoing sync
   */
  stopSync(): void {
    if (this.syncAbortController) {
      this.syncAbortController.abort();
    }
  }

  /**
   * Process a single sync queue item
   */
  private async processSyncItem(item: SyncQueueItem, token: string): Promise<void> {
    try {
      // Update status to processing
      item.status = 'processing';
      await offlineStorage.updateSyncQueueItem(item);

      // Process based on resource type and operation
      await this.syncResource(item, token);

      // Mark as completed
      item.status = 'completed';
      await offlineStorage.updateSyncQueueItem(item);

      console.log(`Synced ${item.resource_type} ${item.operation_type} ${item.resource_id}`);
    } catch (error: any) {
      console.error(`Failed to sync ${item.resource_type} ${item.operation_type}:`, error);

      // Handle retry logic
      item.retry_count += 1;
      const errorMsg = error.message || 'Unknown error';
      item.error_message = errorMsg;
      item.last_error = errorMsg; // Backward compatibility

      if (item.retry_count >= MAX_RETRIES) {
        item.status = 'failed';
        console.error(`Max retries reached for ${item.resource_type} ${item.resource_id}`);
      } else {
        item.status = 'pending';
        // Wait before retrying
        const delay = calculateBackoffDelay(item.retry_count);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      await offlineStorage.updateSyncQueueItem(item);
      throw error;
    }
  }

  /**
   * Sync a resource based on type and operation
   */
  private async syncResource(item: SyncQueueItem, token: string): Promise<void> {
    const { resource_type, operation_type, resource_id, data } = item;

    switch (resource_type) {
      case 'trip':
        await this.syncTrip(operation_type, resource_id, data, token);
        break;
      
      case 'trip_day':
        await this.syncTripDay(operation_type, resource_id, data, token);
        break;
      
      case 'place':
        await this.syncPlace(operation_type, resource_id, data, token);
        break;
      
      case 'story_item':
        await this.syncStoryItem(operation_type, resource_id, data, token);
        break;
      
      case 'packing_item':
        await this.syncPackingItem(operation_type, resource_id, data, token);
        break;
      
      default:
        throw new Error(`Unknown resource type: ${resource_type}`);
    }
  }

  /**
   * Sync trip operations
   */
  private async syncTrip(
    operation: string,
    resourceId: string,
    data: any,
    token: string
  ): Promise<void> {
    const cleanData = cleanOfflineMetadata(data) as any;

    // Map operation_type to action
    if (operation === 'trip_create' || operation === 'CREATE') {
      // Create trip on server
      const response = await tripService.createTrip(cleanData, token);
      
      // Update offline storage with server ID
      const offlineTrip = await offlineStorage.getTrip(resourceId);
      if (offlineTrip) {
        await offlineStorage.deleteTrip(resourceId);
        await offlineStorage.saveTrip({
          ...offlineTrip,
          id: response.data.id,
          _offline_created: false,
          _last_synced: new Date().toISOString(),
        });
      }
    } else if (operation === 'trip_update' || operation === 'UPDATE') {
      // Check for conflicts before updating
      const offlineTrip = await offlineStorage.getTrip(resourceId);
      
      if (offlineTrip && (offlineTrip._offline_modified || offlineTrip._offline_created)) {
        // Fetch current server version to check for conflicts
        try {
          const serverTrip = await tripService.getTripById(resourceId, token);
          
          // Detect conflict
          const hasConflict = syncConflictService.detectConflict(
            offlineTrip,
            serverTrip.data,
            'trip'
          );

          if (hasConflict) {
            // Create conflict for user resolution
            syncConflictService.createConflict(
              'trip',
              resourceId,
              offlineTrip,
              serverTrip.data
            );
            
            // Throw error to mark sync item as failed and wait for user resolution
            throw new Error('Sync conflict detected - user resolution required');
          }
        } catch (error: any) {
          // If error is not about conflict detection, rethrow
          if (!error.message?.includes('conflict')) {
            console.warn('Could not fetch server version for conflict check:', error);
          } else {
            throw error;
          }
        }
      }

      await tripService.updateTrip(resourceId, cleanData, token);
      
      // Update offline storage
      if (offlineTrip) {
        offlineTrip._offline_modified = false;
        offlineTrip._last_synced = new Date().toISOString();
        await offlineStorage.saveTrip(offlineTrip);
      }
    } else if (operation === 'trip_delete' || operation === 'DELETE') {
      await tripService.deleteTrip(resourceId, token);
      await offlineStorage.deleteTrip(resourceId);
    }
  }

  /**
   * Sync trip day operations
   */
  private async syncTripDay(
    operation: string,
    resourceId: string,
    _data: any,
    _token: string
  ): Promise<void> {
    // Implementation for trip day sync
    // Similar pattern to syncTrip
    console.log('Syncing trip day:', operation, resourceId);
  }

  /**
   * Sync place operations
   */
  private async syncPlace(
    operation: string,
    resourceId: string,
    data: any,
    _token: string
  ): Promise<void> {
    const cleanData = cleanOfflineMetadata(data) as any;

    // Map operation_type to action
    if (operation === 'place_create' || operation === 'CREATE') {
      const place = await placeService.createPlace(cleanData);
      
      // Update offline storage with server ID
      const offlinePlace = await offlineStorage.getPlace(resourceId);
      if (offlinePlace) {
        await offlineStorage.deletePlace(resourceId);
        await offlineStorage.savePlace({
          ...offlinePlace,
          id: place.id,
          _offline_created: false,
        });
      }
    } else if (operation === 'place_update' || operation === 'UPDATE') {
      // Check for conflicts before updating
      const offlinePlace = await offlineStorage.getPlace(resourceId);
      
      if (offlinePlace && (offlinePlace._offline_modified || offlinePlace._offline_created)) {
        // Fetch current server version to check for conflicts
        try {
          const serverPlace = await placeService.getPlaceById(resourceId);
          
          // Detect conflict
          const hasConflict = syncConflictService.detectConflict(
            offlinePlace,
            serverPlace,
            'place'
          );

          if (hasConflict) {
            // Create conflict for user resolution
            syncConflictService.createConflict(
              'place',
              resourceId,
              offlinePlace,
              serverPlace
            );
            
            // Throw error to mark sync item as failed and wait for user resolution
            throw new Error('Sync conflict detected - user resolution required');
          }
        } catch (error: any) {
          // If error is not about conflict detection, rethrow
          if (!error.message?.includes('conflict')) {
            console.warn('Could not fetch server version for conflict check:', error);
          } else {
            throw error;
          }
        }
      }

      await placeService.updatePlace(resourceId, cleanData);
      
      // Update offline storage
      if (offlinePlace) {
        offlinePlace._offline_modified = false;
        await offlineStorage.savePlace(offlinePlace);
      }
    } else if (operation === 'place_delete' || operation === 'DELETE') {
      await placeService.deletePlace(resourceId);
      await offlineStorage.deletePlace(resourceId);
    } else if (operation === 'place_reorder') {
      // Handle place reordering
      await placeService.updatePlace(resourceId, cleanData);
      
      const offlinePlace = await offlineStorage.getPlace(resourceId);
      if (offlinePlace) {
        offlinePlace._offline_modified = false;
        await offlineStorage.savePlace(offlinePlace);
      }
    }
  }

  /**
   * Sync story item operations
   */
  private async syncStoryItem(
    operation: string,
    resourceId: string,
    _data: any,
    _token: string
  ): Promise<void> {
    // Implementation for story item sync
    console.log('Syncing story item:', operation, resourceId);
  }

  /**
   * Sync packing item operations
   */
  private async syncPackingItem(
    operation: string,
    resourceId: string,
    _data: any,
    _token: string
  ): Promise<void> {
    // Implementation for packing item sync
    console.log('Syncing packing item:', operation, resourceId);
  }

  /**
   * Complete sync successfully
   */
  private completeSyncSuccess(): void {
    const offlineStore = useOfflineStore.getState();
    const now = new Date().toISOString();
    
    offlineStore.setSyncStatus(false, 100);
    offlineStore.setLastSyncTime(now);
    offlineStore.loadSyncQueue();
    
    // Track sync completed event
    analyticsService.trackOfflineSyncCompleted();
    
    console.log('Sync completed successfully');
  }



  /**
   * Sync a specific trip to server (for QuickPlan offline service)
   */
  async syncTripToServer(trip: any): Promise<void> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Cannot sync without authentication token');
    }

    // Add to sync queue for processing
    await offlineStorage.addToSyncQueue(
      'trip_create',
      'trip',
      trip.id,
      trip
    );

    // Process immediately if online
    if (navigator.onLine) {
      await this.startSync();
    }
  }

  /**
   * Process pending photo uploads
   */
  async processPendingUploads(): Promise<void> {
    const uploads = await offlineStorage.getPendingUploads();
    
    if (uploads.length === 0) {
      return;
    }

    console.log(`Processing ${uploads.length} pending uploads`);

    for (const upload of uploads) {
      try {
        // Upload file based on type
        // This would integrate with your upload service
        console.log('Uploading:', upload.type, upload.resource_id);
        
        // Remove from pending uploads after successful upload
        await offlineStorage.removePendingUpload(upload.id);
      } catch (error) {
        console.error('Failed to upload:', error);
        
        // Increment retry count
        upload.retry_count += 1;
        
        if (upload.retry_count >= MAX_RETRIES) {
          console.error('Max retries reached for upload:', upload.id);
          await offlineStorage.removePendingUpload(upload.id);
        }
      }
    }
  }
}

export const syncService = new SyncService();
export default syncService;
