# Activity Log Middleware

## Overview

The Activity Log Middleware automatically logs all changes to trip-related content without blocking the main request flow. It intercepts successful responses (2xx status codes) and asynchronously logs activity details to the database and emits real-time events via Socket.IO.

## Features

- ✅ **Automatic Logging**: Logs activities without manual intervention
- ✅ **Non-Blocking**: Asynchronous logging doesn't delay responses
- ✅ **Error Resilient**: Logging failures don't break the main flow
- ✅ **Flexible**: Supports all CRUD operations (POST, PUT, PATCH, DELETE)
- ✅ **Smart Extraction**: Automatically extracts entity names and changes
- ✅ **Metadata Capture**: Records IP, user agent, method, and path

## Usage

### Basic Usage

```typescript
import { activityLogMiddleware } from '../middleware/activityLogMiddleware';

// Apply to a route
router.post('/places', 
  authenticate, 
  activityLogMiddleware('place_added', 'place'),
  PlaceController.createPlace
);
```

### Using Helper Functions

The middleware provides convenient helper functions for common operations:

```typescript
import { createActivityLogMiddleware } from '../middleware/activityLogMiddleware';

// Place operations
router.post('/places', authenticate, createActivityLogMiddleware.placeAdded(), PlaceController.createPlace);
router.put('/places/:id', authenticate, createActivityLogMiddleware.placeUpdated(), PlaceController.updatePlace);
router.delete('/places/:id', authenticate, createActivityLogMiddleware.placeDeleted(), PlaceController.deletePlace);

// Day operations
router.post('/days', authenticate, createActivityLogMiddleware.dayAdded(), DayController.createDay);
router.put('/days/:id', authenticate, createActivityLogMiddleware.dayUpdated(), DayController.updateDay);
router.delete('/days/:id', authenticate, createActivityLogMiddleware.dayDeleted(), DayController.deleteDay);

// Packing item operations
router.post('/packing', authenticate, createActivityLogMiddleware.packingItemAdded(), PackingController.createItem);
router.put('/packing/:id', authenticate, createActivityLogMiddleware.packingItemUpdated(), PackingController.updateItem);
router.delete('/packing/:id', authenticate, createActivityLogMiddleware.packingItemDeleted(), PackingController.deleteItem);

// Shopping item operations
router.post('/shopping', authenticate, createActivityLogMiddleware.shoppingItemAdded(), ShoppingController.createItem);
router.put('/shopping/:id', authenticate, createActivityLogMiddleware.shoppingItemUpdated(), ShoppingController.updateItem);
router.delete('/shopping/:id', authenticate, createActivityLogMiddleware.shoppingItemDeleted(), ShoppingController.deleteItem);

// Trip operations
router.post('/trips', authenticate, createActivityLogMiddleware.tripCreated(), TripController.createTrip);
router.put('/trips/:id', authenticate, createActivityLogMiddleware.tripUpdated(), TripController.updateTrip);
router.delete('/trips/:id', authenticate, createActivityLogMiddleware.tripDeleted(), TripController.deleteTrip);

// Collaborator operations
router.post('/trips/:tripId/collaborators', authenticate, createActivityLogMiddleware.collaboratorAdded(), CollaboratorController.addCollaborator);
router.delete('/trips/:tripId/collaborators/:id', authenticate, createActivityLogMiddleware.collaboratorRemoved(), CollaboratorController.removeCollaborator);
router.patch('/trips/:tripId/collaborators/:id', authenticate, createActivityLogMiddleware.collaboratorRoleChanged(), CollaboratorController.updateRole);

// Story operations
router.post('/stories', authenticate, createActivityLogMiddleware.storyAdded(), StoryController.createStory);
router.delete('/stories/:id', authenticate, createActivityLogMiddleware.storyDeleted(), StoryController.deleteStory);
```

## How It Works

### 1. Request Flow

```
Client Request → Auth Middleware → Activity Log Middleware → Controller → Response
                                          ↓
                                    Intercepts res.json()
                                          ↓
                                    Logs Activity (async)
                                          ↓
                                    Returns Response
```

### 2. Data Extraction

The middleware automatically extracts:

- **User ID**: From `req.user.userId`
- **Trip ID**: From `req.params.tripId` or `data.trip_id`
- **Entity ID**: From `data.id` or `req.params.id`
- **Entity Name**: Based on entity type (see below)
- **Changes**: Compares request body with response data
- **Metadata**: IP address, user agent, HTTP method, path

### 3. Entity Name Extraction

The middleware intelligently extracts human-readable names:

| Entity Type | Name Source | Fallback |
|------------|-------------|----------|
| `place` | `data.name` | "Unnamed place" |
| `day` | `data.title` or `Day ${data.day_number}` | "Unnamed day" |
| `packing_item` | `data.item_name` | "Unnamed item" |
| `shopping_item` | `data.name` | "Unnamed item" |
| `trip` | `data.title` | "Unnamed trip" |
| `collaborator` | `data.user.name` or `data.email` | "Unknown user" |
| `story` | `Story at ${data.place_name}` | "Story item" |

### 4. Changes Extraction

The middleware captures different information based on HTTP method:

- **POST (Create)**: Captures created fields (name, title, description, etc.)
- **PUT/PATCH (Update)**: Compares request body with response to show what changed
- **DELETE**: Captures the deleted entity data

Example changes object:

```typescript
// POST - Create
{
  name: { to: "Tokyo Tower" },
  description: { to: "Famous landmark" }
}

// PUT/PATCH - Update
{
  name: { from: "Tokyo Tower", to: "Updated Tower" },
  description: { from: "Old description", to: "New description" }
}

// DELETE
{
  deleted: { id: "place-123", name: "Tokyo Tower", ... }
}
```

## Requirements

### Request Requirements

For the middleware to log activities, the request must have:

1. **Authenticated User**: `req.user.userId` must be present
2. **Trip ID**: Either in `req.params.tripId` or response `data.trip_id`
3. **Successful Response**: Status code 200-299

If any of these are missing, the middleware will skip logging (without throwing errors).

### Response Requirements

The controller should return data that includes:

- `id`: Entity identifier
- Entity-specific fields (name, title, etc.)
- `trip_id`: If not in URL params

Example response:

```typescript
{
  id: "place-123",
  name: "Tokyo Tower",
  description: "Famous landmark",
  trip_id: "trip-456",
  // ... other fields
}
```

## Error Handling

The middleware is designed to be **fail-safe**:

- ✅ Logging errors are caught and logged to console
- ✅ Main request flow continues even if logging fails
- ✅ Response is always sent to the client
- ✅ No exceptions are thrown to the client

```typescript
activityLogService.logActivity({...}).catch(err => {
  console.error('Failed to log activity:', err);
  // Error is logged but not thrown
});
```

## Activity Action Types

The middleware supports the following action types:

### Trip Operations
- `trip_created`
- `trip_updated`
- `trip_deleted`

### Day Operations
- `day_added`
- `day_updated`
- `day_deleted`

### Place Operations
- `place_added`
- `place_updated`
- `place_deleted`
- `place_reordered`

### Packing Item Operations
- `packing_item_added`
- `packing_item_updated`
- `packing_item_deleted`

### Shopping Item Operations
- `shopping_item_added`
- `shopping_item_updated`
- `shopping_item_deleted`

### Collaborator Operations
- `collaborator_added`
- `collaborator_removed`
- `collaborator_role_changed`

### Story Operations
- `story_added`
- `story_deleted`

## Testing

The middleware has comprehensive unit tests with >80% coverage:

```bash
npm test -- activityLogMiddleware.test.ts
```

Test coverage includes:
- ✅ Basic functionality (middleware chain, response interception)
- ✅ Activity logging (successful operations, status codes)
- ✅ Entity name extraction (all entity types)
- ✅ Changes extraction (POST, PUT, PATCH, DELETE)
- ✅ Error handling (logging failures, missing data)
- ✅ Helper functions (all operation types)
- ✅ Edge cases (null data, missing fields)

## Real-Time Events

When an activity is logged, the middleware automatically emits a Socket.IO event:

```typescript
socket.emit('activity:new', {
  tripId: 'trip-456',
  activity: {
    id: 'activity-123',
    tripId: 'trip-456',
    userId: 'user-123',
    userName: 'John Doe',
    actionType: 'place_added',
    entityType: 'place',
    entityId: 'place-789',
    entityName: 'Tokyo Tower',
    changes: {...},
    metadata: {...},
    createdAt: '2024-01-15T10:30:00Z'
  },
  timestamp: '2024-01-15T10:30:00Z'
});
```

Frontend clients can subscribe to these events to show real-time activity updates.

## Performance Considerations

- **Asynchronous**: Logging happens after the response is sent
- **Non-Blocking**: Client receives response immediately
- **Efficient**: Only logs on successful operations (2xx status)
- **Minimal Overhead**: Simple data extraction and JSON serialization

## Best Practices

1. **Always use with authentication**: Place after `authenticate` middleware
2. **Use helper functions**: They provide type safety and consistency
3. **Test your routes**: Ensure response data includes required fields
4. **Monitor logs**: Check console for logging errors
5. **Review activity log**: Verify activities are being logged correctly

## Troubleshooting

### Activity not being logged?

Check:
- ✅ Is the user authenticated? (`req.user.userId` exists)
- ✅ Is the trip ID present? (in params or response)
- ✅ Is the response successful? (status 200-299)
- ✅ Does the response include entity data?

### Wrong entity name?

Check:
- ✅ Does the response include the expected name field?
- ✅ Is the entity type correct?
- ✅ Review the entity name extraction logic

### Changes not captured?

Check:
- ✅ Is the request body populated?
- ✅ Does the response include the updated fields?
- ✅ Are field names consistent between request and response?

## Future Enhancements

Potential improvements for future versions:

- [ ] Support for batch operations
- [ ] Configurable field capture (whitelist/blacklist)
- [ ] Activity log retention policies
- [ ] Performance metrics and monitoring
- [ ] Custom entity name extractors
- [ ] Activity log compression for large changes

## Related Files

- **Service**: `backend/src/services/activityLogService.ts`
- **Tests**: `backend/src/middleware/__tests__/activityLogMiddleware.test.ts`
- **Database**: `backend/src/migrations/031_collaboration_enhancements.sql`
- **Design**: `.kiro/specs/collaboration-enhancement/design.md`

## Support

For questions or issues, refer to:
- Design document: `.kiro/specs/collaboration-enhancement/design.md`
- Activity Log Service README: `backend/src/services/ACTIVITY_LOG_SERVICE_README.md`
- Task list: `.kiro/specs/collaboration-enhancement/tasks.md`
