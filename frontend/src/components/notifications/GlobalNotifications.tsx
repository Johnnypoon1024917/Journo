/**
 * GlobalNotifications Component
 * Displays toast notifications and provides access to notification center
 */

import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationCenter } from '../bubblequest/NotificationCenterWeb';
import { useEnhancedAuthStore } from '../../stores/enhancedAuthStore';
import { useFABPosition, getFABStyle } from '../../hooks/useFABPosition';
import { useLocation } from 'react-router-dom';

export const GlobalNotifications: React.FC = () => {
  const [showCenter, setShowCenter] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; title: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }>>([]);
  const { notifications, unreadCount } = useNotifications();
  const isAuthenticated = useEnhancedAuthStore((state) => state.isAuthenticated);
  const accessToken = useEnhancedAuthStore((state) => state.accessToken);
  const location = useLocation();
  
  // Check if we're on a page with bottom navigation
  const hasBottomNav = location.pathname.includes('/trips/');
  
  // Get FAB position (notification is always top-most, index 0)
  const fabPosition = useFABPosition({ 
    type: 'notification', 
    index: 0,
    hasBottomNav 
  });

  // Listen for new notifications and show toasts
  useEffect(() => {
    if (notifications.length === 0) return;

    const latestNotification = notifications[0];
    
    // Check if we already showed a toast for this notification
    const alreadyShown = toasts.some(t => t.id === latestNotification.id);
    if (alreadyShown) return;

    // Determine toast type based on notification priority
    let type: 'info' | 'success' | 'warning' | 'error' = 'info';
    if (latestNotification.priority === 'urgent') {
      type = 'error';
    } else if (latestNotification.priority === 'high') {
      type = 'warning';
    } else if (latestNotification.category === 'collaboration') {
      type = 'success';
    }

    // Add toast
    const newToast = {
      id: latestNotification.id,
      title: latestNotification.title,
      message: latestNotification.message,
      type,
    };

    setToasts(prev => [newToast, ...prev].slice(0, 3)); // Keep max 3 toasts

    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== latestNotification.id));
    }, 5000);
  }, [notifications]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Don't render anything if not authenticated
  if (!isAuthenticated || !accessToken) {
    return null;
  }

  return (
    <>
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto
              bg-white dark:bg-gray-800 
              rounded-lg shadow-lg 
              p-4 
              border-l-4
              toast-enter
              ${toast.type === 'error' ? 'border-red-500' : ''}
              ${toast.type === 'warning' ? 'border-yellow-500' : ''}
              ${toast.type === 'success' ? 'border-green-500' : ''}
              ${toast.type === 'info' ? 'border-blue-500' : ''}
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                  {toast.title}
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Notification Bell Button */}
      <button
        onClick={() => setShowCenter(true)}
        style={getFABStyle(fabPosition)}
        className="bg-bubblequest-primary-500 hover:bg-bubblequest-primary-600 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110"
        aria-label="Open notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Center */}
      <NotificationCenter
        visible={showCenter}
        onClose={() => setShowCenter(false)}
      />
    </>
  );
};
