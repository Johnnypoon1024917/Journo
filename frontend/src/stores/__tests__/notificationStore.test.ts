/**
 * Notification Store Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useNotificationStore, Notification } from '../notificationStore';
import { notificationService } from '../../services/notificationService';

// Mock the notification service
vi.mock('../../services/notificationService', () => ({
  notificationService: {
    getNotifications: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    deleteNotification: vi.fn(),
  },
}));

describe('NotificationStore', () => {
  const mockNotification: Notification = {
    id: 'notif-1',
    userId: 'user-1',
    type: 'place_added',
    category: 'activity',
    priority: 'normal',
    title: 'New Place Added',
    message: 'John added Tokyo Tower',
    data: { placeId: 'place-1', placeName: 'Tokyo Tower' },
    actionUrl: '/trips/trip-1',
    isRead: false,
    createdAt: '2024-01-01T10:00:00Z',
  };

  const mockNotification2: Notification = {
    id: 'notif-2',
    userId: 'user-1',
    type: 'collaborator_added',
    category: 'collaboration',
    priority: 'high',
    title: 'New Collaborator',
    message: 'Jane joined your trip',
    data: { collaboratorId: 'user-2', collaboratorName: 'Jane' },
    actionUrl: '/trips/trip-1/members',
    isRead: true,
    readAt: '2024-01-01T11:00:00Z',
    createdAt: '2024-01-01T09:00:00Z',
  };

  beforeEach(() => {
    // Reset store state
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
      hasMore: false,
      filters: { limit: 50, offset: 0 },
    });

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useNotificationStore.getState();
      
      expect(state.notifications).toEqual([]);
      expect(state.unreadCount).toBe(0);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.hasMore).toBe(false);
      expect(state.filters).toEqual({ limit: 50, offset: 0 });
    });
  });

  describe('fetchNotifications', () => {
    it('should fetch notifications successfully', async () => {
      const mockResponse = {
        notifications: [mockNotification, mockNotification2],
        total: 2,
        unreadCount: 1,
        hasMore: false,
      };

      vi.mocked(notificationService.getNotifications).mockResolvedValue(mockResponse);

      await useNotificationStore.getState().fetchNotifications();

      const state = useNotificationStore.getState();
      expect(state.notifications).toEqual(mockResponse.notifications);
      expect(state.unreadCount).toBe(1);
      expect(state.hasMore).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should set loading state while fetching', async () => {
      const mockResponse = {
        notifications: [],
        total: 0,
        unreadCount: 0,
        hasMore: false,
      };

      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(notificationService.getNotifications).mockReturnValue(promise as any);

      const fetchPromise = useNotificationStore.getState().fetchNotifications();

      // Check loading state
      expect(useNotificationStore.getState().isLoading).toBe(true);

      // Resolve the promise
      resolvePromise!(mockResponse);
      await fetchPromise;

      // Check final state
      expect(useNotificationStore.getState().isLoading).toBe(false);
    });

    it('should handle fetch errors', async () => {
      const errorMessage = 'Network error';
      vi.mocked(notificationService.getNotifications).mockRejectedValue(
        new Error(errorMessage)
      );

      await useNotificationStore.getState().fetchNotifications();

      const state = useNotificationStore.getState();
      expect(state.error).toBe(errorMessage);
      expect(state.isLoading).toBe(false);
    });

    it('should merge filters when fetching', async () => {
      const mockResponse = {
        notifications: [],
        total: 0,
        unreadCount: 0,
        hasMore: false,
      };

      vi.mocked(notificationService.getNotifications).mockResolvedValue(mockResponse);

      await useNotificationStore.getState().fetchNotifications({
        category: 'activity',
        isRead: false,
      });

      expect(notificationService.getNotifications).toHaveBeenCalledWith({
        limit: 50,
        offset: 0,
        category: 'activity',
        isRead: false,
      });
    });
  });

  describe('addNotification', () => {
    it('should add a new notification', () => {
      useNotificationStore.getState().addNotification(mockNotification);

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0]).toEqual(mockNotification);
      expect(state.unreadCount).toBe(1);
    });

    it('should add notification to the beginning of the array', () => {
      useNotificationStore.setState({
        notifications: [mockNotification2],
        unreadCount: 0,
      });

      useNotificationStore.getState().addNotification(mockNotification);

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(2);
      expect(state.notifications[0]).toEqual(mockNotification);
      expect(state.notifications[1]).toEqual(mockNotification2);
    });

    it('should not add duplicate notifications', () => {
      useNotificationStore.setState({
        notifications: [mockNotification],
        unreadCount: 1,
      });

      useNotificationStore.getState().addNotification(mockNotification);

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(1);
      expect(state.unreadCount).toBe(1);
    });

    it('should not increment unread count for read notifications', () => {
      useNotificationStore.getState().addNotification(mockNotification2);

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(1);
      expect(state.unreadCount).toBe(0);
    });
  });

  describe('markAsRead', () => {
    beforeEach(() => {
      useNotificationStore.setState({
        notifications: [mockNotification, mockNotification2],
        unreadCount: 1,
      });
    });

    it('should mark notification as read optimistically', async () => {
      vi.mocked(notificationService.markAsRead).mockResolvedValue();

      await useNotificationStore.getState().markAsRead('notif-1');

      const state = useNotificationStore.getState();
      const notification = state.notifications.find(n => n.id === 'notif-1');
      
      expect(notification?.isRead).toBe(true);
      expect(notification?.readAt).toBeDefined();
      expect(state.unreadCount).toBe(0);
      expect(notificationService.markAsRead).toHaveBeenCalledWith('notif-1');
    });

    it('should not change state if notification is already read', async () => {
      vi.mocked(notificationService.markAsRead).mockResolvedValue();

      await useNotificationStore.getState().markAsRead('notif-2');

      const state = useNotificationStore.getState();
      expect(state.unreadCount).toBe(1);
      expect(notificationService.markAsRead).toHaveBeenCalledWith('notif-2');
    });

    it('should revert optimistic update on error', async () => {
      vi.mocked(notificationService.markAsRead).mockRejectedValue(
        new Error('Failed to mark as read')
      );

      await useNotificationStore.getState().markAsRead('notif-1');

      const state = useNotificationStore.getState();
      const notification = state.notifications.find(n => n.id === 'notif-1');
      
      expect(notification?.isRead).toBe(false);
      expect(notification?.readAt).toBeUndefined();
      expect(state.unreadCount).toBe(1);
      expect(state.error).toBe('Failed to mark as read');
    });

    it('should not go below 0 for unread count', async () => {
      useNotificationStore.setState({
        notifications: [mockNotification2],
        unreadCount: 0,
      });

      vi.mocked(notificationService.markAsRead).mockResolvedValue();

      await useNotificationStore.getState().markAsRead('notif-2');

      const state = useNotificationStore.getState();
      expect(state.unreadCount).toBe(0);
    });
  });

  describe('markAllAsRead', () => {
    beforeEach(() => {
      useNotificationStore.setState({
        notifications: [mockNotification, mockNotification2],
        unreadCount: 1,
      });
    });

    it('should mark all notifications as read optimistically', async () => {
      vi.mocked(notificationService.markAllAsRead).mockResolvedValue();

      await useNotificationStore.getState().markAllAsRead();

      const state = useNotificationStore.getState();
      expect(state.notifications.every(n => n.isRead)).toBe(true);
      expect(state.unreadCount).toBe(0);
      expect(notificationService.markAllAsRead).toHaveBeenCalled();
    });

    it('should revert optimistic update on error', async () => {
      const previousNotifications = [...useNotificationStore.getState().notifications];
      const previousUnreadCount = useNotificationStore.getState().unreadCount;

      vi.mocked(notificationService.markAllAsRead).mockRejectedValue(
        new Error('Failed to mark all as read')
      );

      await useNotificationStore.getState().markAllAsRead();

      const state = useNotificationStore.getState();
      expect(state.notifications).toEqual(previousNotifications);
      expect(state.unreadCount).toBe(previousUnreadCount);
      expect(state.error).toBe('Failed to mark all as read');
    });
  });

  describe('deleteNotification', () => {
    beforeEach(() => {
      useNotificationStore.setState({
        notifications: [mockNotification, mockNotification2],
        unreadCount: 1,
      });
    });

    it('should delete notification optimistically', async () => {
      vi.mocked(notificationService.deleteNotification).mockResolvedValue();

      await useNotificationStore.getState().deleteNotification('notif-1');

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0].id).toBe('notif-2');
      expect(state.unreadCount).toBe(0);
      expect(notificationService.deleteNotification).toHaveBeenCalledWith('notif-1');
    });

    it('should not change unread count when deleting read notification', async () => {
      vi.mocked(notificationService.deleteNotification).mockResolvedValue();

      await useNotificationStore.getState().deleteNotification('notif-2');

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(1);
      expect(state.unreadCount).toBe(1);
    });

    it('should revert optimistic update on error', async () => {
      const previousNotifications = [...useNotificationStore.getState().notifications];
      const previousUnreadCount = useNotificationStore.getState().unreadCount;

      vi.mocked(notificationService.deleteNotification).mockRejectedValue(
        new Error('Failed to delete')
      );

      await useNotificationStore.getState().deleteNotification('notif-1');

      const state = useNotificationStore.getState();
      expect(state.notifications).toEqual(previousNotifications);
      expect(state.unreadCount).toBe(previousUnreadCount);
      expect(state.error).toBe('Failed to delete');
    });
  });

  describe('setFilters', () => {
    it('should update filters', () => {
      useNotificationStore.getState().setFilters({
        category: 'activity',
        isRead: false,
      });

      const state = useNotificationStore.getState();
      expect(state.filters).toEqual({
        limit: 50,
        offset: 0,
        category: 'activity',
        isRead: false,
      });
    });

    it('should merge with existing filters', () => {
      useNotificationStore.setState({
        filters: { limit: 20, offset: 10 },
      });

      useNotificationStore.getState().setFilters({
        category: 'collaboration',
      });

      const state = useNotificationStore.getState();
      expect(state.filters).toEqual({
        limit: 20,
        offset: 10,
        category: 'collaboration',
      });
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      useNotificationStore.setState({
        error: 'Some error',
      });

      useNotificationStore.getState().clearError();

      const state = useNotificationStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('Getters', () => {
    beforeEach(() => {
      useNotificationStore.setState({
        notifications: [mockNotification, mockNotification2],
        unreadCount: 1,
      });
    });

    describe('getNotification', () => {
      it('should return notification by id', () => {
        const notification = useNotificationStore.getState().getNotification('notif-1');
        expect(notification).toEqual(mockNotification);
      });

      it('should return undefined for non-existent id', () => {
        const notification = useNotificationStore.getState().getNotification('non-existent');
        expect(notification).toBeUndefined();
      });
    });

    describe('getUnreadNotifications', () => {
      it('should return only unread notifications', () => {
        const unread = useNotificationStore.getState().getUnreadNotifications();
        expect(unread).toHaveLength(1);
        expect(unread[0].id).toBe('notif-1');
      });

      it('should return empty array when all notifications are read', () => {
        useNotificationStore.setState({
          notifications: [mockNotification2],
          unreadCount: 0,
        });

        const unread = useNotificationStore.getState().getUnreadNotifications();
        expect(unread).toHaveLength(0);
      });
    });

    describe('getNotificationsByCategory', () => {
      it('should return notifications filtered by category', () => {
        const activityNotifications = useNotificationStore
          .getState()
          .getNotificationsByCategory('activity');
        
        expect(activityNotifications).toHaveLength(1);
        expect(activityNotifications[0].id).toBe('notif-1');
      });

      it('should return empty array for category with no notifications', () => {
        const mentionNotifications = useNotificationStore
          .getState()
          .getNotificationsByCategory('mention');
        
        expect(mentionNotifications).toHaveLength(0);
      });
    });
  });
});
