# Offline Support

## Overview

Offline-first architecture enabling users to continue working without internet connection, with automatic synchronization when connection is restored.

## Architecture

### Storage Layers

1. **IndexedDB**: Structured data (trips, activities, budgets)
2. **Service Worker Cache**: Static assets and API responses
3. **LocalStorage**: User preferences and settings

### Sync Strategy

- **Optimistic UI**: Immediate local updates
- **Operation Queue**: Store pending operations
- **Conflict Resolution**: Last-write-wins with timestamps
- **Automatic Retry**: Exponential backoff

## Implementation

### Offline Store (Zustand)

```typescript
interface OfflineState {
  isOnline: boolean;
  queue: Operation[];
  syncStatus: 'idle' | 'syncing' | 'error';
  
  addToQueue: (operation: Operation) => void;
  processQueue: () => Promise<void>;
  clearQueue: () => void;
}
```

### Operation Queue

```typescript
interface Operation {
  id: string;
  type: 'create' | 'update' | 'delete';
  resource: 'trip' | 'activity' | 'budget';
  data: any;
  timestamp: number;
  retries: number;
}
```

### Network Detection

```typescript
import { Network } from '@capacitor/network';

// Listen for network changes
Network.addListener('networkStatusChange', (status) => {
  useOfflineStore.getState().setOnline(status.connected);
  
  if (status.connected) {
    // Trigger sync
    useOfflineStore.getState().processQueue();
  }
});

// Check current status
const status = await Network.getStatus();
```

## Offline Operations

### Creating Data Offline

```typescript
const createTrip = async (tripData: TripInput) => {
  const tempId = `temp-${uuid()}`;
  const trip = { ...tripData, id: tempId };
  
  // Optimistic update
  useTripStore.getState().addTrip(trip);
  
  // Add to offline queue
  useOfflineStore.getState().addToQueue({
    id: uuid(),
    type: 'create',
    resource: 'trip',
    data: trip,
    timestamp: Date.now(),
    retries: 0
  });
  
  // Store in IndexedDB
  await db.trips.add(trip);
  
  return trip;
};
```

### Updating Data Offline

```typescript
const updateActivity = async (id: string, updates: Partial<Activity>) => {
  // Optimistic update
  useActivityStore.getState().updateActivity(id, updates);
  
  // Add to queue
  useOfflineStore.getState().addToQueue({
    id: uuid(),
    type: 'update',
    resource: 'activity',
    data: { id, ...updates },
    timestamp: Date.now(),
    retries: 0
  });
  
  // Update IndexedDB
  await db.activities.update(id, updates);
};
```

### Deleting Data Offline

```typescript
const deleteActivity = async (id: string) => {
  // Optimistic update
  useActivityStore.getState().removeActivity(id);
  
  // Add to queue
  useOfflineStore.getState().addToQueue({
    id: uuid(),
    type: 'delete',
    resource: 'activity',
    data: { id },
    timestamp: Date.now(),
    retries: 0
  });
  
  // Mark as deleted in IndexedDB
  await db.activities.update(id, { _deleted: true });
};
```

## Synchronization

### Processing Queue

```typescript
const processQueue = async () => {
  const { queue, isOnline } = useOfflineStore.getState();
  
  if (!isOnline || queue.length === 0) return;
  
  useOfflineStore.getState().setSyncStatus('syncing');
  
  for (const operation of queue) {
    try {
      await executeOperation(operation);
      useOfflineStore.getState().removeFromQueue(operation.id);
    } catch (error) {
      if (operation.retries < 3) {
        // Retry with exponential backoff
        useOfflineStore.getState().incrementRetries(operation.id);
      } else {
        // Move to failed queue
        useOfflineStore.getState().moveToFailed(operation);
      }
    }
  }
  
  useOfflineStore.getState().setSyncStatus('idle');
};
```

### Conflict Resolution

```typescript
const resolveConflict = (local: any, remote: any) => {
  // Last-write-wins based on timestamp
  if (local.updatedAt > remote.updatedAt) {
    return local;
  }
  return remote;
};
```

## Service Worker

### Caching Strategy

```javascript
// Cache-first for static assets
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/assets/')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});

// Network-first for API calls
if (event.request.url.includes('/api/')) {
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
}
```

### Background Sync

```javascript
// Register background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-operations') {
    event.waitUntil(syncOperations());
  }
});

// Trigger from client
navigator.serviceWorker.ready.then((registration) => {
  registration.sync.register('sync-operations');
});
```

## IndexedDB Schema

```typescript
import Dexie from 'dexie';

class JournoDB extends Dexie {
  trips: Dexie.Table<Trip, string>;
  activities: Dexie.Table<Activity, string>;
  budgets: Dexie.Table<Budget, string>;
  operations: Dexie.Table<Operation, string>;
  
  constructor() {
    super('JournoDB');
    
    this.version(1).stores({
      trips: 'id, ownerId, updatedAt',
      activities: 'id, tripId, updatedAt, _deleted',
      budgets: 'id, tripId, updatedAt',
      operations: 'id, timestamp, resource'
    });
  }
}

export const db = new JournoDB();
```

## Storage Management

### Size Monitoring

```typescript
const checkStorageUsage = async () => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const percentUsed = (estimate.usage / estimate.quota) * 100;
    
    if (percentUsed > 80) {
      // Warn user or cleanup old data
      await cleanupOldData();
    }
  }
};
```

### Data Cleanup

```typescript
const cleanupOldData = async () => {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  
  // Remove old completed operations
  await db.operations
    .where('timestamp')
    .below(thirtyDaysAgo)
    .delete();
  
  // Remove deleted items
  await db.activities
    .where('_deleted')
    .equals(true)
    .delete();
};
```

## UI Indicators

### Offline Banner

```typescript
function OfflineBanner() {
  const isOnline = useOfflineStore(state => state.isOnline);
  const queueLength = useOfflineStore(state => state.queue.length);
  
  if (isOnline) return null;
  
  return (
    <div className="offline-banner">
      <Icon name="wifi-off" />
      <span>You're offline</span>
      {queueLength > 0 && (
        <span>{queueLength} changes pending</span>
      )}
    </div>
  );
}
```

### Sync Status

```typescript
function SyncStatus() {
  const syncStatus = useOfflineStore(state => state.syncStatus);
  
  if (syncStatus === 'idle') return null;
  
  return (
    <div className="sync-status">
      {syncStatus === 'syncing' && (
        <>
          <Spinner size="small" />
          <span>Syncing...</span>
        </>
      )}
      {syncStatus === 'error' && (
        <>
          <Icon name="alert" />
          <span>Sync failed</span>
        </>
      )}
    </div>
  );
}
```

## Testing Offline Mode

### Simulate Offline

```typescript
// In browser DevTools
// Network tab → Throttling → Offline

// Programmatically
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.controller?.postMessage({
    type: 'SIMULATE_OFFLINE'
  });
}
```

### Test Scenarios

1. Create data while offline
2. Update data while offline
3. Delete data while offline
4. Go offline mid-operation
5. Multiple offline operations
6. Conflict resolution
7. Failed sync retry
8. Storage quota exceeded

## Best Practices

1. **Always use optimistic updates** for better UX
2. **Show clear offline indicators** to users
3. **Implement proper conflict resolution**
4. **Monitor storage usage** and cleanup regularly
5. **Test offline scenarios** thoroughly
6. **Handle sync failures** gracefully
7. **Provide manual sync option** for users
8. **Cache critical assets** in service worker

## Troubleshooting

### Data Not Syncing

1. Check network connection
2. Verify queue has operations
3. Check for sync errors in console
4. Verify API endpoints are accessible
5. Check authentication tokens

### Storage Quota Exceeded

1. Check current usage
2. Run cleanup operations
3. Remove old cached data
4. Prompt user to clear data

### Conflicts Not Resolving

1. Check timestamp accuracy
2. Verify conflict resolution logic
3. Review server-side handling
4. Check for clock skew issues

## Future Enhancements

- Differential sync (only changed fields)
- Peer-to-peer sync
- Selective sync (user chooses what to sync)
- Compression for large datasets
- Encryption for sensitive data
