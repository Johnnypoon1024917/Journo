/**
 * BubbleQuest ChecklistProgress Component
 * 
 * Displays checklist progress with progress bar and percentage.
 * 
 * Features:
 * - Display progress bar and percentage
 * - Show completed vs total counts
 * - Visual progress indicator
 * - BubbleQuest styling with rounded corners
 * - Animated progress transitions
 * 
 * Requirements: 13.2
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CheckCircleIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';
import { PackingListProgress } from '@/types/packing';

export interface ChecklistProgressProps {
  progress: PackingListProgress;
  className?: string;
}

export const ChecklistProgress: React.FC<ChecklistProgressProps> = ({
  progress,
  className,
}) => {
  const { t } = useTranslation('packing');

  const progressPercentage = progress.percentage || 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total Items */}
        <motion.div
          className={cn(
            'bg-white dark:bg-bubblequest-neutral-800',
            'rounded-2xl p-4',
            'shadow-sm',
            'border-2 border-bubblequest-primary/20'
          )}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-bubblequest-primary/10">
              <ClipboardDocumentListIcon className="w-5 h-5 text-bubblequest-primary" />
            </div>
            <div className="text-sm text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400">
              {t('checklist.totalItems')}
            </div>
          </div>
          <motion.div
            className="text-3xl font-bold text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100"
            key={progress.total_items}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {progress.total_items}
          </motion.div>
        </motion.div>

        {/* Completed Items */}
        <motion.div
          className={cn(
            'bg-white dark:bg-bubblequest-neutral-800',
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
            <div className="text-sm text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400">
              {t('checklist.completed')}
            </div>
          </div>
          <motion.div
            className="text-3xl font-bold text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100"
            key={progress.checked_items}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {progress.checked_items}
          </motion.div>
        </motion.div>
      </div>

      {/* Progress bar */}
      <div className={cn(
        'bg-white dark:bg-bubblequest-neutral-800',
        'rounded-2xl p-4',
        'shadow-sm'
      )}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300">
            {t('checklist.progress')}
          </span>
          <span className="text-sm font-bold text-bubblequest-primary">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        
        {/* Progress bar track */}
        <div className="relative h-3 bg-bubblequest-neutral-100 dark:bg-bubblequest-neutral-700 rounded-full overflow-hidden">
          {/* Progress bar fill */}
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-bubblequest-primary to-bubblequest-primary-dark rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Completion message */}
        {progressPercentage === 100 && progress.total_items > 0 && (
          <motion.div
            className="mt-3 text-center text-sm font-medium text-green-600 dark:text-green-400"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            🎉 {t('checklist.allComplete')}
          </motion.div>
        )}
      </div>
    </div>
  );
};
