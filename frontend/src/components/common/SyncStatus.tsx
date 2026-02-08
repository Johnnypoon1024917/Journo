import React, { useState } from 'react';
import { useOfflineStore } from '../../stores/offlineStore';
import { formatLastSyncTime } from '../../utils/offlineUtils';
import { syncService } from '../../services/syncService';

export const SyncStatus: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { 
    isOnline, 
    isSyncing, 
    lastSyncTime, 
    syncQueue,
    pendingChangesCount,
    syncProgress,
    syncError,
  } = useOfflineStore();

  const handleManualSync = () => {
    if (isOnline && !isSyncing) {
      syncService.startSync();
    }
  };

  if (pendingChangesCount === 0 && !isSyncing && !syncError) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            {/* Status icon */}
            {isSyncing ? (
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            ) : syncError ? (
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : !isOnline ? (
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}

            {/* Status text */}
            <div className="text-left">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {isSyncing ? 'Syncing changes...' : 
                 syncError ? 'Sync failed' :
                 !isOnline ? 'Working offline' :
                 `${pendingChangesCount} pending change${pendingChangesCount !== 1 ? 's' : ''}`}
              </div>
              {isSyncing && syncProgress > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {Math.round(syncProgress)}% complete
                </div>
              )}
              {!isSyncing && lastSyncTime && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Last synced {formatLastSyncTime(lastSyncTime)}
                </div>
              )}
            </div>
          </div>

          {/* Expand icon */}
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Expanded details */}
        {isExpanded && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            {/* Progress bar */}
            {isSyncing && (
              <div className="px-4 py-2">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${syncProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Error message */}
            {syncError && (
              <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {syncError}
                </p>
              </div>
            )}

            {/* Pending changes list */}
            {syncQueue.length > 0 && (
              <div className="max-h-64 overflow-y-auto">
                <div className="px-4 py-2">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                    Pending Changes
                  </h4>
                  <div className="space-y-1">
                    {syncQueue.slice(0, 10).map((item) => (
                      <div 
                        key={item.id}
                        className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300"
                      >
                        <span className="capitalize">{(item.operation || item.operation_type || 'unknown').toLowerCase()}</span>
                        <span className="text-gray-400">•</span>
                        <span className="capitalize">{item.resource_type.replace('_', ' ')}</span>
                        {item.status === 'failed' && (
                          <span className="ml-auto text-red-600 dark:text-red-400">
                            Failed (retry {item.retry_count})
                          </span>
                        )}
                      </div>
                    ))}
                    {syncQueue.length > 10 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 pt-1">
                        +{syncQueue.length - 10} more
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Offline message */}
            {!isOnline && (
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50">
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Changes will sync automatically when you're back online
                </p>
              </div>
            )}

            {/* Manual sync button */}
            {isOnline && !isSyncing && pendingChangesCount > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleManualSync}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Sync Now
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SyncStatus;
