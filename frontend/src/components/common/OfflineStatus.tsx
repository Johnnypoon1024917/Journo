import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { WifiIcon, SignalSlashIcon } from '@heroicons/react/24/outline';

const OfflineStatus: React.FC = () => {
  const { t } = useTranslation('common');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setShowOfflineMessage(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-hide online message after 3 seconds
  useEffect(() => {
    if (isOnline && !showOfflineMessage) {
      const timer = setTimeout(() => {
        setShowOfflineMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, showOfflineMessage]);

  if (!showOfflineMessage && isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div
        className={`px-4 py-2 text-center text-sm font-medium transition-colors duration-200 ${
          isOnline
            ? 'bg-green-600 text-white'
            : 'bg-yellow-600 text-white'
        }`}
      >
        <div className="flex items-center justify-center space-x-2">
          {isOnline ? (
            <>
              <WifiIcon className="h-4 w-4" />
              <span>{t('offline.indicator.backOnline')}</span>
            </>
          ) : (
            <>
              <SignalSlashIcon className="h-4 w-4" />
              <span>{t('offline.indicator.offlineMessage')}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfflineStatus;