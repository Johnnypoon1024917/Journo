import pool from '../config/database.js';
import { socketService } from './socketService.js';

export type NotificationCategory = 'collaboration' | 'activity' | 'mention' | 'system';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface CreateNotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  actionUrl?: string;
  expiresAt?: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  data: any;
  actionUrl?: string;
  isRead: boolean;
  readAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export interface NotificationFilters {
  limit?: number;
  offset?: number;
  category?: NotificationCategory;
  isRead?: boolean;
  startDate?: Date;
  endDate?: Date;
}

// Batch notification queue
interface BatchedNotification {
  userId: string;
  notifications: CreateNotificationData[];
  scheduledAt: Date;
}

export class NotificationService {
  private static batchQueue: Map<string, BatchedNotification> = new Map();
  private static batchInterval = 60000; // 1 minute in milliseconds

  static async createNotification(notificationData: CreateNotificationData): Promise<Notification> {
    try {
      // Check user preferences for batching
      const preferences = await this.getUserPreferences(notificationData.userId);
      
      // Check quiet hours
      if (preferences.quietHoursEnabled && this.isQuietHours(preferences)) {
        // Queue notification for later
        return this.queueNotification(notificationData);
      }

      // Check if batching is enabled
      if (preferences.batchNotifications) {
        return this.batchNotification(notificationData, preferences.batchInterval);
      }

      // Create notification immediately
      return this.createNotificationImmediate(notificationData);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  private static async createNotificationImmediate(
    notificationData: CreateNotificationData
  ): Promise<Notification> {
    const result = await pool.query(
      `INSERT INTO notifications 
       (user_id, type, title, message, data, category, priority, action_url, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        notificationData.userId,
        notificationData.type,
        notificationData.title,
        notificationData.message,
        JSON.stringify(notificationData.data || {}),
        notificationData.category || 'system',
        notificationData.priority || 'normal',
        notificationData.actionUrl,
        notificationData.expiresAt
      ]
    );

    const notification = this.mapRowToNotification(result.rows[0]);

    // Emit real-time event
    socketService.emitNotification(notificationData.userId, notification);

    return notification;
  }

  private static async batchNotification(
    notificationData: CreateNotificationData,
    batchInterval: number
  ): Promise<Notification> {
    const batchKey = notificationData.userId;
    const existing = this.batchQueue.get(batchKey);

    if (existing) {
      // Add to existing batch
      existing.notifications.push(notificationData);
    } else {
      // Create new batch
      this.batchQueue.set(batchKey, {
        userId: notificationData.userId,
        notifications: [notificationData],
        scheduledAt: new Date(Date.now() + batchInterval * 60000)
      });

      // Schedule batch processing
      setTimeout(() => {
        this.processBatch(batchKey);
      }, batchInterval * 60000);
    }

    // Return a placeholder notification
    return {
      id: 'batched',
      userId: notificationData.userId,
      type: notificationData.type,
      category: notificationData.category || 'system',
      priority: notificationData.priority || 'normal',
      title: notificationData.title,
      message: notificationData.message,
      data: notificationData.data || {},
      actionUrl: notificationData.actionUrl,
      isRead: false,
      createdAt: new Date()
    };
  }

  private static async processBatch(batchKey: string): Promise<void> {
    const batch = this.batchQueue.get(batchKey);
    if (!batch) return;

    // Create all notifications in batch
    for (const notification of batch.notifications) {
      await this.createNotificationImmediate(notification);
    }

    // Clear batch
    this.batchQueue.delete(batchKey);
  }

  private static async queueNotification(
    notificationData: CreateNotificationData
  ): Promise<Notification> {
    // Store notification for later delivery (after quiet hours)
    // For now, just create it immediately but mark as queued
    return this.createNotificationImmediate(notificationData);
  }

  private static isQuietHours(preferences: any): boolean {
    if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = preferences.quietHoursStart.split(':').map(Number);
    const [endHour, endMin] = preferences.quietHoursEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime < endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private static async getUserPreferences(userId: string): Promise<any> {
    const result = await pool.query(
      'SELECT * FROM notification_preferences WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      // Return default preferences
      return {
        batchNotifications: false,
        batchInterval: 1,
        quietHoursEnabled: false,
        quietHoursStart: null,
        quietHoursEnd: null
      };
    }

    return result.rows[0];
  }

  static async getUserNotifications(
    userId: string,
    filters: NotificationFilters = {}
  ): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    let query = `
      SELECT * FROM notifications
      WHERE user_id = $1
    `;
    const params: any[] = [userId];
    let paramIndex = 2;

    if (filters.category) {
      query += ` AND category = $${paramIndex}`;
      params.push(filters.category);
      paramIndex++;
    }

    if (filters.isRead !== undefined) {
      query += ` AND is_read = $${paramIndex}`;
      params.push(filters.isRead);
      paramIndex++;
    }

    if (filters.startDate) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters.endDate) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(filters.endDate);
      paramIndex++;
    }

    // Filter out expired notifications
    query += ` AND (expires_at IS NULL OR expires_at > NOW())`;

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total, 
       SUM(CASE WHEN is_read = false THEN 1 ELSE 0 END) as unread
       FROM notifications 
       WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW())`,
      [userId]
    );

    return {
      notifications: result.rows.map(this.mapRowToNotification),
      total: parseInt(countResult.rows[0].total) || 0,
      unreadCount: parseInt(countResult.rows[0].unread) || 0
    };
  }

  static async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const result = await pool.query(
      `UPDATE notifications 
       SET is_read = true, read_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Notification not found');
    }

    return this.mapRowToNotification(result.rows[0]);
  }

  static async markAllAsRead(userId: string): Promise<number> {
    console.log('📝 markAllAsRead called for user:', userId);
    try {
      const result = await pool.query(
        `UPDATE notifications 
         SET is_read = true, read_at = NOW()
         WHERE user_id = $1 AND is_read = false
         RETURNING id`,
        [userId]
      );

      console.log(`✅ Marked ${result.rows.length} notifications as read`);
      return result.rows.length;
    } catch (error) {
      console.error('❌ Error in markAllAsRead:', error);
      throw error;
    }
  }

  static async deleteNotification(notificationId: string, userId: string): Promise<void> {
    console.log('🗑️ deleteNotification called:', { notificationId, userId });
    try {
      const result = await pool.query(
        'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
        [notificationId, userId]
      );

      if (result.rowCount === 0) {
        console.log('❌ Notification not found or not owned by user');
        throw new Error('Notification not found');
      }
      
      console.log('✅ Notification deleted successfully');
    } catch (error) {
      console.error('❌ Error in deleteNotification:', error);
      throw error;
    }
  }

  private static mapRowToNotification(row: any): Notification {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      category: row.category,
      priority: row.priority,
      title: row.title,
      message: row.message,
      data: row.data,
      actionUrl: row.action_url,
      isRead: row.is_read,
      readAt: row.read_at,
      expiresAt: row.expires_at,
      createdAt: row.created_at
    };
  }

  // Legacy methods for backward compatibility
  static async createCollaborationInvite(
    inviteeUserId: string,
    tripId: string,
    tripName: string,
    inviterName: string,
    role: 'editor' | 'viewer',
    inviterId: string
  ): Promise<void> {
    const title = `Trip collaboration invite`;
    const message = `${inviterName} invited you to collaborate on "${tripName}" as ${role === 'editor' ? 'an editor' : 'a viewer'}`;
    
    await this.createNotification({
      userId: inviteeUserId,
      type: 'collaboration_invite',
      title,
      message,
      category: 'collaboration',
      priority: 'high',
      actionUrl: `/trips/${tripId}`,
      data: {
        tripId,
        tripName,
        inviterName,
        role,
        inviterId
      }
    });
  }

  static async createTripSharedNotification(
    userId: string,
    tripId: string,
    tripName: string,
    sharedByName: string
  ): Promise<void> {
    const title = `Trip shared with you`;
    const message = `${sharedByName} shared "${tripName}" with you`;
    
    await this.createNotification({
      userId,
      type: 'trip_shared',
      title,
      message,
      category: 'collaboration',
      priority: 'normal',
      actionUrl: `/trips/${tripId}`,
      data: {
        tripId,
        tripName,
        sharedByName
      }
    });
  }

  /**
   * Notify collaborators when activities are reordered
   * Implements deduplication to prevent multiple notifications for rapid reorders
   */
  static async notifyActivityReordered(
    tripId: string,
    placeName: string,
    reorderedByUserId: string,
    reorderedByName: string
  ): Promise<void> {
    try {
      console.log('🔔 notifyActivityReordered called:', { tripId, placeName, reorderedByUserId, reorderedByName });
      
      // Get trip owner
      const tripResult = await pool.query(
        'SELECT * FROM trips WHERE id = $1',
        [tripId]
      );
      
      const trip = tripResult.rows[0];
      const tripName = trip?.name || trip?.title || trip?.trip_name || 'Untitled Trip';
      const ownerId = trip?.owner_id;
      
      console.log(`📍 Trip: ${tripName}, Owner: ${ownerId}`);
      
      // Get all collaborators AND owner, excluding the user who made the change
      const result = await pool.query(
        `SELECT DISTINCT u.id, u.first_name, u.last_name, u.email
         FROM users u
         WHERE u.id IN (
           -- Get collaborators
           SELECT tc.user_id FROM trip_collaborators tc WHERE tc.trip_id = $1
           UNION
           -- Get owner
           SELECT $2::uuid
         )
         AND u.id != $3`,
        [tripId, ownerId, reorderedByUserId]
      );

      const usersToNotify = result.rows;
      console.log(`📋 Found ${usersToNotify.length} users to notify:`, usersToNotify.map(u => u.email));

      if (usersToNotify.length === 0) {
        console.log('⚠️ No users to notify');
        return;
      }

      // Create notifications for each user with deduplication
      for (const user of usersToNotify) {
        // Check if there's a recent similar notification (within last 5 minutes)
        const recentNotification = await pool.query(
          `SELECT id, created_at FROM notifications
           WHERE user_id = $1
           AND type = 'activity_reordered'
           AND data->>'tripId' = $2
           AND is_read = false
           AND created_at > NOW() - INTERVAL '5 minutes'
           ORDER BY created_at DESC
           LIMIT 1`,
          [user.id, tripId]
        );

        if (recentNotification.rows.length > 0) {
          // Update existing notification instead of creating new one
          console.log(`🔄 Updating existing notification for ${user.email} (deduplication)`);
          await pool.query(
            `UPDATE notifications
             SET message = $1,
                 data = $2,
                 created_at = NOW(),
                 updated_at = NOW()
             WHERE id = $3`,
            [
              `${reorderedByName} reordered activities in ${tripName}`,
              JSON.stringify({
                tripId,
                tripName,
                reorderedByUserId,
                reorderedByName,
                lastActivity: placeName,
                count: (recentNotification.rows[0].data?.count || 1) + 1
              }),
              recentNotification.rows[0].id
            ]
          );
          console.log(`✅ Notification updated for ${user.email}`);
        } else {
          // Create new notification
          console.log(`📬 Creating new notification for ${user.email}...`);
          await this.createNotification({
            userId: user.id,
            type: 'activity_reordered',
            title: 'Activity reordered',
            message: `${reorderedByName} reordered "${placeName}" in ${tripName}`,
            category: 'activity',
            priority: 'low',
            actionUrl: `/trips/${tripId}`,
            data: {
              tripId,
              tripName,
              placeName,
              reorderedByUserId,
              reorderedByName,
              count: 1
            }
          });
          console.log(`✅ Notification created for ${user.email}`);
        }
      }
      
      console.log('✅ All activity reorder notifications processed');
    } catch (error) {
      console.error('❌ Error notifying activity reordered:', error);
      // Don't throw - notification failure shouldn't break the reorder operation
    }
  }
}