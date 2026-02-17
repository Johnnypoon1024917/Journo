import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExpenseListSection } from '../ExpenseListSection';
import { ExpenseEntry, BudgetCategory } from '../../../../types/expense';

// Mock the child components
vi.mock('../../atoms/FilterTab', () => ({
  FilterTab: ({ label, isActive, onClick, value }: any) => (
    <button
      data-testid={`filter-${value}`}
      onClick={() => onClick(value)}
      aria-pressed={isActive}
    >
      {label}
    </button>
  ),
}));

vi.mock('../../atoms/FloatingAddButton', () => ({
  FloatingAddButton: ({ onClick, label }: any) => (
    <button data-testid="floating-add-button" onClick={onClick}>
      {label}
    </button>
  ),
}));

vi.mock('../../molecules/ExpenseCard', () => ({
  ExpenseCard: ({ expense, onEdit, onDelete }: any) => (
    <div data-testid={`expense-card-${expense.id}`} role="listitem">
      <span>{expense.category}</span>
      <span>{expense.amount}</span>
      <button onClick={() => onEdit(expense)}>Edit</button>
      <button onClick={() => onDelete(expense.id)}>Delete</button>
    </div>
  ),
}));

describe('ExpenseListSection', () => {
  const mockExpenses: ExpenseEntry[] = [
    {
      id: '1',
      tripId: 'trip1',
      amount: 100,
      currency: 'USD',
      category: 'food' as BudgetCategory,
      date: '2024-03-15T00:00:00.000Z',
      note: 'Lunch',
      isSettled: false,
      createdBy: 'user1',
      createdAt: '2024-03-15T12:00:00.000Z',
      updatedAt: '2024-03-15T12:00:00.000Z',
      syncStatus: 'synced',
    },
    {
      id: '2',
      tripId: 'trip1',
      amount: 200,
      currency: 'USD',
      category: 'accommodation' as BudgetCategory,
      date: '2024-03-14T00:00:00.000Z',
      note: 'Hotel',
      splitWith: ['user1', 'user2'],
      splitType: 'equal',
      isSettled: false,
      createdBy: 'user1',
      createdAt: '2024-03-14T12:00:00.000Z',
      updatedAt: '2024-03-14T12:00:00.000Z',
      syncStatus: 'synced',
    },
    {
      id: '3',
      tripId: 'trip1',
      amount: 50,
      currency: 'USD',
      category: 'transport' as BudgetCategory,
      date: '2024-03-13T00:00:00.000Z',
      note: 'Taxi',
      splitWith: ['user1', 'user2'],
      splitType: 'equal',
      isSettled: true,
      createdBy: 'user1',
      createdAt: '2024-03-13T12:00:00.000Z',
      updatedAt: '2024-03-13T12:00:00.000Z',
      syncStatus: 'synced',
    },
  ];

  const defaultProps = {
    expenses: mockExpenses,
    homeCurrency: 'HKD',
    exchangeRate: 7.8,
    onAddExpense: vi.fn(),
    onEditExpense: vi.fn(),
    onDeleteExpense: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the expense list section', () => {
      render(<ExpenseListSection {...defaultProps} />);
      expect(screen.getByLabelText('Expense list section')).toBeInTheDocument();
    });

    it('should render all filter tabs', () => {
      render(<ExpenseListSection {...defaultProps} />);
      expect(screen.getByTestId('filter-all')).toBeInTheDocument();
      expect(screen.getByTestId('filter-pending')).toBeInTheDocument();
      expect(screen.getByTestId('filter-settled')).toBeInTheDocument();
      expect(screen.getByTestId('filter-by-category')).toBeInTheDocument();
      expect(screen.getByTestId('filter-by-date')).toBeInTheDocument();
    });

    it('should render floating add button', () => {
      render(<ExpenseListSection {...defaultProps} />);
      expect(screen.getByTestId('floating-add-button')).toBeInTheDocument();
    });

    it('should render all expenses by default', () => {
      render(<ExpenseListSection {...defaultProps} />);
      expect(screen.getByTestId('expense-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('expense-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('expense-card-3')).toBeInTheDocument();
    });

    it('should render expenses in reverse chronological order', () => {
      render(<ExpenseListSection {...defaultProps} />);
      const expenseCards = screen.getAllByRole('listitem');
      expect(expenseCards[0]).toHaveAttribute('data-testid', 'expense-card-1'); // Most recent
      expect(expenseCards[1]).toHaveAttribute('data-testid', 'expense-card-2');
      expect(expenseCards[2]).toHaveAttribute('data-testid', 'expense-card-3'); // Oldest
    });
  });

  describe('Filter Functionality', () => {
    it('should show all expenses when "all" filter is active', () => {
      render(<ExpenseListSection {...defaultProps} />);
      expect(screen.getByTestId('expense-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('expense-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('expense-card-3')).toBeInTheDocument();
    });

    it('should filter pending expenses when "pending" filter is clicked', () => {
      render(<ExpenseListSection {...defaultProps} />);
      
      const pendingFilter = screen.getByTestId('filter-pending');
      fireEvent.click(pendingFilter);

      // Should show only unsettled split expenses
      expect(screen.queryByTestId('expense-card-1')).not.toBeInTheDocument(); // No split
      expect(screen.getByTestId('expense-card-2')).toBeInTheDocument(); // Split, not settled
      expect(screen.queryByTestId('expense-card-3')).not.toBeInTheDocument(); // Settled
    });

    it('should filter settled expenses when "settled" filter is clicked', () => {
      render(<ExpenseListSection {...defaultProps} />);
      
      const settledFilter = screen.getByTestId('filter-settled');
      fireEvent.click(settledFilter);

      // Should show only settled split expenses
      expect(screen.queryByTestId('expense-card-1')).not.toBeInTheDocument(); // No split
      expect(screen.queryByTestId('expense-card-2')).not.toBeInTheDocument(); // Not settled
      expect(screen.getByTestId('expense-card-3')).toBeInTheDocument(); // Settled
    });

    it('should group expenses by category when "by-category" filter is clicked', () => {
      render(<ExpenseListSection {...defaultProps} />);
      
      const categoryFilter = screen.getByTestId('filter-by-category');
      fireEvent.click(categoryFilter);

      // Should show category headers (using role to distinguish from expense card content)
      const headings = screen.getAllByRole('heading', { level: 3 });
      const categoryNames = headings.map(h => h.textContent);
      expect(categoryNames).toContain('food');
      expect(categoryNames).toContain('accommodation');
      expect(categoryNames).toContain('transport');
    });

    it('should group expenses by date when "by-date" filter is clicked', () => {
      render(<ExpenseListSection {...defaultProps} />);
      
      const dateFilter = screen.getByTestId('filter-by-date');
      fireEvent.click(dateFilter);

      // Should show date headers (formatted)
      expect(screen.getByText(/March 15, 2024/)).toBeInTheDocument();
      expect(screen.getByText(/March 14, 2024/)).toBeInTheDocument();
      expect(screen.getByText(/March 13, 2024/)).toBeInTheDocument();
    });

    it('should update active filter state when filter is clicked', () => {
      render(<ExpenseListSection {...defaultProps} />);
      
      const allFilter = screen.getByTestId('filter-all');
      const pendingFilter = screen.getByTestId('filter-pending');

      // Initially "all" should be active
      expect(allFilter).toHaveAttribute('aria-pressed', 'true');
      expect(pendingFilter).toHaveAttribute('aria-pressed', 'false');

      // Click pending filter
      fireEvent.click(pendingFilter);

      // Now "pending" should be active
      expect(allFilter).toHaveAttribute('aria-pressed', 'false');
      expect(pendingFilter).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no expenses exist', () => {
      render(<ExpenseListSection {...defaultProps} expenses={[]} />);
      
      expect(screen.getByText('No expenses yet')).toBeInTheDocument();
      expect(
        screen.getByText(/Start tracking your trip expenses/)
      ).toBeInTheDocument();
    });

    it('should show pending empty state when no pending expenses', () => {
      const settledOnlyExpenses = [mockExpenses[2]]; // Only settled expense
      render(<ExpenseListSection {...defaultProps} expenses={settledOnlyExpenses} />);
      
      const pendingFilter = screen.getByTestId('filter-pending');
      fireEvent.click(pendingFilter);

      expect(screen.getByText('No pending expenses')).toBeInTheDocument();
      expect(
        screen.getByText(/Split expenses that need settlement/)
      ).toBeInTheDocument();
    });

    it('should show settled empty state when no settled expenses', () => {
      const pendingOnlyExpenses = [mockExpenses[1]]; // Only pending expense
      render(<ExpenseListSection {...defaultProps} expenses={pendingOnlyExpenses} />);
      
      const settledFilter = screen.getByTestId('filter-settled');
      fireEvent.click(settledFilter);

      expect(screen.getByText('No settled expenses')).toBeInTheDocument();
      expect(
        screen.getByText(/Settled split expenses will appear here/)
      ).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onAddExpense when floating add button is clicked', () => {
      render(<ExpenseListSection {...defaultProps} />);
      
      const addButton = screen.getByTestId('floating-add-button');
      fireEvent.click(addButton);

      expect(defaultProps.onAddExpense).toHaveBeenCalledTimes(1);
    });

    it('should call onEditExpense when edit button is clicked', () => {
      render(<ExpenseListSection {...defaultProps} />);
      
      const expenseCard = screen.getByTestId('expense-card-1');
      const editButton = within(expenseCard).getByText('Edit');
      fireEvent.click(editButton);

      expect(defaultProps.onEditExpense).toHaveBeenCalledWith(mockExpenses[0]);
    });

    it('should call onDeleteExpense when delete button is clicked', () => {
      render(<ExpenseListSection {...defaultProps} />);
      
      const expenseCard = screen.getByTestId('expense-card-1');
      const deleteButton = within(expenseCard).getByText('Delete');
      fireEvent.click(deleteButton);

      expect(defaultProps.onDeleteExpense).toHaveBeenCalledWith('1');
    });
  });

  describe('Virtual Scrolling', () => {
    it('should apply virtual scrolling styles for large lists (>50 items)', () => {
      const largeExpenseList = Array.from({ length: 60 }, (_, i) => ({
        ...mockExpenses[0],
        id: `expense-${i}`,
        date: new Date(2024, 2, i + 1).toISOString(),
      }));

      render(<ExpenseListSection {...defaultProps} expenses={largeExpenseList} />);
      
      const expenseList = screen.getByRole('list');
      expect(expenseList).toHaveClass('max-h-[600px]', 'overflow-y-auto');
    });

    it('should not apply virtual scrolling styles for small lists (<=50 items)', () => {
      render(<ExpenseListSection {...defaultProps} />);
      
      const expenseList = screen.getByRole('list');
      expect(expenseList).not.toHaveClass('max-h-[600px]');
      expect(expenseList).not.toHaveClass('overflow-y-auto');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ExpenseListSection {...defaultProps} />);
      
      expect(screen.getByLabelText('Expense list section')).toBeInTheDocument();
      expect(screen.getByLabelText('3 expenses')).toBeInTheDocument();
    });

    it('should have proper role attributes', () => {
      render(<ExpenseListSection {...defaultProps} />);
      
      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(3);
    });

    it('should update ARIA label when filter changes expense count', () => {
      render(<ExpenseListSection {...defaultProps} />);
      
      const pendingFilter = screen.getByTestId('filter-pending');
      fireEvent.click(pendingFilter);

      // Only 1 pending expense
      expect(screen.getByLabelText('1 expenses')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle expenses without split information', () => {
      const noSplitExpense: ExpenseEntry = {
        ...mockExpenses[0],
        splitWith: undefined,
        splitType: undefined,
      };

      render(<ExpenseListSection {...defaultProps} expenses={[noSplitExpense]} />);
      
      expect(screen.getByTestId('expense-card-1')).toBeInTheDocument();
    });

    it('should handle expenses with missing optional fields', () => {
      const minimalExpense: ExpenseEntry = {
        id: '1',
        tripId: 'trip1',
        amount: 100,
        currency: 'USD',
        category: 'food' as BudgetCategory,
        date: '2024-03-15T00:00:00.000Z',
        isSettled: false,
        createdBy: 'user1',
        createdAt: '2024-03-15T12:00:00.000Z',
        updatedAt: '2024-03-15T12:00:00.000Z',
        syncStatus: 'synced',
      };

      render(<ExpenseListSection {...defaultProps} expenses={[minimalExpense]} />);
      
      expect(screen.getByTestId('expense-card-1')).toBeInTheDocument();
    });

    it('should handle same-date expenses in by-date grouping', () => {
      const sameDateExpenses = [
        { ...mockExpenses[0], id: '1', date: '2024-03-15T10:00:00.000Z' },
        { ...mockExpenses[1], id: '2', date: '2024-03-15T14:00:00.000Z' },
      ];

      render(<ExpenseListSection {...defaultProps} expenses={sameDateExpenses} />);
      
      const dateFilter = screen.getByTestId('filter-by-date');
      fireEvent.click(dateFilter);

      // Both should be under the same date header
      const dateHeaders = screen.getAllByText(/March 15, 2024/);
      expect(dateHeaders).toHaveLength(1);
      expect(screen.getByTestId('expense-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('expense-card-2')).toBeInTheDocument();
    });

    it('should handle same-category expenses in by-category grouping', () => {
      const sameCategoryExpenses = [
        { ...mockExpenses[0], id: '1', category: 'food' as BudgetCategory },
        { ...mockExpenses[1], id: '2', category: 'food' as BudgetCategory },
      ];

      render(<ExpenseListSection {...defaultProps} expenses={sameCategoryExpenses} />);
      
      const categoryFilter = screen.getByTestId('filter-by-category');
      fireEvent.click(categoryFilter);

      // Both should be under the same category header
      const categoryHeaders = screen.getAllByRole('heading', { level: 3 });
      expect(categoryHeaders).toHaveLength(1);
      expect(categoryHeaders[0]).toHaveTextContent('food');
      expect(screen.getByTestId('expense-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('expense-card-2')).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <ExpenseListSection {...defaultProps} className="custom-class" />
      );
      
      const section = container.querySelector('section');
      expect(section).toHaveClass('custom-class');
    });
  });
});
