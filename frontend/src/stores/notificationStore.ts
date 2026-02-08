/**
 * Notification Store
 * Manages notification state with real-time updates
 */

import { create } from 'zustand';
import { notificationService } from '../services/notificationService';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  category: 'collaboration' | 'activity' | 'mention' | 'system';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  title: string;
  message: string;
  data: Record<string, any>;
  actionUrl?: string;
  isRead: boolean;
  readAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface NotificationFilters {
  category?: 'collaboration' | 'activity' | 'mention' | 'system';
  isRead?: boolean;
  limit?: number;
  offset?: number;
}

interface NotificationStore {
  // State
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  filters: NotificationFilters;
  lastFetchTime: number; // Track last fetch to prevent rapid calls

  // Actions
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  setFilters: (filters: NotificationFilters) => void;
  clearError: () => void;
  
  // Getters
  getNotification: (notificationId: string) => Notification | undefined;
  getUnreadNotifications: () => Notification[];
  getNotificationsByCategory: (category: Notification['category']) => Notification[];
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  // Initial state
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  hasMore: false,
  lastFetchTime: 0,
  filters: {
    limit: 50,
    offset: 0,
  },

  // Actions
  fetchNotifications: async (filters?: NotificationFilters) => {
    // Prevent rapid successive calls (debounce 1 second)
    const now = Date.now();
    const timeSinceLastFetch = now - get().lastFetchTime;
    if (timeSinceLastFetch < 1000 && get().lastFetchTime > 0) {
      console.debug('⏭️ Skipping notification fetch - too soon since last fetch (', timeSinceLastFetch, 'ms)');
      return;
    }

    // Prevent multiple simultaneous fetches
    if (get().isLoading) {
      console.debug('⏭️ Skipping notification fetch - already loading');
      return;
    }

    try {
      set({ isLoading: true, error: null, lastFetchTime: now });
      
      const mergedFilters = {
        ...get().filters,
        ...filters,
      };

      const response = await notificationService.getNotifications(mergedFilters);
      
      set({
        notifications: response.notifications,
        unreadCount: response.unreadCount,
        hasMore: response.hasMore || false,
        filters: mergedFilters,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      // Silently fail if authentication error - don't set error state or log
      if (error.code === 'AUTH_REQUIRED' || 
          error.status === 401 || 
          error.message?.includes('Authentication') || 
          error.message?.includes('Unauthorized')) {
        set({
          isLoading: false,
          error: null, // Don't show error for auth issues
        });
        return;
      }
      
      // Only log and set error for non-auth issues
      console.error('Failed to fetch notifications:', error);
      set({
        error: error.message || 'Failed to fetch notifications',
        isLoading: false,
      });
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => {
      // Check if notification already exists
      const exists = state.notifications.some(n => n.id === notification.id);
      if (exists) {
        return state;
      }

      // Add notification to the beginning of the array
      const updatedNotifications = [notification, ...state.notifications];
      
      // Update unread count if notification is unread
      const updatedUnreadCount = notification.isRead 
        ? state.unreadCount 
        : state.unreadCount + 1;

      return {
        notifications: updatedNotifications,
        unreadCount: updatedUnreadCount,
      };
    });
  },

  markAsRead: async (notificationId: string) => {
    try {
      // Optimistic update
      set((state) => {
        const notification = state.notifications.find(n => n.id === notificationId);
        if (!notification || notification.isRead) {
          return state;
        }

        const updatedNotifications = state.notifications.map(n =>
          n.id === notificationId
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n
        );

        return {
          notifications: updatedNotifications,
          unreadCount: Math.max(0, state.unreadCount - 1),
        };
      });

      // Make API call
      await notificationService.markAsRead(notificationId);
    } catch (error: any) {
      console.error('Failed to mark notification as read:', error);
      
      // Revert optimistic update on error
      set((state) => {
        const updatedNotifications = state.notifications.map(n =>
          n.id === notificationId
            ? { ...n, isRead: false, readAt: undefined }
            : n
        );

        return {
          notifications: updatedNotifications,
          unreadCount: state.unreadCount + 1,
          error: error.message || 'Failed to mark notification as read',
        };
      });
    }
  },

  markAllAsRead: async () => {
    // Store previous state for potential rollback
    const previousNotifications = [...get().notifications];
    const previousUnreadCount = get().unreadCount;
    
    try {
      // Optimistic update
      set((state) => ({
        notifications: state.notifications.map(n => ({
          ...n,
          isRead: true,
          readAt: n.readAt || new Date().toISOString(),
        })),
        unreadCount: 0,
      }));

      // Make API call
      await notificationService.markAllAsRead();
    } catch (error: any) {
      console.error('Failed to mark all notifications as read:', error);
      
      // Revert optimistic update on error
      set({
        notifications: previousNotifications,
        unreadCount: previousUnreadCount,
        error: error.message || 'Failed to mark all notifications as read',
      });
    }
  },

  deleteNotification: async (notificationId: string) => {
    // Store previous state for potential rollback
    const previousNotifications = [...get().notifications];
    const previousUnreadCount = get().unreadCount;
    const notification = previousNotifications.find(n => n.id === notificationId);
    
    try {
      // Optimistic update
      set((state) => {
        const updatedNotifications = state.notifications.filter(
          n => n.id !== notificationId
        );
        
        // Update unread count if deleted notification was unread
        const updatedUnreadCount = notification && !notification.isRead
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount;

        return {
          notifications: updatedNotifications,
          unreadCount: updatedUnreadCount,
        };
      });

      // Make API call
      await notificationService.deleteNotification(notificationId);
    } catch (error: any) {
      console.error('Failed to delete notification:', error);
      
      // Revert optimistic update on error
      set({
        notifications: previousNotifications,
        unreadCount: previousUnreadCount,
        error: error.message || 'Failed to delete notification',
      });
    }
  },

  setFilters: (filters: NotificationFilters) => {
    set((state) => ({
      filters: {
        ...state.filters,
        ...filters,
      },
    }));
  },

  clearError: () => {
    set({ error: null });
  },

  // Getters
  getNotification: (notificationId: string) => {
    return get().notifications.find(n => n.id === notificationId);
  },

  getUnreadNotifications: () => {
    return get().notifications.filter(n => !n.isRead);
  },

  getNotificationsByCategory: (category: Notification['category']) => {
    return get().notifications.filter(n => n.category === category);
  },
}));

export default useNotificationStore;
