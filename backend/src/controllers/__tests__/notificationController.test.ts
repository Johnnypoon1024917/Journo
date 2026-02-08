import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Request, Response } from 'express';
import { NotificationController } from '../notificationController.js';
import { NotificationService } from '../../services/notificationService.js';
import { NotificationPreferencesService } from '../../services/notificationPreferencesService.js';

// Mock dependencies
vi.mock('../../services/notificationService.js');
vi.mock('../../services/notificationPreferencesService.js');

describe('NotificationController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      user: { userId: 'user-1' },
      params: {},
      query: {},
      body: {}
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getNotifications', () => {
    it('should get user notifications with default filters', async () => {
      const mockResult = {
        notifications: [
          {
            id: 'notif-1',
            userId: 'user-1',
            type: 'test',
            category: 'system',
            priority: 'normal',
            title: 'Test',
            message: 'Test message',
            data: {},
            isRead: false,
            createdAt: new Date()
          }
        ],
        total: 1,
        unreadCount: 1
      };

      vi.mocked(NotificationService.getUserNotifications).mockResolvedValueOnce(mockResult);

      await NotificationController.getNotifications(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(NotificationService.getUserNotifications).toHaveBeenCalledWith('user-1', {
        limit: 50,
        offset: 0,
        category: undefined,
        isRead: undefined,
        startDate: undefined,
        endDate: undefined
      });

      expect(jsonMock).toHaveBeenCalledWith({
        notifications: mockResult.notifications,
        total: 1,
        unreadCount: 1,
        hasMore: false
      });
    });

    it('should apply query filters', async () => {
      mockRequest.query = {
        limit: '10',
        offset: '5',
        category: 'activity',
        isRead: 'false',
        startDate: '2026-01-01',
        endDate: '2026-02-01'
      };

      const mockResult = {
        notifications: [],
        total: 0,
        unreadCount: 0
      };

      vi.mocked(NotificationService.getUserNotifications).mockResolvedValueOnce(mockResult);

      await NotificationController.getNotifications(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(NotificationService.getUserNotifications).toHaveBeenCalledWith('user-1', {
        limit: 10,
        offset: 5,
        category: 'activity',
        isRead: false,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-02-01')
      });
    });

    it('should return 401 if user not authenticated', async () => {
      mockRequest.user = undefined;

      await NotificationController.getNotifications(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should handle errors', async () => {
      vi.mocked(NotificationService.getUserNotifications).mockRejectedValueOnce(
        new Error('Database error')
      );

      await NotificationController.getNotifications(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to get notifications' });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockRequest.params = { notificationId: 'notif-1' };

      const mockNotification = {
        id: 'notif-1',
        userId: 'user-1',
        type: 'test',
        category: 'system',
        priority: 'normal',
        title: 'Test',
        message: 'Test message',
        data: {},
        isRead: true,
        readAt: new Date(),
        createdAt: new Date()
      };

      vi.mocked(NotificationService.markAsRead).mockResolvedValueOnce(mockNotification);

      await NotificationController.markAsRead(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(NotificationService.markAsRead).toHaveBeenCalledWith('notif-1', 'user-1');
      expect(jsonMock).toHaveBeenCalledWith(mockNotification);
    });

    it('should return 404 if notification not found', async () => {
      mockRequest.params = { notificationId: 'notif-1' };

      vi.mocked(NotificationService.markAsRead).mockRejectedValueOnce(
        new Error('Notification not found')
      );

      await NotificationController.markAsRead(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Notification not found' });
    });

    it('should return 401 if user not authenticated', async () => {
      mockRequest.user = undefined;

      await NotificationController.markAsRead(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      vi.mocked(NotificationService.markAllAsRead).mockResolvedValueOnce(5);

      await NotificationController.markAllAsRead(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(NotificationService.markAllAsRead).toHaveBeenCalledWith('user-1');
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'All notifications marked as read',
        count: 5
      });
    });

    it('should return 401 if user not authenticated', async () => {
      mockRequest.user = undefined;

      await NotificationController.markAllAsRead(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      mockRequest.params = { notificationId: 'notif-1' };

      vi.mocked(NotificationService.deleteNotification).mockResolvedValueOnce();

      await NotificationController.deleteNotification(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(NotificationService.deleteNotification).toHaveBeenCalledWith('notif-1', 'user-1');
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Notification deleted' });
    });

    it('should return 404 if notification not found', async () => {
      mockRequest.params = { notificationId: 'notif-1' };

      vi.mocked(NotificationService.deleteNotification).mockRejectedValueOnce(
        new Error('Notification not found')
      );

      await NotificationController.deleteNotification(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Notification not found' });
    });
  });

  describe('getPreferences', () => {
    it('should get user notification preferences', async () => {
      const mockPreferences = {
        userId: 'user-1',
        emailNotifications: true,
        pushNotifications: true,
        inAppNotifications: true,
        notifyOnCollaboratorJoined: true,
        notifyOnItemAdded: true,
        notifyOnItemEdited: false,
        notifyOnItemDeleted: true,
        notifyOnScheduleChanged: true,
        notifyOnMention: true,
        batchNotifications: false,
        batchInterval: 1,
        quietHoursEnabled: false
      };

      vi.mocked(NotificationPreferencesService.getPreferences).mockResolvedValueOnce(
        mockPreferences
      );

      await NotificationController.getPreferences(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(NotificationPreferencesService.getPreferences).toHaveBeenCalledWith('user-1');
      expect(jsonMock).toHaveBeenCalledWith(mockPreferences);
    });

    it('should return 401 if user not authenticated', async () => {
      mockRequest.user = undefined;

      await NotificationController.getPreferences(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });
  });

  describe('updatePreferences', () => {
    it('should update user notification preferences', async () => {
      mockRequest.body = {
        emailNotifications: false,
        batchNotifications: true,
        batchInterval: 5
      };

      const mockUpdated = {
        userId: 'user-1',
        emailNotifications: false,
        pushNotifications: true,
        inAppNotifications: true,
        notifyOnCollaboratorJoined: true,
        notifyOnItemAdded: true,
        notifyOnItemEdited: false,
        notifyOnItemDeleted: true,
        notifyOnScheduleChanged: true,
        notifyOnMention: true,
        batchNotifications: true,
        batchInterval: 5,
        quietHoursEnabled: false
      };

      vi.mocked(NotificationPreferencesService.updatePreferences).mockResolvedValueOnce(
        mockUpdated
      );

      await NotificationController.updatePreferences(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(NotificationPreferencesService.updatePreferences).toHaveBeenCalledWith(
        'user-1',
        mockRequest.body
      );
      expect(jsonMock).toHaveBeenCalledWith(mockUpdated);
    });

    it('should validate quiet hours format', async () => {
      mockRequest.body = {
        quietHoursStart: 'invalid'
      };

      await NotificationController.updatePreferences(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Invalid quietHoursStart format. Use HH:mm'
      });
    });

    it('should validate batch interval range', async () => {
      mockRequest.body = {
        batchInterval: 100
      };

      await NotificationController.updatePreferences(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Batch interval must be between 1 and 60 minutes'
      });
    });

    it('should accept valid quiet hours', async () => {
      mockRequest.body = {
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00'
      };

      const mockUpdated = {
        userId: 'user-1',
        emailNotifications: true,
        pushNotifications: true,
        inAppNotifications: true,
        notifyOnCollaboratorJoined: true,
        notifyOnItemAdded: true,
        notifyOnItemEdited: false,
        notifyOnItemDeleted: true,
        notifyOnScheduleChanged: true,
        notifyOnMention: true,
        batchNotifications: false,
        batchInterval: 1,
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00'
      };

      vi.mocked(NotificationPreferencesService.updatePreferences).mockResolvedValueOnce(
        mockUpdated
      );

      await NotificationController.updatePreferences(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(NotificationPreferencesService.updatePreferences).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith(mockUpdated);
    });
  });

  describe('resetPreferences', () => {
    it('should reset preferences to defaults', async () => {
      const mockDefaults = {
        userId: 'user-1',
        emailNotifications: true,
        pushNotifications: true,
        inAppNotifications: true,
        notifyOnCollaboratorJoined: true,
        notifyOnItemAdded: true,
        notifyOnItemEdited: false,
        notifyOnItemDeleted: true,
        notifyOnScheduleChanged: true,
        notifyOnMention: true,
        batchNotifications: false,
        batchInterval: 1,
        quietHoursEnabled: false
      };

      vi.mocked(NotificationPreferencesService.deletePreferences).mockResolvedValueOnce();
      vi.mocked(NotificationPreferencesService.getPreferences).mockResolvedValueOnce(
        mockDefaults
      );

      await NotificationController.resetPreferences(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(NotificationPreferencesService.deletePreferences).toHaveBeenCalledWith('user-1');
      expect(NotificationPreferencesService.getPreferences).toHaveBeenCalledWith('user-1');
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Notification preferences reset to defaults',
        preferences: mockDefaults
      });
    });
  });
});
