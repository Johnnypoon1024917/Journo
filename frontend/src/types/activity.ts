/**
 * Activity Log Types
 * 
 * Types for activity logging and tracking changes to trip content.
 * These types match the backend activity log system.
 */

/**
 * Activity action types that can be logged
 */
export type ActivityActionType =
  | 'trip_created' | 'trip_updated' | 'trip_deleted'
  | 'day_added' | 'day_updated' | 'day_deleted'
  | 'place_added' | 'place_updated' | 'place_deleted' | 'place_reordered'
  | 'packing_item_added' | 'packing_item_updated' | 'packing_item_deleted'
  | 'shopping_item_added' | 'shopping_item_updated' | 'shopping_item_deleted'
  | 'collaborator_added' | 'collaborator_removed' | 'collaborator_role_changed'
  | 'story_added' | 'story_deleted';

/**
 * Activity log entry interface
 */
export interface ActivityLogEntry {
  id: string;
  tripId: string;
  userId: string | null;
  userName: string;
  userAvatar?: string;
  actionType: ActivityActionType;
  entityType: string;
  entityId: string;
  entityName: string;
  changes: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
}

/**
 * Options for fetching activity log
 */
export interface GetActivityLogOptions {
  limit?: number;
  offset?: number;
  actionType?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Activity log response from API
 */
export interface ActivityLogResponse {
  activities: ActivityLogEntry[];
  total: number;
  hasMore: boolean;
}

/**
 * Activity summary by action type and user
 */
export interface ActivitySummary {
  totalActivities: number;
  byActionType: Record<string, number>;
  byUser: Record<string, number>;
  recentActivity: ActivityLogEntry[];
}

/**
 * Socket event data for new activity
 */
export interface ActivityNewEvent {
  tripId: string;
  activity: ActivityLogEntry;
  timestamp: string;
}
