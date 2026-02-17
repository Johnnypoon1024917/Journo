/**
 * GroupSplitView Component Tests
 * 
 * Tests for the GroupSplitView organism component
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GroupSplitView } from '../GroupSplitView';
import { ExpenseEntry, TripMember } from '../../../../types/expense';
import { budgetService } from '../../../../services/budgetService';

// Mock the budget service
vi.mock('../../../../services/budgetService', () => ({
  budgetService: {
    calculateMemberBalances: vi.fn(),
    calculateSettlements: vi.fn(),
    updateExpense: vi.fn(),
  },
}));

describe('GroupSplitView', () => {
  const mockTripMembers: TripMember[] = [
    { id: 'user1', name: 'Alice', email: 'alice@example.com' },
    { id: 'user2', name: 'Bob', email: 'bob@example.com' },
    { id: 'user3', name: 'Charlie', email: 'charlie@example.com' },
  ];

  const mockExpenses: ExpenseEntry[] = [
    {
      id: 'exp1',
      tripId: 'trip1',
      amount: 300,
      currency: 'USD',
      category: 'food',
      date: '2024-01-15',
      paidBy: 'user1',
      splitWith: ['user1', 'user2', 'user3'],
      splitType: 'equal',
      isSettled: false,
      createdBy: 'user1',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      syncStatus: 'synced',
    },
    {
      id: 'exp2',
      tripId: 'trip1',
      amount: 150,
      currency: 'USD',
      category: 'transport',
      date: '2024-01-16',
      paidBy: 'user2',
      splitWith: ['user1', 'user2', 'user3'],
      splitType: 'equal',
      isSettled: false,
      createdBy: 'user2',
      createdAt: '2024-01-16T10:00:00Z',
      updatedAt: '2024-01-16T10:00:00Z',
      syncStatus: 'synced',
    },
  ];

  const mockMemberBalances = [
    {
      userId: 'user1',
      userName: 'Alice',
      totalPaid: 300,
      totalOwed: 150,
      netBalance: 150,
    },
    {
      userId: 'user2',
      userName: 'Bob',
      totalPaid: 150,
      totalOwed: 150,
      netBalance: 0,
    },
    {
      userId: 'user3',
      userName: 'Charlie',
      totalPaid: 0,
      totalOwed: 150,
      netBalance: -150,
    },
  ];

  const mockSettlements = [
    {
      from: 'user3',
      to: 'user1',
      amount: 150,
      currency: 'USD',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (budgetService.calculateMemberBalances as any).mockReturnValue(mockMemberBalances);
    (budgetService.calculateSettlements as any).mockReturnValue(mockSettlements);
  });

  describe('Rendering', () => {
    it('should not render for single-member trips', () => {
      const singleMember = [mockTripMembers[0]];
      const { container } = render(
        <GroupSplitView
          tripId="trip1"
          expenses={mockExpenses}
          tripMembers={singleMember}
          currency="USD"
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should not render when no members provided', () => {
      const { container } = render(
        <GroupSplitView
          tripId="trip1"
          expenses={mockExpenses}
          tripMembers={[]}
          currency="USD"
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render for multi-member trips', () => {
      render(
        <GroupSplitView
          tripId="trip1"
          expenses={mockExpenses}
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );
      expect(screen.getByText('Group Split')).toBeInTheDocument();
    });

    it('should display member balances', () => {
      render(
        <GroupSplitView
          tripId="trip1"
          expenses={mockExpenses}
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );
      expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Bob').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Charlie').length).toBeGreaterThan(0);
    });

    it('should display settlement instructions when there are unsettled expenses', () => {
      render(
        <GroupSplitView
          tripId="trip1"
          expenses={mockExpenses}
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );
      expect(screen.getByText('Settlement Instructions')).toBeInTheDocument();
    });

    it('should display settle button when there are unsettled expenses', () => {
      render(
        <GroupSplitView
          tripId="trip1"
          expenses={mockExpenses}
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );
      expect(screen.getByText('Settle All Expenses')).toBeInTheDocument();
    });

    it('should not display settle button when all expenses are settled', () => {
      const settledExpenses = mockExpenses.map(exp => ({ ...exp, isSettled: true }));
      render(
        <GroupSplitView
          tripId="trip1"
          expenses={settledExpenses}
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );
      expect(screen.queryByText('Settle All Expenses')).not.toBeInTheDocument();
    });

    it('should display "All Settled!" message when no settlements needed', () => {
      (budgetService.calculateSettlements as any).mockReturnValue([]);
      render(
        <GroupSplitView
          tripId="trip1"
          expenses={mockExpenses}
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );
      expect(screen.getByText(/All Settled!/)).toBeInTheDocument();
    });
  });

  describe('Settlement Calculations', () => {
    it('should call calculateMemberBalances with correct parameters', () => {
      render(
        <GroupSplitView
          tripId="trip1"
          expenses={mockExpenses}
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );
      expect(budgetService.calculateMemberBalances).toHaveBeenCalledWith(
        mockExpenses,
        mockTripMembers
      );
    });

    it('should call calculateSettlements with member balances', () => {
      render(
        <GroupSplitView
          tripId="trip1"
          expenses={mockExpenses}
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );
      expect(budgetService.calculateSettlements).toHaveBeenCalledWith(mockMemberBalances);
    });

    it('should recalculate when expenses change', () => {
      const { rerender } = render(
        <GroupSplitView
          tripId="trip1"
          expenses={mockExpenses}
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      const newExpenses = [...mockExpenses, {
        ...mockExpenses[0],
        id: 'exp3',
        amount: 200,
      }];

      rerender(
        <GroupSplitView
          tripId="trip1"
          expenses={newExpenses}
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      expect(budgetService.calculateMemberBalances).toHaveBeenCalledTimes(2);
    });
  });

  describe('Settlement Modal', () => {
    it('should open confirmation modal when settle button is clicked', () => {
      render(
        <GroupSplitView
          tripId="trip1"
          expenses={mockExpenses}
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      const settleButton = screen.getByText('Settle All Expenses');
      fireEvent.click(settleButton);

      expect(screen.getByRole('button', { name: /confirm settlement/i })).toBeInTheDocument();
    });

    it('should close modal when cancel button is clicked', () => {
      render(
        <GroupSplitView
          tripId="trip1"
          expenses={mockExpenses}
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      const settleButton = screen.getByText('Settle All Expenses');
      fireEvent.click(settleButton);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(screen.queryByRole('button', { name: /confirm settlement/i })).not.toBeInTheDocument();
    });

    it('should close modal when clicking outside', () => {
      render(
        <GroupSplitView
          tripId="trip1"
          expenses={mockExpenses}
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      const settleButton = screen.getByText('Settle All Expenses');
      fireEvent.click(settleButton);

      const modal = screen.getByRole('button', { name: /confirm settlement/i }).closest('div')?.parentElement?.parentElement;
      if (modal) {
        fireEvent.click(modal);
      }

      expect(screen.queryByRole('button', { name: /confirm settlement/i })).not.toBeInTheDocument();
    });

    it('should not close modal when clicking inside modal content', () => {
      render(
        <GroupSplitView
          tripId="trip1"
          expenses={mockExpenses}
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      const settleButton = screen.getByText('Settle All Expenses');
      fireEvent.click(settleButton);

      const modalContent = screen.getByRole('button', { name: /confirm settlement/i }).closest('div');
      if (modalContent) {
        fireEvent.click(modalContent);
      }

      expect(screen.getByRole('button', { name: /confirm settlement/i })).toBeInTheDocument();
    });
  });

  describe('Settlement Process', () => {
    it('should mark all unsettled expenses as settled when confirmed', async () => {
      (budgetService.updateExpense as any).mockResolvedValue({});

      render(
        <GroupSplitView
          tripId="trip1"
          expenses={mockExpenses}
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      const settleButton = screen.getByText('Settle All Expenses');
      fireEvent.click(settleButton);

      const confirmButton = screen.getByRole('button', { name: /confirm settlement/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(budgetService.updateExpense).toHaveBeenCalledTimes(2);
      });

      expect(budgetService.updateExpense).toHaveBeenCalledWith('trip1', 'exp1', {
        isSettled: true,
      });
      expect(budgetService.updateExpense).toHaveBeenCalledWith('trip1', 'exp2', {
        isSettled: true,
      });
    });

    it('should call onSettleComplete callback after successful settlement', async () => {
      (budgetService.updateExpense as any).mockResolvedValue({});
      const onSettleComplete = vi.fn();

      render(
        <GroupSplitView
          tripId="trip1"
          expenses={mockExpenses}
          tripMembers={mockTripMembers}
          currency="USD"
          onSettleComplete={onSettleComplete}
        />
      );

      const settleButton = screen.getByText('Settle All Expenses');
      fireEvent.click(settleButton);

      const confirmButton = screen.getByRole('button', { name: /confirm settlement/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(onSettleComplete).toHaveBeenCalled();
      });
    });

    it('should show loading state during settlement', async () => {
      (budgetService.updateExpense as any).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <GroupSplitView
          tripId="trip1"
          expenses={mockExpenses}
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      const settleButton = screen.getByText('Settle All Expenses');
      fireEvent.click(settleButton);

      const confirmButton = screen.getByRole('button', { name: /confirm settlement/i });
      fireEvent.click(confirmButton);

      expect(screen.getAllByText('Settling...').length).toBeGreaterThan(0);

      await waitFor(() => {
        expect(screen.queryByText('Settling...')).not.toBeInTheDocument();
      });
    });

    it('should handle settlement errors gracefully', async () => {
      (budgetService.updateExpense as any).mockRejectedValue(
        new Error('Network error')
      );
      
      // Mock window.alert
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(
        <GroupSplitView
          tripId="trip1"
          expenses={mockExpenses}
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      const settleButton = screen.getByText('Settle All Expenses');
      fireEvent.click(settleButton);

      const confirmButton = screen.getByRole('button', { name: /confirm settlement/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith(
          'Failed to settle expenses. Please try again.'
        );
      });

      alertMock.mockRestore();
    });

    it('should not settle already settled expenses', async () => {
      const mixedExpenses = [
        { ...mockExpenses[0], isSettled: false },
        { ...mockExpenses[1], isSettled: true },
      ];

      (budgetService.updateExpense as any).mockResolvedValue({});

      render(
        <GroupSplitView
          tripId="trip1"
          expenses={mixedExpenses}
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      const settleButton = screen.getByText('Settle All Expenses');
      fireEvent.click(settleButton);

      const confirmButton = screen.getByRole('button', { name: /confirm settlement/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(budgetService.updateExpense).toHaveBeenCalledTimes(1);
      });

      expect(budgetService.updateExpense).toHaveBeenCalledWith('trip1', 'exp1', {
        isSettled: true,
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA label on settle button', () => {
      render(
        <GroupSplitView
          tripId="trip1"
          expenses={mockExpenses}
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      const settleButton = screen.getByLabelText('Settle all expenses');
      expect(settleButton).toBeInTheDocument();
    });

    it('should disable buttons during settlement process', async () => {
      (budgetService.updateExpense as any).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <GroupSplitView
          tripId="trip1"
          expenses={mockExpenses}
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      const settleButton = screen.getByText('Settle All Expenses');
      fireEvent.click(settleButton);

      const confirmButton = screen.getByRole('button', { name: /confirm settlement/i });
      fireEvent.click(confirmButton);

      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.queryByText('Settling...')).not.toBeInTheDocument();
      });
    });
  });
});
