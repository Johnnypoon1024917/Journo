# Activity Logging Implementation Guide

## Quick Reference for Developers

This guide explains how to add activity logging to new routes in the application.

---

## 📚 Overview

Activity logging automatically tracks user actions on trip-related entities. When a user creates, updates, or deletes content, an entry is created in the activity log that includes:

- Who made the change (user ID and name)
- What was changed (entity type and name)
- When it happened (timestamp)
- What changed (before/after values)
- Context (IP address, user agent)

---

## 🚀 Quick Start

### 1. Import the Middleware

```typescript
import { createActivityLogMiddleware } from '../middleware/activityLogMiddleware.js';
```

### 2. Apply to Routes

Add the middleware between authentication and your controller:

```typescript
router.post('/api/resource', 
  authenticate,                                    // Auth first
  createActivityLogMiddleware.resourceAdded(),     // Then logging
  ResourceController.create                        // Then controller
);
```

---

## 📋 Available Middleware Helpers

### Place Operations
```typescript
createActivityLogMiddleware.placeAdded()
createActivityLogMiddleware.placeUpdated()
createActivityLogMiddleware.placeDeleted()
createActivityLogMiddleware.placeReordered()
```

### Day Operations
```typescript
createActivityLogMiddleware.dayAdded()
createActivityLogMiddleware.dayUpdated()
createActivityLogMiddleware.dayDeleted()
```

### Packing Item Operations
```typescript
createActivityLogMiddleware.packingItemAdded()
createActivityLogMiddleware.packingItemUpdated()
createActivityLogMiddleware.packingItemDeleted()
```

### Shopping Item Operations
```typescript
createActivityLogMiddleware.shoppingItemAdded()
createActivityLogMiddleware.shoppingItemUpdated()
createActivityLogMiddleware.shoppingItemDeleted()
```

### Trip Operations
```typescript
createActivityLogMiddleware.tripCreated()
createActivityLogMiddleware.tripUpdated()
createActivityLogMiddleware.tripDeleted()
```

### Collaborator Operations
```typescript
createActivityLogMiddleware.collaboratorAdded()
createActivityLogMiddleware.collaboratorRemoved()
createActivityLogMiddleware.collaboratorRoleChanged()
```

### Story Operations
```typescript
createActivityLogMiddleware.storyAdded()
createActivityLogMiddleware.storyDeleted()
```

---

## 💡 Examples

### Example 1: Simple CRUD Routes

```typescript
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { createActivityLogMiddleware } from '../middleware/activityLogMiddleware.js';
import { PlaceController } from '../controllers/placeController.js';

const router = express.Router();

router.use(authenticate);

// CREATE - Log when place is added
router.post('/', 
  createActivityLogMiddleware.placeAdded(), 
  PlaceController.createPlace
);

// READ - No logging needed for reads
router.get('/:id', PlaceController.getPlace);

// UPDATE - Log when place is updated
router.put('/:id', 
  createActivityLogMiddleware.placeUpdated(), 
  PlaceController.updatePlace
);

// DELETE - Log when place is deleted
router.delete('/:id', 
  createActivityLogMiddleware.placeDeleted(), 
  PlaceController.deletePlace
);

export default router;
```

### Example 2: Custom Operations

```typescript
// Move/reorder operation
router.put('/:id/move', 
  authenticate,
  createActivityLogMiddleware.placeReordered(), 
  PlaceController.movePlace
);

// Partial update (still use updated)
router.patch('/:id/status', 
  authenticate,
  createActivityLogMiddleware.placeUpdated(), 
  PlaceController.updateStatus
);
```

### Example 3: Batch Operations

```typescript
// For batch operations, you might want to log at the service level
// instead of using middleware, to create individual log entries
router.post('/batch-delete', 
  authenticate,
  PlaceController.batchDelete  // Controller handles logging internally
);
```

---

## 🔧 Adding New Activity Types

If you need to add a new activity type:

### 1. Add to Type Definition

Edit `backend/src/services/activityLogService.ts`:

```typescript
export type ActivityActionType =
  | 'place_added' | 'place_updated' | 'place_deleted'
  // ... existing types
  | 'your_new_action';  // Add your new type
```

### 2. Add to Database Migration

Edit the activity_log table CHECK constraint:

```sql
action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
    'place_added', 'place_updated',
    -- ... existing types
    'your_new_action'  -- Add your new type
))
```

### 3. Add Middleware Helper

Edit `backend/src/middleware/activityLogMiddleware.ts`:

```typescript
export const createActivityLogMiddleware = {
  // ... existing helpers
  
  // Your new helper
  yourNewAction: () => activityLogMiddleware('your_new_action', 'entity_type')
};
```

### 4. Add Entity Name Extraction

If using a new entity type, add to `extractEntityName()` in the middleware:

```typescript
function extractEntityName(data: any, entityType: string): string {
  switch (entityType) {
    // ... existing cases
    
    case 'your_entity':
      return data.name || data.title || 'Unnamed entity';
    
    default:
      return 'Unknown';
  }
}
```

---

## ⚠️ Important Notes

### DO:
- ✅ Apply middleware to CREATE, UPDATE, DELETE operations
- ✅ Place middleware AFTER authentication
- ✅ Place middleware BEFORE controller
- ✅ Use appropriate helper for the operation type
- ✅ Ensure controller returns proper response data

### DON'T:
- ❌ Apply to GET/READ operations (no need to log reads)
- ❌ Apply to public routes (requires authenticated user)
- ❌ Block the main request if logging fails (it's async)
- ❌ Log sensitive data in changes object

### Response Requirements

The middleware extracts data from the controller response. Ensure your controller returns:

```typescript
// Required fields
{
  id: string,           // Entity ID
  trip_id: string,      // Trip ID (or in params)
  name: string,         // Entity name (or title, item_name, etc.)
  // ... other fields
}
```

---

## 🧪 Testing Activity Logging

### Manual Testing

1. Perform an operation (e.g., create a place)
2. Check the activity log:
   ```bash
   GET /api/trips/:tripId/activity-log
   ```
3. Verify the log entry contains:
   - Correct action type
   - User information
   - Entity details
   - Timestamp

### Automated Testing

```typescript
import { activityLogService } from '../services/activityLogService';

// Mock the service
vi.mock('../services/activityLogService', () => ({
  activityLogService: {
    logActivity: vi.fn().mockResolvedValue(undefined)
  }
}));

// Test that logging is called
it('should log activity when creating place', async () => {
  await request(app)
    .post('/api/places')
    .send({ name: 'Tokyo Tower' });
  
  expect(activityLogService.logActivity).toHaveBeenCalledWith(
    expect.objectContaining({
      actionType: 'place_added',
      entityType: 'place'
    })
  );
});
```

---

## 🔍 Debugging

### Check if Logging is Working

1. **Enable debug logging** in the middleware:
   ```typescript
   console.log('Logging activity:', { tripId, userId, actionType });
   ```

2. **Check the database**:
   ```sql
   SELECT * FROM activity_log 
   WHERE trip_id = 'your-trip-id' 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

3. **Check socket events**:
   - Open browser console
   - Listen for `activity:new` events
   - Verify events are emitted

### Common Issues

**Issue**: Activity not logged
- ✅ Check user is authenticated
- ✅ Check response status is 2xx
- ✅ Check tripId is in params or response
- ✅ Check controller returns proper data

**Issue**: Wrong entity name
- ✅ Check `extractEntityName()` handles your entity type
- ✅ Check response data has name/title field

**Issue**: Missing changes
- ✅ Check request body has data
- ✅ Check response data differs from request
- ✅ Check `extractChanges()` handles your HTTP method

---

## 📊 Activity Log Data Structure

### Database Schema

```sql
CREATE TABLE activity_log (
    id UUID PRIMARY KEY,
    trip_id UUID NOT NULL,
    user_id UUID,
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    entity_name TEXT,
    changes JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Example Log Entry

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "tripId": "trip-123",
  "userId": "user-456",
  "userName": "John Doe",
  "userAvatar": "https://...",
  "actionType": "place_added",
  "entityType": "place",
  "entityId": "place-789",
  "entityName": "Tokyo Tower",
  "changes": {
    "name": { "to": "Tokyo Tower" },
    "description": { "to": "Famous landmark in Tokyo" },
    "cost": { "to": 1200 }
  },
  "metadata": {
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "method": "POST",
    "path": "/api/places"
  },
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

## 🔗 Related Documentation

- **Middleware Implementation**: `backend/src/middleware/activityLogMiddleware.ts`
- **Service Implementation**: `backend/src/services/activityLogService.ts`
- **Design Document**: `.kiro/specs/collaboration-enhancement/design.md`
- **Task Completion**: `backend/src/routes/TASK_4.3_COMPLETION_SUMMARY.md`

---

## 📞 Questions?

If you have questions about activity logging:
1. Check the existing route implementations (places.ts, days.ts, etc.)
2. Review the middleware tests
3. Check the design document
4. Ask the team!

---

**Last Updated**: 2024
**Maintained By**: Backend Team
