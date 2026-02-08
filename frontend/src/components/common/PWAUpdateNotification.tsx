import React, { useState, useEffect } from 'react';
import { ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Define types for PWA registration
interface PWARegistration {
  offlineReady: [boolean, (value: boolean) => void];
  needRefresh: [boolean, (value: boolean) => void];
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
}

// Mock PWA registration hook for development
const useRegisterSW = (options: {
  onRegistered?: (registration: any) => void;
  onRegisterError?: (error: any) => void;
}): PWARegistration => {
  const [offlineReady, setOfflineReady] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);

  useEffect(() => {
    // Only show PWA notifications in production
    if (import.meta.env.PROD) {
      setTimeout(() => {
        setOfflineReady(true);
        options.onRegistered?.('SW Registered');
      }, 1000);
    }
  }, []);

  const updateServiceWorker = async (reloadPage = false) => {
    if (reloadPage) {
      window.location.reload();
    }
  };

  return {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  };
};

const PWAUpdateNotification: React.FC = () => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [hasSeenOfflineNotification, setHasSeenOfflineNotification] = useState(() => {
    return localStorage.getItem('pwa-offline-notification-seen') === 'true';
  });
  
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: any) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error: any) {
      console.log('SW registration error', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      setShowUpdatePrompt(true);
    }
  }, [needRefresh]);

  const handleUpdate = () => {
    updateServiceWorker(true);
    setShowUpdatePrompt(false);
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
    setNeedRefresh(false);
  };

  const handleDismissOfflineNotification = () => {
    setOfflineReady(false);
    setHasSeenOfflineNotification(true);
    localStorage.setItem('pwa-offline-notification-seen', 'true');
  };

  // Add a way to reset the notification for testing (only in development)
  useEffect(() => {
    if (import.meta.env.DEV) {
      // Listen for a custom event to reset the notification
      const resetNotification = () => {
        localStorage.removeItem('pwa-offline-notification-seen');
        setHasSeenOfflineNotification(false);
      };
      
      window.addEventListener('reset-pwa-notification', resetNotification);
      return () => window.removeEventListener('reset-pwa-notification', resetNotification);
    }
  }, []);

  // Show offline ready notification only if user hasn't seen it before
  if (offlineReady && !needRefresh && !hasSeenOfflineNotification) {
    return (
      <div className="fixed top-24 right-4 z-[9999] max-w-sm">
        <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4 shadow-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                App ready for offline use
              </p>
            </div>
            <button
              onClick={handleDismissOfflineNotification}
              className="ml-2 flex-shrink-0 text-green-400 hover:text-green-500"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show update notification
  if (showUpdatePrompt) {
    return (
      <div className="fixed top-24 right-4 z-[9999] max-w-sm">
        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4 shadow-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <ArrowPathIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Update Available
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                A new version of Journo is available. Refresh to get the latest features.
              </p>
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={handleUpdate}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Update
                </button>
                <button
                  onClick={handleDismiss}
                  className="text-blue-600 dark:text-blue-400 px-3 py-1 text-sm font-medium hover:text-blue-500"
                >
                  Later
                </button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="ml-2 flex-shrink-0 text-blue-400 hover:text-blue-500"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PWAUpdateNotification;