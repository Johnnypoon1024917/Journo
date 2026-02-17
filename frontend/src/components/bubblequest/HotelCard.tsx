/**
 * HotelCard Component
 * 
 * Displays hotel/accommodation information in the schedule.
 * Shows hotel name, address, and check-in/check-out times.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';

interface HotelCardProps {
  name: string;
  address?: string;
  checkIn?: string;
  checkOut?: string;
  onClick?: () => void;
  className?: string;
}

export const HotelCard: React.FC<HotelCardProps> = ({
  name,
  address,
  checkIn,
  checkOut,
  onClick,
  className,
}) => {
  const { t } = useTranslation('bubbleQuest');

  return (
    <motion.div
      className={cn(
        'bg-gradient-to-br from-bubblequest-accent-100 to-bubblequest-accent-200',
        'dark:from-bubblequest-accent-900/30 dark:to-bubblequest-accent-800/30',
        'rounded-2xl p-4 border-2 border-bubblequest-accent-300 dark:border-bubblequest-accent-700',
        'shadow-bubblequest-sm hover:shadow-bubblequest-md transition-all',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
    >
      <div className="flex items-start gap-3">
        {/* Hotel Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-xl bg-white dark:bg-bubblequest-neutral-800 flex items-center justify-center text-2xl shadow-sm">
            🏨
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-semibold text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100">
              {name}
            </h4>
            <span className="text-xs px-2 py-1 rounded-full bg-white dark:bg-bubblequest-neutral-800 text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 whitespace-nowrap">
              {t('schedule.hotel')}
            </span>
          </div>

          {address && (
            <p className="text-sm text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-3 line-clamp-2">
              📍 {address}
            </p>
          )}

          {/* Check-in/Check-out Times */}
          {(checkIn || checkOut) && (
            <div className="flex items-center gap-4 text-sm">
              {checkIn && (
                <div className="flex items-center gap-1">
                  <span className="text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400">
                    {t('schedule.checkIn')}:
                  </span>
                  <span className="font-medium text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100">
                    {checkIn}
                  </span>
                </div>
              )}
              {checkOut && (
                <div className="flex items-center gap-1">
                  <span className="text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400">
                    {t('schedule.checkOut')}:
                  </span>
                  <span className="font-medium text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100">
                    {checkOut}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
