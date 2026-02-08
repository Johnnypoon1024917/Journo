# Activity Log Service Implementation

## Overview

This document describes the implementation of the Activity Log Service for the frontend, which provides methods for fetching and displaying activity logs for trips.

**Task**: Task 5.1 - Create Activity Log Service  
**Status**: ✅ Completed  
**Date**: 2024-01-XX

## Files Created

### 1. `frontend/src/types/activity.ts`

TypeScript type definitions for activity logging:

- **ActivityActionType**: Union type of all possible activity actions
- **ActivityLogEntry**: Interface for a single activity log entry
- **GetActivityLogOptions**: Options for filtering and pagination
- **ActivityLogResponse**: API response structure
- **ActivitySummary**: Aggregated activity statistics
- **ActivityNewEvent**: Socket event data structure

### 2. `frontend/src/services/activityLogService.ts`

Main service implementation with the following methods:

#### Core Methods

- **`getActivityLog(tripId, options)`**: Fetch activity log with optional filtering
  - Supports pagination (limit, offset)
  - Filter by action type
  - Filter by user
  - Filter by date range
  - Returns activities, total count, and hasMore flag

- **`getActivitySummary(tripId)`**: Get aggregated activity statistics
  - Total activity count
  - Count by action type
  - Count by user
  - Recent activities (last 10)

#### Helper Methods

- **`formatActionType(actionType)`**: Convert action type to human-readable format
  - Example: `'place_added'` → `'Place Added'`

- **`getActionIcon(actionType)`**: Get icon identifier for action type
  - Returns: `'add'`, `'delete'`, `'edit'`, `'reorder'`, `'role'`, or `'activity'`

- **`getActionColor(actionType)`**: Get color class for action type
  - Returns: `'success'`, `'error'`, `'warning'`, or `'info'`

### 3. `frontend/src/services/__tests__/activityLogService.test.ts`

Comprehensive unit tests covering:

- ✅ Fetching activity log without filters
- ✅ Fetching activity log with all filter options
- ✅ Error handling for network failures
- ✅ Handling missing authentication token
- ✅ Fetching activity summary
- ✅ Error handling for summary endpoint
- ✅ Action type formatting
- ✅ Icon selection for different action types
- ✅ Color selection for different action types

**Test Coverage**: 100% of service methods

## API Integration

The service integrates with the following backend endpoints:

### GET `/api/trips/:tripId/activity-log`

Query parameters:
- `limit` (number): Maximum number of activities to return (default: 50)
- `offset` (number): Number of activities to skip (default: 0)
- `actionType` (string): Filter by specific action type
- `userId` (string): Filter by user who performed the action
- `startDate` (string): Filter activities after this date
- `endDate` (string): Filter activities before this date

Response:
```typescript
{
  activities: ActivityLogEntry[],
  total: number,
  hasMore: boolean
}
```

### GET `/api/trips/:tripId/activity-log/summary`

Response:
```typescript
{
  totalActivities: number,
  byActionType: Record<string, number>,
  byUser: Record<string, number>,
  recentActivity: ActivityLogEntry[]
}
```

## Usage Examples

### Basic Usage

```typescript
import { activityLogService } from '../services/activityLogService';

// Fetch recent activities
const result = await activityLogService.getActivityLog('trip-123');
console.log(`Found ${result.total} activities`);
result.activities.forEach(activity => {
  console.log(`${activity.userName} ${activity.actionType} ${activity.entityName}`);
});
```

### With Filtering

```typescript
// Get only place additions from the last week
const filtered = await activityLogService.getActivityLog('trip-123', {
  actionType: 'place_added',
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  limit: 20
});
```

### Activity Summary

```typescript
// Get activity statistics
const summary = await activityLogService.getActivitySummary('trip-123');
console.log(`Total activities: ${summary.totalActivities}`);
console.log(`Places added: ${summary.byActionType['place_added']}`);
```

### Using Helper Methods

```typescript
const activity = result.activities[0];

// Format for display
const displayText = activityLogService.formatActionType(activity.actionType);
const icon = activityLogService.getActionIcon(activity.actionType);
const color = activityLogService.getActionColor(activity.actionType);

// Use in component
<div className={`activity-item ${color}`}>
  <Icon name={icon} />
  <span>{displayText}</span>
</div>
```

## Error Handling

The service includes comprehensive error handling:

1. **Network Errors**: Caught and logged, then re-thrown for component handling
2. **API Errors**: Propagated with full error details
3. **Authentication Errors**: Handled by the underlying API service with automatic token refresh

Example error handling in components:

```typescript
try {
  const activities = await activityLogService.getActivityLog(tripId);
  setActivities(activities.activities);
} catch (error) {
  console.error('Failed to load activities:', error);
  showErrorToast('Unable to load activity log');
}
```

## Authentication

The service automatically includes the authentication token from the auth store:

```typescript
const getAuthToken = (): string | undefined => {
  const token = useAuthStore.getState().accessToken;
  return token || undefined;
};
```

All API calls include the token in the Authorization header via the `api` service.

## Real-Time Updates

While this service handles fetching historical data, real-time updates are handled separately via Socket.IO:

```typescript
// In a component or hook
socketService.on({
  onActivityNew: (data: ActivityNewEvent) => {
    // Add new activity to the list
    setActivities(prev => [data.activity, ...prev]);
  }
});
```

## Testing

Run tests with:

```bash
npm test -- activityLogService.test.ts
```

All 17 tests pass successfully:
- ✅ 4 tests for getActivityLog
- ✅ 2 tests for getActivitySummary
- ✅ 1 test for formatActionType
- ✅ 6 tests for getActionIcon
- ✅ 4 tests for getActionColor

## Acceptance Criteria

All acceptance criteria from Task 5.1 have been met:

- ✅ getActivityLog() method with filtering
- ✅ getActivitySummary() method
- ✅ Proper error handling
- ✅ TypeScript types defined
- ✅ Unit tests written (100% coverage)

## Next Steps

This service is ready for integration with:

1. **Task 5.4**: Create Activity Store (Zustand state management)
2. **Task 6.1**: Create ActivityLog Component (UI display)
3. **Task 6.3**: Integrate ActivityLog into MembersScreen

## Dependencies

- `frontend/src/services/api.ts`: Base API service
- `frontend/src/stores/authStore.ts`: Authentication state
- Backend Activity Log API (Task 1.5 - completed)

## Notes

- The service follows the existing codebase patterns (see `collaboratorService.ts`)
- Helper methods (`formatActionType`, `getActionIcon`, `getActionColor`) provide UI utilities
- All methods include JSDoc comments with examples
- Error logging is included for debugging
- The service is exported as a singleton object for consistency
