# Socket.IO Client Integration

This document describes how to use Socket.IO real-time features in the Journo frontend.

## Quick Start

### Using the useSocket Hook

The easiest way to integrate real-time features is using the `useSocket` hook:

```typescript
import { useSocket } from '../hooks/useSocket';

function TripDetailPage({ tripId }) {
  const { isConnected, error } = useSocket({
    autoConnect: true,
    tripId,
    onTripUpdated: (data) => {
      console.log('Trip updated:', data);
      // Refetch trip data or update local state
    },
    onStoryAdded: (data) => {
      console.log('New story item:', data);
      // Add story item to local state
    },
    onPresenceUpdate: (data) => {
      console.log('Viewers:', data.viewerCount);
    },
  });

  return (
    <div>
      {isConnected ? 'Connected' : 'Disconnected'}
      {/* Your trip content */}
    </div>
  );
}
```

### Using the RealtimeTripView Component

Wrap your trip view with the `RealtimeTripView` component for automatic real-time updates:

```typescript
import { RealtimeTripView } from '../components/RealtimeTripView';

function TripPage({ tripId }) {
  return (
    <RealtimeTripView tripId={tripId}>
      {/* Your trip content */}
      <TripDetails />
      <StoryFeed />
      <PackingList />
    </RealtimeTripView>
  );
}
```

This component:
- Automatically connects to Socket.IO
- Joins the trip room
- Shows connection status
- Displays viewer count
- Handles all real-time events

### Manual Socket Service Usage

For more control, use the `socketService` directly:

```typescript
import { socketService } from '../services/socketService';

// Connect with authentication
const token = useAuthStore.getState().accessToken;
socketService.connect(token);

// Register event handlers
socketService.on({
  onConnect: () => console.log('Connected'),
  onTripUpdated: (data) => console.log('Trip updated:', data),
});

// Join a trip room
socketService.joinTrip('trip-id');

// Leave a trip room
socketService.leaveTrip('trip-id');

// Disconnect
socketService.disconnect();
```

## Components

### ConnectionStatus

Shows real-time connection status and viewer count:

```typescript
import { ConnectionStatus } from '../components/ConnectionStatus';

<ConnectionStatus tripId={tripId} />
```

Features:
- Green badge when connected
- Red badge when disconnected
- Shows viewer count for the trip
- Displays connection errors

## State Management

### Realtime Store

The `useRealtimeStore` manages real-time state:

```typescript
import { useRealtimeStore } from '../stores/realtimeStore';

function MyComponent() {
  const { isConnected, presence } = useRealtimeStore();
  
  const tripPresence = presence['trip-id'];
  console.log('Viewers:', tripPresence?.viewerCount);
}
```

Store properties:
- `isConnected` - Connection status
- `connectionError` - Error message if any
- `presence` - Presence data by trip ID
- `pendingUpdates` - Optimistic UI updates

## Event Handlers

### Available Events

All event handlers are optional:

```typescript
{
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onTripUpdated?: (data: TripUpdatedEvent) => void;
  onStoryAdded?: (data: StoryAddedEvent) => void;
  onPackingUpdated?: (data: PackingUpdatedEvent) => void;
  onPlaceAdded?: (data: PlaceAddedEvent) => void;
  onPlaceUpdated?: (data: PlaceUpdatedEvent) => void;
  onPlaceDeleted?: (data: PlaceDeletedEvent) => void;
  onPresenceUpdate?: (data: PresenceUpdateEvent) => void;
}
```

### Event Data Types

All event types are defined in `types/socket.ts`:

```typescript
import {
  TripUpdatedEvent,
  StoryAddedEvent,
  PackingUpdatedEvent,
  PlaceAddedEvent,
  PlaceUpdatedEvent,
  PlaceDeletedEvent,
  PresenceUpdateEvent,
} from '../types/socket';
```

## Connection Management

### Auto-Reconnection

The socket automatically reconnects with exponential backoff:
- Initial delay: 1 second
- Max delay: 5 seconds
- Max attempts: 5

### Manual Reconnection

```typescript
const { reconnect } = useSocket();

// Trigger manual reconnection
reconnect();
```

### Connection Status

```typescript
const { isConnected } = useSocket();

if (isConnected) {
  // Socket is connected
} else {
  // Socket is disconnected
}
```

## Best Practices

### 1. Clean Up on Unmount

The `useSocket` hook automatically cleans up, but if using `socketService` directly:

```typescript
useEffect(() => {
  socketService.joinTrip(tripId);
  
  return () => {
    socketService.leaveTrip(tripId);
  };
}, [tripId]);
```

### 2. Handle Optimistic Updates

For better UX, update UI immediately and handle conflicts:

```typescript
const { addPendingUpdate, removePendingUpdate } = useRealtimeStore();

async function updatePlace(placeId, data) {
  const updateId = `place-${placeId}-${Date.now()}`;
  
  // Optimistic update
  addPendingUpdate(updateId);
  updateLocalState(data);
  
  try {
    await api.updatePlace(placeId, data);
    removePendingUpdate(updateId);
  } catch (error) {
    // Revert on error
    removePendingUpdate(updateId);
    revertLocalState();
  }
}
```

### 3. Debounce Rapid Updates

If receiving many rapid updates, debounce the UI updates:

```typescript
import { debounce } from 'lodash';

const debouncedUpdate = debounce((data) => {
  updateUI(data);
}, 300);

useSocket({
  onTripUpdated: debouncedUpdate,
});
```

### 4. Handle Offline Mode

Check connection status before showing real-time features:

```typescript
const { isConnected } = useSocket();

{isConnected ? (
  <div>Live updates enabled</div>
) : (
  <div>Offline mode - changes will sync when online</div>
)}
```

## Troubleshooting

### Connection Issues

1. Check if backend is running
2. Verify CORS configuration
3. Check JWT token is valid
4. Look for errors in browser console

### Events Not Received

1. Verify you've joined the trip room
2. Check event handler is registered
3. Ensure backend is emitting events
4. Check network tab for WebSocket frames

### Performance Issues

1. Limit number of active connections
2. Debounce rapid updates
3. Use React.memo for components
4. Implement virtual scrolling for large lists

## Environment Variables

Add to `.env`:

```
VITE_API_URL=http://localhost:5000
```

## Testing

### Manual Testing

1. Open two browser windows
2. Login as different users
3. View the same trip
4. Make changes in one window
5. Observe updates in the other window

### Automated Testing

Mock the socket service in tests:

```typescript
jest.mock('../services/socketService', () => ({
  socketService: {
    connect: jest.fn(),
    joinTrip: jest.fn(),
    leaveTrip: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  },
}));
```

## Examples

### Example 1: Live Story Feed

```typescript
function StoryFeed({ tripId }) {
  const [stories, setStories] = useState([]);
  
  useSocket({
    tripId,
    onStoryAdded: (data) => {
      setStories(prev => [data.storyItem, ...prev]);
    },
  });
  
  return (
    <div>
      {stories.map(story => (
        <StoryItem key={story.id} story={story} />
      ))}
    </div>
  );
}
```

### Example 2: Collaborative Packing List

```typescript
function PackingList({ tripId }) {
  const [items, setItems] = useState([]);
  
  useSocket({
    tripId,
    onPackingUpdated: (data) => {
      setItems(prev => 
        prev.map(item => 
          item.id === data.data.id ? data.data : item
        )
      );
    },
  });
  
  return (
    <div>
      {items.map(item => (
        <PackingItem key={item.id} item={item} />
      ))}
    </div>
  );
}
```

### Example 3: Live Map Updates

```typescript
function TripMap({ tripId }) {
  const [places, setPlaces] = useState([]);
  
  useSocket({
    tripId,
    onPlaceAdded: (data) => {
      setPlaces(prev => [...prev, data.place]);
    },
    onPlaceUpdated: (data) => {
      setPlaces(prev =>
        prev.map(p => p.id === data.place.id ? data.place : p)
      );
    },
    onPlaceDeleted: (data) => {
      setPlaces(prev => prev.filter(p => p.id !== data.placeId));
    },
  });
  
  return <MapView places={places} />;
}
```
