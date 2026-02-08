# Optimistic Update Infrastructure

This infrastructure provides a complete solution for implementing optimistic UI updates with automatic rollback, retry logic, and IndexedDB persistence.

## Components

### 1. OptimisticUpdateManager
Handles optimistic UI updates with rollback capability.

### 2. SyncQueueService
Manages the queue of pending operations with IndexedDB persistence.

### 3. PlaceStore
Zustand store with loading state management for places.

### 4. Error Handling Utilities
Retry logic and error classification utilities.

## Usage Examples

### Basic Optimistic Update

```typescript
import { optimisticUpdateManager, usePlaceStore } from '@/services/optimistic';
import { placeService } from '@/services/placeService';

function handlePlaceReorder(placeId: string, newOrder: number) {
  const placeStore = usePlaceStore.getState();
  const place = placeStore.getPlace(placeId);
  
  if (!place) return;

  // Store original data for rollback
  const originalOrder = place.place_order;
  const optimisticPlace = { ...place, place_order: newOrder };

  // Apply optimistic update
  optimisticUpdateManager.applyUpdate(
    placeId,
    'place_reorder',
    optimisticPlace,
    place,
    async () => {
      // This function performs the actual API call
      await placeService.updatePlace(placeId, { place_order: newOrder });
      return optimisticPlace;
    },
    {
      maxRetries: 3,
      retryDelay: 1000,
      onSuccess: () => {
        console.log('Place reordered successfully');
        placeStore.clearLoadingState(placeId);
      },
      onError: (error) => {
        console.error('Failed to reorder place:', error);
        placeStore.setError(placeId, error.message);
      },
      onRollback: () => {
        // Rollback UI to original state
        placeStore.updatePlace(placeId, { place_order: originalOrder });
      },
    }
  );

  // Update UI optimistically
  placeStore.updatePlace(placeId, { place_order: newOrder });
  placeStore.setLoading(placeId, true, 'reorder');
}
```


### Using Loading States

```typescript
import { usePlaceStore } from '@/services/optimistic';

function PlaceCard({ placeId }: { placeId: string }) {
  const place = usePlaceStore(state => state.getPlace(placeId));
  const loadingState = usePlaceStore(state => state.getLoadingState(placeId));
  const isLoading = usePlaceStore(state => state.isPlaceLoading(placeId));

  if (!place) return null;

  return (
    <div className={`place-card ${isLoading ? 'loading' : ''}`}>
      <h3>{place.name}</h3>
      
      {isLoading && (
        <div className="loading-overlay">
          <Spinner size="small" />
          <span>Syncing...</span>
        </div>
      )}
      
      {loadingState?.error && (
        <div className="error-message">
          {loadingState.error}
          <button onClick={() => retryUpdate(placeId)}>Retry</button>
        </div>
      )}
    </div>
  );
}
```

### Processing Sync Queue

```typescript
import { syncQueueService } from '@/services/optimistic';
import { placeService } from '@/services/placeService';

async function processPendingSync() {
  await syncQueueService.processQueue(
    async (item) => {
      // Handle different resource types
      switch (item.resource_type) {
        case 'place':
          await handlePlaceSync(item);
          break;
        // Add other resource types as needed
      }
    },
    {
      maxRetries: 3,
      retryDelay: 1000,
      onProgress: (completed, total) => {
        console.log(`Syncing: ${completed}/${total}`);
      },
      onItemSuccess: (item) => {
        console.log(`Synced ${item.resource_type} ${item.resource_id}`);
      },
      onItemError: (item, error) => {
        console.error(`Failed to sync ${item.resource_type}:`, error);
      },
    }
  );
}

async function handlePlaceSync(item: SyncQueueItem) {
  switch (item.operation) {
    case 'CREATE':
      await placeService.createPlace(item.data);
      break;
    case 'UPDATE':
      await placeService.updatePlace(item.resource_id, item.data);
      break;
    case 'DELETE':
      await placeService.deletePlace(item.resource_id);
      break;
  }
}
```


### Error Handling with Retry

```typescript
import { retryWithBackoff, isNetworkError } from '@/services/optimistic';

async function updatePlaceWithRetry(placeId: string, data: any) {
  try {
    await retryWithBackoff(
      async () => {
        const response = await fetch(`/api/places/${placeId}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        return response.json();
      },
      {
        maxRetries: 3,
        retryDelay: 1000,
        exponentialBackoff: true,
        shouldRetry: (error, attempt) => {
          // Custom retry logic
          if (isNetworkError(error)) {
            return true;
          }
          if (attempt < 2) {
            return true;
          }
          return false;
        },
        onRetry: (error, attempt) => {
          console.log(`Retry attempt ${attempt} after error:`, error);
        },
      }
    );
  } catch (error) {
    console.error('All retry attempts failed:', error);
    throw error;
  }
}
```

### Monitoring Queue Status

```typescript
import { syncQueueService } from '@/services/optimistic';

async function displayQueueStatus() {
  const stats = await syncQueueService.getQueueStats();
  
  console.log(`Queue Status:
    Total: ${stats.total}
    Pending: ${stats.pending}
    Processing: ${stats.processing}
    Failed: ${stats.failed}
  `);
  
  const isProcessing = syncQueueService.isQueueProcessing();
  const currentItem = syncQueueService.getCurrentItem();
  
  if (isProcessing && currentItem) {
    console.log(`Currently processing: ${currentItem.resource_type} ${currentItem.resource_id}`);
  }
}
```

## Architecture

```
User Action
    ↓
Optimistic UI Update (immediate)
    ↓
Show Loading Indicator
    ↓
Add to Sync Queue (IndexedDB)
    ↓
API Call with Retry Logic
    ↓
Success → Remove Loading → Remove from Queue
    ↓
Failure → Rollback UI → Show Error → Keep in Queue
```

## Best Practices

1. **Always provide rollback logic**: Ensure the UI can revert to the original state on failure.

2. **Use appropriate loading indicators**: Show users that an operation is in progress.

3. **Handle errors gracefully**: Provide clear error messages and retry options.

4. **Queue operations**: Don't block the UI while syncing - queue operations and process them in the background.

5. **Persist the queue**: Use IndexedDB to ensure operations aren't lost on page refresh.

6. **Monitor queue health**: Regularly check queue status and clear completed items.

7. **Test offline scenarios**: Ensure the system works correctly when offline and syncs when back online.
