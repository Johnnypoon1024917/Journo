/**
 * SyncStatusPanel Component
 * Displays sync status and allows manual sync
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { useOfflineStore } from '../../stores/offlineStore';
import {
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export interface SyncStatusPanelProps {
  className?: string;
  showDetails?: boolean;
}

export const SyncStatusPanel: React.FC<SyncStatusPanelProps> = ({
  className = '',
  showDetails = true,
}) => {
  const { t } = useTranslation();
  const { isOnline } = useOfflineStore();
  const {
    isSyncing,
    pendingChangesCount,
    lastSyncTime,
    syncError,
    syncProgress,
    syncAll,
  } = useOfflineSync();

  const [isManualSyncing, setIsManualSyncing] = useState(false);

  const handleManualSync = async () => {
    if (!isOnline || isSyncing) {
      return;
    }

    setIsManualSyncing(true);
    try {
      const result = await syncAll();
      console.log('Manual sync complete:', result);
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const formatLastSyncTime = (time: string | null) => {
    if (!time) return t('offline.sync.neverSynced');

    const date = new Date(time);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return t('offline.sync.justNow');
    if (diffMins < 60) return t('offline.sync.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('offline.sync.hoursAgo', { count: diffHours });
    return date.toLocaleString();
  };

  const getSyncStatus = () => {
    if (!isOnline) {
      return {
        icon: ExclamationTriangleIcon,
        text: t('offline.sync.offline'),
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      };
    }

    if (isSyncing || isManualSyncing) {
      return {
        icon: CloudArrowUpIcon,
        text: t('offline.sync.syncing'),
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      };
    }

    if (syncError) {
      return {
        icon: ExclamationTriangleIcon,
        text: t('offline.sync.error'),
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
      };
    }

    if (pendingChangesCount > 0) {
      return {
        icon: CloudArrowUpIcon,
        text: t('offline.sync.pending', { count: pendingChangesCount }),
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      };
    }

    return {
      icon: CheckCircleIcon,
      text: t('offline.sync.synced'),
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    };
  };

  const status = getSyncStatus();
  const StatusIcon = status.icon;

  return (
    <div className={`rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      <div className={`${status.bgColor} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <StatusIcon className={`w-6 h-6 ${status.color}`} />
            <div>
              <p className={`text-sm font-medium ${status.color}`}>{status.text}</p>
              {showDetails && lastSyncTime && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  {t('offline.sync.lastSynced')}: {formatLastSyncTime(lastSyncTime)}
                </p>
              )}
            </div>
          </div>

          {isOnline && pendingChangesCount > 0 && !isSyncing && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleManualSync}
              disabled={isManualSyncing}
              className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isManualSyncing ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">{t('offline.sync.syncNow')}</span>
            </motion.button>
          )}
        </div>

        {(isSyncing || isManualSyncing) && syncProgress > 0 && (
          <div className="mt-3">
            <div className="h-2 bg-white dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${syncProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-right">
              {Math.round(syncProgress)}%
            </p>
          </div>
        )}

        {syncError && showDetails && (
          <div className="mt-3 p-2 bg-white dark:bg-gray-800 rounded text-xs text-red-600 dark:text-red-400">
            {syncError}
          </div>
        )}
      </div>
    </div>
  );
};

export default SyncStatusPanel;
