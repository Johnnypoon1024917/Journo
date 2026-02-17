import React from 'react';
import { BudgetCategory } from '../../../types/trip';
import { CategorySummary, BudgetStatus } from '../../../types/expense';

interface CategoryProgressBarsProps {
  categorySummaries: CategorySummary[];
  currency: string;
  className?: string;
}

const CATEGORY_INFO: Record<BudgetCategory, { emoji: string; label: string; color: string }> = {
  flights: { emoji: '✈️', label: 'Flights', color: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300' },
  accommodation: { emoji: '🏨', label: 'Accommodation', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
  food: { emoji: '🍜', label: 'Food', color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300' },
  transport: { emoji: '🚇', label: 'Transport', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
  activities: { emoji: '🎭', label: 'Activities', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' },
  shopping: { emoji: '🛍️', label: 'Shopping', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' },
  misc: { emoji: '📦', label: 'Miscellaneous', color: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300' },
};

const STATUS_COLORS: Record<BudgetStatus, { bar: string; text: string }> = {
  safe: {
    bar: 'bg-gradient-to-r from-green-400 to-green-500',
    text: 'text-green-600 dark:text-green-400',
  },
  warning: {
    bar: 'bg-gradient-to-r from-yellow-400 to-yellow-500',
    text: 'text-yellow-600 dark:text-yellow-400',
  },
  danger: {
    bar: 'bg-gradient-to-r from-orange-400 to-orange-500',
    text: 'text-orange-600 dark:text-orange-400',
  },
  over: {
    bar: 'bg-gradient-to-r from-red-400 to-red-500',
    text: 'text-red-600 dark:text-red-400',
  },
};

interface CategoryProgressBarItemProps {
  summary: CategorySummary;
  currency: string;
}

const CategoryProgressBarItem: React.FC<CategoryProgressBarItemProps> = React.memo(({ summary, currency }) => {
  const info = CATEGORY_INFO[summary.category];
  const statusColors = STATUS_COLORS[summary.status];
  
  // Calculate percentage, capping at 100% for display
  const displayPercentage = Math.min(summary.percentageSpent, 100);
  const isOverBudget = summary.spent > summary.allocated;

  return (
    <div className="rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3 transition-all duration-200 hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${info.color} text-xl`}>
            {info.emoji}
          </span>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {info.label}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {summary.expenseCount} {summary.expenseCount === 1 ? 'expense' : 'expenses'}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${statusColors.text}`}>
            {summary.percentageSpent.toFixed(0)}%
          </div>
          {isOverBudget && (
            <div className="text-xs text-red-600 dark:text-red-400 font-medium">
              ⚠️ Over
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden relative">
          <div
            className={`h-full rounded-full ${statusColors.bar} transition-all duration-500 ease-out`}
            style={{ width: `${displayPercentage}%` }}
          />
          {isOverBudget && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-full w-full bg-red-500/20 animate-pulse" />
            </div>
          )}
        </div>
        
        {/* Amount details */}
        <div className="flex items-center justify-between text-xs">
          <div className="text-gray-600 dark:text-gray-400">
            <span className="font-medium">Spent:</span>{' '}
            <span className={statusColors.text}>
              {currency} {summary.spent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            <span className="font-medium">Budget:</span>{' '}
            <span className="text-gray-900 dark:text-white">
              {currency} {summary.allocated.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {/* Remaining amount */}
        <div className="text-xs text-center">
          {isOverBudget ? (
            <span className="text-red-600 dark:text-red-400 font-medium">
              Over by {currency} {Math.abs(summary.remaining).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          ) : (
            <span className="text-green-600 dark:text-green-400 font-medium">
              {currency} {summary.remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })} remaining
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

CategoryProgressBarItem.displayName = 'CategoryProgressBarItem';

export const CategoryProgressBars: React.FC<CategoryProgressBarsProps> = React.memo(({
  categorySummaries,
  currency,
  className = '',
}) => {
  // Filter out categories with no allocation
  const visibleCategories = categorySummaries.filter(summary => summary.allocated > 0);

  if (visibleCategories.length === 0) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-sm">No category allocations</p>
          <p className="text-xs mt-1">Set up your budget to see progress</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {visibleCategories.map(summary => (
        <CategoryProgressBarItem
          key={summary.category}
          summary={summary}
          currency={currency}
        />
      ))}
    </div>
  );
});

CategoryProgressBars.displayName = 'CategoryProgressBars';
