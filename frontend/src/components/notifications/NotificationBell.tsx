import { useState, useEffect } from 'react';
import { notificationService } from '../../services/notificationService';
import { Notification } from '../../types/notification';
import { NotificationDropdown } from './NotificationDropdown.tsx';
import { useToast } from '../../hooks/useToast';
import { useEnhancedAuthStore } from '../../stores/enhancedAuthStore';

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { error } = useToast();
  const { isAuthenticated, accessToken } = useEnhancedAuthStore();

  const fetchNotifications = async () => {
    // Double-check auth state before making the request
    const currentAuthState = useEnhancedAuthStore.getState();
    if (!currentAuthState.isAuthenticated || !currentAuthState.accessToken) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await notificationService.getNotifications();
      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
    } catch (err: any) {
      // For 401 errors, clear local state and stop retrying
      // The auth system will handle logout and redirect
      if (err.status === 401 || err.code === 'AUTH_REQUIRED') {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      
      // For other errors, just log them in dev - don't show error toast
      // Notifications are a nice-to-have feature, not critical
      if (import.meta.env.DEV) {
        console.debug('Notifications fetch error:', err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      // Add a delay to ensure auth is fully established
      // and to avoid race conditions with token refresh
      const timer = setTimeout(() => {
        fetchNotifications();
      }, 2000); // Wait 2 seconds after auth is confirmed
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        // Only fetch if still authenticated
        if (useEnhancedAuthStore.getState().isAuthenticated) {
          fetchNotifications();
        }
      }, 30000);
      
      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    } else {
      // Clear notifications when not authenticated
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, accessToken]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err: any) {
      error('Failed to mark all notifications as read');
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      const deletedNotification = notifications.find(n => n.id === notificationId);
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err: any) {
      error('Failed to delete notification');
    }
  };

  const handleAcceptInvite = async (notificationId: string) => {
    try {
      await notificationService.acceptCollaborationInvite(notificationId);
      await fetchNotifications(); // Refresh notifications
    } catch (err: any) {
      error('Failed to accept invitation');
    }
  };

  const handleDeclineInvite = async (notificationId: string) => {
    try {
      await notificationService.declineCollaborationInvite(notificationId);
      await fetchNotifications(); // Refresh notifications
    } catch (err: any) {
      error('Failed to decline invitation');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 rounded-full transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 19H6.5A2.5 2.5 0 014 16.5v-9A2.5 2.5 0 016.5 5h11A2.5 2.5 0 0120 7.5v3.5" />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown
          notifications={notifications}
          isLoading={isLoading}
          onClose={() => setIsOpen(false)}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onDelete={handleDelete}
          onAcceptInvite={handleAcceptInvite}
          onDeclineInvite={handleDeclineInvite}
        />
      )}
    </div>
  );
}