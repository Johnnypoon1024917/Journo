# Activity Log Service

## Overview

The Activity Log Service provides comprehensive activity tracking for trip collaboration features. It logs all changes to trip content, provides filtering and pagination capabilities, and emits real-time events via Socket.IO.

## Features

### 1. Activity Logging
- Logs all trip-related activities with detailed metadata
- Supports 19 different action types (place_added, day_updated, etc.)
- Captures user information, entity details, changes, and metadata
- Automatically emits real-time events to connected clients

### 2. Activity Retrieval
- Paginated activity log retrieval
- Filtering by action type, user, and date range
- Ordered by creation time (most recent first)
- Includes user information (name, avatar) with each activity

### 3. Activity Summary
- Total activity count
- Activity breakdown by action type
- Activity breakdown by user
- Recent activity list (last 10 entries)

## API

### `logActivity(data: LogActivityData): Promise<ActivityLogEntry>`

Logs a new activity to the database and emits a real-time event.

**Parameters:**
```typescript
{
  tripId: string;
  userId: string;
  actionType: ActivityActionType;
  entityType: string;
  entityId: string;
  entityName: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
}
```

**Returns:** `ActivityLogEntry` with complete activity details including user information.

**Example:**
```typescript
const activity = await activityLogService.logActivity({
  tripId: 'trip-123',
  userId: 'user-456',
  actionType: 'place_added',
  entityType: 'place',
  entityId: 'place-789',
  entityName: 'Tokyo Tower',
  changes: { name: 'Tokyo Tower', lat: 35.6586, lng: 139.7454 },
  metadata: { ip: '127.0.0.1' }
});
```

### `getActivityLog(tripId: string, options?: GetActivityLogOptions): Promise<ActivityLogResponse>`

Retrieves activity log for a trip with optional filtering and pagination.

**Options:**
```typescript
{
  limit?: number;        // Default: 50
  offset?: number;       // Default: 0
  actionType?: string;   // Filter by action type
  userId?: string;       // Filter by user
  startDate?: string;    // Filter by start date
  endDate?: string;      // Filter by end date
}
```

**Returns:**
```typescript
{
  activities: ActivityLogEntry[];
  total: number;
  hasMore: boolean;
}
```

**Example:**
```typescript
const log = await activityLogService.getActivityLog('trip-123', {
  actionType: 'place_added',
  limit: 20,
  offset: 0
});
```

### `getActivitySummary(tripId: string): Promise<ActivitySummary>`

Retrieves activity summary statistics for a trip.

**Returns:**
```typescript
{
  totalActivities: number;
  byActionType: Record<string, number>;
  byUser: Record<string, number>;
  recentActivity: ActivityLogEntry[];
}
```

**Example:**
```typescript
const summary = await activityLogService.getActivitySummary('trip-123');
console.log(`Total activities: ${summary.totalActivities}`);
console.log(`Place additions: ${summary.byActionType.place_added}`);
```

## Action Types

The service supports the following action types:

### Trip Actions
- `trip_created` - Trip was created
- `trip_updated` - Trip details were updated
- `trip_deleted` - Trip was deleted

### Day Actions
- `day_added` - New day added to trip
- `day_updated` - Day details updated
- `day_deleted` - Day removed from trip

### Place Actions
- `place_added` - New place added to day
- `place_updated` - Place details updated
- `place_deleted` - Place removed from day
- `place_reordered` - Place order changed

### Packing Actions
- `packing_item_added` - Item added to packing list
- `packing_item_updated` - Packing item updated
- `packing_item_deleted` - Packing item removed

### Shopping Actions
- `shopping_item_added` - Item added to shopping list
- `shopping_item_updated` - Shopping item updated
- `shopping_item_deleted` - Shopping item removed

### Collaborator Actions
- `collaborator_added` - New collaborator invited
- `collaborator_removed` - Collaborator removed
- `collaborator_role_changed` - Collaborator role changed

### Story Actions
- `story_added` - Story item added
- `story_deleted` - Story item deleted

## Real-Time Events

The service emits Socket.IO events to the trip room when activities are logged:

**Event:** `activity:new`

**Payload:**
```typescript
{
  tripId: string;
  activity: ActivityLogEntry;
  timestamp: string;
}
```

**Client Usage:**
```typescript
socket.on('activity:new', (data) => {
  console.log(`New activity in trip ${data.tripId}:`, data.activity);
  // Update UI with new activity
});
```

## Database Schema

Activities are stored in the `activity_log` table:

```sql
CREATE TABLE activity_log (
    id UUID PRIMARY KEY,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    entity_name TEXT,
    changes JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `idx_activity_log_trip_id` - Fast lookup by trip
- `idx_activity_log_user_id` - Fast lookup by user
- `idx_activity_log_created_at` - Fast ordering by time
- `idx_activity_log_action_type` - Fast filtering by action type

## Error Handling

The service handles errors gracefully:

1. **Database Errors:** Throws error with details for proper error handling
2. **Socket.IO Errors:** Logs error but doesn't throw (activity is still saved)
3. **Missing User:** Returns "Unknown User" instead of failing

## Testing

The service includes comprehensive integration tests covering:

- Activity logging with all fields
- Activity logging with minimal fields
- Activity retrieval with pagination
- Activity filtering by action type, user, and date
- Activity summary generation
- Multiple activity types
- Empty result handling

**Run Tests:**
```bash
npm test -- activityLogService.test.ts
```

**Manual Test:**
```bash
npx tsx test_activity_log_service.ts
```

## Performance Considerations

1. **Pagination:** Use `limit` and `offset` for large activity logs
2. **Indexes:** All common query patterns are indexed
3. **JSONB:** Changes and metadata stored as JSONB for flexible querying
4. **Async Emission:** Socket events are emitted asynchronously and don't block

## Usage in Controllers

Example integration in a controller:

```typescript
import { activityLogService } from '../services/activityLogService';

export const addPlace = async (req: Request, res: Response) => {
  const { tripId } = req.params;
  const { name, lat, lng } = req.body;
  const userId = req.user.userId;

  // Create place
  const place = await createPlace({ tripId, name, lat, lng });

  // Log activity
  await activityLogService.logActivity({
    tripId,
    userId,
    actionType: 'place_added',
    entityType: 'place',
    entityId: place.id,
    entityName: name,
    changes: { name, lat, lng },
    metadata: { ip: req.ip }
  });

  res.json(place);
};
```

## Future Enhancements

Potential improvements for future versions:

1. Activity log export (CSV, JSON)
2. Activity search by entity name
3. Activity grouping by time periods
4. Activity diff visualization
5. Undo/redo functionality based on activity log
6. Activity-based notifications
7. Activity analytics and insights

## Dependencies

- `pg` - PostgreSQL client
- `uuid` - UUID generation
- `socket.io` - Real-time event emission

## Related Services

- `socketService` - Real-time event broadcasting
- `notificationService` - User notifications
- `collaboratorService` - Collaboration management
