// Backend TypeScript types for Journo travel platform
// These types mirror the database schema and are used for type safety in the backend

// Trip types
export type TripTheme = 'default' | 'adventure' | 'romantic' | 'foodie' | 'chill';

export interface Trip {
  id: string;
  title: string;
  destination: string | null;
  start_date: Date | null;
  end_date: Date | null;
  cover_image_url: string | null;
  theme: TripTheme;
  owner_id: string;
  is_public: boolean;
  is_community: boolean;
  share_token: string;
  total_budget: number | null;
  currency_code: string;
  weather_data: any | null;
  likes_count: number;
  views_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface TripDay {
  id: string;
  trip_id: string;
  day_number: number;
  date: Date | null;
  created_at: Date;
}

export interface TripWithDays extends Trip {
  days: TripDay[];
}

export type PlaceType = 
  | 'attraction' 
  | 'food' 
  | 'hotel' 
  | 'transport' 
  | 'other' 
  | 'temple' 
  | 'observation_deck' 
  | 'shrine' 
  | 'market' 
  | 'garden' 
  | 'landmark' 
  | 'cathedral' 
  | 'castle' 
  | 'monument' 
  | 'district'
  | 'restaurant'
  | 'museum'
  | 'shopping'
  | 'nightlife'
  | 'entertainment'
  | 'nature'
  | 'park'
  | 'activity'
  | 'cultural'
  | 'accommodation';
export type BudgetCategory = 'accommodation' | 'food' | 'transport' | 'activities' | 'shopping' | 'misc';
export type TransportMode = 'driving' | 'walking' | 'transit' | 'flight';

export interface Place {
  id: string;
  trip_day_id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  time_start: string | null;
  time_end: string | null;
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
  calculated_arrival_time: string | null;
  is_syncing: boolean;
  sync_error: string | null;
  created_at: Date;
  updated_at: Date;
}

// Story types
export type StoryItemType = 'photo' | 'youtube' | 'note';

export interface StoryItem {
  id: string;
  trip_id: string;
  user_id: string;
  type: StoryItemType;
  content_url: string | null;
  caption: string | null;
  created_at: Date;
}

export interface TripLike {
  id: string;
  trip_id: string;
  user_id: string;
  created_at: Date;
}

// Packing types
export type PackingCategory = 
  | 'essentials' 
  | 'clothing' 
  | 'toiletries' 
  | 'electronics' 
  | 'documents' 
  | 'health' 
  | 'activities' 
  | 'misc';

export interface PackingItem {
  id: string;
  trip_id: string;
  item: string;
  category: PackingCategory | null;
  is_checked: boolean;
  added_by: string;
  is_custom: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PackingTemplate {
  id: string;
  destination_type: string | null;
  weather_condition: string | null;
  trip_duration_days: number | null;
  item: string;
  category: string;
  created_at: Date;
}

// Collaboration types
export type CollaboratorRole = 'owner' | 'editor' | 'viewer';

export interface TripCollaborator {
  id: string;
  trip_id: string;
  user_id: string;
  role: CollaboratorRole;
  invited_by: string | null;
  created_at: Date;
}

export interface TripVersion {
  id: string;
  trip_id: string;
  version_data: any;
  created_at: Date;
}

// User and Badge types
export type BadgeType = 
  | 'golden_hour' 
  | 'food_explorer' 
  | 'early_bird'
  | 'world_traveler'
  | 'budget_master'
  | 'packing_pro';

export interface UserBadge {
  id: string;
  user_id: string;
  trip_id: string | null;
  badge_type: BadgeType;
  earned_at: Date;
}

// Analytics types
export interface AnalyticsEvent {
  id: string;
  event_name: string;
  user_id: string | null;
  trip_id: string | null;
  metadata: any | null;
  created_at: Date;
}

export interface CurrencyRate {
  id: string;
  base_currency: string;
  target_currency: string;
  rate: number;
  cached_at: Date;
}

// Destination types
export interface DestinationSuggestion {
  id: string;
  destination_name: string;
  country: string;
  image_url: string | null;
  month: number | null;
  temperature_avg: number | null;
  weather_condition: string | null;
  why_now: string | null;
  climate_type: string | null;
  activity_type: string | null;
  popularity_score: number;
  created_at: Date;
  updated_at: Date;
}

export interface ScrapedLocation {
  id?: string;
  location_name: string;
  source: string;
  visitor_count: number | null;
  rating: number | null;
  tips: string | null;
  lat: number | null;
  lng: number | null;
  city?: string | null;
  country?: string | null;
  place_type?: PlaceType;
  estimated_cost?: number;
  estimated_duration?: number;
  budget_category?: 'low' | 'medium' | 'high';
  interest_match?: number;
  popularity_score?: number;
  weather_suitability?: 'indoor' | 'outdoor' | 'flexible';
  opening_hours?: string;
  crowd_level?: 'low' | 'medium' | 'high';
  diversity_score?: number;
  address?: string;
  category?: string;
  cached_at: Date;
  created_at: Date;
  updated_at?: Date;
}

export interface SearchQuery {
  id: string;
  user_id: string | null;
  query_text: string;
  result_count: number;
  selected_result_id: string | null;
  created_at: Date;
}

// Admin types
export type ModerationResourceType = 'trip' | 'story_item' | 'user';
export type ModerationStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';
export type ModerationAction = 'flag' | 'hide' | 'delete' | 'warn' | 'ban' | 'restore';

export interface ModerationFlag {
  id: string;
  resource_type: ModerationResourceType;
  resource_id: string;
  reason: string;
  moderator_id: string | null;
  status: ModerationStatus;
  created_at: Date;
  updated_at: Date;
}

export interface ModerationLog {
  id: string;
  action: ModerationAction;
  resource_type: ModerationResourceType;
  resource_id: string;
  reason: string | null;
  moderator_id: string;
  metadata: any | null;
  created_at: Date;
}

export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  rollout_percentage: number;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export type SuggestionInteractionType = 'view' | 'click' | 'quick_plan';

export interface SuggestionInteraction {
  id: string;
  user_id: string | null;
  suggestion_id: string;
  interaction_type: SuggestionInteractionType;
  created_at: Date;
}

// Interest and Traveler types
export interface InterestCategory {
  id: string;
  name: string;
  weight: number;
}

export interface TravelerType {
  type: 'solo' | 'couple' | 'family' | 'friends' | 'business';
  ageGroups?: ('child' | 'teen' | 'adult' | 'senior')[];
  preferences?: string[];
}

// Transport Route types
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
  route_steps: any | null; // JSONB
  calculated_at: Date;
  expires_at: Date;
  created_at: Date;
}

// Sync Queue types
export type SyncOperationType = 
  | 'place_reorder' 
  | 'place_update' 
  | 'place_delete' 
  | 'place_create'
  | 'trip_update'
  | 'day_create';

export type SyncResourceType = 
  | 'place' 
  | 'trip' 
  | 'trip_day' 
  | 'story_item' 
  | 'packing_item';

export type SyncStatus = 'pending' | 'processing' | 'success' | 'failed';

export interface SyncQueueItem {
  id: string;
  operation_type: SyncOperationType;
  resource_type: SyncResourceType;
  resource_id: string;
  data: any; // JSONB
  user_id: string;
  status: SyncStatus;
  retry_count: number;
  error_message: string | null;
  created_at: Date;
  updated_at: Date;
}

// Country Recommendation types
export interface CountryRecommendation {
  id: string;
  country_name: string;
  best_months: number[];
  temp_range: string;
  avoid_months: number[];
  region: string;
  description: string;
  created_at?: Date;
  updated_at?: Date;
}

export type WeatherPreference = 'Warm' | 'Cold' | 'Any';

export type CountryRegion = 
  | 'Asia' 
  | 'Europe' 
  | 'Americas' 
  | 'Africa' 
  | 'Oceania' 
  | 'Middle East';

export interface CountryQueryFilters {
  month?: number;
  weather?: WeatherPreference;
  region?: CountryRegion;
  limit?: number;
  offset?: number;
}

// Request/Response DTOs
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}
