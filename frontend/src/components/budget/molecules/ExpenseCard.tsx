import React from 'react';
import { ExpenseEntry, BudgetCategory } from '../../../types/expense';

interface ExpenseCardProps {
  expense: ExpenseEntry;
  homeCurrency: string;
  exchangeRate: number;
  onEdit: (expense: ExpenseEntry) => void;
  onDelete: (expenseId: string) => void;
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

export const ExpenseCard: React.FC<ExpenseCardProps> = ({
  expense,
  homeCurrency,
  exchangeRate,
  onEdit,
  onDelete,
  className = '',
}) => {
  const categoryInfo = CATEGORY_INFO[expense.category];
  const homeAmount = expense.amount * exchangeRate;
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    console.log('ExpenseCard - formatDate:', { dateString, date, formatted: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) });
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const handleEdit = () => {
    onEdit(expense);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      onDelete(expense.id);
    }
  };

  return (
    <div
      className={`rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3 transition-all duration-200 hover:shadow-lg ${className}`}
      role="article"
      aria-label={`Expense: ${categoryInfo.label}, ${formatAmount(expense.amount, expense.currency)}`}
    >
      {/* Header: Category and Amount */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${categoryInfo.color} text-2xl`}>
            {categoryInfo.emoji}
          </span>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {categoryInfo.label}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(expense.date)}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {formatAmount(expense.amount, expense.currency)}
          </div>
          {expense.currency !== homeCurrency && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {formatAmount(homeAmount, homeCurrency)}
            </div>
          )}
        </div>
      </div>

      {/* Note */}
      {expense.note && (
        <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
          {expense.note}
        </div>
      )}

      {/* Split Information */}
      {expense.splitWith && expense.splitWith.length > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 dark:text-gray-400">Split:</span>
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
              {expense.splitType === 'equal' ? 'Equal' : 'Custom'}
            </span>
            <span className="text-gray-600 dark:text-gray-300">
              with {expense.splitWith.length} {expense.splitWith.length === 1 ? 'person' : 'people'}
            </span>
          </div>
          {!expense.isSettled && (
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs font-medium">
              Pending
            </span>
          )}
          {expense.isSettled && (
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium">
              Settled
            </span>
          )}
        </div>
      )}

      {/* Sync Status */}
      {expense.syncStatus !== 'synced' && (
        <div className="flex items-center gap-2 text-xs">
          {expense.syncStatus === 'pending' && (
            <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Syncing...
            </span>
          )}
          {expense.syncStatus === 'error' && (
            <span className="inline-flex items-center gap-1 text-red-500 dark:text-red-400">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Sync failed
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleEdit}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 font-medium text-sm hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-pink-300 dark:focus:ring-pink-600"
          aria-label="Edit expense"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
        <button
          onClick={handleDelete}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium text-sm hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-600"
          aria-label="Delete expense"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
};
