/**
 * OfflineIndicator Component
 * Displays offline status and sync information
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOfflineStore } from '../../stores/offlineStore';
import { useTranslation } from 'react-i18next';
import {
  WifiIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export interface OfflineIndicatorProps {
  position?: 'top' | 'bottom';
  showWhenOnline?: boolean;
  className?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  position = 'top',
  showWhenOnline = false,
  className = '',
}) => {
  const { t } = useTranslation();
  const {
    isOnline,
    isSyncing,
    syncProgress,
    syncError,
    pendingChangesCount,
    lastSyncTime,
  } = useOfflineStore();

  // Determine what to show
  const shouldShow = !isOnline || isSyncing || syncError || (showWhenOnline && pendingChangesCount > 0);

  // Get status info
  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: WifiIcon,
        text: t('offline.indicator.offline'),
        subtext: pendingChangesCount > 0
          ? t('offline.indicator.pendingChanges', { count: pendingChangesCount })
          : t('offline.indicator.viewingCached'),
        color: 'bg-yellow-500',
        textColor: 'text-yellow-900',
      };
    }

    if (isSyncing) {
      return {
        icon: CloudArrowUpIcon,
        text: t('offline.indicator.syncing'),
        subtext: syncProgress > 0
          ? t('offline.indicator.syncProgress', { progress: Math.round(syncProgress) })
          : t('offline.indicator.syncingChanges'),
        color: 'bg-blue-500',
        textColor: 'text-blue-900',
      };
    }

    if (syncError) {
      return {
        icon: ExclamationTriangleIcon,
        text: t('offline.indicator.syncError'),
        subtext: syncError,
        color: 'bg-red-500',
        textColor: 'text-red-900',
      };
    }

    if (pendingChangesCount > 0) {
      return {
        icon: CloudArrowUpIcon,
        text: t('offline.indicator.pendingSync'),
        subtext: t('offline.indicator.pendingChanges', { count: pendingChangesCount }),
        color: 'bg-blue-500',
        textColor: 'text-blue-900',
      };
    }

    return {
      icon: CheckCircleIcon,
      text: t('offline.indicator.synced'),
      subtext: lastSyncTime
        ? t('offline.indicator.lastSync', { time: new Date(lastSyncTime).toLocaleTimeString() })
        : '',
      color: 'bg-green-500',
      textColor: 'text-green-900',
    };
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  const positionClasses = position === 'top'
    ? 'top-0 left-0 right-0'
    : 'bottom-0 left-0 right-0';

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ y: position === 'top' ? -100 : 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: position === 'top' ? -100 : 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`fixed ${positionClasses} z-50 ${className}`}
        >
          <div className={`${statusInfo.color} ${statusInfo.textColor} px-4 py-2 shadow-lg`}>
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Icon className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{statusInfo.text}</p>
                  {statusInfo.subtext && (
                    <p className="text-xs opacity-90 truncate">{statusInfo.subtext}</p>
                  )}
                </div>
              </div>

              {isSyncing && syncProgress > 0 && (
                <div className="ml-4 w-24">
                  <div className="h-2 bg-white bg-opacity-30 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-white"
                      initial={{ width: 0 }}
                      animate={{ width: `${syncProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineIndicator;
