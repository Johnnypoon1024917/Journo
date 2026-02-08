import React from 'react';
import { DailySpending } from '../../services/budgetService';
import { getCurrencySymbol } from '../../constants/currencies';

interface DailyBudgetRingProps {
  dailySpending: DailySpending[];
  currency: string;
}

export const DailyBudgetRing: React.FC<DailyBudgetRingProps> = ({ dailySpending, currency }) => {
  const currencySymbol = getCurrencySymbol(currency);

  if (dailySpending.length === 0) {
    return (
      <div className="rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Daily Spending
        </h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No daily spending data available
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daily Spending</h3>

      <div className="space-y-3">
        {dailySpending.map((day) => {
          const percentage = day.budget > 0 ? (day.spent / day.budget) * 100 : 0;
          const isOverBudget = day.spent > day.budget;
          const status = isOverBudget ? 'danger' : percentage >= 80 ? 'warning' : 'ok';

          const getStatusColor = () => {
            switch (status) {
              case 'danger':
                return 'bg-red-500';
              case 'warning':
                return 'bg-yellow-500';
              default:
                return 'bg-blue-500';
            }
          };

          return (
            <div
              key={day.dayNumber}
              className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 space-y-2"
            >
              {/* Day Header */}
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Day {day.dayNumber}
                  </span>
                  {day.date && (
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(day.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {currencySymbol}
                    {day.spent.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    of {currencySymbol}
                    {day.budget.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getStatusColor()} transition-all duration-300`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>

              {/* Details */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 dark:text-gray-400">
                  {day.places} {day.places === 1 ? 'place' : 'places'}
                </span>
                <span
                  className={
                    isOverBudget
                      ? 'text-red-600 dark:text-red-400 font-medium'
                      : 'text-gray-500 dark:text-gray-400'
                  }
                >
                  {percentage.toFixed(0)}%
                  {isOverBudget && ' over'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">Total Days</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {dailySpending.length}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm mt-2">
          <span className="text-gray-600 dark:text-gray-400">Average per Day</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {currencySymbol}
            {(
              dailySpending.reduce((sum, day) => sum + day.spent, 0) / dailySpending.length
            ).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};
