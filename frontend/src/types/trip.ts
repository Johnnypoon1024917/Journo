// Trip-related types and interfaces

export type TripTheme = 'default' | 'adventure' | 'romantic' | 'foodie' | 'chill';

export interface Trip {
  id: string;
  title: string;
  destination: string | null;
  start_date: string | null; // ISO date string
  end_date: string | null; // ISO date string
  cover_image_url: string | null;
  theme: TripTheme;
  owner_id: string;
  is_public: boolean;
  is_community: boolean;
  share_token: string;
  total_budget: number | null;
  currency_code: string;
  weather_data: WeatherData | null;
  likes_count: number;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export interface WeatherData {
  forecast: DailyForecast[];
  cached_at: string;
}

export interface DailyForecast {
  date: string;
  temperature_high: number;
  temperature_low: number;
  condition: string;
  precipitation_probability: number;
  icon: string;
}

export interface TripDay {
  id: string;
  trip_id: string;
  day_number: number;
  date: string | null; // ISO date string
  created_at: string;
}

export type PlaceType = 'attraction' | 'food' | 'hotel' | 'transport' | 'other';
export type BudgetCategory = 'flights' | 'accommodation' | 'food' | 'transport' | 'activities' | 'shopping' | 'misc';
export type TransportMode = 'driving' | 'walking' | 'transit' | 'flight';

export interface Place {
  id: string;
  trip_day_id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  time_start: string | null; // HH:MM format
  time_end: string | null; // HH:MM format
  notes: string | null;
  image_url: string | null;
  place_type: PlaceType | null;
  sticker: string | null;
  cost: number | null;
  cost_currency: string | null;
  budget_category: BudgetCategory | null;
  transport_mode: TransportMode | null;
  travel_time_seconds: number | null;
  travel_distance_meters: number | null;
  travel_time_text: string | null;
  travel_distance_text: string | null;
  display_order: number;
  is_completed: boolean; // Activity completion status
  created_at: string;
  updated_at: string;
  
  // New fields for optimistic updates and enhanced routing
  calculated_arrival_time: string | null; // HH:MM format - auto-calculated arrival time
  is_syncing: boolean; // Flag indicating if place is currently syncing
  sync_error: string | null; // Error message if sync failed
}

// Extended types with relationships
export interface TripWithDays extends Trip {
  days: TripDayWithPlaces[];
}

export interface TripDayWithPlaces extends TripDay {
  places: Place[];
}

// Create/Update DTOs
export interface CreateTripDto {
  title: string;
  destination?: string;
  start_date?: string;
  end_date?: string;
  cover_image_url?: string;
  theme?: TripTheme;
  total_budget?: number;
  currency_code?: string;
  is_public?: boolean;
  is_community?: boolean;
}

export interface UpdateTripDto {
  title?: string;
  destination?: string;
  start_date?: string;
  end_date?: string;
  cover_image_url?: string;
  theme?: TripTheme;
  total_budget?: number;
  currency_code?: string;
  is_public?: boolean;
  is_community?: boolean;
  weather_data?: WeatherData;
}

export interface CreateTripDayDto {
  trip_id: string;
  day_number: number;
  date?: string;
}

export interface CreatePlaceDto {
  trip_day_id: string;
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  time_start?: string;
  time_end?: string;
  notes?: string;
  image_url?: string;
  place_type?: PlaceType;
  sticker?: string;
  cost?: number;
  cost_currency?: string;
  budget_category?: BudgetCategory;
  transport_mode?: TransportMode;
  travel_time_seconds?: number;
  travel_distance_meters?: number;
  travel_time_text?: string;
  travel_distance_text?: string;
  calculated_arrival_time?: string;
  display_order?: number;
}

export interface UpdatePlaceDto {
  name?: string;
  address?: string;
  lat?: number;
  lng?: number;
  time_start?: string;
  time_end?: string;
  notes?: string;
  image_url?: string;
  place_type?: PlaceType;
  sticker?: string;
  cost?: number;
  cost_currency?: string;
  budget_category?: BudgetCategory;
  transport_mode?: TransportMode;
  travel_time_seconds?: number;
  travel_distance_meters?: number;
  travel_time_text?: string;
  travel_distance_text?: string;
  calculated_arrival_time?: string;
  is_completed?: boolean;
}

// Transport Route types for route calculation and caching
export interface RouteStep {
  instruction: string;
  distance_meters: number;
  duration_seconds: number;
  polyline: string;
}

export interface TransportRoute {
  id: string;
  from_place_id: string;
  to_place_id: string;
  transport_mode: TransportMode;
  duration_seconds: number;
  distance_meters: number;
  polyline: string | null;
  route_steps: RouteStep[] | null;
  calculated_at: string;
  expires_at: string;
  created_at: string;
}

export interface CreateTransportRouteDto {
  from_place_id: string;
  to_place_id: string;
  transport_mode: TransportMode;
  duration_seconds: number;
  distance_meters: number;
  polyline?: string;
  route_steps?: RouteStep[];
}

// Sync Queue types for optimistic updates
export type SyncOperationType = 
  | 'place_reorder' 
  | 'place_update' 
  | 'place_delete' 
  | 'place_create'
  | 'trip_update'
  | 'trip_create'
  | 'day_create';

export type SyncResourceType = 
  | 'place' 
  | 'trip' 
  | 'trip_day' 
  | 'story_item' 
  | 'packing_item';

export type SyncStatus = 'pending' | 'processing' | 'success' | 'failed' | 'completed';

export interface SyncQueueItem {
  id: string;
  operation_type: SyncOperationType;
  resource_type: SyncResourceType;
  resource_id: string;
  data: any;
  user_id: string;
  status: SyncStatus;
  retry_count: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSyncQueueItemDto {
  operation_type: SyncOperationType;
  resource_type: SyncResourceType;
  resource_id: string;
  data: any;
}
