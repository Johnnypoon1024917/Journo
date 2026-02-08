/**
 * Service Status Notification Component
 * 
 * Displays notifications when service availability changes
 * Provides user feedback about system health and feature availability
 * 
 * Validates: Requirements 5.4
 */

import React, { useEffect, useState } from 'react';
import { ServiceChange } from '../../services/healthMonitor';
import { useServiceChanges } from '../../hooks/useHealthMonitor';

interface NotificationItem extends ServiceChange {
  id: string;
  dismissed: boolean;
}

export const ServiceStatusNotification: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Subscribe to service changes
  useServiceChanges((changes) => {
    // Add new notifications
    const newNotifications = changes.map((change) => ({
      ...change,
      id: `${change.service}-${change.timestamp.getTime()}`,
      dismissed: false,
    }));

    setNotifications((prev) => [...prev, ...newNotifications]);

    // Auto-dismiss after 10 seconds
    newNotifications.forEach((notification) => {
      setTimeout(() => {
        dismissNotification(notification.id);
      }, 10000);
    });
  });

  const dismissNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, dismissed: true } : n))
    );

    // Remove from DOM after animation
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 300);
  };

  // Don't render if no active notifications
  const activeNotifications = notifications.filter((n) => !n.dismissed);
  if (activeNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {activeNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 
            border-l-4 transition-all duration-300 ease-in-out
            ${
              notification.currentStatus
                ? 'border-green-500'
                : 'border-yellow-500'
            }
            ${notification.dismissed ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
          `}
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {/* Status Icon */}
              <div
                className={`
                  flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center
                  ${
                    notification.currentStatus
                      ? 'bg-green-100 dark:bg-green-900'
                      : 'bg-yellow-100 dark:bg-yellow-900'
                  }
                `}
              >
                {notification.currentStatus ? (
                  <svg
                    className="w-4 h-4 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 text-yellow-600 dark:text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                )}
              </div>

              {/* Message */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {notification.currentStatus ? 'Service Restored' : 'Service Issue'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {notification.message}
                </p>
              </div>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => dismissNotification(notification.id)}
              className="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Dismiss notification"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
