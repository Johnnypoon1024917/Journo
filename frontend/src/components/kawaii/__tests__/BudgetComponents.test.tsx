/**
 * Tests for Budget Components
 * 
 * Tests ExpenseItem and ExpenseSummary components
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExpenseItem } from '../ExpenseItem';
import { ExpenseSummary } from '../ExpenseSummary';
import { Expense, ExpenseStats } from '@/types/expense';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'budget.categories.accommodation': 'Accommodation',
        'budget.categories.food': 'Food',
        'budget.categories.transport': 'Transport',
        'budget.categories.activities': 'Activities',
        'budget.categories.shopping': 'Shopping',
        'budget.categories.misc': 'Miscellaneous',
        'budget.totalExpenses': 'Total Expenses',
        'budget.categoryBreakdown': 'Category Breakdown',
        'budget.noExpenses': 'No expenses recorded yet',
        'common.edit': 'Edit',
        'common.delete': 'Delete',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('ExpenseItem', () => {
  const mockExpense: Expense = {
    id: '1',
    trip_id: 'trip-1',
    amount: 150.50,
    currency: 'USD',
    category: 'food',
    date: '2026-02-15',
    notes: 'Dinner at restaurant',
    created_at: '2026-01-31T00:00:00Z',
    updated_at: '2026-01-31T00:00:00Z',
  };

  it('renders expense item with all details', () => {
    render(<ExpenseItem expense={mockExpense} />);

    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('$150.50')).toBeInTheDocument();
    expect(screen.getByText('Feb 15, 2026')).toBeInTheDocument();
    expect(screen.getByText('Dinner at restaurant')).toBeInTheDocument();
  });

  it('renders without notes', () => {
    const expenseWithoutNotes = { ...mockExpense, notes: undefined };
    render(<ExpenseItem expense={expenseWithoutNotes} />);

    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.queryByText('Dinner at restaurant')).not.toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(<ExpenseItem expense={mockExpense} onEdit={onEdit} />);

    // Open menu
    const menuButton = screen.getByLabelText('Menu');
    fireEvent.click(menuButton);

    // Click edit
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when delete button is clicked', async () => {
    const onDelete = vi.fn();
    render(<ExpenseItem expense={mockExpense} onDelete={onDelete} />);

    // Open menu
    const menuButton = screen.getByLabelText('Menu');
    fireEvent.click(menuButton);

    // Click delete
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    // Wait for the animation timeout
    await new Promise(resolve => setTimeout(resolve, 350));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('displays correct category icon and color for accommodation', () => {
    const accommodationExpense = { ...mockExpense, category: 'accommodation' as const };
    const { container } = render(<ExpenseItem expense={accommodationExpense} />);

    expect(screen.getByText('Accommodation')).toBeInTheDocument();
    expect(container.querySelector('.bg-purple-100')).toBeInTheDocument();
  });

  it('displays correct category icon and color for transport', () => {
    const transportExpense = { ...mockExpense, category: 'transport' as const };
    const { container } = render(<ExpenseItem expense={transportExpense} />);

    expect(screen.getByText('Transport')).toBeInTheDocument();
    expect(container.querySelector('.bg-blue-100')).toBeInTheDocument();
  });
});

describe('ExpenseSummary', () => {
  const mockStats: ExpenseStats = {
    total: 500.00,
    currency: 'USD',
    byCategory: [
      {
        category: 'food',
        amount: 200.00,
        percentage: 40,
        count: 3,
      },
      {
        category: 'transport',
        amount: 150.00,
        percentage: 30,
        count: 2,
      },
      {
        category: 'activities',
        amount: 150.00,
        percentage: 30,
        count: 1,
      },
    ],
  };

  it('renders total expenses', () => {
    render(<ExpenseSummary stats={mockStats} />);

    expect(screen.getByText('Total Expenses')).toBeInTheDocument();
    expect(screen.getByText('$500.00')).toBeInTheDocument();
  });

  it('renders category breakdown', () => {
    render(<ExpenseSummary stats={mockStats} />);

    expect(screen.getByText('Category Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Transport')).toBeInTheDocument();
    expect(screen.getByText('Activities')).toBeInTheDocument();
  });

  it('displays correct amounts and percentages for each category', () => {
    render(<ExpenseSummary stats={mockStats} />);

    expect(screen.getByText('$200.00')).toBeInTheDocument();
    expect(screen.getByText('40.0%')).toBeInTheDocument();
    
    // Use getAllByText for duplicate amounts
    const amounts = screen.getAllByText('$150.00');
    expect(amounts).toHaveLength(2); // Transport and Activities both have $150
    
    const percentages = screen.getAllByText('30.0%');
    expect(percentages).toHaveLength(2); // Both 30%
  });

  it('displays item counts for each category', () => {
    render(<ExpenseSummary stats={mockStats} />);

    expect(screen.getByText('(3)')).toBeInTheDocument();
    expect(screen.getByText('(2)')).toBeInTheDocument();
    expect(screen.getByText('(1)')).toBeInTheDocument();
  });

  it('renders empty state when no expenses', () => {
    const emptyStats: ExpenseStats = {
      total: 0,
      currency: 'USD',
      byCategory: [],
    };

    render(<ExpenseSummary stats={emptyStats} />);

    expect(screen.getByText('No expenses recorded yet')).toBeInTheDocument();
  });

  it('filters out categories with zero amount', () => {
    const statsWithZero: ExpenseStats = {
      total: 200.00,
      currency: 'USD',
      byCategory: [
        {
          category: 'food',
          amount: 200.00,
          percentage: 100,
          count: 2,
        },
        {
          category: 'transport',
          amount: 0,
          percentage: 0,
          count: 0,
        },
      ],
    };

    render(<ExpenseSummary stats={statsWithZero} />);

    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.queryByText('Transport')).not.toBeInTheDocument();
  });

  it('handles different currencies', () => {
    const euroStats = { ...mockStats, currency: 'EUR' };
    render(<ExpenseSummary stats={euroStats} />);

    expect(screen.getByText('€500.00')).toBeInTheDocument();
  });
});
