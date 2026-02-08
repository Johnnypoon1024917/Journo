import pool from '../config/database.js';

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  notifyOnCollaboratorJoined: boolean;
  notifyOnItemAdded: boolean;
  notifyOnItemEdited: boolean;
  notifyOnItemDeleted: boolean;
  notifyOnScheduleChanged: boolean;
  notifyOnMention: boolean;
  batchNotifications: boolean;
  batchInterval: number; // minutes
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // HH:mm format
  quietHoursEnd?: string; // HH:mm format
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UpdateNotificationPreferencesDto {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  inAppNotifications?: boolean;
  notifyOnCollaboratorJoined?: boolean;
  notifyOnItemAdded?: boolean;
  notifyOnItemEdited?: boolean;
  notifyOnItemDeleted?: boolean;
  notifyOnScheduleChanged?: boolean;
  notifyOnMention?: boolean;
  batchNotifications?: boolean;
  batchInterval?: number;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export class NotificationPreferencesService {
  /**
   * Get user notification preferences
   * Returns default preferences if none exist
   */
  static async getPreferences(userId: string): Promise<NotificationPreferences> {
    const result = await pool.query(
      'SELECT * FROM notification_preferences WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      // Return default preferences
      return this.getDefaultPreferences(userId);
    }

    return this.mapRowToPreferences(result.rows[0]);
  }

  /**
   * Update user notification preferences
   * Creates preferences if they don't exist
   */
  static async updatePreferences(
    userId: string,
    updates: UpdateNotificationPreferencesDto
  ): Promise<NotificationPreferences> {
    // Check if preferences exist
    const existing = await pool.query(
      'SELECT * FROM notification_preferences WHERE user_id = $1',
      [userId]
    );

    if (existing.rows.length === 0) {
      // Create new preferences
      return this.createPreferences(userId, updates);
    }

    // Update existing preferences
    const fields: string[] = [];
    const values: any[] = [userId];
    let paramIndex = 2;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        fields.push(`${this.camelToSnake(key)} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      // No updates provided
      return this.mapRowToPreferences(existing.rows[0]);
    }

    fields.push(`updated_at = NOW()`);

    const query = `
      UPDATE notification_preferences
      SET ${fields.join(', ')}
      WHERE user_id = $1
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return this.mapRowToPreferences(result.rows[0]);
  }

  /**
   * Create notification preferences for a new user
   */
  private static async createPreferences(
    userId: string,
    initial: UpdateNotificationPreferencesDto = {}
  ): Promise<NotificationPreferences> {
    const defaults = this.getDefaultPreferences(userId);
    const preferences = { ...defaults, ...initial };

    const result = await pool.query(
      `INSERT INTO notification_preferences (
        user_id,
        email_notifications,
        push_notifications,
        in_app_notifications,
        notify_on_collaborator_joined,
        notify_on_item_added,
        notify_on_item_edited,
        notify_on_item_deleted,
        notify_on_schedule_changed,
        notify_on_mention,
        batch_notifications,
        batch_interval,
        quiet_hours_enabled,
        quiet_hours_start,
        quiet_hours_end
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        userId,
        preferences.emailNotifications,
        preferences.pushNotifications,
        preferences.inAppNotifications,
        preferences.notifyOnCollaboratorJoined,
        preferences.notifyOnItemAdded,
        preferences.notifyOnItemEdited,
        preferences.notifyOnItemDeleted,
        preferences.notifyOnScheduleChanged,
        preferences.notifyOnMention,
        preferences.batchNotifications,
        preferences.batchInterval,
        preferences.quietHoursEnabled,
        preferences.quietHoursStart,
        preferences.quietHoursEnd
      ]
    );

    return this.mapRowToPreferences(result.rows[0]);
  }

  /**
   * Delete user notification preferences (reset to defaults)
   */
  static async deletePreferences(userId: string): Promise<void> {
    await pool.query(
      'DELETE FROM notification_preferences WHERE user_id = $1',
      [userId]
    );
  }

  /**
   * Check if user should receive a specific notification type
   */
  static async shouldNotify(
    userId: string,
    notificationType: keyof UpdateNotificationPreferencesDto
  ): Promise<boolean> {
    const preferences = await this.getPreferences(userId);
    
    // Check if in-app notifications are enabled
    if (!preferences.inAppNotifications) {
      return false;
    }

    // Check specific notification type
    const key = notificationType as keyof NotificationPreferences;
    if (key in preferences) {
      return preferences[key] as boolean;
    }

    return true; // Default to true for unknown types
  }

  /**
   * Get default notification preferences
   */
  private static getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      emailNotifications: true,
      pushNotifications: true,
      inAppNotifications: true,
      notifyOnCollaboratorJoined: true,
      notifyOnItemAdded: true,
      notifyOnItemEdited: false, // Too noisy by default
      notifyOnItemDeleted: true,
      notifyOnScheduleChanged: true,
      notifyOnMention: true,
      batchNotifications: false,
      batchInterval: 1, // 1 minute
      quietHoursEnabled: false,
      quietHoursStart: undefined,
      quietHoursEnd: undefined
    };
  }

  /**
   * Map database row to NotificationPreferences object
   */
  private static mapRowToPreferences(row: any): NotificationPreferences {
    return {
      userId: row.user_id,
      emailNotifications: row.email_notifications,
      pushNotifications: row.push_notifications,
      inAppNotifications: row.in_app_notifications,
      notifyOnCollaboratorJoined: row.notify_on_collaborator_joined,
      notifyOnItemAdded: row.notify_on_item_added,
      notifyOnItemEdited: row.notify_on_item_edited,
      notifyOnItemDeleted: row.notify_on_item_deleted,
      notifyOnScheduleChanged: row.notify_on_schedule_changed,
      notifyOnMention: row.notify_on_mention,
      batchNotifications: row.batch_notifications,
      batchInterval: row.batch_interval,
      quietHoursEnabled: row.quiet_hours_enabled,
      quietHoursStart: row.quiet_hours_start,
      quietHoursEnd: row.quiet_hours_end,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Convert camelCase to snake_case
   */
  private static camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}
