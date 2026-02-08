// Analytics and event tracking types

export type AnalyticsEventName =
  | 'trip_created'
  | 'trip_updated'
  | 'trip_deleted'
  | 'trip_shared'
  | 'trip_viewed'
  | 'place_added'
  | 'place_updated'
  | 'place_deleted'
  | 'photo_uploaded'
  | 'story_item_added'
  | 'community_posted'
  | 'trip_liked'
  | 'trip_unliked'
  | 'trip_copied'
  | 'packing_item_added'
  | 'packing_item_checked'
  | 'budget_updated'
  | 'collaborator_added'
  | 'offline_sync_started'
  | 'offline_sync_completed'
  | 'offline_sync_failed'
  | 'map_downloaded'
  | 'pdf_exported'
  | 'qr_generated'
  | 'destination_suggestion_viewed'
  | 'destination_suggestion_clicked'
  | 'quick_plan_used'
  | 'location_searched'
  | 'location_scraped';

export interface AnalyticsEvent {
  id: string;
  event_name: AnalyticsEventName;
  user_id: string | null;
  trip_id: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface CreateAnalyticsEventDto {
  event_name: AnalyticsEventName;
  user_id?: string;
  trip_id?: string;
  metadata?: Record<string, any>;
}

export interface AnalyticsMetrics {
  dau: number; // Daily Active Users
  mau: number; // Monthly Active Users
  trips_created: number;
  community_posts: number;
  offline_syncs: number;
  storage_used_mb: number;
  api_errors: number;
}

export interface ContentInsights {
  top_destinations: Array<{
    destination: string;
    trip_count: number;
  }>;
  most_liked_trips: Array<{
    trip_id: string;
    title: string;
    likes_count: number;
  }>;
  popular_themes: Array<{
    theme: string;
    usage_count: number;
  }>;
}

export interface ConversionFunnel {
  stage: string;
  count: number;
  conversion_rate: number;
}

export interface AnalyticsDashboard {
  metrics: AnalyticsMetrics;
  content_insights: ContentInsights;
  conversion_funnels: {
    trip_creation: ConversionFunnel[];
    sharing: ConversionFunnel[];
    community: ConversionFunnel[];
  };
  active_users: Array<{
    user_id: string;
    name: string;
    email: string;
    last_active: string;
  }>;
}
