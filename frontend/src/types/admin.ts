// Admin portal types

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
  created_at: string;
  updated_at: string;
}

export interface ModerationFlagWithDetails extends ModerationFlag {
  resource?: any; // The actual trip, story_item, or user
  moderator?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateModerationFlagDto {
  resource_type: ModerationResourceType;
  resource_id: string;
  reason: string;
}

export interface UpdateModerationFlagDto {
  status?: ModerationStatus;
  moderator_id?: string;
}

export interface ModerationLog {
  id: string;
  action: ModerationAction;
  resource_type: ModerationResourceType;
  resource_id: string;
  reason: string | null;
  moderator_id: string;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface ModerationLogWithDetails extends ModerationLog {
  moderator: {
    id: string;
    name: string;
    email: string;
  };
  resource?: any;
}

export interface CreateModerationLogDto {
  action: ModerationAction;
  resource_type: ModerationResourceType;
  resource_id: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  rollout_percentage: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateFeatureFlagDto {
  enabled?: boolean;
  rollout_percentage?: number;
  description?: string;
}

export interface AdminDashboardMetrics {
  dau: number;
  mau: number;
  trips_created_today: number;
  trips_created_total: number;
  community_posts_today: number;
  community_posts_total: number;
  offline_syncs_today: number;
  storage_used_gb: number;
  api_errors_today: number;
  active_users: Array<{
    user_id: string;
    name: string;
    email: string;
    last_active: string;
    trip_count: number;
  }>;
}

export interface SystemHealthMetrics {
  database: {
    status: 'healthy' | 'degraded' | 'down';
    connection_count: number;
    query_avg_time_ms: number;
  };
  storage: {
    total_gb: number;
    used_gb: number;
    available_gb: number;
    percentage_used: number;
  };
  external_apis: {
    google_maps: 'healthy' | 'degraded' | 'down';
    weather: 'healthy' | 'degraded' | 'down';
    currency: 'healthy' | 'degraded' | 'down';
  };
  error_rates: {
    last_hour: number;
    last_24h: number;
    last_7d: number;
  };
}

export interface UserManagementFilters {
  search?: string;
  role?: string;
  created_after?: string;
  created_before?: string;
  has_trips?: boolean;
  is_blocked?: boolean;
}

export interface UserManagementResult {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
  trip_count: number;
  last_active: string | null;
  is_blocked: boolean;
}
