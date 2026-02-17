# Offline Support Implementation

This document describes the offline support implementation for the BubbleQuest UI Redesign.

## Overview

The offline support system provides:
1. **Service Worker Caching** - Automatic caching of trip data, documents, and static assets
2. **Offline Data Display** - Display cached data when offline with visual indicators
3. **Change Queuing** - Queue user changes when offline and sync when connection is restored
4. **Conflict Resolution** - Handle sync conflicts gracefully

## Architecture

### Components

#### 1. Service Worker (Vite PWA Plugin)
- Configured in `vite.config.ts`
- Caches static assets, API responses, and uploaded documents
- Uses different caching strategies:
  - **NetworkFirst**: Trip data, API calls (tries network, falls back to cache)
  - **CacheFirst**: Documents, images, stickers (uses cache, updates in background)
  - **StaleWhileRevalidate**: Maps, fonts (returns cache immediately, updates in background)

#### 2. Service Worker Manager (`serviceWorkerManager.ts`)
- Programmatic cache management
- Manual caching of specific URLs
- Cache status monitoring
- Cache invalidation

#### 3. Offline Storage (`offlineStorage.ts`)
- IndexedDB-based storage using localforage
- Stores trips, days, places, shopping items, checklist items, etc.
- Manages sync queue for pending changes

#### 4. Offline Data Service (`offlineDataService.ts`)
- Fetches data with offline support
- Tries network first, falls back to cache
- Supports cache-first mode for better performance

#### 5. Offline Sync Service (`offlineSyncService.ts`)
- Queues changes when offline
- Auto-syncs when connection is restored
- Handles retry logic and conflict resolution
- Provides sync progress updates

### Hooks

#### 1. `useServiceWorker`
```typescript
const {
  isSupported,
  isRegistered,
  cacheStatus,
  cacheTripData,
  cacheDocument,
  clearCache,
  updateServiceWorker,
} = useServiceWorker();
```

#### 2. `useOfflineData`
```typescript
const {
  data,
  isLoading,
  error,
  fromCache,
  lastUpdated,
  refetch,
  prefetch,
  isCached,
} = useOfflineData<Trip>('/api/trips/123', {
  cacheFirst: true,
  token: accessToken,
});
```

#### 3. `useOfflineSync`
```typescript
const {
  isSyncing,
  pendingChangesCount,
  lastSyncTime,
  syncAll,
  queueChange,
} = useOfflineSync();
```

### UI Components

#### 1. `OfflineIndicator`
Displays offline status at the top or bottom of the screen:
- Shows when offline
- Shows sync progress
- Shows pending changes count
- Shows sync errors

```tsx
<OfflineIndicator position="top" showWhenOnline={false} />
```

#### 2. `CachedDataBadge`
Shows when data is from cache:
```tsx
<CachedDataBadge lastUpdated={lastUpdated} size="sm" />
```

#### 3. `SyncStatusPanel`
Displays detailed sync status with manual sync button:
```tsx
<SyncStatusPanel showDetails={true} />
```

## Usage Examples

### 1. Fetch Data with Offline Support

```typescript
import { useOfflineData } from '../hooks/useOfflineData';

function TripDetail({ tripId }: { tripId: string }) {
  const { data: trip, isLoading, fromCache, lastUpdated } = useOfflineData<Trip>(
    `/api/trips/${tripId}`,
    {
      cacheFirst: false, // Try network first
      refetchOnOnline: true, // Refetch when coming back online
      token: accessToken,
    }
  );

  return (
    <div>
      {fromCache && <CachedDataBadge lastUpdated={lastUpdated} />}
      {/* Render trip data */}
    </div>
  );
}
```

### 2. Queue Changes When Offline

```typescript
import { useOfflineSync } from '../hooks/useOfflineSync';

function EditTrip({ tripId }: { tripId: string }) {
  const { queueChange } = useOfflineSync();

  const handleSave = async (data: UpdateTripDto) => {
    // Queue the change (works offline)
    await queueChange('update', 'trip', tripId, data);
    
    // The change will be synced automatically when online
  };

  return (
    <form onSubmit={handleSave}>
      {/* Form fields */}
    </form>
  );
}
```

### 3. Manual Sync

```typescript
import { useOfflineSync } from '../hooks/useOfflineSync';

function SyncButton() {
  const { syncAll, isSyncing, pendingChangesCount } = useOfflineSync();

  const handleSync = async () => {
    const result = await syncAll();
    console.log(`Synced ${result.success} changes, ${result.failed} failed`);
  };

  return (
    <button onClick={handleSync} disabled={isSyncing}>
      {isSyncing ? 'Syncing...' : `Sync ${pendingChangesCount} changes`}
    </button>
  );
}
```

### 4. Prefetch Data for Offline Use

```typescript
import { useServiceWorker } from '../hooks/useServiceWorker';

function DownloadForOffline({ tripId }: { tripId: string }) {
  const { cacheTripData } = useServiceWorker();

  const handleDownload = async () => {
    const success = await cacheTripData(tripId, accessToken);
    if (success) {
      alert('Trip saved for offline use');
    }
  };

  return (
    <button onClick={handleDownload}>
      Save for Offline
    </button>
  );
}
```

## Auto-Sync Behavior

The sync service automatically syncs pending changes when:
1. **Connection is restored** - Listens for `online` event
2. **Periodic check** - Every 5 minutes when online
3. **Page visibility change** - When user returns to the tab

## Caching Strategies

### Trip Data (NetworkFirst)
- Tries network first with 5-second timeout
- Falls back to cache if network fails
- Caches successful responses for 7 days
- Max 50 entries

### Documents (CacheFirst)
- Uses cache first for fast loading
- Updates cache in background
- Caches for 30 days
- Max 100 entries

### Stickers (CacheFirst)
- Uses cache first
- Caches for 30 days
- Max 200 entries

## Error Handling

### Network Errors
- Automatically falls back to cached data
- Shows offline indicator
- Queues changes for later sync

### Sync Errors
- Retries up to 3 times with exponential backoff
- Shows error in sync status panel
- Keeps failed items in queue for manual retry

### Cache Errors
- Logs errors to console
- Continues with network-only mode
- Shows appropriate error messages to user

## Testing

### Test Offline Mode
1. Open DevTools > Network tab
2. Set throttling to "Offline"
3. Verify cached data is displayed
4. Make changes and verify they're queued
5. Go back online and verify auto-sync

### Test Cache
1. Load a trip while online
2. Go offline
3. Verify trip data is still accessible
4. Check cache status in DevTools > Application > Cache Storage

### Test Sync
1. Go offline
2. Make multiple changes
3. Verify changes are queued (check sync status)
4. Go back online
5. Verify changes are synced automatically

## Performance Considerations

- **Cache Size**: Monitor cache size to avoid exceeding browser limits
- **Sync Frequency**: Auto-sync runs every 5 minutes to balance freshness and battery
- **Network Timeout**: 5-second timeout for network requests before falling back to cache
- **Batch Sync**: Syncs all pending changes in one batch for efficiency

## Browser Support

- **Service Workers**: Chrome 40+, Firefox 44+, Safari 11.1+, Edge 17+
- **IndexedDB**: All modern browsers
- **Cache API**: All modern browsers

## Troubleshooting

### Cache Not Working
- Check if service worker is registered: DevTools > Application > Service Workers
- Verify cache storage: DevTools > Application > Cache Storage
- Check console for errors

### Sync Not Working
- Verify network connection
- Check sync queue: `await offlineStorage.getSyncQueue()`
- Check for authentication errors

### Data Not Updating
- Clear cache: `await serviceWorkerManager.clearAllCaches()`
- Force refresh: `useOfflineData` with `forceRefresh: true`
- Update service worker: `await serviceWorkerManager.updateServiceWorker()`

## Future Enhancements

1. **Conflict Resolution UI** - Show conflicts to user and let them choose
2. **Selective Sync** - Allow users to choose which changes to sync
3. **Background Sync** - Use Background Sync API for better reliability
4. **Offline Analytics** - Track offline usage patterns
5. **Smart Prefetching** - Automatically prefetch likely-needed data
