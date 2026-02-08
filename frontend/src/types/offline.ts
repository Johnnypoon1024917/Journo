// Offline storage types

export interface OfflineTrip {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  cover_image_url?: string;
  theme: 'default' | 'adventure' | 'romantic' | 'foodie' | 'chill';
  owner_id: string;
  is_public: boolean;
  is_community: boolean;
  share_token: string;
  total_budget?: number;
  currency_code: string;
  likes_count: number;
  views_count: number;
  created_at: string;
  updated_at: string;
  // Offline metadata
  _offline_created?: boolean;
  _offline_modified?: boolean;
  _last_synced?: string;
}

export interface OfflineTripDay {
  id: string;
  trip_id: string;
  day_number: number;
  date: string;
  created_at: string;
  // Offline metadata
  _offline_created?: boolean;
  _offline_modified?: boolean;
}

export interface OfflinePlace {
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
  place_type?: 'attraction' | 'food' | 'hotel' | 'transport' | 'other';
  sticker?: string;
  cost?: number;
  cost_currency?: string;
  budget_category?: string;
  transport_mode?: 'driving' | 'walking' | 'transit' | 'flight';
  travel_time_seconds?: number;
  travel_distance_meters?: number;
  travel_time_text?: string;
  travel_distance_text?: string;
  travel_time?: number; // Alias for travel_time_seconds
  travel_distance?: number; // Alias for travel_distance_meters
  display_order?: number;
  place_order?: number; // Alias for display_order
  calculated_arrival_time?: string;
  is_syncing?: boolean;
  sync_error?: string;
  created_at: string;
  updated_at: string;
  // Offline metadata
  _offline_created?: boolean;
  _offline_modified?: boolean;
}

export interface OfflineStoryItem {
  id: string;
  trip_id: string;
  user_id: string;
  type: 'photo' | 'youtube' | 'note';
  content_url?: string;
  caption?: string;
  created_at: string;
  // Offline metadata
  _offline_created?: boolean;
  _pending_upload?: boolean;
}

export interface OfflinePackingItem {
  id: string;
  trip_id: string;
  item: string;
  category: 'essentials' | 'clothing' | 'toiletries' | 'electronics' | 'documents' | 'health' | 'activities' | 'misc';
  is_checked: boolean;
  added_by: string;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
  // Offline metadata
  _offline_created?: boolean;
  _offline_modified?: boolean;
}

// Sync queue types - import from trip.ts to avoid duplication
import type { SyncOperationType, SyncQueueItem as TripSyncQueueItem } from './trip';

// Use the base SyncQueueItem from trip.ts directly
export interface SyncQueueItem extends TripSyncQueueItem {
  // Additional offline-specific fields for backward compatibility
  operation?: SyncOperationType; // Keep 'operation' for backward compatibility, maps to operation_type
  last_error?: string; // Maps to error_message
}

// Transport Route types for offline caching
export interface OfflineRouteStep {
  instruction: string;
  distance_meters: number;
  duration_seconds: number;
  polyline: string;
}

export interface OfflineTransportRoute {
  id: string;
  from_place_id: string;
  to_place_id: string;
  transport_mode: 'driving' | 'walking' | 'transit' | 'flight';
  duration_seconds: number;
  distance_meters: number;
  polyline?: string;
  route_steps?: OfflineRouteStep[];
  calculated_at: string;
  expires_at: string;
  created_at: string;
}

// Offline storage schema
export interface OfflineStorage {
  trips: Record<string, OfflineTrip>;
  trip_days: Record<string, OfflineTripDay>;
  places: Record<string, OfflinePlace>;
  story_items: Record<string, OfflineStoryItem>;
  packing_items: Record<string, OfflinePackingItem>;
  sync_queue: Record<string, SyncQueueItem>;
  transport_routes: Record<string, OfflineTransportRoute>;
  pending_uploads: Record<string, PendingUpload>;
  map_tiles: Record<string, OfflineMapTile>;
  map_regions: Record<string, OfflineMapRegion>;
}

export interface PendingUpload {
  id: string;
  file: Blob | File;
  type: 'photo' | 'cover';
  resource_id: string;
  resource_type: 'trip' | 'place' | 'story_item';
  created_at: string;
  retry_count: number;
}

// Network status
export interface NetworkStatus {
  isOnline: boolean;
  lastOnline?: string;
  lastSync?: string;
}

// Offline maps
export interface OfflineMapTile {
  id: string;
  x: number;
  y: number;
  zoom: number;
  url: string;
  blob: Blob;
  downloaded_at: string;
}

export interface OfflineMapRegion {
  id: string;
  trip_id: string;
  name: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  center: {
    lat: number;
    lng: number;
  };
  zoom_levels: number[];
  tile_count: number;
  size_bytes: number;
  downloaded_at: string;
  last_accessed?: string;
}

export interface OfflineMapDownloadProgress {
  trip_id: string;
  total_tiles: number;
  downloaded_tiles: number;
  failed_tiles: number;
  progress_percent: number;
  status: 'downloading' | 'completed' | 'failed' | 'cancelled';
  error?: string;
}

// Collaboration-specific offline queue types
export interface OfflineQueueItem {
  id: string;
  tripId: string;
  action: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  data: any;
  timestamp: string;
  retryCount: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
}

export interface QueueStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  failedCount: number;
}
