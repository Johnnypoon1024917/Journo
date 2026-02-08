/**
 * Kawaii ShoppingStats Component
 * 
 * Displays shopping list statistics with "to buy" and "bought" counts.
 * 
 * Features:
 * - Display "to buy" and "bought" counts
 * - Update in real-time as items are checked
 * - Visual progress indicator
 * - Kawaii styling with rounded corners
 * - Animated count transitions
 * 
 * Requirements: 11.2
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ShoppingBagIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';
import { ShoppingStats as ShoppingStatsType } from '@/types/shopping';

export interface ShoppingStatsProps {
  stats: ShoppingStatsType;
  className?: string;
}

export const ShoppingStats: React.FC<ShoppingStatsProps> = ({
  stats,
  className,
}) => {
  const { t } = useTranslation();

  const progressPercentage = stats.total > 0 
    ? (stats.bought / stats.total) * 100 
    : 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* To Buy */}
        <motion.div
          className={cn(
            'bg-white dark:bg-kawaii-neutral-800',
            'rounded-2xl p-4',
            'shadow-sm',
            'border-2 border-kawaii-primary/20'
          )}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-kawaii-primary/10">
              <ShoppingBagIcon className="w-5 h-5 text-kawaii-primary" />
            </div>
            <div className="text-sm text-kawaii-neutral-600 dark:text-kawaii-neutral-400">
              {t('shopping.toBuy')}
            </div>
          </div>
          <motion.div
            className="text-3xl font-bold text-kawaii-neutral-900 dark:text-kawaii-neutral-100"
            key={stats.toBuy}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {stats.toBuy}
          </motion.div>
        </motion.div>

        {/* Bought */}
        <motion.div
          className={cn(
            'bg-white dark:bg-kawaii-neutral-800',
            'rounded-2xl p-4',
            'shadow-sm',
            'border-2 border-green-500/20'
          )}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-sm text-kawaii-neutral-600 dark:text-kawaii-neutral-400">
              {t('shopping.bought')}
            </div>
          </div>
          <motion.div
            className="text-3xl font-bold text-kawaii-neutral-900 dark:text-kawaii-neutral-100"
            key={stats.bought}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {stats.bought}
          </motion.div>
        </motion.div>
      </div>

      {/* Progress bar */}
      <div className={cn(
        'bg-white dark:bg-kawaii-neutral-800',
        'rounded-2xl p-4',
        'shadow-sm'
      )}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-kawaii-neutral-700 dark:text-kawaii-neutral-300">
            {t('shopping.progress')}
          </span>
          <span className="text-sm font-bold text-kawaii-primary">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        
        {/* Progress bar track */}
        <div className="relative h-3 bg-kawaii-neutral-100 dark:bg-kawaii-neutral-700 rounded-full overflow-hidden">
          {/* Progress bar fill */}
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-kawaii-primary to-kawaii-primary-dark rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Total count */}
        <div className="mt-2 text-xs text-center text-kawaii-neutral-600 dark:text-kawaii-neutral-400">
          {t('shopping.totalItems', { count: stats.total })}
        </div>
      </div>
    </div>
  );
};
