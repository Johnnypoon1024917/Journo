import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { notificationService } from '../notificationService';
import api from '../api';
import { useEnhancedAuthStore } from '../../stores/enhancedAuthStore';
import { 
  NotificationResponse, 
  Notification, 
  NotificationPreferences,
  NotificationFilters 
} from '../../types/notification';

// Mock dependencies
vi.mock('../api');
vi.mock('../../stores/authStore');

describe('notificationService', () => {
  const mockToken = 'test-token-123';
  
  beforeEach(() => {
    // Mock auth store
    vi.mocked(useEnhancedAuthStore.getState).mockReturnValue({
      accessToken: mockToken,
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should fetch notifications without filters', async () => {
      const mockResponse: NotificationResponse = {
        notifications: [
          {
            id: '1',
            userId: 'user-1',
            type: 'collaboration_invite',
            category: 'collaboration',
            priority: 'normal',
            title: 'New Collaboration Invite',
            message: 'You have been invited to collaborate',
            data: {},
            isRead: false,
            createdAt: '2024-01-01T00:00:00Z'
          }
        ],
        total: 1,
        unreadCount: 1,
        hasMore: false
      };

      vi.mocked(api.get).mockResolvedValue(mockResponse);

      const result = await notificationService.getNotifications();

      expect(api.get).toHaveBeenCalledWith('/notifications', { token: mockToken });
      expect(result).toEqual(mockResponse);
    });

    it('should fetch notifications with filters', async () => {
      const filters: NotificationFilters = {
        limit: 10,
        offset: 0,
        category: 'activity',
        isRead: false
      };

      const mockResponse: NotificationResponse = {
        notifications: [],
        total: 0,
        unreadCount: 0,
        hasMore: false
      };

      vi.mocked(api.get).mockResolvedValue(mockResponse);

      await notificationService.getNotifications(filters);

      expect(api.get).toHaveBeenCalledWith(
        '/notifications?limit=10&offset=0&category=activity&isRead=false',
        { token: mockToken }
      );
    });

    it('should handle date filters', async () => {
      const filters: NotificationFilters = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const mockResponse: NotificationResponse = {
        notifications: [],
        total: 0,
        unreadCount: 0,
        hasMore: false
      };

      vi.mocked(api.get).mockResolvedValue(mockResponse);

      await notificationService.getNotifications(filters);

      expect(api.get).toHaveBeenCalledWith(
        '/notifications?startDate=2024-01-01&endDate=2024-01-31',
        { token: mockToken }
      );
    });

    it('should handle empty filters object', async () => {
      const mockResponse: NotificationResponse = {
        notifications: [],
        total: 0,
        unreadCount: 0,
        hasMore: false
      };

      vi.mocked(api.get).mockResolvedValue(mockResponse);

      await notificationService.getNotifications({});

      expect(api.get).toHaveBeenCalledWith('/notifications', { token: mockToken });
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const notificationId = 'notif-123';
      const mockNotification: Notification = {
        id: notificationId,
        userId: 'user-1',
        type: 'activity',
        category: 'activity',
        priority: 'normal',
        title: 'Test',
        message: 'Test message',
        data: {},
        isRead: true,
        readAt: '2024-01-01T00:00:00Z',
        createdAt: '2024-01-01T00:00:00Z'
      };

      vi.mocked(api.patch).mockResolvedValue(mockNotification);

      const result = await notificationService.markAsRead(notificationId);

      expect(api.patch).toHaveBeenCalledWith(
        `/notifications/${notificationId}/read`,
        {},
        { token: mockToken }
      );
      expect(result).toEqual(mockNotification);
      expect(result.isRead).toBe(true);
    });

    it('should handle errors when marking as read', async () => {
      const notificationId = 'notif-123';
      const error = new Error('Network error');

      vi.mocked(api.patch).mockRejectedValue(error);

      await expect(notificationService.markAsRead(notificationId)).rejects.toThrow('Network error');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      const mockResponse = { message: 'All notifications marked as read', count: 5 };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await notificationService.markAllAsRead();

      expect(api.post).toHaveBeenCalledWith(
        '/notifications/mark-all-read',
        {},
        { token: mockToken }
      );
      expect(result).toEqual(mockResponse);
      expect(result.count).toBe(5);
    });

    it('should handle zero notifications marked', async () => {
      const mockResponse = { message: 'All notifications marked as read', count: 0 };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await notificationService.markAllAsRead();

      expect(result.count).toBe(0);
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      const notificationId = 'notif-123';
      const mockResponse = { message: 'Notification deleted' };

      vi.mocked(api.delete).mockResolvedValue(mockResponse);

      const result = await notificationService.deleteNotification(notificationId);

      expect(api.delete).toHaveBeenCalledWith(
        `/notifications/${notificationId}`,
        { token: mockToken }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors when deleting', async () => {
      const notificationId = 'notif-123';
      const error = new Error('Not found');

      vi.mocked(api.delete).mockRejectedValue(error);

      await expect(notificationService.deleteNotification(notificationId)).rejects.toThrow('Not found');
    });
  });

  describe('getPreferences', () => {
    it('should fetch notification preferences', async () => {
      const mockPreferences: NotificationPreferences = {
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

      vi.mocked(api.get).mockResolvedValue(mockPreferences);

      const result = await notificationService.getPreferences();

      expect(api.get).toHaveBeenCalledWith(
        '/users/notification-preferences',
        { token: mockToken }
      );
      expect(result).toEqual(mockPreferences);
    });

    it('should handle preferences with quiet hours', async () => {
      const mockPreferences: NotificationPreferences = {
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
        batchNotifications: true,
        batchInterval: 5,
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00'
      };

      vi.mocked(api.get).mockResolvedValue(mockPreferences);

      const result = await notificationService.getPreferences();

      expect(result.quietHoursEnabled).toBe(true);
      expect(result.quietHoursStart).toBe('22:00');
      expect(result.quietHoursEnd).toBe('08:00');
    });
  });

  describe('updatePreferences', () => {
    it('should update notification preferences', async () => {
      const updates = {
        emailNotifications: false,
        batchNotifications: true,
        batchInterval: 5
      };

      const mockUpdatedPreferences: NotificationPreferences = {
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

      vi.mocked(api.patch).mockResolvedValue(mockUpdatedPreferences);

      const result = await notificationService.updatePreferences(updates);

      expect(api.patch).toHaveBeenCalledWith(
        '/users/notification-preferences',
        updates,
        { token: mockToken }
      );
      expect(result).toEqual(mockUpdatedPreferences);
      expect(result.emailNotifications).toBe(false);
      expect(result.batchNotifications).toBe(true);
    });

    it('should update quiet hours settings', async () => {
      const updates = {
        quietHoursEnabled: true,
        quietHoursStart: '23:00',
        quietHoursEnd: '07:00'
      };

      const mockUpdatedPreferences: NotificationPreferences = {
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
        quietHoursStart: '23:00',
        quietHoursEnd: '07:00'
      };

      vi.mocked(api.patch).mockResolvedValue(mockUpdatedPreferences);

      const result = await notificationService.updatePreferences(updates);

      expect(result.quietHoursEnabled).toBe(true);
      expect(result.quietHoursStart).toBe('23:00');
      expect(result.quietHoursEnd).toBe('07:00');
    });

    it('should handle partial updates', async () => {
      const updates = {
        notifyOnItemEdited: true
      };

      const mockUpdatedPreferences: NotificationPreferences = {
        userId: 'user-1',
        emailNotifications: true,
        pushNotifications: true,
        inAppNotifications: true,
        notifyOnCollaboratorJoined: true,
        notifyOnItemAdded: true,
        notifyOnItemEdited: true,
        notifyOnItemDeleted: true,
        notifyOnScheduleChanged: true,
        notifyOnMention: true,
        batchNotifications: false,
        batchInterval: 1,
        quietHoursEnabled: false
      };

      vi.mocked(api.patch).mockResolvedValue(mockUpdatedPreferences);

      const result = await notificationService.updatePreferences(updates);

      expect(result.notifyOnItemEdited).toBe(true);
    });
  });

  describe('resetPreferences', () => {
    it('should reset preferences to defaults', async () => {
      const mockResponse = {
        message: 'Notification preferences reset to defaults',
        preferences: {
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
        }
      };

      vi.mocked(api.delete).mockResolvedValue(mockResponse);

      const result = await notificationService.resetPreferences();

      expect(api.delete).toHaveBeenCalledWith(
        '/users/notification-preferences',
        { token: mockToken }
      );
      expect(result).toEqual(mockResponse);
      expect(result.preferences.emailNotifications).toBe(true);
    });
  });

  describe('legacy methods', () => {
    it('should accept collaboration invite', async () => {
      const notificationId = 'notif-123';

      vi.mocked(api.post).mockResolvedValue(undefined);

      await notificationService.acceptCollaborationInvite(notificationId);

      expect(api.post).toHaveBeenCalledWith(
        `/notifications/${notificationId}/accept`,
        {},
        { token: mockToken }
      );
    });

    it('should decline collaboration invite', async () => {
      const notificationId = 'notif-123';

      vi.mocked(api.post).mockResolvedValue(undefined);

      await notificationService.declineCollaborationInvite(notificationId);

      expect(api.post).toHaveBeenCalledWith(
        `/notifications/${notificationId}/decline`,
        {},
        { token: mockToken }
      );
    });
  });

  describe('authentication', () => {
    it('should handle missing auth token', async () => {
      vi.mocked(useEnhancedAuthStore.getState).mockReturnValue({
        accessToken: undefined,
      } as any);

      vi.mocked(api.get).mockResolvedValue({
        notifications: [],
        total: 0,
        unreadCount: 0,
        hasMore: false
      });

      await notificationService.getNotifications();

      expect(api.get).toHaveBeenCalledWith('/notifications', { token: undefined });
    });
  });

  describe('error handling', () => {
    it('should propagate API errors', async () => {
      const error = new Error('API Error');
      vi.mocked(api.get).mockRejectedValue(error);

      await expect(notificationService.getNotifications()).rejects.toThrow('API Error');
    });

    it('should handle network errors', async () => {
      const error = new Error('Network error');
      vi.mocked(api.patch).mockRejectedValue(error);

      await expect(notificationService.markAsRead('notif-123')).rejects.toThrow('Network error');
    });
  });
});
