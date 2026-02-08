# Real-Time Collaboration Features

This document describes the real-time collaboration features implemented for the Kawaii UI redesign.

## Overview

The collaboration system provides:
1. **WebSocket Connection Management** - Automatic connection, reconnection, and status tracking
2. **Presence Indicators** - Show who's viewing the trip and editing items
3. **Conflict Prevention** - Lock items during editing to prevent conflicts
4. **Real-Time Notifications** - Toast notifications for collaboration events

## Components

### 1. ConnectionStatusIndicator

Shows the current WebSocket connection status.

```tsx
import { ConnectionStatusIndicator } from './ConnectionStatusIndicator';

<ConnectionStatusIndicator 
  showWhenConnected={false} // Optional: show indicator even when connected
/>
```

**States:**
- Connected (green) - hidden by default
- Connecting (yellow, pulsing)
- Reconnecting (orange, pulsing)
- Disconnected (red, with retry button)

### 2. PresenceIndicator

Shows active viewers for a trip.

```tsx
import { PresenceIndicator } from './PresenceIndicator';

<PresenceIndicator tripId="trip-123" />
```

**Features:**
- Shows up to 3 viewer avatars
- Displays total viewer count
- Color-coded avatars with initials

### 3. EditingIndicator

Shows when another user is editing an item.

```tsx
import { EditingIndicator } from './EditingIndicator';

<EditingIndicator tripId="trip-123" itemId="item-456" />
```

**Features:**
- Animated pencil icon
- Shows editor's name
- Auto-hides when editing stops

### 4. EditingConflictModal

Modal shown when user tries to edit an item being edited by someone else.

```tsx
import { EditingConflictModal } from './EditingConflictModal';

<EditingConflictModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  editingUser={{
    userId: "123",
    userEmail: "user@example.com",
    userName: "John Doe"
  }}
  itemType="activity"
/>
```

### 5. CollaborationNotification

Toast notification for collaboration events.

```tsx
import { CollaborationNotification } from './CollaborationNotification';

<CollaborationNotification
  notification={{
    id: "notif-1",
    type: "user_joined",
    userName: "John Doe",
    timestamp: new Date()
  }}
  onDismiss={(id) => console.log('Dismissed', id)}
  autoHideDuration={5000}
/>
```

**Event Types:**
- `user_joined` - User joined the trip
- `user_left` - User left the trip
- `item_edited` - Item was edited
- `item_added` - Item was added
- `item_deleted` - Item was deleted

### 6. CollaborationNotificationContainer

Container that manages all collaboration notifications.

```tsx
import { CollaborationNotificationContainer } from './CollaborationNotificationContainer';

<CollaborationNotificationContainer tripId="trip-123" />
```

**Features:**
- Automatically listens for collaboration events
- Manages notification lifecycle
- Fixed position (top-right)
- Auto-dismisses after 5 seconds

## Hooks

### 1. useSocket

Enhanced socket hook with connection state tracking.

```tsx
import { useSocket } from '../../hooks/useSocket';

const {
  isConnected,
  connectionState, // 'disconnected' | 'connecting' | 'connected' | 'reconnecting'
  error,
  connect,
  disconnect,
  reconnect,
  joinTrip,
  leaveTrip,
} = useSocket({
  autoConnect: true,
  tripId: 'trip-123',
  onPresenceUpdate: (data) => console.log('Presence:', data),
  onTripUpdated: (data) => console.log('Trip updated:', data),
});
```

### 2. useEditingState

Manages editing state for collaborative items.

```tsx
import { useEditingState } from '../../hooks/useEditingState';

const {
  startEditing,
  stopEditing,
  isBeingEditedByOther,
  editingUser,
} = useEditingState({
  tripId: 'trip-123',
  itemId: 'item-456',
  itemType: 'activity',
  onEditingConflict: (user) => {
    console.log('Conflict with:', user);
  },
});

// Start editing
const success = startEditing(); // Returns false if someone else is editing

// Stop editing
stopEditing();
```

### 3. useItemLock

Higher-level hook for item locking.

```tsx
import { useItemLock } from '../../hooks/useItemLock';

const {
  isLocked,
  isLockedByMe,
  isLockedByOther,
  editingUser,
  acquireLock,
  releaseLock,
  checkLock,
} = useItemLock({
  tripId: 'trip-123',
  itemId: 'item-456',
  itemType: 'activity',
  onLockFailed: (user) => {
    alert(`${user.userName} is editing this item`);
  },
});

// Acquire lock
const success = await acquireLock();

// Release lock
releaseLock();
```

## Store

### RealtimeStore

Zustand store for real-time collaboration state.

```tsx
import { useRealtimeStore } from '../../stores/realtimeStore';

// Get connection state
const isConnected = useRealtimeStore((state) => state.isConnected);

// Get presence for a trip
const presence = useRealtimeStore((state) => state.presence['trip-123']);

// Set user editing
const setUserEditing = useRealtimeStore((state) => state.setUserEditing);
setUserEditing('trip-123', 'user-123', 'user@example.com', 'John', 'item-456', 'activity');

// Clear user editing
const clearUserEditing = useRealtimeStore((state) => state.clearUserEditing);
clearUserEditing('trip-123', 'user-123', 'item-456');

// Get user editing an item
const getUserEditingItem = useRealtimeStore((state) => state.getUserEditingItem);
const editor = getUserEditingItem('trip-123', 'item-456');
```

## Usage Example

Here's a complete example of adding collaboration to an editable component:

```tsx
import React, { useState } from 'react';
import { useItemLock } from '../../hooks/useItemLock';
import { EditingIndicator } from './EditingIndicator';
import { EditingConflictModal } from './EditingConflictModal';

export const CollaborativeActivity: React.FC<{ tripId: string; activity: Activity }> = ({
  tripId,
  activity,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showConflict, setShowConflict] = useState(false);
  const [conflictUser, setConflictUser] = useState(null);

  const {
    isLockedByOther,
    isLockedByMe,
    editingUser,
    acquireLock,
    releaseLock,
  } = useItemLock({
    tripId,
    itemId: activity.id,
    itemType: 'activity',
    onLockFailed: (user) => {
      setConflictUser(user);
      setShowConflict(true);
    },
  });

  const handleEdit = async () => {
    const success = await acquireLock();
    if (success) {
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    // Save changes...
    releaseLock();
    setIsEditing(false);
  };

  const handleCancel = () => {
    releaseLock();
    setIsEditing(false);
  };

  return (
    <div className="relative">
      {/* Show editing indicator if someone else is editing */}
      {isLockedByOther && (
        <EditingIndicator tripId={tripId} itemId={activity.id} />
      )}

      {/* Activity content */}
      <div className={isLockedByOther ? 'opacity-60 pointer-events-none' : ''}>
        <h3>{activity.name}</h3>
        <p>{activity.description}</p>
      </div>

      {/* Edit controls */}
      {!isEditing && !isLockedByOther && (
        <button onClick={handleEdit}>Edit</button>
      )}
      
      {isEditing && isLockedByMe && (
        <>
          <button onClick={handleSave}>Save</button>
          <button onClick={handleCancel}>Cancel</button>
        </>
      )}

      {/* Conflict modal */}
      {conflictUser && (
        <EditingConflictModal
          isOpen={showConflict}
          onClose={() => setShowConflict(false)}
          editingUser={conflictUser}
          itemType="activity"
        />
      )}
    </div>
  );
};
```

## Backend Integration

The frontend expects these socket events from the backend:

### Emitted Events (Frontend → Backend)

```typescript
// Join trip room
socket.emit('trip:join', tripId);

// Leave trip room
socket.emit('trip:leave', tripId);

// Start editing
socket.emit('item:editing:start', {
  tripId,
  itemId,
  itemType,
});

// Stop editing
socket.emit('item:editing:stop', {
  tripId,
  itemId,
});
```

### Received Events (Backend → Frontend)

```typescript
// Presence update
socket.on('presence:update', (data) => {
  // data: { tripId, viewerCount, viewers: [{ userId, userEmail }] }
});

// User started editing
socket.on('item:editing:start', (data) => {
  // data: { tripId, itemId, itemType, userId, userEmail, userName }
});

// User stopped editing
socket.on('item:editing:stop', (data) => {
  // data: { tripId, itemId, userId }
});

// Trip updated
socket.on('trip:updated', (data) => {
  // data: { tripId, data, timestamp }
});

// Place added/updated/deleted
socket.on('place:added', (data) => {
  // data: { tripId, place, timestamp }
});
```

## Requirements Validation

This implementation satisfies:

- **Requirement 19.1**: WebSocket connection with automatic reconnection
- **Requirement 19.2**: Presence indicators showing online users and editing status
- **Requirement 19.3**: Item locking to prevent conflicting edits
- **Requirement 19.4**: Notifications for collaborator actions

## Testing

To test the collaboration features:

1. Open the same trip in two different browsers/tabs
2. Log in as different users
3. Try editing the same item simultaneously
4. Observe presence indicators and editing locks
5. Check notifications for collaboration events

## Performance Considerations

- Socket events are debounced to prevent flooding
- Presence updates are throttled to once per second
- Editing state is cleaned up automatically on unmount
- Notifications auto-dismiss after 5 seconds
- Maximum 3 avatars shown in presence indicator
