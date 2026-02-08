# Socket.IO Real-Time Features

This document describes the Socket.IO implementation for real-time features in the Journo travel platform.

## Architecture

The Socket.IO implementation follows a room-based architecture where each trip has its own room. Users join trip rooms to receive real-time updates about changes to the trip, story items, packing lists, and places.

### Components

1. **Socket Authentication Middleware** (`middleware/socketAuth.ts`)
   - Verifies JWT tokens from handshake auth or query parameters
   - Attaches user information to socket for authenticated connections
   - Allows anonymous connections for public trip viewing

2. **Socket Service** (`services/socketService.ts`)
   - Manages room membership and presence tracking
   - Provides methods to emit events to trip rooms
   - Handles cleanup on disconnection

3. **Backend Integration** (`index.ts`)
   - Initializes Socket.IO server with CORS configuration
   - Sets up event handlers for join/leave room operations
   - Handles connection and disconnection events

## Events

### Client-to-Server Events

- `trip:join` - Join a trip room to receive updates
  ```typescript
  socket.emit('trip:join', tripId);
  ```

- `trip:leave` - Leave a trip room
  ```typescript
  socket.emit('trip:leave', tripId);
  ```

### Server-to-Client Events

- `trip:updated` - Trip details were updated
  ```typescript
  {
    tripId: string;
    data: any;
    timestamp: string;
  }
  ```

- `story:added` - New story item was added
  ```typescript
  {
    tripId: string;
    storyItem: StoryItem;
    timestamp: string;
  }
  ```

- `packing:updated` - Packing list was updated
  ```typescript
  {
    tripId: string;
    data: PackingItem;
    timestamp: string;
  }
  ```

- `place:added` - New place was added
  ```typescript
  {
    tripId: string;
    place: Place;
    timestamp: string;
  }
  ```

- `place:updated` - Place was updated
  ```typescript
  {
    tripId: string;
    place: Place;
    timestamp: string;
  }
  ```

- `place:deleted` - Place was deleted
  ```typescript
  {
    tripId: string;
    placeId: string;
    timestamp: string;
  }
  ```

- `presence:update` - Active viewers changed
  ```typescript
  {
    tripId: string;
    viewerCount: number;
    viewers: Array<{ userId?: string; userEmail?: string }>;
    timestamp: string;
  }
  ```

## Usage in Controllers

When you create, update, or delete trip-related data, emit the corresponding Socket.IO event:

```typescript
import { socketService } from '../services/socketService.js';

// After creating a story item
const storyItem = await createStoryItem(data);
socketService.emitStoryItemAdded(tripId, storyItem);

// After updating a place
const updatedPlace = await updatePlace(placeId, data);
socketService.emitPlaceUpdated(tripId, updatedPlace);

// After updating packing list
const packingItem = await updatePackingItem(itemId, data);
socketService.emitPackingListUpdate(tripId, packingItem);
```

## Presence Tracking

The system automatically tracks active viewers for each trip:

- When a user joins a trip room, presence is updated
- When a user leaves or disconnects, presence is updated
- All viewers in the room receive presence updates
- Presence includes viewer count and user information (if authenticated)

## Connection Management

- Automatic reconnection with exponential backoff
- Graceful handling of disconnections
- Room membership is restored on reconnection
- Pending operations are queued during disconnection

## Security

- JWT authentication for user identification
- Anonymous connections allowed for public trip viewing
- Room-based isolation ensures users only receive updates for trips they're viewing
- All events include tripId for validation

## Testing

To test Socket.IO functionality:

1. Start the backend server
2. Connect from frontend or use a Socket.IO client
3. Join a trip room
4. Make changes to the trip and observe real-time updates

Example using socket.io-client:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: { token: 'your-jwt-token' }
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
  socket.emit('trip:join', 'trip-id-here');
});

socket.on('trip:updated', (data) => {
  console.log('Trip updated:', data);
});
```

## Environment Variables

- `SOCKET_IO_CORS_ORIGIN` - Allowed CORS origin for Socket.IO (default: http://localhost:5173)
- `JWT_SECRET` - Secret for JWT token verification

## Performance Considerations

- Room-based architecture scales well with many concurrent users
- Events are only sent to users in the relevant room
- Presence tracking uses efficient Set data structures
- Automatic cleanup prevents memory leaks
