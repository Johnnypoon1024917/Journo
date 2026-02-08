# Socket Service Usage Examples

## Overview
This document provides practical examples of how to use the enhanced Socket Service with the new collaboration enhancement features.

## Basic Setup

### 1. Connect to Socket Server

```typescript
import { socketService } from './services/socketService';

// Connect with authentication token
const token = localStorage.getItem('authToken');
socketService.connect(token);
```

### 2. Join a Trip Room

```typescript
// Join a trip room to receive real-time updates
const tripId = 'trip-123';
socketService.joinTrip(tripId);
```

### 3. Register Event Handlers

```typescript
socketService.on({
  onConnect: () => {
    console.log('Connected to socket server');
  },
  onDisconnect: () => {
    console.log('Disconnected from socket server');
  },
  onError: (error) => {
    console.error('Socket error:', error);
  },
});
```

## Activity Log Events

### Listen for New Activities

```typescript
import { socketService } from './services/socketService';
import { useActivityStore } from './stores/activityStore';

function setupActivityListener(tripId: string) {
  const activityStore = useActivityStore();

  socketService.on({
    onActivityNew: (data) => {
      console.log('New activity:', data.activity);
      
      // Add to activity store
      activityStore.addActivity(data.activity);
      
      // Show toast notification (don't show for own actions)
      if (data.activity.userId !== currentUserId) {
        toast.info(
          `${data.activity.userName} ${formatActionType(data.activity.actionType)}`
        );
      }
    },
  });
}
```

### Format Activity Action Types

```typescript
function formatActionType(actionType: string): string {
  const actionMap: Record<string, string> = {
    place_added: 'added a place',
    place_updated: 'updated a place',
    place_deleted: 'deleted a place',
    day_added: 'added a day',
    day_updated: 'updated a day',
    day_deleted: 'deleted a day',
    packing_item_added: 'added a packing item',
    packing_item_updated: 'updated a packing item',
    packing_item_deleted: 'deleted a packing item',
    collaborator_added: 'added a collaborator',
    collaborator_removed: 'removed a collaborator',
    collaborator_role_changed: 'changed a collaborator role',
  };
  
  return actionMap[actionType] || 'made a change';
}
```

## Notification Events

### Listen for New Notifications

```typescript
import { socketService } from './services/socketService';
import { useNotificationStore } from './stores/notificationStore';
import { useNavigate } from 'react-router-dom';

function setupNotificationListener() {
  const notificationStore = useNotificationStore();
  const navigate = useNavigate();

  socketService.on({
    onNotificationNew: (data) => {
      console.log('New notification:', data.notification);
      
      // Add to notification store
      notificationStore.addNotification(data.notification);
      
      // Show toast with action button
      toast.show({
        type: data.notification.priority === 'high' ? 'warning' : 'info',
        title: data.notification.title,
        message: data.notification.message,
        duration: 5000,
        action: data.notification.actionUrl ? {
          label: 'View',
          onClick: () => navigate(data.notification.actionUrl)
        } : undefined,
      });
      
      // Update unread count
      notificationStore.incrementUnreadCount();
    },
  });
}
```

## Collaborator Events

### Listen for Collaborator Changes

```typescript
import { socketService } from './services/socketService';
import { useCollaboratorStore } from './stores/collaboratorStore';

function setupCollaboratorListeners(tripId: string) {
  const collaboratorStore = useCollaboratorStore();

  socketService.on({
    // Collaborator joined
    onCollaboratorJoined: (data) => {
      console.log('Collaborator joined:', data.collaborator);
      
      // Add to collaborators list
      collaboratorStore.addCollaborator(data.collaborator);
      
      // Show toast
      toast.success(
        `${data.collaborator.user.name} joined as ${data.collaborator.role}`
      );
      
      // Update member count
      collaboratorStore.updateMemberCount();
    },
    
    // Collaborator left
    onCollaboratorLeft: (data) => {
      console.log('Collaborator left:', data.userId);
      
      // Remove from collaborators list
      collaboratorStore.removeCollaborator(data.userId);
      
      // Show toast
      const name = data.userName || 'A collaborator';
      toast.info(`${name} left the trip`);
      
      // Update member count
      collaboratorStore.updateMemberCount();
    },
    
    // Collaborator role changed
    onCollaboratorRoleChanged: (data) => {
      console.log('Role changed:', data.userId, data.newRole);
      
      // Update collaborator role
      collaboratorStore.updateCollaboratorRole(data.userId, data.newRole);
      
      // Show toast
      const name = data.userName || 'A collaborator';
      const article = data.newRole === 'editor' ? 'an' : 'a';
      toast.info(`${name} is now ${article} ${data.newRole}`);
    },
  });
}
```

## Presence Updates

### Emit Presence Updates

```typescript
import { socketService } from './services/socketService';

// User starts editing a day
function onStartEditingDay(tripId: string, dayId: string) {
  socketService.emitPresenceUpdate(tripId, 'day', dayId);
}

// User starts editing a place
function onStartEditingPlace(tripId: string, placeId: string) {
  socketService.emitPresenceUpdate(tripId, 'place', placeId);
}

// User stops editing (clear editing status)
function onStopEditing(tripId: string) {
  socketService.emitPresenceUpdate(tripId);
}
```

### Listen for Presence Updates

```typescript
import { socketService } from './services/socketService';

function setupPresenceListener(tripId: string) {
  socketService.on({
    onPresenceUpdate: (data) => {
      console.log('Presence update:', data);
      
      // Update presence map
      if (data.isOnline) {
        presenceMap.set(data.userId, {
          userId: data.userId,
          isOnline: true,
          editingEntity: data.editingEntity,
          editingEntityId: data.editingEntityId,
          lastUpdate: new Date(data.timestamp),
        });
      } else {
        presenceMap.delete(data.userId);
      }
      
      // Update UI
      updatePresenceIndicators();
    },
  });
}
```

## React Hook Example

### Complete useSocketEvents Hook

```typescript
import { useEffect } from 'react';
import { socketService } from '../services/socketService';
import { useActivityStore } from '../stores/activityStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useCollaboratorStore } from '../stores/collaboratorStore';
import { useToast } from './useToast';
import { useAuth } from './useAuth';

export function useSocketEvents(tripId: string) {
  const activityStore = useActivityStore();
  const notificationStore = useNotificationStore();
  const collaboratorStore = useCollaboratorStore();
  const toast = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!tripId) return;

    // Join trip room
    socketService.joinTrip(tripId);

    // Register all event handlers
    socketService.on({
      // Activity events
      onActivityNew: (data) => {
        activityStore.addActivity(data.activity);
        
        // Don't show toast for own actions
        if (data.activity.userId !== user?.id) {
          toast.info(
            `${data.activity.userName} ${formatActionType(data.activity.actionType)}`
          );
        }
      },

      // Notification events
      onNotificationNew: (data) => {
        notificationStore.addNotification(data.notification);
        
        toast.show({
          type: data.notification.priority === 'high' ? 'warning' : 'info',
          title: data.notification.title,
          message: data.notification.message,
          duration: 5000,
        });
      },

      // Collaborator events
      onCollaboratorJoined: (data) => {
        collaboratorStore.addCollaborator(data.collaborator);
        toast.success(`${data.collaborator.user.name} joined the trip`);
      },

      onCollaboratorLeft: (data) => {
        collaboratorStore.removeCollaborator(data.userId);
        const name = data.userName || 'A collaborator';
        toast.info(`${name} left the trip`);
      },

      onCollaboratorRoleChanged: (data) => {
        collaboratorStore.updateCollaboratorRole(data.userId, data.newRole);
        const name = data.userName || 'A collaborator';
        const article = data.newRole === 'editor' ? 'an' : 'a';
        toast.info(`${name} is now ${article} ${data.newRole}`);
      },

      // Presence events
      onPresenceUpdate: (data) => {
        // Update presence state
        if (data.isOnline) {
          collaboratorStore.updatePresence(data.userId, {
            isOnline: true,
            editingEntity: data.editingEntity,
            editingEntityId: data.editingEntityId,
          });
        } else {
          collaboratorStore.updatePresence(data.userId, {
            isOnline: false,
          });
        }
      },

      // Connection events
      onConnect: () => {
        console.log('Socket connected');
        // Refresh data on reconnect
        activityStore.fetchActivities(tripId);
        collaboratorStore.fetchCollaborators(tripId);
      },

      onDisconnect: () => {
        console.log('Socket disconnected');
      },

      onError: (error) => {
        console.error('Socket error:', error);
        toast.error('Connection error. Retrying...');
      },
    });

    // Cleanup
    return () => {
      // Remove event handlers
      socketService.off([
        'onActivityNew',
        'onNotificationNew',
        'onCollaboratorJoined',
        'onCollaboratorLeft',
        'onCollaboratorRoleChanged',
        'onPresenceUpdate',
        'onConnect',
        'onDisconnect',
        'onError',
      ]);
      
      // Leave trip room
      socketService.leaveTrip(tripId);
    };
  }, [tripId, user?.id]);
}

function formatActionType(actionType: string): string {
  const actionMap: Record<string, string> = {
    place_added: 'added a place',
    place_updated: 'updated a place',
    place_deleted: 'deleted a place',
    day_added: 'added a day',
    day_updated: 'updated a day',
    day_deleted: 'deleted a day',
    packing_item_added: 'added a packing item',
    packing_item_updated: 'updated a packing item',
    packing_item_deleted: 'deleted a packing item',
    collaborator_added: 'added a collaborator',
    collaborator_removed: 'removed a collaborator',
    collaborator_role_changed: 'changed a collaborator role',
  };
  
  return actionMap[actionType] || 'made a change';
}
```

### Usage in Component

```typescript
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
socketService.on({
  onActivityNew: (data) => {
    // Always update the store
    activityStore.addActivity(data.activity);
    
    // Only show toast for other users' actions
    if (data.activity.userId !== currentUserId) {
      toast.info(`${data.activity.userName} made a change`);
    }
  },
});
```

### 2. Batch Notifications
If multiple events come in quickly, consider batching them:

```typescript
let notificationQueue: any[] = [];
let notificationTimer: NodeJS.Timeout | null = null;

socketService.on({
  onActivityNew: (data) => {
    notificationQueue.push(data.activity);
    
    if (notificationTimer) {
      clearTimeout(notificationTimer);
    }
    
    notificationTimer = setTimeout(() => {
      if (notificationQueue.length === 1) {
        toast.info(`${notificationQueue[0].userName} made a change`);
      } else {
        toast.info(`${notificationQueue.length} new updates`);
      }
      notificationQueue = [];
      notificationTimer = null;
    }, 1000);
  },
});
```

### 3. Handle Reconnection
Refresh data when reconnecting:

```typescript
socketService.on({
  onConnect: () => {
    // Refresh activity log
    activityStore.fetchActivities(tripId);
    
    // Refresh collaborators
    collaboratorStore.fetchCollaborators(tripId);
    
    // Refresh notifications
    notificationStore.fetchNotifications();
  },
});
```

### 4. Clean Up Event Handlers
Always clean up event handlers when component unmounts:

```typescript
useEffect(() => {
  // Register handlers
  socketService.on({ onActivityNew, onNotificationNew });
  
  // Clean up
  return () => {
    socketService.off(['onActivityNew', 'onNotificationNew']);
  };
}, []);
```

### 5. Optimistic Updates
Update UI immediately, then sync with server:

```typescript
async function addPlace(placeData: PlaceData) {
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
1. Check if socket is connected: `socketService.isConnected()`
2. Verify you've joined the trip room: `socketService.joinTrip(tripId)`
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

## Related Documentation

- [Socket Events Integration Guide](../../../backend/src/services/SOCKET_EVENTS_INTEGRATION_GUIDE.md)
- [Task 5.6 Completion Summary](./TASK_5.6_COMPLETION_SUMMARY.md)
- [Design Document](.kiro/specs/collaboration-enhancement/design.md)
