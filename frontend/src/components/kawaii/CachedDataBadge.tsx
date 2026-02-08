/**
 * CachedDataBadge Component
 * Shows when data is being displayed from cache
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ClockIcon } from '@heroicons/react/24/outline';

export interface CachedDataBadgeProps {
  lastUpdated?: Date | string;
  className?: string;
  size?: 'sm' | 'md';
}

export const CachedDataBadge: React.FC<CachedDataBadgeProps> = ({
  lastUpdated,
  className = '',
  size = 'sm',
}) => {
  const { t } = useTranslation();

  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('time.now');
    if (diffMins < 60) return `${diffMins}m ${t('time.ago')}`;
    if (diffHours < 24) return `${diffHours}h ${t('time.ago')}`;
    return `${diffDays}d ${t('time.ago')}`;
  };

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5';

  return (
    <div
      className={`inline-flex items-center space-x-1.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full ${sizeClasses} ${className}`}
    >
      <ClockIcon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      <span className="font-medium">
        {lastUpdated
          ? t('offline.dataDisplay.lastUpdated', { time: formatTime(lastUpdated) })
          : t('offline.dataDisplay.cachedData')}
      </span>
    </div>
  );
};

export default CachedDataBadge;
