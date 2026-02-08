/**
 * Example Integration of Optimistic Update Infrastructure
 * This file demonstrates how to use all the components together
 */

import { optimisticUpdateManager } from '../optimisticUpdateManager';
import { syncQueueService } from '../syncQueueService';
import { usePlaceStore } from '../../stores/placeStore';
import { retryWithBackoff, getUserFriendlyErrorMessage } from '../../utils/errorHandling';
import { OfflinePlace } from '../../types/offline';

/**
 * Example: Reorder a place with optimistic update
 */
export async function reorderPlaceOptimistically(
  placeId: string,
  newOrder: number,
  apiUpdateFn: (id: string, order: number) => Promise<void>
): Promise<void> {
  const placeStore = usePlaceStore.getState();
  const place = placeStore.getPlace(placeId);

  if (!place) {
    throw new Error('Place not found');
  }

  // Store original state for rollback
  const originalOrder = place.place_order || 0;
  const optimisticPlace: OfflinePlace = {
    ...place,
    place_order: newOrder,
    updated_at: new Date().toISOString(),
  };

  // 1. Apply optimistic UI update immediately
  placeStore.updatePlace(placeId, { place_order: newOrder });
  placeStore.setLoading(placeId, true, 'reorder');

  // 2. Use OptimisticUpdateManager to handle the update with rollback
  await optimisticUpdateManager.applyUpdate(
    placeId,
    'place_reorder',
    optimisticPlace,
    place,
    async () => {
      // 3. Perform the actual API call with retry logic
      await retryWithBackoff(
        () => apiUpdateFn(placeId, newOrder),
        {
          maxRetries: 3,
          retryDelay: 1000,
          exponentialBackoff: true,
        }
      );
      return optimisticPlace;
    },
    {
      onSuccess: () => {
        // 4. On success, clear loading state
        placeStore.clearLoadingState(placeId);
        console.log(`Place ${placeId} reordered successfully`);
      },
      onError: (error) => {
        // 5. On error, show error state
        const errorMessage = getUserFriendlyErrorMessage(error);
        placeStore.setError(placeId, errorMessage);
        console.error(`Failed to reorder place ${placeId}:`, error);
      },
      onRollback: () => {
        // 6. On rollback, restore original state
        placeStore.updatePlace(placeId, { place_order: originalOrder });
        placeStore.clearLoadingState(placeId);
        console.log(`Rolled back place ${placeId} to original order`);
      },
    }
  );
}


/**
 * Example: Process sync queue when coming back online
 */
export async function processSyncQueueOnOnline(
  apiHandlers: {
    createPlace: (data: any) => Promise<void>;
    updatePlace: (id: string, data: any) => Promise<void>;
    deletePlace: (id: string) => Promise<void>;
  }
): Promise<void> {
  console.log('Processing sync queue...');

  await syncQueueService.processQueue(
    async (item) => {
      console.log(`Processing ${item.operation} for ${item.resource_type} ${item.resource_id}`);

      // Handle different operations
      switch (item.operation) {
        case 'place_create':
          await apiHandlers.createPlace(item.data);
          break;
        case 'place_update':
          await apiHandlers.updatePlace(item.resource_id, item.data);
          break;
        case 'place_delete':
          await apiHandlers.deletePlace(item.resource_id);
          break;
      }
    },
    {
      maxRetries: 3,
      retryDelay: 1000,
      onProgress: (completed, total) => {
        console.log(`Sync progress: ${completed}/${total}`);
      },
      onItemSuccess: (item) => {
        console.log(`Successfully synced ${item.resource_type} ${item.resource_id}`);
      },
      onItemError: (item, error) => {
        console.error(`Failed to sync ${item.resource_type} ${item.resource_id}:`, error);
      },
    }
  );

  console.log('Sync queue processing complete');
}

/**
 * Example: Monitor queue status
 */
export async function monitorQueueStatus(): Promise<void> {
  const stats = await syncQueueService.getQueueStats();

  console.log('=== Sync Queue Status ===');
  console.log(`Total items: ${stats.total}`);
  console.log(`Pending: ${stats.pending}`);
  console.log(`Processing: ${stats.processing}`);
  console.log(`Failed: ${stats.failed}`);

  if (syncQueueService.isQueueProcessing()) {
    const currentItem = syncQueueService.getCurrentItem();
    if (currentItem) {
      console.log(`Currently processing: ${currentItem.resource_type} ${currentItem.resource_id}`);
    }
  }

  const updateStatus = optimisticUpdateManager.getQueueStatus();
  console.log('\n=== Optimistic Update Status ===');
  console.log(`Pending: ${updateStatus.pending}`);
  console.log(`Processing: ${updateStatus.processing}`);
  console.log(`Failed: ${updateStatus.failed}`);
  console.log(`Is processing: ${updateStatus.isProcessing}`);
}

/**
 * Example: Setup online/offline event listeners
 */
export function setupOnlineOfflineHandlers(
  apiHandlers: {
    createPlace: (data: any) => Promise<void>;
    updatePlace: (id: string, data: any) => Promise<void>;
    deletePlace: (id: string) => Promise<void>;
  }
): void {
  window.addEventListener('online', async () => {
    console.log('Back online! Processing pending sync queue...');
    try {
      await processSyncQueueOnOnline(apiHandlers);
    } catch (error) {
      console.error('Error processing sync queue:', error);
    }
  });

  window.addEventListener('offline', () => {
    console.log('Gone offline. Operations will be queued for later sync.');
  });
}
