import React from 'react';
import { BudgetSummary } from '../../services/budgetService';
import { getCurrencySymbol } from '../../constants/currencies';

interface BudgetCardProps {
  summary: BudgetSummary;
  onEdit?: () => void;
  onExportPDF?: () => void;
  onExportCSV?: () => void;
  onShare?: () => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({ 
  summary, 
  onEdit, 
  onExportPDF, 
  onExportCSV, 
  onShare,
}) => {
  const { totalBudget, totalSpent, remaining, percentageSpent, currency, dailyBudget, status } =
    summary;

  const currencySymbol = getCurrencySymbol(currency);

  // Ensure numeric values
  const safeTotalBudget = Number(totalBudget) || 0;
  const safeTotalSpent = Number(totalSpent) || 0;
  const safeRemaining = Number(remaining) || 0;
  const safeDailyBudget = Number(dailyBudget) || 0;

  // Determine colors based on status
  const getStatusColors = () => {
    switch (status) {
      case 'danger':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-700 dark:text-red-300',
          progress: 'bg-red-500',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          text: 'text-yellow-700 dark:text-yellow-300',
          progress: 'bg-yellow-500',
        };
      default:
        return {
          bg: 'bg-white dark:bg-gray-800',
          border: 'border-gray-200 dark:border-gray-700',
          text: 'text-gray-700 dark:text-gray-300',
          progress: 'bg-blue-500',
        };
    }
  };

  const colors = getStatusColors();

  return (
    <div className={`rounded-lg border-2 ${colors.border} ${colors.bg} p-6 space-y-4`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Budget Overview</h3>
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Edit Budget
            </button>
          )}
        </div>
      </div>

      {/* Export Actions */}
      {(onExportPDF || onExportCSV || onShare) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {onExportPDF && (
            <button
              onClick={onExportPDF}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 
                bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg 
                hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Export PDF
            </button>
          )}
          {onExportCSV && (
            <button
              onClick={onExportCSV}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 
                bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg 
                hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          )}
          {onShare && (
            <button
              onClick={onShare}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 
                bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg 
                hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share Budget
            </button>
          )}
        </div>
      )}

      {/* Total Budget */}
      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-gray-600 dark:text-gray-400">Total Budget</span>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {currencySymbol}
            {safeTotalBudget.toFixed(2)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="relative w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${colors.progress} transition-all duration-300`}
            style={{ width: `${Math.min(percentageSpent, 100)}%` }}
          />
          {percentageSpent > 100 && (
            <div
              className="absolute top-0 left-0 h-full bg-red-700 opacity-50"
              style={{ width: '100%' }}
            />
          )}
        </div>

        <div className="flex justify-between text-sm">
          <span className={colors.text}>
            {percentageSpent.toFixed(1)}% spent
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            {currencySymbol}
            {safeTotalSpent.toFixed(2)} / {currencySymbol}
            {safeTotalBudget.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Remaining Budget */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {safeRemaining >= 0 ? 'Remaining' : 'Over Budget'}
          </span>
          <span
            className={`text-xl font-bold ${
              safeRemaining >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {safeRemaining >= 0 ? '' : '-'}
            {currencySymbol}
            {Math.abs(safeRemaining).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Daily Budget */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Daily Budget</span>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            {currencySymbol}
            {safeDailyBudget.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Status Alert */}
      {status === 'warning' && (
        <div className="flex items-start gap-2 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
          <svg
            className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            You've spent over 80% of your budget. Consider adjusting your spending.
          </p>
        </div>
      )}

      {status === 'danger' && (
        <div className="flex items-start gap-2 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
          <svg
            className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-red-800 dark:text-red-200">
            You've exceeded your budget by {currencySymbol}
            {Math.abs(safeRemaining).toFixed(2)}!
          </p>
        </div>
      )}
    </div>
  );
};
