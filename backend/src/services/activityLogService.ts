import pool from '../config/database';
import { socketService } from './socketService';
import { v4 as uuidv4 } from 'uuid';

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
  changes: Record<string, any>;
  metadata: Record<string, any>;
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
 * Activity log response
 */
export interface ActivityLogResponse {
  activities: ActivityLogEntry[];
  total: number;
  hasMore: boolean;
}

/**
 * Activity summary by action type
 */
export interface ActivitySummary {
  totalActivities: number;
  byActionType: Record<string, number>;
  byUser: Record<string, number>;
  recentActivity: ActivityLogEntry[];
}

/**
 * Data for logging an activity
 */
export interface LogActivityData {
  tripId: string;
  userId: string;
  actionType: ActivityActionType;
  entityType: string;
  entityId: string;
  entityName: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Service for managing activity logs
 */
export class ActivityLogService {
  /**
   * Log an activity to the database and emit real-time event
   */
  async logActivity(data: LogActivityData): Promise<ActivityLogEntry> {
    try {
      const activityId = uuidv4();
      const changes = data.changes || {};
      const metadata = data.metadata || {};

      // Insert activity log entry
      const result = await pool.query(
        `INSERT INTO activity_log 
         (id, trip_id, user_id, action_type, entity_type, entity_id, entity_name, changes, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          activityId,
          data.tripId,
          data.userId,
          data.actionType,
          data.entityType,
          data.entityId,
          data.entityName,
          JSON.stringify(changes),
          JSON.stringify(metadata)
        ]
      );

      // Get user information
      const userResult = await pool.query(
        `SELECT name, profile_picture FROM users WHERE id = $1`,
        [data.userId]
      );

      const user = userResult.rows[0];
      const activity: ActivityLogEntry = {
        id: result.rows[0].id,
        tripId: result.rows[0].trip_id,
        userId: result.rows[0].user_id,
        userName: user?.name || 'Unknown User',
        userAvatar: user?.profile_picture,
        actionType: result.rows[0].action_type,
        entityType: result.rows[0].entity_type,
        entityId: result.rows[0].entity_id,
        entityName: result.rows[0].entity_name,
        changes: result.rows[0].changes,
        metadata: result.rows[0].metadata,
        createdAt: result.rows[0].created_at
      };

      // Emit real-time event
      this.emitActivityLog(data.tripId, activity);

      return activity;
    } catch (error) {
      console.error('Failed to log activity:', error);
      throw error;
    }
  }

  /**
   * Get activity log for a trip with filtering and pagination
   */
  async getActivityLog(
    tripId: string,
    options: GetActivityLogOptions = {}
  ): Promise<ActivityLogResponse> {
    try {
      const limit = options.limit || 50;
      const offset = options.offset || 0;

      // Build query with filters
      let query = `
        SELECT 
          al.*,
          u.name as user_name,
          u.profile_picture as user_avatar
        FROM activity_log al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.trip_id = $1
      `;

      const params: any[] = [tripId];
      let paramIndex = 2;

      // Add filters
      if (options.actionType) {
        query += ` AND al.action_type = $${paramIndex}`;
        params.push(options.actionType);
        paramIndex++;
      }

      if (options.userId) {
        query += ` AND al.user_id = $${paramIndex}`;
        params.push(options.userId);
        paramIndex++;
      }

      if (options.startDate) {
        query += ` AND al.created_at >= $${paramIndex}`;
        params.push(options.startDate);
        paramIndex++;
      }

      if (options.endDate) {
        query += ` AND al.created_at <= $${paramIndex}`;
        params.push(options.endDate);
        paramIndex++;
      }

      // Add ordering and pagination
      query += ` ORDER BY al.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      // Execute query
      const result = await pool.query(query, params);

      // Get total count
      let countQuery = `SELECT COUNT(*) FROM activity_log WHERE trip_id = $1`;
      const countParams: any[] = [tripId];
      let countParamIndex = 2;

      if (options.actionType) {
        countQuery += ` AND action_type = $${countParamIndex}`;
        countParams.push(options.actionType);
        countParamIndex++;
      }

      if (options.userId) {
        countQuery += ` AND user_id = $${countParamIndex}`;
        countParams.push(options.userId);
        countParamIndex++;
      }

      if (options.startDate) {
        countQuery += ` AND created_at >= $${countParamIndex}`;
        countParams.push(options.startDate);
        countParamIndex++;
      }

      if (options.endDate) {
        countQuery += ` AND created_at <= $${countParamIndex}`;
        countParams.push(options.endDate);
        countParamIndex++;
      }

      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);

      // Map results to ActivityLogEntry
      const activities: ActivityLogEntry[] = result.rows.map(row => ({
        id: row.id,
        tripId: row.trip_id,
        userId: row.user_id,
        userName: row.user_name || 'Unknown User',
        userAvatar: row.user_avatar,
        actionType: row.action_type,
        entityType: row.entity_type,
        entityId: row.entity_id,
        entityName: row.entity_name,
        changes: row.changes,
        metadata: row.metadata,
        createdAt: row.created_at
      }));

      return {
        activities,
        total,
        hasMore: offset + limit < total
      };
    } catch (error) {
      console.error('Failed to get activity log:', error);
      throw error;
    }
  }

  /**
   * Get activity summary for a trip
   */
  async getActivitySummary(tripId: string): Promise<ActivitySummary> {
    try {
      // Get total count
      const totalResult = await pool.query(
        `SELECT COUNT(*) FROM activity_log WHERE trip_id = $1`,
        [tripId]
      );
      const totalActivities = parseInt(totalResult.rows[0].count);

      // Get count by action type
      const actionTypeResult = await pool.query(
        `SELECT action_type, COUNT(*) as count 
         FROM activity_log 
         WHERE trip_id = $1 
         GROUP BY action_type`,
        [tripId]
      );

      const byActionType: Record<string, number> = {};
      actionTypeResult.rows.forEach(row => {
        byActionType[row.action_type] = parseInt(row.count);
      });

      // Get count by user
      const userResult = await pool.query(
        `SELECT user_id, COUNT(*) as count 
         FROM activity_log 
         WHERE trip_id = $1 AND user_id IS NOT NULL
         GROUP BY user_id`,
        [tripId]
      );

      const byUser: Record<string, number> = {};
      userResult.rows.forEach(row => {
        byUser[row.user_id] = parseInt(row.count);
      });

      // Get recent activity (last 10)
      const recentResult = await this.getActivityLog(tripId, { limit: 10 });

      return {
        totalActivities,
        byActionType,
        byUser,
        recentActivity: recentResult.activities
      };
    } catch (error) {
      console.error('Failed to get activity summary:', error);
      throw error;
    }
  }

  /**
   * Emit activity log event via Socket.IO
   */
  private emitActivityLog(tripId: string, activity: ActivityLogEntry): void {
    try {
      const roomName = `trip:${tripId}`;
      socketService.getIO().to(roomName).emit('activity:new', {
        tripId,
        activity,
        timestamp: new Date().toISOString()
      });
      console.log(`Emitted activity log for trip: ${tripId}, action: ${activity.actionType}`);
    } catch (error) {
      console.error('Failed to emit activity log:', error);
      // Don't throw - logging should not break the main flow
    }
  }
}

// Export singleton instance
export const activityLogService = new ActivityLogService();
