# Offline Support Documentation

## Overview

The Journo platform includes comprehensive offline support, allowing users to create and edit trips, add places, and manage their travel plans without an internet connection. All changes are automatically synchronized when the connection is restored.

## Architecture

### Storage Layer

- **LocalForage**: IndexedDB-based storage for structured data
- **Separate stores**: Trips, trip days, places, story items, packing items, sync queue
- **Metadata tracking**: Offline-created and offline-modified flags

### Sync Queue

All offline operations are queued for synchronization:
- CREATE operations
- UPDATE operations
- DELETE operations

Each queue item includes:
- Operation type
- Resource type and ID
- Data payload
- Retry count and status
- Error information

### Conflict Resolution

Uses a **last-write-wins** strategy:
- Compares timestamps between local and server data
- Applies the most recent change
- Simple and predictable for users

## Usage

### Using Offline Services

Replace standard services with offline-aware versions:

```typescript
// Instead of:
import { tripService } from './services/tripService';

// Use:
import { offlineTripService } from './services/offlineTripService';

// Create trip (works offline)
const trip = await offlineTripService.createTrip(tripData, token);

// Update trip (works offline)
const updated = await offlineTripService.updateTrip(tripId, updates, token);

// Get trips (includes offline trips)
const trips = await offlineTripService.getTrips(1, 10, token);
```

### Offline Store

Access offline state in components:

```typescript
import { useOfflineStore } from '../stores/offlineStore';

function MyComponent() {
  const { 
    isOnline,           // Network status
    isSyncing,          // Sync in progress
    pendingChangesCount, // Number of pending changes
    lastSyncTime,       // Last successful sync
    syncError           // Sync error message
  } = useOfflineStore();

  return (
    <div>
      {!isOnline && <p>You're offline</p>}
      {pendingChangesCount > 0 && <p>{pendingChangesCount} changes pending</p>}
    </div>
  );
}
```

### Automatic Sync

Sync happens automatically when:
1. Device comes back online
2. User opens the app while online
3. User manually triggers sync

```typescript
import { useOfflineSync } from '../hooks/useOfflineSync';

function App() {
  // Enable automatic sync
  const { triggerSync, stopSync } = useOfflineSync();

  return (
    <button onClick={triggerSync}>
      Sync Now
    </button>
  );
}
```

## UI Components

### OfflineBadge

Shows offline status and pending changes:

```typescript
import { OfflineBadge } from '../components/common/OfflineBadge';

<OfflineBadge showSyncStatus={true} />
```

### SyncStatus

Detailed sync status with expandable details:

```typescript
import { SyncStatus } from '../components/common/SyncStatus';

// Add to app root
<SyncStatus />
```

## Offline IDs

Resources created offline get temporary IDs:
- Format: `offline_<timestamp>_<random>`
- Replaced with server IDs during sync
- Automatically handled by offline services

```typescript
import { generateOfflineId, isOfflineId } from '../utils/offlineUtils';

const id = generateOfflineId();
// => "offline_1699564800000_abc123def"

if (isOfflineId(id)) {
  console.log('This resource was created offline');
}
```

## Data Flow

### Creating a Trip Offline

1. User creates trip while offline
2. Trip saved to IndexedDB with offline ID
3. Operation added to sync queue
4. When online, sync service processes queue
5. Trip created on server
6. Local trip updated with server ID
7. Sync queue item marked complete

### Updating a Trip Offline

1. User updates trip while offline
2. Changes saved to IndexedDB
3. Trip marked as `_offline_modified`
4. Update operation added to sync queue
5. When online, changes synced to server
6. Local trip marked as synced

### Conflict Resolution

1. Sync detects server has newer data
2. Compares timestamps
3. Applies last-write-wins strategy
4. Updates local storage with result

## Error Handling

### Retry Logic

Failed sync operations are retried with exponential backoff:
- Retry 1: 1 second delay
- Retry 2: 2 seconds delay
- Retry 3: 4 seconds delay
- Max retries: 3

After max retries, item marked as failed and user notified.

### Network Detection

```typescript
// Automatic detection
window.addEventListener('online', () => {
  // Trigger sync
});

window.addEventListener('offline', () => {
  // Update UI
});

// Manual check
if (navigator.onLine) {
  // Device is online
}
```

## Best Practices

### 1. Always Use Offline Services

```typescript
// ✅ Good
import { offlineTripService } from './services/offlineTripService';
await offlineTripService.createTrip(data, token);

// ❌ Bad
import { tripService } from './services/tripService';
await tripService.createTrip(data, token);
```

### 2. Show Offline Indicators

```typescript
const { isOnline, pendingChangesCount } = useOfflineStore();

return (
  <div>
    {!isOnline && <OfflineBadge />}
    {pendingChangesCount > 0 && (
      <p>{pendingChangesCount} changes will sync when online</p>
    )}
  </div>
);
```

### 3. Handle Offline Errors Gracefully

```typescript
try {
  await offlineTripService.createTrip(data, token);
  if (isOnline) {
    toast.success('Trip created!');
  } else {
    toast.info('Trip created offline. Will sync when online.');
  }
} catch (error) {
  toast.error('Failed to create trip');
}
```

### 4. Provide Manual Sync Option

```typescript
<button 
  onClick={() => syncService.startSync()}
  disabled={!isOnline || isSyncing}
>
  {isSyncing ? 'Syncing...' : 'Sync Now'}
</button>
```

## Testing Offline Functionality

### Chrome DevTools

1. Open DevTools (F12)
2. Go to Network tab
3. Select "Offline" from throttling dropdown
4. Test creating/editing trips
5. Switch back to "Online"
6. Verify sync happens automatically

### Manual Testing

1. Disconnect from internet
2. Create a new trip
3. Add places to the trip
4. Edit trip details
5. Reconnect to internet
6. Verify all changes sync
7. Check sync status indicator

## Limitations

1. **Photo uploads**: Queued for background processing
2. **Real-time features**: Disabled while offline
3. **Search**: Limited to cached data
4. **Maps**: Requires cached tiles (see offline maps feature)
5. **Weather**: Uses last cached forecast

## Future Enhancements

- [ ] Selective sync (choose what to sync)
- [ ] Conflict resolution UI
- [ ] Offline map tiles
- [ ] Background sync API
- [ ] Service worker caching
- [ ] Compression for large datasets
- [ ] Sync priority queue
- [ ] Bandwidth-aware sync

## Troubleshooting

### Sync Not Working

1. Check network connection
2. Verify authentication token is valid
3. Check browser console for errors
4. Clear offline storage and retry
5. Check sync queue for failed items

### Clear Offline Data

```typescript
import { offlineStorage } from './services/offlineStorage';

// Clear all offline data
await offlineStorage.clearAllData();
```

### Check Storage Size

```typescript
const size = await offlineStorage.getStorageSize();
console.log(`Offline storage: ${(size / 1024 / 1024).toFixed(2)} MB`);
```

## API Reference

See individual service files for detailed API documentation:
- `offlineStorage.ts` - Storage operations
- `offlineTripService.ts` - Trip operations
- `offlinePlaceService.ts` - Place operations
- `syncService.ts` - Sync operations
- `offlineStore.ts` - State management
