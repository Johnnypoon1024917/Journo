import React, { useState } from 'react';
import { CategoryComparisonChart } from '../molecules/CategoryComparisonChart';
import { SpendingOverTimeChart } from '../molecules/SpendingOverTimeChart';
import { CategoryProgressBars } from '../molecules/CategoryProgressBars';
import { CategorySummary, ExpenseEntry } from '../../../types/expense';

interface VisualizationSectionProps {
  categorySummaries: CategorySummary[];
  expenses: ExpenseEntry[];
  totalBudget: number;
  currency: string;
  tripStartDate?: string;
  tripEndDate?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export const VisualizationSection: React.FC<VisualizationSectionProps> = ({
  categorySummaries,
  expenses,
  totalBudget,
  currency,
  tripStartDate,
  tripEndDate,
  isCollapsed = false,
  onToggleCollapse,
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Render collapsed state
  if (isCollapsed) {
    return (
      <div className={`rounded-2xl border-2 border-[#d5d0c2] dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-kawaii-sm ${className}`}>
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
          aria-expanded="false"
          aria-label="Expand visualizations section"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Budget Visualizations</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Charts and progress tracking
              </p>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-400 transform transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    );
  }

  // Render expanded state
  return (
    <div className={`rounded-2xl border-2 border-[#d5d0c2] dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-kawaii-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b-2 border-[#d5d0c2] dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Budget Visualizations</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Detailed charts and progress tracking
              </p>
            </div>
          </div>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-expanded="true"
              aria-label="Collapse visualizations section"
            >
              <svg className="w-5 h-5 text-gray-400 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin h-8 w-8 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-sm text-gray-600 dark:text-gray-400">Loading charts...</p>
            </div>
          </div>
        )}

        {/* Charts - Only render when not loading */}
        {!isLoading && (
          <>
            {/* Category Comparison Chart */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-purple-500 rounded-full" />
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Category Comparison
                </h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Compare planned budget vs actual spending by category
              </p>
              <div className="rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
                <CategoryComparisonChart
                  categorySummaries={categorySummaries}
                  currency={currency}
                  height={300}
                  showLegend={true}
                />
              </div>
            </div>

            {/* Spending Over Time Chart */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-pink-500 rounded-full" />
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Spending Over Time
                </h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Track your cumulative spending throughout the trip
              </p>
              <div className="rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
                <SpendingOverTimeChart
                  expenses={expenses}
                  totalBudget={totalBudget}
                  currency={currency}
                  tripStartDate={tripStartDate}
                  tripEndDate={tripEndDate}
                  height={300}
                  showLegend={true}
                />
              </div>
            </div>

            {/* Category Progress Bars */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-green-500 rounded-full" />
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Category Progress
                </h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Detailed breakdown of spending in each category
              </p>
              <CategoryProgressBars
                categorySummaries={categorySummaries}
                currency={currency}
              />
            </div>
          </>
        )}

        {/* Empty State */}
        {!isLoading && expenses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              No Data Yet
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm">
              Add expenses to see detailed visualizations and track your spending progress
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
