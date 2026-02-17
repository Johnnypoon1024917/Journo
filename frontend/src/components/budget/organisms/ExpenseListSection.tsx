import React, { useState, useMemo, useCallback } from 'react';
import { ExpenseEntry, FilterTab as FilterTabType } from '../../../types/expense';
import { FilterTab } from '../atoms/FilterTab';
import { FloatingAddButton } from '../atoms/FloatingAddButton';
import { ExpenseCard } from '../molecules/ExpenseCard';

interface ExpenseListSectionProps {
  expenses: ExpenseEntry[];
  homeCurrency: string;
  exchangeRate: number;
  onAddExpense: () => void;
  onEditExpense: (expense: ExpenseEntry) => void;
  onDeleteExpense: (expenseId: string) => void;
  className?: string;
}

const FILTER_LABELS: Record<FilterTabType, string> = {
  all: '全部',
  pending: '待支付',
  settled: '已結算',
  'by-category': '按類別',
  'by-date': '按日期',
};

export const ExpenseListSection: React.FC<ExpenseListSectionProps> = ({
  expenses,
  homeCurrency,
  exchangeRate,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  className = '',
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterTabType>('all');

  // Filter expenses based on active filter
  const filteredExpenses = useMemo(() => {
    let filtered = [...expenses];

    switch (activeFilter) {
      case 'pending':
        filtered = filtered.filter(
          (expense) => expense.splitWith && expense.splitWith.length > 0 && !expense.isSettled
        );
        break;
      case 'settled':
        filtered = filtered.filter(
          (expense) => expense.splitWith && expense.splitWith.length > 0 && expense.isSettled
        );
        break;
      case 'all':
      case 'by-category':
      case 'by-date':
        // For 'all', 'by-category', and 'by-date', we show all expenses
        // Grouping logic will be handled in the rendering
        break;
    }

    return filtered;
  }, [expenses, activeFilter]);

  // Group expenses by category or date based on filter
  const groupedExpenses = useMemo(() => {
    if (activeFilter === 'by-category') {
      const groups: Record<string, ExpenseEntry[]> = {};
      filteredExpenses.forEach((expense) => {
        if (!groups[expense.category]) {
          groups[expense.category] = [];
        }
        groups[expense.category].push(expense);
      });
      return groups;
    } else if (activeFilter === 'by-date') {
      const groups: Record<string, ExpenseEntry[]> = {};
      filteredExpenses.forEach((expense) => {
        const date = new Date(expense.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(expense);
      });
      return groups;
    }
    return null;
  }, [filteredExpenses, activeFilter]);

  // Sort expenses in reverse chronological order for non-grouped views
  const sortedExpenses = useMemo(() => {
    if (groupedExpenses) return [];
    return [...filteredExpenses].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [filteredExpenses, groupedExpenses]);

  // Calculate counts for filter tabs
  const filterCounts = useMemo(() => {
    const pending = expenses.filter(
      (e) => e.splitWith && e.splitWith.length > 0 && !e.isSettled
    ).length;
    const settled = expenses.filter(
      (e) => e.splitWith && e.splitWith.length > 0 && e.isSettled
    ).length;

    return {
      all: expenses.length,
      pending,
      settled,
      'by-category': expenses.length,
      'by-date': expenses.length,
    };
  }, [expenses]);

  const handleFilterChange = useCallback((filter: FilterTabType) => {
    setActiveFilter(filter);
  }, []);

  // Virtual scrolling: Only render visible items for large lists
  const shouldUseVirtualScrolling = filteredExpenses.length > 50;

  // For virtual scrolling, we'll use a simple approach with CSS
  // More advanced virtual scrolling can be added with libraries like react-window if needed

  return (
    <section
      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-bubblequest-sm border-2 border-[#d5d0c2] dark:border-gray-700 p-4 ${className}`}
      aria-label="Expense list section"
    >
      {/* Filter Tabs */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 pb-4 -mx-4 px-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {(Object.keys(FILTER_LABELS) as FilterTabType[]).map((filter) => (
            <FilterTab
              key={filter}
              label={FILTER_LABELS[filter]}
              value={filter}
              isActive={activeFilter === filter}
              count={filterCounts[filter]}
              onClick={handleFilterChange}
            />
          ))}
        </div>
      </div>

      {/* Expense List */}
      <div
        className={`space-y-3 ${
          shouldUseVirtualScrolling ? 'max-h-[600px] overflow-y-auto' : ''
        }`}
        role="list"
        aria-label={`${filteredExpenses.length} expenses`}
      >
        {filteredExpenses.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-24 h-24 mb-4 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-pink-300 dark:text-pink-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {activeFilter === 'pending' && 'No pending expenses'}
              {activeFilter === 'settled' && 'No settled expenses'}
              {activeFilter !== 'pending' && activeFilter !== 'settled' && 'No expenses yet'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
              {activeFilter === 'pending' &&
                'Split expenses that need settlement will appear here.'}
              {activeFilter === 'settled' &&
                'Settled split expenses will appear here.'}
              {activeFilter !== 'pending' &&
                activeFilter !== 'settled' &&
                'Start tracking your trip expenses by adding your first expense.'}
            </p>
          </div>
        ) : groupedExpenses ? (
          // Grouped View (by category or date)
          Object.entries(groupedExpenses)
            .sort(([keyA], [keyB]) => {
              // Sort groups
              if (activeFilter === 'by-date') {
                return new Date(keyB).getTime() - new Date(keyA).getTime();
              }
              return keyA.localeCompare(keyB);
            })
            .map(([groupKey, groupExpenses]) => (
              <div key={groupKey} className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide px-2">
                  {groupKey}
                </h3>
                <div className="space-y-3">
                  {groupExpenses
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    )
                    .map((expense) => (
                      <ExpenseCard
                        key={expense.id}
                        expense={expense}
                        homeCurrency={homeCurrency}
                        exchangeRate={exchangeRate}
                        onEdit={onEditExpense}
                        onDelete={onDeleteExpense}
                      />
                    ))}
                </div>
              </div>
            ))
        ) : (
          // Flat List View
          sortedExpenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              homeCurrency={homeCurrency}
              exchangeRate={exchangeRate}
              onEdit={onEditExpense}
              onDelete={onDeleteExpense}
            />
          ))
        )}
      </div>

      {/* Floating Add Button */}
      <FloatingAddButton onClick={onAddExpense} label="Add Expense" />
    </section>
  );
};
