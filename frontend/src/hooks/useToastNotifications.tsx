import React, { createContext, useContext, useState, useCallback } from 'react';
import { Notification } from '../components/common/Notification';

interface NotificationItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  showNotification: (notification: Omit<NotificationItem, 'id'>) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const showNotification = useCallback((notification: Omit<NotificationItem, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    setNotifications((prev) => [...prev, { ...notification, id }]);
  }, []);

  const showSuccess = useCallback((message: string, duration = 3000) => {
    showNotification({ type: 'success', message, duration });
  }, [showNotification]);

  const showError = useCallback((message: string, duration = 5000) => {
    showNotification({ type: 'error', message, duration });
  }, [showNotification]);

  const showWarning = useCallback((message: string, duration = 4000) => {
    showNotification({ type: 'warning', message, duration });
  }, [showNotification]);

  const showInfo = useCallback((message: string, duration = 3000) => {
    showNotification({ type: 'info', message, duration });
  }, [showNotification]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}
      
      {/* Notification container */}
      <div className="notification-container">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            type={notification.type}
            message={notification.message}
            duration={notification.duration}
            action={notification.action}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>

      <style>{`
        .notification-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 12px;
          pointer-events: none;
        }

        .notification-container > * {
          pointer-events: auto;
        }

        @media (max-width: 768px) {
          .notification-container {
            top: 10px;
            right: 10px;
            left: 10px;
          }
        }
      `}</style>
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
