/**
 * Socket.IO event types and interfaces
 */

export interface SocketEventData {
  tripId: string;
  timestamp: string;
}

export interface TripUpdatedEvent extends SocketEventData {
  data: any;
}

export interface StoryAddedEvent extends SocketEventData {
  storyItem: {
    id: string;
    trip_id: string;
    user_id: string;
    type: 'photo' | 'youtube' | 'note';
    content_url?: string;
    caption?: string;
    created_at: string;
  };
}

export interface PackingUpdatedEvent extends SocketEventData {
  data: {
    id: string;
    trip_id: string;
    item: string;
    category: string;
    is_checked: boolean;
    added_by: string;
    is_custom: boolean;
  };
}

export interface PlaceAddedEvent extends SocketEventData {
  place: {
    id: string;
    trip_day_id: string;
    name: string;
    address?: string;
    lat?: number;
    lng?: number;
    time_start?: string;
    time_end?: string;
    notes?: string;
    image_url?: string;
    place_type: 'attraction' | 'food' | 'hotel' | 'transport' | 'other';
    sticker?: string;
    cost?: number;
    cost_currency?: string;
    budget_category?: string;
    transport_mode?: string;
  };
}

export interface PlaceUpdatedEvent extends SocketEventData {
  place: PlaceAddedEvent['place'];
}

export interface PlaceDeletedEvent extends SocketEventData {
  placeId: string;
}

export interface PresenceUpdateEvent extends SocketEventData {
  viewerCount: number;
  viewers: Array<{
    userId?: string;
    userEmail?: string;
  }>;
}

export interface TripJoinedEvent {
  tripId: string;
  success: boolean;
  error?: string;
}

export interface TripLeftEvent {
  tripId: string;
  success: boolean;
}

/**
 * Socket.IO client-to-server events
 */
export interface ClientToServerEvents {
  'trip:join': (tripId: string) => void;
  'trip:leave': (tripId: string) => void;
}

/**
 * Socket.IO server-to-client events
 */
export interface ServerToClientEvents {
  'trip:updated': (data: TripUpdatedEvent) => void;
  'trip:joined': (data: TripJoinedEvent) => void;
  'trip:left': (data: TripLeftEvent) => void;
  'story:added': (data: StoryAddedEvent) => void;
  'packing:updated': (data: PackingUpdatedEvent) => void;
  'place:added': (data: PlaceAddedEvent) => void;
  'place:updated': (data: PlaceUpdatedEvent) => void;
  'place:deleted': (data: PlaceDeletedEvent) => void;
  'presence:update': (data: PresenceUpdateEvent) => void;
}
