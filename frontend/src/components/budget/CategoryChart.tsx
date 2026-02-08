import React from 'react';
import { CategorySpending } from '../../services/budgetService';
import { getCurrencySymbol } from '../../constants/currencies';

interface CategoryChartProps {
  categories: CategorySpending[];
  currency: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  accommodation: '#3b82f6', // blue
  food: '#f59e0b', // amber
  transport: '#10b981', // green
  activities: '#8b5cf6', // purple
  shopping: '#ec4899', // pink
  misc: '#6b7280', // gray
};

const CATEGORY_LABELS: Record<string, string> = {
  accommodation: 'Accommodation',
  food: 'Food & Dining',
  transport: 'Transport',
  activities: 'Activities',
  shopping: 'Shopping',
  misc: 'Miscellaneous',
};

export const CategoryChart: React.FC<CategoryChartProps> = ({ categories, currency }) => {
  const currencySymbol = getCurrencySymbol(currency);

  // Filter out categories with no spending
  const activeCategories = categories.filter((cat) => cat.amount > 0);

  if (activeCategories.length === 0) {
    return (
      <div className="rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Spending by Category
        </h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No spending recorded yet
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Spending by Category
      </h3>

      {/* Pie Chart (Simple Bar Representation) */}
      <div className="space-y-3 mb-6">
        {activeCategories.map((category) => (
          <div key={category.category} className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[category.category] }}
                />
                <span className="font-medium text-gray-900 dark:text-white">
                  {CATEGORY_LABELS[category.category]}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  ({category.count} {category.count === 1 ? 'item' : 'items'})
                </span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {currencySymbol}
                {category.amount.toFixed(2)}
              </span>
            </div>
            <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${category.percentage}%`,
                  backgroundColor: CATEGORY_COLORS[category.category],
                }}
              />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
              {category.percentage.toFixed(1)}%
            </div>
          </div>
        ))}
      </div>

      {/* Legend Summary */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-3">
          {activeCategories.slice(0, 4).map((category) => (
            <div key={category.category} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS[category.category] }}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {CATEGORY_LABELS[category.category]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
