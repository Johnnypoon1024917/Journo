# Sync Conflict Resolution

This document describes the sync conflict resolution feature implemented for offline functionality.

## Overview

When users make changes offline and those changes conflict with server updates, the app detects the conflict and presents a resolution dialog allowing the user to choose which version to keep.

**Validates Requirement 11.6**: Handle sync conflicts by prompting the user to choose which version to keep.

## Architecture

### Components

1. **SyncConflictService** (`frontend/src/services/syncConflictService.ts`)
   - Detects conflicts between local and server data
   - Manages conflict records and resolution state
   - Applies user's resolution choice

2. **SyncConflictDialog** (`frontend/src/components/common/SyncConflictDialog.tsx`)
   - UI component that displays conflict details
   - Shows both local and server versions side-by-side
   - Provides buttons for user to choose which version to keep

3. **SyncConflictManager** (`frontend/src/components/common/SyncConflictManager.tsx`)
   - Monitors for conflicts and displays dialogs
   - Handles conflict resolution flow
   - Triggers re-sync after resolution

### Integration

The conflict detection is integrated into the sync process:

- **syncService.ts**: Updated to check for conflicts before applying server updates
- **App.tsx**: Includes SyncConflictManager component to handle conflicts globally

## How It Works

### 1. Conflict Detection

A conflict is detected when:
- Local data has been modified offline (`_offline_modified` or `_offline_created` flag)
- Server data has a different modification timestamp (>1 second difference)
- The actual data content differs in meaningful fields

```typescript
const hasConflict = syncConflictService.detectConflict(
  localData,
  serverData,
  'trip'
);
```

### 2. Conflict Creation

When a conflict is detected during sync:

```typescript
if (hasConflict) {
  syncConflictService.createConflict(
    'trip',
    resourceId,
    localData,
    serverData
  );
  throw new Error('Sync conflict detected - user resolution required');
}
```

### 3. User Resolution

The SyncConflictManager displays a dialog showing:
- Resource name and type
- Local version with timestamp
- Server version with timestamp
- Side-by-side comparison of key fields

User can choose:
- **Keep My Changes**: Local version is saved and pushed to server
- **Keep Server Version**: Server version overwrites local changes
- **Cancel**: Skip this conflict (can be resolved later)

### 4. Resolution Application

When user chooses a version:

```typescript
await syncConflictService.resolveConflict(conflictId, 'local' | 'server');
```

The service:
- Updates offline storage with chosen version
- Clears offline modification flags
- If local version chosen, adds to sync queue to push changes
- Removes conflict from pending list
- Triggers re-sync to process resolved items

## Supported Resource Types

Conflict resolution supports:
- Trips
- Places
- Packing Items
- Story Items
- Trip Days

## Field Comparison

Different resource types compare different fields:

**Trips**: title, destination, start_date, end_date, theme, is_public
**Places**: name, address, time_start, time_end, notes, display_order
**Packing Items**: item, category, is_checked
**Story Items**: type, content_url, caption
**Trip Days**: day_number, date

## Testing

Comprehensive unit tests cover:
- Conflict detection logic
- Conflict creation and management
- Resolution with local version
- Resolution with server version
- Subscription and notification system
- Edge cases (no conflicts, identical data, close timestamps)

Run tests:
```bash
npm test -- syncConflictService.test.ts
```

## Usage Example

```typescript
// In sync service
const offlineTrip = await offlineStorage.getTrip(resourceId);
const serverTrip = await tripService.getTripById(resourceId, token);

const hasConflict = syncConflictService.detectConflict(
  offlineTrip,
  serverTrip.data,
  'trip'
);

if (hasConflict) {
  syncConflictService.createConflict(
    'trip',
    resourceId,
    offlineTrip,
    serverTrip.data
  );
  throw new Error('Sync conflict detected - user resolution required');
}
```

## Future Enhancements

Potential improvements:
1. **Automatic merge**: For non-conflicting fields, automatically merge changes
2. **Conflict history**: Keep a log of resolved conflicts
3. **Batch resolution**: Allow resolving multiple conflicts at once
4. **Field-level resolution**: Let users choose which fields to keep from each version
5. **Conflict prevention**: Implement optimistic locking or version numbers

## Related Files

- `frontend/src/services/syncConflictService.ts` - Core conflict detection and resolution
- `frontend/src/components/common/SyncConflictDialog.tsx` - UI dialog component
- `frontend/src/components/common/SyncConflictManager.tsx` - Global conflict manager
- `frontend/src/services/syncService.ts` - Integration with sync process
- `frontend/src/services/__tests__/syncConflictService.test.ts` - Unit tests
- `frontend/src/App.tsx` - App-level integration
