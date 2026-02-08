/**
 * Offline Mode Indicator Component
 * 
 * Comprehensive offline mode indicator that shows:
 * - Current connection status (online/offline/slow)
 * - Available offline features
 * - Sync status and pending changes
 * - Progressive enhancement warnings for slow connections
 * 
 * Validates: Requirements 5.5, 9.3
 */

import React, { useState } from 'react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useHealthMonitor } from '../../hooks/useHealthMonitor';
import { useOfflineStore } from '../../stores/offlineStore';

export interface OfflineModeIndicatorProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showDetails?: boolean;
  compact?: boolean;
}

export const OfflineModeIndicator: React.FC<OfflineModeIndicatorProps> = ({
  position = 'bottom-left',
  showDetails = true,
  compact = false,
}) => {
  const { isOnline, status, effectiveType, rtt } = useNetworkStatus();
  const { health, features } = useHealthMonitor();
  const { pendingChangesCount, isSyncing, lastSyncTime } = useOfflineStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const getStatusConfig = () => {
    if (!isOnline || status === 'offline') {
      return {
        icon: '📴',
        label: 'Offline Mode',
        description: 'Working offline with limited features',
        color: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 border-red-300 dark:border-red-700',
        showFeatures: true,
      };
    }

    if (status === 'slow') {
      return {
        icon: '🐌',
        label: 'Slow Connection',
        description: `${effectiveType || 'Limited'} connection detected`,
        color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700',
        showFeatures: false,
      };
    }

    // Only show when there are pending changes or recently synced
    if (pendingChangesCount > 0 || isSyncing) {
      return {
        icon: '🔄',
        label: isSyncing ? 'Syncing...' : 'Changes Pending',
        description: isSyncing
          ? 'Synchronizing your changes'
          : `${pendingChangesCount} change${pendingChangesCount > 1 ? 's' : ''} to sync`,
        color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 border-blue-300 dark:border-blue-700',
        showFeatures: false,
      };
    }

    return null;
  };

  const config = getStatusConfig();

  // Don't show if online with no pending changes
  if (!config) {
    return null;
  }

  // Compact mode - just show icon and count
  if (compact) {
    return (
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`fixed ${positionClasses[position]} z-40 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg border ${config.color} transition-all hover:scale-105`}
        aria-label={config.label}
      >
        <span className="text-lg">{config.icon}</span>
        {pendingChangesCount > 0 && (
          <span className="text-xs font-bold">{pendingChangesCount}</span>
        )}
      </button>
    );
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-40 max-w-sm`}>
      {/* Main Indicator */}
      <div
        className={`rounded-lg shadow-lg border ${config.color} transition-all duration-300`}
      >
        <button
          onClick={() => showDetails && setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-start gap-3 hover:opacity-90 transition-opacity"
          aria-label={config.label}
          aria-expanded={isExpanded}
        >
          <span className="text-2xl flex-shrink-0">{config.icon}</span>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-semibold">{config.label}</p>
            <p className="text-xs mt-0.5 opacity-90">{config.description}</p>
            {status === 'slow' && rtt && (
              <p className="text-xs mt-1 opacity-75">Latency: {rtt}ms</p>
            )}
          </div>
          {showDetails && (
            <svg
              className={`w-4 h-4 flex-shrink-0 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          )}
        </button>

        {/* Expanded Details */}
        {isExpanded && showDetails && (
          <div className="border-t border-current/20 px-4 py-3 space-y-3">
            {/* Offline Features */}
            {config.showFeatures && (
              <div>
                <h4 className="text-xs font-semibold mb-2 opacity-75">
                  Available Features
                </h4>
                <div className="space-y-1">
                  {Array.from(features.entries()).map(([name, feature]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="capitalize">
                        {name.replace(/-/g, ' ')}
                      </span>
                      <span
                        className={`font-medium ${
                          feature.enabled ? 'opacity-100' : 'opacity-40'
                        }`}
                      >
                        {feature.enabled ? '✓' : '✗'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sync Status */}
            {(pendingChangesCount > 0 || lastSyncTime) && (
              <div>
                <h4 className="text-xs font-semibold mb-2 opacity-75">
                  Sync Status
                </h4>
                <div className="space-y-1 text-xs">
                  {pendingChangesCount > 0 && (
                    <p>
                      {pendingChangesCount} change{pendingChangesCount > 1 ? 's' : ''}{' '}
                      pending
                    </p>
                  )}
                  {lastSyncTime && (
                    <p className="opacity-75">
                      Last sync: {new Date(lastSyncTime).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Connection Quality */}
            {status === 'slow' && (
              <div>
                <h4 className="text-xs font-semibold mb-2 opacity-75">
                  Connection Quality
                </h4>
                <div className="space-y-1 text-xs">
                  {effectiveType && (
                    <p>Type: {effectiveType.toUpperCase()}</p>
                  )}
                  {rtt && <p>Latency: {rtt}ms</p>}
                  <p className="opacity-75 mt-2">
                    Some features may load slowly or be temporarily unavailable.
                  </p>
                </div>
              </div>
            )}

            {/* Offline Tips */}
            {!isOnline && (
              <div className="pt-2 border-t border-current/20">
                <p className="text-xs opacity-75">
                  💡 Your changes are saved locally and will sync automatically
                  when you're back online.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
