# Offline Storage Size Management

## Overview

This document describes the implementation of offline storage size management for the Journo application, which tracks total cached data size, enforces a 50MB limit, and implements automatic cache eviction when the limit is reached.

**Validates Requirement 11.10**: Store offline data using IndexedDB with a maximum cache size of 50MB

## Implementation

### Core Service: StorageSizeManagerService

Location: `frontend/src/services/storageSizeManager.ts`

The `StorageSizeManagerService` provides comprehensive storage management with the following capabilities:

#### 1. Storage Tracking

- **Tracks total cached data size** across all IndexedDB stores
- Monitors storage usage in real-time
- Provides detailed breakdown by store type:
  - Trips
  - Trip Days
  - Places
  - Story Items
  - Packing Items
  - Sync Queue
  - Pending Uploads
  - Metadata
  - Offline Queue
  - Quick Plan cache

#### 2. Limit Enforcement

- **50MB maximum storage limit** (configurable constant)
- **Warning threshold at 80%** (40MB) of maximum
- Automatic detection of near-limit and over-limit conditions
- Prevents write operations that would exceed the limit

#### 3. Cache Eviction Strategy

When storage limit is reached, the service automatically evicts data in the following priority order:

1. **Completed sync queue items** - Already synced to server, safe to remove
2. **Expired Quick Plan suggestions** - Past their expiration date
3. **Oldest Quick Plan suggestions** - Least recently cached
4. **Oldest story items** - Ordered by creation date
5. **Oldest trips** - Excluding trips with pending sync operations

This strategy ensures:
- Critical data with pending sync is never evicted
- Most recently used data is preserved
- User experience is minimally impacted

### Integration with Offline Storage

Location: `frontend/src/services/offlineStorage.ts`

The offline storage service has been enhanced to check storage limits before write operations:

```typescript
async saveTrip(trip: OfflineTrip): Promise<void> {
  // Check storage limit before saving
  const tripSize = new Blob([JSON.stringify(trip)]).size;
  const hasSpace = await storageSizeManager.ensureSpaceAvailable(tripSize);
  
  if (!hasSpace) {
    throw new Error('Storage limit exceeded. Unable to save trip.');
  }
  
  await tripsStore.setItem(trip.id, trip);
}
```

Similar checks are applied to:
- `saveTripDay()`
- `savePlace()`
- Other write operations

### UI Component: StorageIndicator

Location: `frontend/src/components/common/StorageIndicator.tsx`

A visual indicator component that:
- Displays current storage usage as a percentage
- Shows progress bar with color coding:
  - **Blue**: Normal usage (< 80%)
  - **Orange**: Near limit (80-100%)
  - **Red**: Over limit (> 100%)
- Provides warnings when approaching or exceeding limit
- Shows detailed breakdown of storage by type (optional)
- Auto-refreshes every 30 seconds

## API

### StorageSizeManagerService

#### `getStorageStats(): Promise<StorageStats>`

Returns comprehensive storage statistics:

```typescript
interface StorageStats {
  totalSize: number;           // Total bytes used
  maxSize: number;             // Maximum allowed (50MB)
  percentUsed: number;         // Percentage of limit used
  isNearLimit: boolean;        // True if >= 80% used
  isOverLimit: boolean;        // True if > 100% used
  breakdown: {                 // Size by store type
    trips: number;
    tripDays: number;
    places: number;
    storyItems: number;
    packingItems: number;
    syncQueue: number;
    pendingUploads: number;
    metadata: number;
    offlineQueue: number;
    quickPlan: number;
  };
}
```

#### `wouldExceedLimit(additionalBytes: number): Promise<boolean>`

Checks if adding the specified number of bytes would exceed the storage limit.

#### `evictCache(targetBytes: number): Promise<EvictionResult>`

Attempts to free up the specified number of bytes by evicting cached data.

```typescript
interface EvictionResult {
  success: boolean;            // True if target bytes freed
  bytesFreed: number;          // Actual bytes freed
  itemsRemoved: number;        // Number of items evicted
  errors: string[];            // Any errors encountered
}
```

#### `ensureSpaceAvailable(requiredBytes: number): Promise<boolean>`

Ensures sufficient space is available for a write operation. Automatically triggers eviction if needed.

#### `formatBytes(bytes: number): string`

Formats byte count as human-readable string (e.g., "42 MB").

## Usage Examples

### Check Storage Status

```typescript
import { storageSizeManager } from './services/storageSizeManager';

const stats = await storageSizeManager.getStorageStats();
console.log(`Storage: ${stats.percentUsed.toFixed(1)}% used`);

if (stats.isNearLimit) {
  console.warn('Storage nearly full!');
}
```

### Before Saving Data

```typescript
const dataSize = new Blob([JSON.stringify(myData)]).size;
const hasSpace = await storageSizeManager.ensureSpaceAvailable(dataSize);

if (hasSpace) {
  await offlineStorage.saveTrip(myData);
} else {
  console.error('Insufficient storage space');
}
```

### Manual Eviction

```typescript
// Free up 10MB of space
const result = await storageSizeManager.evictCache(10 * 1024 * 1024);

if (result.success) {
  console.log(`Freed ${storageSizeManager.formatBytes(result.bytesFreed)}`);
} else {
  console.error('Could not free enough space');
}
```

### Display Storage Indicator

```tsx
import { StorageIndicator } from './components/common/StorageIndicator';

function SettingsPage() {
  return (
    <div>
      <h2>Storage</h2>
      <StorageIndicator showDetails />
    </div>
  );
}
```

## Configuration

### Constants

Located in `frontend/src/services/storageSizeManager.ts`:

```typescript
// 50MB limit in bytes
const MAX_STORAGE_SIZE = 50 * 1024 * 1024;

// Warning threshold at 80% of max size
const WARNING_THRESHOLD = MAX_STORAGE_SIZE * 0.8;
```

These can be adjusted if requirements change.

## Error Handling

### Storage Limit Exceeded

When a write operation would exceed the limit:

1. `ensureSpaceAvailable()` is called automatically
2. Cache eviction is attempted
3. If eviction frees enough space, operation proceeds
4. If eviction fails, an error is thrown:
   ```
   Error: Storage limit exceeded. Unable to save [resource].
   ```

### Eviction Failures

Eviction may fail if:
- All data has pending sync operations
- No evictable data exists
- Storage is corrupted

In these cases, the user should be prompted to:
- Manually delete old trips
- Clear cache
- Sync pending changes to free up space

## Testing

### Unit Tests

Location: `frontend/src/services/__tests__/storageSizeManager.test.ts`

Tests cover:
- Storage statistics calculation
- Limit detection (near/over)
- Eviction strategy execution
- Space availability checks
- Byte formatting

### Component Tests

Location: `frontend/src/components/common/__tests__/StorageIndicator.test.tsx`

Tests cover:
- Rendering based on storage status
- Color coding (blue/orange/red)
- Warning messages
- Storage breakdown display

## Performance Considerations

### Size Calculation

- Uses `Blob` API for accurate byte size estimation
- Caches results where possible
- Iterates through stores efficiently

### Eviction Performance

- Processes items in batches
- Stops when target bytes freed
- Minimizes database operations

### UI Updates

- Storage indicator refreshes every 30 seconds
- Only renders when usage > 50% (unless `showDetails` is true)
- Lightweight progress bar animation

## Future Enhancements

1. **User-configurable limits** - Allow users to set their own storage limits
2. **Compression** - Compress cached data to maximize storage efficiency
3. **Smart eviction** - Use ML to predict which data is least likely to be accessed
4. **Background eviction** - Proactively evict data during idle time
5. **Storage analytics** - Track storage usage patterns over time

## Related Requirements

- **Requirement 11.3**: Queue all data modifications when offline
- **Requirement 11.4**: Automatically sync queued changes when online
- **Requirement 11.10**: Store offline data using IndexedDB with a maximum cache size of 50MB

## Related Files

- `frontend/src/services/storageSizeManager.ts` - Core service
- `frontend/src/services/offlineStorage.ts` - Integration point
- `frontend/src/components/common/StorageIndicator.tsx` - UI component
- `frontend/src/services/__tests__/storageSizeManager.test.ts` - Unit tests
- `frontend/src/components/common/__tests__/StorageIndicator.test.tsx` - Component tests
