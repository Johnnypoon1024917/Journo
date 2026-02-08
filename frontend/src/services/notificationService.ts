import api from './api';
import { useEnhancedAuthStore } from '../stores/enhancedAuthStore';
import { 
  NotificationResponse, 
  NotificationFilters, 
  Notification,
  NotificationPreferences,
  UpdateNotificationPreferencesDto
} from '../types/notification';

// Get token at call time, not import time
const getAuthToken = (): string | undefined => {
  const state = useEnhancedAuthStore.getState();
  const token = state.accessToken;
  console.log('🔑 getAuthToken called:', {
    hasState: !!state,
    isAuthenticated: state.isAuthenticated,
    hasAccessToken: !!token,
    tokenPreview: token ? token.substring(0, 20) + '...' : 'null'
  });
  return token || undefined;
};

export const notificationService = {
  /**
   * Get notifications with optional filtering
   * @param filters - Optional filters for notifications
   * @returns Promise with notifications, total count, unread count, and hasMore flag
   */
  async getNotifications(filters?: NotificationFilters): Promise<NotificationResponse> {
    const params = new URLSearchParams();
    
    if (filters?.limit !== undefined) {
      params.append('limit', filters.limit.toString());
    }
    if (filters?.offset !== undefined) {
      params.append('offset', filters.offset.toString());
    }
    if (filters?.category) {
      params.append('category', filters.category);
    }
    if (filters?.isRead !== undefined) {
      params.append('isRead', filters.isRead.toString());
    }
    if (filters?.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters?.endDate) {
      params.append('endDate', filters.endDate);
    }

    const queryString = params.toString();
    const url = queryString ? `/notifications?${queryString}` : '/notifications';
    
    const token = getAuthToken();
    console.log('📬 getNotifications - token available:', !!token);
    
    const response = await api.get<NotificationResponse>(
      url,
      { token }
    );
    return response;
  },

  /**
   * Mark a notification as read
   * @param notificationId - ID of the notification to mark as read
   * @returns Promise with the updated notification
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await api.patch<Notification>(
      `/notifications/${notificationId}/read`,
      {},
      { token: getAuthToken() }
    );
    return response;
  },

  /**
   * Mark all notifications as read
   * @returns Promise with count of notifications marked as read
   */
  async markAllAsRead(): Promise<{ message: string; count: number }> {
    const token = getAuthToken();
    if (!token) {
      console.error('No auth token available for markAllAsRead');
      throw new Error('Authentication required');
    }
    
    const response = await api.post<{ message: string; count: number }>(
      '/notifications/mark-all-read',
      {},
      { token }
    );
    return response;
  },

  /**
   * Delete a notification
   * @param notificationId - ID of the notification to delete
   * @returns Promise with success message
   */
  async deleteNotification(notificationId: string): Promise<{ message: string }> {
    const token = getAuthToken();
    if (!token) {
      console.error('No auth token available for deleteNotification');
      throw new Error('Authentication required');
    }
    
    const response = await api.delete<{ message: string }>(
      `/notifications/${notificationId}`,
      { token }
    );
    return response;
  },

  /**
   * Get user notification preferences
   * @returns Promise with user's notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    const response = await api.get<NotificationPreferences>(
      '/users/notification-preferences',
      { token: getAuthToken() }
    );
    return response;
  },

  /**
   * Update user notification preferences
   * @param preferences - Partial preferences object with fields to update
   * @returns Promise with updated preferences
   */
  async updatePreferences(preferences: UpdateNotificationPreferencesDto): Promise<NotificationPreferences> {
    const response = await api.patch<NotificationPreferences>(
      '/users/notification-preferences',
      preferences,
      { token: getAuthToken() }
    );
    return response;
  },

  /**
   * Reset notification preferences to defaults
   * @returns Promise with default preferences
   */
  async resetPreferences(): Promise<{ message: string; preferences: NotificationPreferences }> {
    const response = await api.delete<{ message: string; preferences: NotificationPreferences }>(
      '/users/notification-preferences',
      { token: getAuthToken() }
    );
    return response;
  },

  // Legacy methods for backward compatibility
  
  /**
   * Accept a collaboration invite
   * @param notificationId - ID of the notification
   * @deprecated Use collaboration-specific endpoints instead
   */
  async acceptCollaborationInvite(notificationId: string): Promise<void> {
    await api.post<void>(
      `/notifications/${notificationId}/accept`,
      {},
      { token: getAuthToken() }
    );
  },

  /**
   * Decline a collaboration invite
   * @param notificationId - ID of the notification
   * @deprecated Use collaboration-specific endpoints instead
   */
  async declineCollaborationInvite(notificationId: string): Promise<void> {
    await api.post<void>(
      `/notifications/${notificationId}/decline`,
      {},
      { token: getAuthToken() }
    );
  }
};
