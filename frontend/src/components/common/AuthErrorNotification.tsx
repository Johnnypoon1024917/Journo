/**
 * Authentication Error Notification Component
 * 
 * Displays user-friendly authentication error messages with recovery options
 * 
 * Requirements: 2.4, 2.5, 6.4, 6.5
 */

import React, { useEffect, useState } from 'react';
import { AuthErrorDetails } from '../../services/authErrorHandler';

interface AuthErrorNotificationProps {
  error: AuthErrorDetails | null;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export const AuthErrorNotification: React.FC<AuthErrorNotificationProps> = ({
  error,
  onClose,
  autoClose = false,
  autoCloseDelay = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);

      if (autoClose && !error.recoverable) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseDelay);

        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [error, autoClose, autoCloseDelay]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation
  };

  const handleRecovery = () => {
    if (error?.recoveryAction) {
      error.recoveryAction();
    }
    handleClose();
  };

  if (!error || !isVisible) {
    return null;
  }

  return (
    <div
      className="fixed top-4 right-4 z-50 max-w-md animate-slide-in-right"
      role="alert"
      aria-live="assertive"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border-l-4 border-red-500 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {error.title}
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {error.message}
            </p>
            
            {error.recoverable && error.recoveryAction && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleRecovery}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  {error.recoveryLabel || 'Retry'}
                </button>
                <button
                  onClick={handleClose}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
          
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleClose}
              className="inline-flex text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded-md transition-colors"
              aria-label="Close notification"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
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
      </div>
    </div>
  );
};

export default AuthErrorNotification;
