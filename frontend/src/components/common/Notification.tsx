import React, { useEffect, useState } from 'react';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationProps {
  type: NotificationType;
  message: string;
  duration?: number;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  duration = 5000,
  onClose,
  action,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = (): string => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: '#10b981',
          text: '#ffffff',
        };
      case 'error':
        return {
          bg: '#ef4444',
          text: '#ffffff',
        };
      case 'warning':
        return {
          bg: '#f59e0b',
          text: '#ffffff',
        };
      case 'info':
        return {
          bg: '#3b82f6',
          text: '#ffffff',
        };
    }
  };

  const colors = getColors();

  if (!isVisible) return null;

  return (
    <div className={`notification ${isVisible ? 'visible' : 'hidden'}`} role="alert">
      <div className="notification-icon">{getIcon()}</div>
      <div className="notification-content">
        <p className="notification-message">{message}</p>
      </div>
      {action && (
        <button className="notification-action" onClick={action.onClick}>
          {action.label}
        </button>
      )}
      {onClose && (
        <button
          className="notification-close"
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose(), 300);
          }}
          aria-label="Close notification"
        >
          ✕
        </button>
      )}

      <style>{`
        .notification {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: ${colors.bg};
          color: ${colors.text};
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          min-width: 300px;
          max-width: 500px;
          opacity: 0;
          transform: translateY(-20px);
          transition: all 0.3s ease;
        }

        .notification.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .notification.hidden {
          opacity: 0;
          transform: translateY(-20px);
        }

        .notification-icon {
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: bold;
        }

        .notification-content {
          flex: 1;
          min-width: 0;
        }

        .notification-message {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
        }

        .notification-action {
          flex-shrink: 0;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 4px;
          color: ${colors.text};
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .notification-action:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .notification-close {
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          color: ${colors.text};
          font-size: 16px;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .notification-close:hover {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};
