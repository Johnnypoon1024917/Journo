# Socket Events Integration Guide

## Overview
This guide explains how to integrate the real-time socket events for activity logs, notifications, and collaborator management in your frontend application.

## Available Socket Events

### 1. Activity Log Events

#### `activity:new`
Emitted when any activity is logged for a trip (place added, item updated, etc.)

**Event Data:**
```typescript
{
  tripId: string,
  activity: {
    id: string,
    tripId: string,
    userId: string,
    userName: string,
    userAvatar?: string,
    actionType: ActivityActionType,
    entityType: string,
    entityId: string,
    entityName: string,
    changes: Record<string, any>,
    metadata: Record<string, any>,
    createdAt: string
  },
  timestamp: string
}
```

**Frontend Example:**
```typescript
socket.on('activity:new', (data) => {
  console.log(`New activity: ${data.activity.userName} ${data.activity.actionType}`);
  
  // Update activity log UI
  activityStore.addActivity(data.activity);
  
  // Show toast notification
  toast.info(`${data.activity.userName} ${formatActionType(data.activity.actionType)}`);
});
```

### 2. Notification Events

#### `notification:new`
Emitted when a notification is created for the current user

**Event Data:**
```typescript
{
  notification: {
    id: string,
    userId: string,
    type: string,
    category: NotificationCategory,
    priority: NotificationPriority,
    title: string,
    message: string,
    data: any,
    actionUrl?: string,
    isRead: boolean,
    createdAt: Date
  },
  timestamp: string
}
```

**Frontend Example:**
```typescript
socket.on('notification:new', (data) => {
  console.log(`New notification: ${data.notification.title}`);
  
  // Update notification center
  notificationStore.addNotification(data.notification);
  
  // Show toast notification
  toast.show({
    type: data.notification.priority === 'high' ? 'warning' : 'info',
    title: data.notification.title,
    message: data.notification.message,
    action: data.notification.actionUrl ? {
      label: 'View',
      onClick: () => navigate(data.notification.actionUrl)
    } : undefined
  });
  
  // Update unread count
  notificationStore.incrementUnreadCount();
});
```

### 3. Collaborator Events

#### `collaborator:joined`
Emitted when a new collaborator joins a trip

**Event Data:**
```typescript
{
  tripId: string,
  collaborator: {
    id: string,
    trip_id: string,
    user_id: string,
    role: 'editor' | 'viewer',
    user: {
      id: string,
      name: string,
      email: string
    }
  },
  timestamp: string
}
```

**Frontend Example:**
```typescript
socket.on('collaborator:joined', (data) => {
  console.log(`${data.collaborator.user.name} joined the trip`);
  
  // Update members list
  collaboratorStore.addCollaborator(data.collaborator);
  
  // Show toast notification
  toast.success(`${data.collaborator.user.name} joined as ${data.collaborator.role}`);
  
  // Update member count
  updateMemberCount();
});
```

#### `collaborator:left`
Emitted when a collaborator leaves or is removed from a trip

**Event Data:**
```typescript
{
  tripId: string,
  userId: string,
  userName?: string,
  timestamp: string
}
```

**Frontend Example:**
```typescript
socket.on('collaborator:left', (data) => {
  const name = data.userName || 'A collaborator';
  console.log(`${name} left the trip`);
  
  // Update members list
  collaboratorStore.removeCollaborator(data.userId);
  
  // Show toast notification
  toast.info(`${name} left the trip`);
  
  // Update member count
  updateMemberCount();
});
```

#### `collaborator:role_changed`
Emitted when a collaborator's role is changed

**Event Data:**
```typescript
{
  tripId: string,
  userId: string,
  newRole: 'editor' | 'viewer',
  userName?: string,
  timestamp: string
}
```

**Frontend Example:**
```typescript
socket.on('collaborator:role_changed', (data) => {
  const name = data.userName || 'A collaborator';
  console.log(`${name} is now a ${data.newRole}`);
  
  // Update members list
  collaboratorStore.updateCollaboratorRole(data.userId, data.newRole);
  
  // Show toast notification
  toast.info(`${name} is now ${data.newRole === 'editor' ? 'an editor' : 'a viewer'}`);
});
```

## Complete Integration Example

### React Hook for Socket Events

```typescript
// hooks/useSocketEvents.ts
import { useEffect } from 'react';
import { socketService } from '../services/socketService';
import { useActivityStore } from '../stores/activityStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useCollaboratorStore } from '../stores/collaboratorStore';
import { useToast } from '../hooks/useToast';

export function useSocketEvents(tripId: string) {
  const activityStore = useActivityStore();
  const notificationStore = useNotificationStore();
  const collaboratorStore = useCollaboratorStore();
  const toast = useToast();

  useEffect(() => {
    if (!tripId) return;

    // Join trip room
    socketService.emit('trip:join', { tripId });

    // Activity events
    const handleActivityNew = (data: any) => {
      activityStore.addActivity(data.activity);
      
      // Don't show toast for own actions
      if (data.activity.userId !== currentUserId) {
        toast.info(
          `${data.activity.userName} ${formatActionType(data.activity.actionType)}`
        );
      }
    };

    // Notification events
    const handleNotificationNew = (data: any) => {
      notificationStore.addNotification(data.notification);
      
      toast.show({
        type: data.notification.priority === 'high' ? 'warning' : 'info',
        title: data.notification.title,
        message: data.notification.message,
        duration: 5000,
        action: data.notification.actionUrl ? {
          label: 'View',
          onClick: () => navigate(data.notification.actionUrl)
        } : undefined
      });
    };

    // Collaborator events
    const handleCollaboratorJoined = (data: any) => {
      collaboratorStore.addCollaborator(data.collaborator);
      toast.success(`${data.collaborator.user.name} joined the trip`);
    };

    const handleCollaboratorLeft = (data: any) => {
      collaboratorStore.removeCollaborator(data.userId);
      const name = data.userName || 'A collaborator';
      toast.info(`${name} left the trip`);
    };

    const handleCollaboratorRoleChanged = (data: any) => {
      collaboratorStore.updateCollaboratorRole(data.userId, data.newRole);
      const name = data.userName || 'A collaborator';
      const article = data.newRole === 'editor' ? 'an' : 'a';
      toast.info(`${name} is now ${article} ${data.newRole}`);
    };

    // Register event listeners
    socketService.on('activity:new', handleActivityNew);
    socketService.on('notification:new', handleNotificationNew);
    socketService.on('collaborator:joined', handleCollaboratorJoined);
    socketService.on('collaborator:left', handleCollaboratorLeft);
    socketService.on('collaborator:role_changed', handleCollaboratorRoleChanged);

    // Cleanup
    return () => {
      socketService.off('activity:new', handleActivityNew);
      socketService.off('notification:new', handleNotificationNew);
      socketService.off('collaborator:joined', handleCollaboratorJoined);
      socketService.off('collaborator:left', handleCollaboratorLeft);
      socketService.off('collaborator:role_changed', handleCollaboratorRoleChanged);
      
      // Leave trip room
      socketService.emit('trip:leave', { tripId });
    };
  }, [tripId]);
}
```

### Usage in Component

```typescript
// pages/TripDetailPage.tsx
import { useSocketEvents } from '../hooks/useSocketEvents';

export function TripDetailPage() {
  const { tripId } = useParams();
  
  // This hook will automatically handle all socket events
  useSocketEvents(tripId);
  
  return (
    <div>
      {/* Your trip detail UI */}
    </div>
  );
}
```

## Best Practices

### 1. Filter Own Actions
Don't show notifications for actions performed by the current user:

```typescript
socket.on('activity:new', (data) => {
  if (data.activity.userId !== currentUserId) {
    toast.info(`${data.activity.userName} made a change`);
  }
  // Always update the UI though
  activityStore.addActivity(data.activity);
});
```

### 2. Batch Notifications
If multiple events come in quickly, consider batching them:

```typescript
let notificationQueue = [];
let notificationTimer = null;

socket.on('activity:new', (data) => {
  notificationQueue.push(data.activity);
  
  clearTimeout(notificationTimer);
  notificationTimer = setTimeout(() => {
    if (notificationQueue.length === 1) {
      toast.info(`${notificationQueue[0].userName} made a change`);
    } else {
      toast.info(`${notificationQueue.length} new updates`);
    }
    notificationQueue = [];
  }, 1000);
});
```

### 3. Handle Reconnection
Refresh data when reconnecting:

```typescript
socket.on('connect', () => {
  // Refresh activity log
  activityStore.fetchActivities(tripId);
  
  // Refresh collaborators
  collaboratorStore.fetchCollaborators(tripId);
  
  // Refresh notifications
  notificationStore.fetchNotifications();
});
```

### 4. Optimistic Updates
Update UI immediately, then sync with server:

```typescript
async function addPlace(placeData) {
  // Optimistic update
  const tempId = `temp-${Date.now()}`;
  placeStore.addPlace({ ...placeData, id: tempId });
  
  try {
    // Server request
    const place = await api.addPlace(placeData);
    
    // Replace temp with real data
    placeStore.replacePlaceId(tempId, place.id);
  } catch (error) {
    // Rollback on error
    placeStore.removePlace(tempId);
    toast.error('Failed to add place');
  }
}
```

## Troubleshooting

### Events Not Received
1. Check if socket is connected: `socket.connected`
2. Verify you've joined the trip room: `socket.emit('trip:join', { tripId })`
3. Check browser console for errors
4. Verify authentication token is valid

### Duplicate Events
1. Make sure you're not registering listeners multiple times
2. Always clean up listeners in useEffect return function
3. Use unique listener references

### Performance Issues
1. Debounce UI updates if receiving many events
2. Use virtual scrolling for long activity lists
3. Limit the number of toasts shown simultaneously
4. Consider pagination for activity log

## Testing

### Mock Socket Events in Tests

```typescript
// __tests__/useSocketEvents.test.ts
import { renderHook } from '@testing-library/react-hooks';
import { useSocketEvents } from '../hooks/useSocketEvents';

describe('useSocketEvents', () => {
  it('should handle activity:new event', () => {
    const { result } = renderHook(() => useSocketEvents('trip-123'));
    
    // Simulate socket event
    act(() => {
      socketService.emit('activity:new', {
        tripId: 'trip-123',
        activity: {
          id: 'activity-1',
          userName: 'John',
          actionType: 'place_added',
          entityName: 'Tokyo Tower'
        }
      });
    });
    
    // Verify store was updated
    expect(activityStore.activities).toHaveLength(1);
  });
});
```

## Additional Resources

- [Socket.IO Client Documentation](https://socket.io/docs/v4/client-api/)
- [Design Document](.kiro/specs/collaboration-enhancement/design.md)
- [Task 4.2 Completion Summary](./TASK_4.2_COMPLETION_SUMMARY.md)
