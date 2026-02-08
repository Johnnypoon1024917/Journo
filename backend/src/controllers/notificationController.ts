import { Request, Response } from 'express';
import { NotificationService, NotificationFilters } from '../services/notificationService.js';
import { NotificationPreferencesService } from '../services/notificationPreferencesService.js';

export class NotificationController {
  /**
   * GET /api/notifications
   * Get user notifications with optional filtering
   */
  static async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      // req.user has 'id' not 'userId' - another middleware populates full user object
      const userId = req.user?.id || req.user?.userId;
      if (!userId) {
        console.log('❌ No userId found, returning 401');
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      console.log('✅ userId found:', userId);

      const filters: NotificationFilters = {
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
        category: req.query.category as any,
        isRead: req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
      };

      const result = await NotificationService.getUserNotifications(userId, filters);

      res.json({
        notifications: result.notifications,
        total: result.total,
        unreadCount: result.unreadCount,
        hasMore: result.total > (filters.offset || 0) + (filters.limit || 50)
      });
    } catch (error) {
      console.error('Error getting notifications:', error);
      res.status(500).json({ error: 'Failed to get notifications' });
    }
  }

  /**
   * PATCH /api/notifications/:notificationId/read
   * Mark a notification as read
   */
  static async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { notificationId } = req.params;

      const notification = await NotificationService.markAsRead(notificationId, userId);

      res.json(notification);
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      if (error.message === 'Notification not found') {
        res.status(404).json({ error: 'Notification not found' });
      } else {
        res.status(500).json({ error: 'Failed to mark notification as read' });
      }
    }
  }

  /**
   * POST /api/notifications/mark-all-read
   * Mark all notifications as read for the current user
   */
  static async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const count = await NotificationService.markAllAsRead(userId);

      res.json({ 
        message: 'All notifications marked as read',
        count 
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
  }

  /**
   * DELETE /api/notifications/:notificationId
   * Delete a notification
   */
  static async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { notificationId } = req.params;

      await NotificationService.deleteNotification(notificationId, userId);

      res.json({ message: 'Notification deleted' });
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      if (error.message === 'Notification not found') {
        res.status(404).json({ error: 'Notification not found' });
      } else {
        res.status(500).json({ error: 'Failed to delete notification' });
      }
    }
  }

  /**
   * GET /api/users/notification-preferences
   * Get user notification preferences
   */
  static async getPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const preferences = await NotificationPreferencesService.getPreferences(userId);

      res.json(preferences);
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      res.status(500).json({ error: 'Failed to get notification preferences' });
    }
  }

  /**
   * PATCH /api/users/notification-preferences
   * Update user notification preferences
   */
  static async updatePreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Validate quiet hours format if provided
      if (req.body.quietHoursStart && !this.isValidTimeFormat(req.body.quietHoursStart)) {
        res.status(400).json({ error: 'Invalid quietHoursStart format. Use HH:mm' });
        return;
      }

      if (req.body.quietHoursEnd && !this.isValidTimeFormat(req.body.quietHoursEnd)) {
        res.status(400).json({ error: 'Invalid quietHoursEnd format. Use HH:mm' });
        return;
      }

      // Validate batch interval
      if (req.body.batchInterval !== undefined) {
        const interval = parseInt(req.body.batchInterval);
        if (isNaN(interval) || interval < 1 || interval > 60) {
          res.status(400).json({ error: 'Batch interval must be between 1 and 60 minutes' });
          return;
        }
      }

      const preferences = await NotificationPreferencesService.updatePreferences(
        userId,
        req.body
      );

      res.json(preferences);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      res.status(500).json({ error: 'Failed to update notification preferences' });
    }
  }

  /**
   * DELETE /api/users/notification-preferences
   * Reset notification preferences to defaults
   */
  static async resetPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      await NotificationPreferencesService.deletePreferences(userId);

      // Get default preferences
      const preferences = await NotificationPreferencesService.getPreferences(userId);

      res.json({
        message: 'Notification preferences reset to defaults',
        preferences
      });
    } catch (error) {
      console.error('Error resetting notification preferences:', error);
      res.status(500).json({ error: 'Failed to reset notification preferences' });
    }
  }

  /**
   * Validate time format (HH:mm)
   */
  private static isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }
}
