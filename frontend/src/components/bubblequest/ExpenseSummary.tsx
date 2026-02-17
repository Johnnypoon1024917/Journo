/**
 * BubbleQuest ExpenseSummary Component
 * 
 * Displays total expenses with category breakdown and visual chart.
 * 
 * Features:
 * - Display total expenses
 * - Category breakdown with percentages
 * - Visual bar chart for categories
 * - Color-coded categories
 * - Responsive layout
 * - Framer Motion animations
 * 
 * Requirements: 12.2, 12.3
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  HomeIcon,
  ShoppingBagIcon,
  TruckIcon,
  TicketIcon,
  CurrencyDollarIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';
import { ExpenseStats, CategoryExpense } from '@/types/expense';
import { BudgetCategory } from '@/types/trip';

export interface ExpenseSummaryProps {
  stats: ExpenseStats;
  className?: string;
}

// Category icons and colors
const CATEGORY_CONFIG: Record<
  BudgetCategory,
  { icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string; chartColor: string }
> = {
  accommodation: {
    icon: HomeIcon,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    chartColor: 'bg-purple-500',
  },
  food: {
    icon: ShoppingBagIcon,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    chartColor: 'bg-orange-500',
  },
  transport: {
    icon: TruckIcon,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    chartColor: 'bg-blue-500',
  },
  activities: {
    icon: TicketIcon,
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    chartColor: 'bg-pink-500',
  },
  shopping: {
    icon: ShoppingBagIcon,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    chartColor: 'bg-teal-500',
  },
  misc: {
    icon: EllipsisHorizontalIcon,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-700',
    chartColor: 'bg-gray-500',
  },
};

export const ExpenseSummary: React.FC<ExpenseSummaryProps> = ({
  stats,
  className,
}) => {
  const { t } = useTranslation();

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      return `${currency} ${amount.toFixed(2)}`;
    }
  };

  // Filter out categories with zero amount
  const activeCategories = stats.byCategory.filter(cat => cat.amount > 0);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Total expenses card */}
      <motion.div
        className={cn(
          'bg-gradient-to-br from-bubblequest-primary to-bubblequest-primary-dark',
          'rounded-3xl p-6',
          'shadow-lg'
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white/80 text-sm font-medium mb-1">
              {t('budget.totalExpenses')}
            </div>
            <div className="text-white text-3xl font-bold">
              {formatCurrency(stats.total, stats.currency)}
            </div>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <CurrencyDollarIcon className="w-8 h-8 text-white" />
          </div>
        </div>
      </motion.div>

      {/* Category breakdown */}
      {activeCategories.length > 0 && (
        <motion.div
          className={cn(
            'bg-white dark:bg-bubblequest-neutral-800',
            'rounded-3xl p-6',
            'shadow-sm'
          )}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h3 className="text-lg font-bold text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 mb-4">
            {t('budget.categoryBreakdown')}
          </h3>

          <div className="space-y-4">
            {activeCategories.map((category, index) => {
              const config = CATEGORY_CONFIG[category.category];
              const CategoryIcon = config.icon;

              return (
                <motion.div
                  key={category.category}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                >
                  {/* Category header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', config.bgColor)}>
                        <CategoryIcon className={cn('w-4 h-4', config.color)} />
                      </div>
                      <span className="text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 capitalize">
                        {t(`budget.categories.${category.category}`)}
                      </span>
                      <span className="text-xs text-bubblequest-neutral-500 dark:text-bubblequest-neutral-400">
                        ({category.count})
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100">
                        {formatCurrency(category.amount, stats.currency)}
                      </div>
                      <div className="text-xs text-bubblequest-neutral-500 dark:text-bubblequest-neutral-400">
                        {category.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 bg-bubblequest-neutral-100 dark:bg-bubblequest-neutral-700 rounded-full overflow-hidden">
                    <motion.div
                      className={cn('h-full rounded-full', config.chartColor)}
                      initial={{ width: 0 }}
                      animate={{ width: `${category.percentage}%` }}
                      transition={{ duration: 0.5, delay: 0.2 + index * 0.05, ease: 'easeOut' }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {activeCategories.length === 0 && (
        <motion.div
          className={cn(
            'bg-white dark:bg-bubblequest-neutral-800',
            'rounded-3xl p-8',
            'shadow-sm',
            'text-center'
          )}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <CurrencyDollarIcon className="w-16 h-16 mx-auto mb-4 text-bubblequest-neutral-300 dark:text-bubblequest-neutral-600" />
          <p className="text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400">
            {t('budget.noExpenses')}
          </p>
        </motion.div>
      )}
    </div>
  );
};
