/**
 * NotificationCenter Component (Web Version)
 * Message bubble style popup for viewing and managing notifications
 */

import React, { useEffect, useState } from 'react';
import { X, Bell, Check, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../stores/notificationStore';
import { useEnhancedAuthStore } from '../../stores/enhancedAuthStore';

interface NotificationCenterProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  visible,
  onClose,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  const isAuthenticated = useEnhancedAuthStore((state) => state.isAuthenticated);
  const accessToken = useEnhancedAuthStore((state) => state.accessToken);
  
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore();

  const handleRefresh = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setIsRefreshing(true);
    try {
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Don't fetch when panel opens - notifications are already loaded by useNotifications hook
    // This prevents duplicate fetches and 401 cascades
  }, [visible, isAuthenticated, accessToken, fetchNotifications]);

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const handleNotificationClick = async (notificationId: string, actionUrl?: string) => {
    await markAsRead(notificationId);
    if (actionUrl) {
      // Close the notification center first
      onClose();
      // Use React Router navigation instead of window.location to avoid full page refresh
      navigate(actionUrl);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'collaboration': return 'text-blue-600 bg-blue-50';
      case 'activity': return 'text-green-600 bg-green-50';
      case 'mention': return 'text-purple-600 bg-purple-50';
      case 'system': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return '🔴';
      case 'high': return '🟠';
      case 'normal': return '🔵';
      case 'low': return '⚪';
      default: return '🔵';
    }
  };

  if (!visible) return null;

  // Don't show if not authenticated
  if (!isAuthenticated || !accessToken) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-transparent z-[9998]"
        onClick={onClose}
      />

      {/* Message Bubble Popup */}
      <div 
        className="fixed bottom-24 right-6 w-96 max-h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-[9999] overflow-hidden border border-gray-200 dark:border-gray-700"
        style={{
          animation: 'modalScaleIn 250ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-kawaii-primary-50 to-kawaii-secondary-50 dark:from-gray-700 dark:to-gray-800">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-kawaii-primary-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/50 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Close notifications"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === 'all'
                  ? 'bg-kawaii-primary-500 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === 'unread'
                  ? 'bg-kawaii-primary-500 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleRefresh(e);
              }}
              type="button"
              disabled={isRefreshing}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              title="Refresh notifications"
            >
              {isRefreshing ? '⟳' : '↻'}
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="text-xs text-kawaii-primary-500 hover:text-kawaii-primary-600 font-medium transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto" style={{ maxHeight: '450px' }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kawaii-primary-500" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1">
                You'll see updates here when something happens
              </p>
            </div>
          ) : (
            <div>
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                    !notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification.id, notification.actionUrl)}
                >
                  <div className="flex items-start space-x-2">
                    {/* Priority Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      <span className="text-base">{getPriorityIcon(notification.priority)}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>

                      {/* Category Badge & Time */}
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCategoryColor(notification.category)}`}>
                          {notification.category}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-1 flex-shrink-0">
                      {!notification.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                          aria-label="Mark as read"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                        aria-label="Delete notification"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
