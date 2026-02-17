/**
 * Storage Indicator Component
 * 
 * Displays offline storage usage and provides warnings when approaching limit
 * Validates Requirement 11.10: Track total cached data size and enforce 50MB limit
 */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { storageSizeManager, StorageStats } from '../../services/storageSizeManager';

interface StorageIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export const StorageIndicator: React.FC<StorageIndicatorProps> = ({
  showDetails = false,
  className = '',
}) => {
  const { t } = useTranslation('common');
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const storageStats = await storageSizeManager.getStorageStats();
      setStats(storageStats);
    } catch (error) {
      console.error('Error loading storage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return null;
  }

  // Don't show indicator if storage usage is low
  if (!showDetails && stats.percentUsed < 50) {
    return null;
  }

  const getStatusColor = () => {
    if (stats.isOverLimit) return 'text-red-600 bg-red-50';
    if (stats.isNearLimit) return 'text-orange-600 bg-orange-50';
    return 'text-blue-600 bg-blue-50';
  };

  const getProgressBarColor = () => {
    if (stats.isOverLimit) return 'bg-red-500';
    if (stats.isNearLimit) return 'bg-orange-500';
    return 'bg-blue-500';
  };

  return (
    <div className={`rounded-lg p-3 ${getStatusColor()} ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
            />
          </svg>
          <span className="font-medium text-sm">{t('storage.offlineStorage')}</span>
        </div>
        <span className="text-xs font-semibold">
          {stats.percentUsed.toFixed(1)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-white bg-opacity-50 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
          style={{ width: `${Math.min(stats.percentUsed, 100)}%` }}
        />
      </div>

      <div className="text-xs">
        {t('storage.used', {
          used: storageSizeManager.formatBytes(stats.totalSize),
          max: storageSizeManager.formatBytes(stats.maxSize)
        })}
      </div>

      {stats.isOverLimit && (
        <div className="mt-2 text-xs font-medium">
          ⚠️ {t('storage.limitExceeded')}
        </div>
      )}

      {stats.isNearLimit && !stats.isOverLimit && (
        <div className="mt-2 text-xs">
          ⚠️ {t('storage.nearLimit')}
        </div>
      )}

      {showDetails && (
        <details className="mt-3">
          <summary className="text-xs font-medium cursor-pointer">
            {t('storage.breakdown')}
          </summary>
          <div className="mt-2 space-y-1 text-xs">
            {Object.entries(stats.breakdown).map(([key, size]) => (
              size > 0 && (
                <div key={key} className="flex justify-between">
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                  <span className="font-mono">
                    {storageSizeManager.formatBytes(size)}
                  </span>
                </div>
              )
            ))}
          </div>
        </details>
      )}
    </div>
  );
};

export default StorageIndicator;
