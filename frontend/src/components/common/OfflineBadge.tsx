import React from 'react';
import { useOfflineStore } from '../../stores/offlineStore';
import { formatLastSyncTime } from '../../utils/offlineUtils';

interface OfflineBadgeProps {
  showSyncStatus?: boolean;
  className?: string;
}

export const OfflineBadge: React.FC<OfflineBadgeProps> = ({ 
  showSyncStatus = true,
  className = '',
}) => {
  const { 
    isOnline, 
    isSyncing, 
    lastSyncTime, 
    pendingChangesCount,
    syncProgress,
    syncError,
  } = useOfflineStore();

  if (isOnline && !isSyncing && pendingChangesCount === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Offline indicator */}
      {!isOnline && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-white rounded-full text-sm font-medium">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <span>Offline</span>
          {pendingChangesCount > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-gray-700 rounded-full text-xs">
              {pendingChangesCount} pending
            </span>
          )}
        </div>
      )}

      {/* Syncing indicator */}
      {isOnline && isSyncing && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-full text-sm font-medium">
          <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"></div>
          <span>Syncing...</span>
          {syncProgress > 0 && (
            <span className="ml-1 text-xs">
              {Math.round(syncProgress)}%
            </span>
          )}
        </div>
      )}

      {/* Pending changes indicator (when online but not syncing) */}
      {isOnline && !isSyncing && pendingChangesCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-600 text-white rounded-full text-sm font-medium">
          <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
          <span>{pendingChangesCount} pending</span>
        </div>
      )}

      {/* Sync error indicator */}
      {syncError && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-full text-sm font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Sync failed</span>
        </div>
      )}

      {/* Last sync time (optional) */}
      {showSyncStatus && isOnline && !isSyncing && !syncError && lastSyncTime && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Last synced {formatLastSyncTime(lastSyncTime)}
        </div>
      )}
    </div>
  );
};

export default OfflineBadge;
