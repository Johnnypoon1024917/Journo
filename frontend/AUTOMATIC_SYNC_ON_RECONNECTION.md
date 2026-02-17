# Automatic Sync on Reconnection

## Overview

This document describes the implementation of automatic synchronization when network connectivity is restored, validating **Requirement 11.4**: "WHEN the App regains connectivity, THE App SHALL automatically sync queued changes within 5 seconds."

## Implementation

### Components

1. **NetworkReconnectionService** (`src/services/networkReconnectionService.ts`)
   - Coordinates automatic sync across all services
   - Detects network status changes
   - Triggers sync within configured delay (default: 1 second, max: 5 seconds)
   - Prevents duplicate sync triggers

2. **OfflineQueueService** (`src/services/offlineQueueService.ts`)
   - Manages offline queue for collaboration-related actions
   - Listens to online/offline events
   - Automatically syncs queue when coming back online
   - Processes items in order with retry logic

3. **SyncService** (`src/services/syncService.ts`)
   - Handles synchronization of offline changes (trips, places, etc.)
   - Processes sync queue in batches
   - Implements retry logic with exponential backoff

4. **NetworkErrorHandler** (`src/services/networkErrorHandler.ts`)
   - Monitors network connectivity
   - Provides network state to subscribers
   - Detects connection quality changes

### Network Status Detection

The system detects network status changes through multiple mechanisms:

1. **Browser Online/Offline Events**
   ```typescript
   window.addEventListener('online', handleOnline);
   window.addEventListener('offline', handleOffline);
   ```

2. **Network Information API** (when available)
   - Monitors connection quality
   - Detects slow connections
   - Provides effective connection type

3. **Periodic Connectivity Checks**
   - Lightweight health check every 30 seconds
   - Validates actual server connectivity

### Sync Trigger Timing

**Requirement**: Sync within 5 seconds of going online

**Implementation**: 
- Default delay: 1 second (to ensure connection stability)
- Maximum delay: 5 seconds (requirement compliance)
- Configurable via `NetworkReconnectionService` config

```typescript
const config = {
  syncDelay: 1000,      // 1 second delay
  maxSyncDelay: 5000,   // 5 seconds maximum
};
```

### Queue Processing Order

Changes are processed in the order they were queued:

1. **Offline Queue Service**
   - Processes collaboration actions (activity logs, notifications, member management)
   - FIFO (First In, First Out) order
   - Batch processing for efficiency

2. **Sync Service**
   - Processes trips, places, story items, packing items
   - Batch processing (5 items at a time)
   - Maintains order within each resource type

### Retry Logic

Failed sync attempts are retried with the following strategy:

- **Maximum retries**: 3 attempts
- **Backoff strategy**: Exponential backoff
  - Attempt 1: Immediate
  - Attempt 2: 2 seconds delay
  - Attempt 3: 4 seconds delay
- **After max retries**: Item marked as "failed" for manual intervention

### Conflict Resolution

The system uses a **last-write-wins** strategy:

- Server accepts the latest update based on timestamp
- No complex merge logic required
- Simple and predictable behavior

## Usage

### Automatic Initialization

The `NetworkReconnectionService` is automatically initialized when the module is loaded:

```typescript
import { networkReconnectionService } from './services/networkReconnectionService';

// Service is already initialized and listening for network changes
```

### Manual Sync Trigger

Users can manually trigger sync through the UI:

```typescript
import { networkReconnectionService } from './services/networkReconnectionService';

// Trigger manual sync
await networkReconnectionService.manualSync();
```

### Configuration

Customize sync timing if needed:

```typescript
networkReconnectionService.updateConfig({
  syncDelay: 2000,      // 2 second delay
  maxSyncDelay: 5000,   // Keep 5 second max
});
```

## Testing

### Manual Testing

1. **Go Offline**
   - Disable network connection
   - Make changes (create trip, add activity, etc.)
   - Verify changes are queued

2. **Come Back Online**
   - Re-enable network connection
   - Observe automatic sync trigger (check console logs)
   - Verify changes are synced within 5 seconds

3. **Check Queue Status**
   ```typescript
   const status = await offlineQueueService.getQueueStatus();
   console.log('Pending:', status.pendingCount);
   console.log('Failed:', status.failedCount);
   ```

### Browser DevTools Testing

1. Open Chrome DevTools
2. Go to Network tab
3. Select "Offline" from throttling dropdown
4. Make changes in the app
5. Select "Online" to restore connection
6. Watch Network tab for sync requests

### Automated Testing

Property-based tests validate:
- Sync triggers within 5 seconds
- Queue items processed in order
- Retry logic works correctly
- No duplicate sync triggers

## Monitoring

### Console Logs

The system provides detailed logging:

```
Network reconnected. Scheduling sync in 1000ms (max 5000ms)
Starting automatic sync after reconnection...
Syncing 3 pending and 0 failed items
Synced trip CREATE trip-123
Synced place UPDATE place-456
Synced activity_log CREATE log-789
Automatic sync completed successfully
```

### Queue Status

Check queue status at any time:

```typescript
const status = await offlineQueueService.getQueueStatus();
// {
//   isOnline: true,
//   isSyncing: false,
//   pendingCount: 0,
//   failedCount: 0
// }
```

### Failed Items

Retrieve failed items for manual intervention:

```typescript
const failedItems = await offlineQueueService.getFailedItems();
failedItems.forEach(item => {
  console.log(`Failed: ${item.action} on ${item.endpoint}`);
  console.log(`Retries: ${item.retryCount}`);
});
```

## Error Handling

### Network Errors

- Automatically retried with backoff
- User notified after max retries
- Items remain in queue for manual retry

### Server Errors (5xx)

- Treated as temporary failures
- Automatically retried
- Logged for monitoring

### Client Errors (4xx)

- Not retried (except 429 rate limit)
- User notified immediately
- Item removed from queue

### Conflict Errors (409)

- Last-write-wins strategy
- Server timestamp determines winner
- No user intervention required

## Performance Considerations

### Batch Processing

- Queue items processed in batches of 5
- Reduces server load
- Improves sync performance

### Connection Stability

- 1 second delay before sync
- Prevents premature sync attempts
- Ensures stable connection

### Duplicate Prevention

- Tracks last online time
- Prevents duplicate sync triggers
- Debounces rapid online/offline transitions

## Future Enhancements

1. **Smart Retry Strategy**
   - Adaptive backoff based on error type
   - Priority queue for critical changes

2. **Conflict Resolution UI**
   - Show conflicts to user
   - Allow manual resolution
   - Merge strategies for complex conflicts

3. **Sync Progress Indicator**
   - Real-time progress bar
   - Item-by-item status
   - Estimated time remaining

4. **Background Sync API**
   - Use Service Worker for background sync
   - Sync even when app is closed
   - Better offline experience

## References

- **Requirement 11.3**: Queue all data modifications when offline
- **Requirement 11.4**: Automatically sync queued changes within 5 seconds
- **Design Document**: Section on Offline Functionality Enhancement
- **Task 10.3**: Implement automatic sync on reconnection
