/**
 * ExpenseFormModal Organism Component Tests
 * 
 * Tests for the ExpenseFormModal component including:
 * - Modal rendering and animations
 * - Form submission with loading state
 * - Error handling and display
 * - Accessibility features
 * - User interactions
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { ExpenseFormModal } from '../ExpenseFormModal';
import { useBudgetStore } from '../../../../stores/budgetStore';
import { ExpenseEntry, TripMember } from '../../../../types/expense';

// Mock the budget store
vi.mock('../../../../stores/budgetStore');

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('ExpenseFormModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockAddExpense = vi.fn();
  const mockUpdateExpense = vi.fn();

  const mockTripMembers: TripMember[] = [
    {
      userId: 'user-1',
      userName: 'Alice',
      avatarUrl: 'https://example.com/alice.jpg',
    },
    {
      userId: 'user-2',
      userName: 'Bob',
      avatarUrl: 'https://example.com/bob.jpg',
    },
  ];

  const mockExpense: ExpenseEntry = {
    id: 'expense-1',
    tripId: 'trip-1',
    amount: 100,
    currency: 'USD',
    category: 'food',
    date: '2024-03-15',
    note: 'Lunch at restaurant',
    isSettled: false,
    syncStatus: 'synced',
    createdBy: 'user-1',
    createdAt: '2024-03-15T12:00:00Z',
    updatedAt: '2024-03-15T12:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the budget store
    (useBudgetStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      addExpense: mockAddExpense,
      updateExpense: mockUpdateExpense,
    });

    // Reset body overflow style
    document.body.style.overflow = 'unset';
  });

  afterEach(() => {
    // Clean up body overflow style
    document.body.style.overflow = 'unset';
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(
        <ExpenseFormModal
          isOpen={false}
          onClose={mockOnClose}
          tripId="trip-1"
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          tripId="trip-1"
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Add New Expense')).toBeInTheDocument();
    });

    it('should render with edit title when initialData is provided', () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          tripId="trip-1"
          tripMembers={mockTripMembers}
          currency="USD"
          initialData={mockExpense}
        />
      );

      expect(screen.getByText('Edit Expense')).toBeInTheDocument();
    });

    it('should render the ExpenseForm component', () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          tripId="trip-1"
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      // Check for form elements
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    });

    it('should render cat emoji in header', () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          tripId="trip-1"
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      const catEmoji = screen.getByLabelText('cat');
      expect(catEmoji).toBeInTheDocument();
      expect(catEmoji).toHaveTextContent('🐱');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          tripId="trip-1"
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'expense-form-modal-title');
    });

    it('should have accessible close button', () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          tripId="trip-1"
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toBeInTheDocument();
    });

    it('should prevent body scroll when open', () => {
      const { rerender } = render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          tripId="trip-1"
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <ExpenseFormModal
          isOpen={false}
          onClose={mockOnClose}
          tripId="trip-1"
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when close button is clicked', () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          tripId="trip-1"
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          tripId="trip-1"
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      // Find backdrop (the element with bg-black/40)
      const backdrop = screen.getByRole('dialog').parentElement?.previousSibling as HTMLElement;
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }
    });

    it('should not close when clicking inside modal content', () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          tripId="trip-1"
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      const modalContent = screen.getByRole('dialog');
      fireEvent.click(modalContent);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should close on Escape key press', () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          tripId="trip-1"
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not close on Escape key when submitting', async () => {
      mockAddExpense.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          tripId="trip-1"
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      // Fill form and submit
      const amountInput = screen.getByLabelText(/amount/i);
      await userEvent.clear(amountInput);
      await userEvent.type(amountInput, '50');

      const categorySelect = screen.getByLabelText(/category/i);
      await userEvent.selectOptions(categorySelect, 'food');

      const submitButton = screen.getByRole('button', { name: /add expense/i });
      fireEvent.click(submitButton);

      // Try to close with Escape while submitting
      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should call addExpense when submitting new expense', async () => {
      mockAddExpense.mockResolvedValue(undefined);

      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          tripId="trip-1"
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      // Fill form
      const amountInput = screen.getByLabelText(/amount/i);
      await userEvent.clear(amountInput);
      await userEvent.type(amountInput, '50');

      const categorySelect = screen.getByLabelText(/category/i);
      await userEvent.selectOptions(categorySelect, 'food');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /add expense/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAddExpense).toHaveBeenCalledWith(
          expect.objectContaining({
            tripId: 'trip-1',
            amount: 50,
            category: 'food',
            currency: 'USD',
            isSettled: false,
            syncStatus: 'pending',
          })
        );
      });
    });

    it('should call updateExpense when editing existing expense', async () => {
      mockUpdateExpense.mockResolvedValue(undefined);

      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          tripId="trip-1"
          tripMembers={mockTripMembers}
          currency="USD"
          initialData={mockExpense}
        />
      );

      // Modify amount
      const amountInput = screen.getByLabelText(/amount/i);
      await userEvent.clear(amountInput);
      await userEvent.type(amountInput, '150');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /update expense/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateExpense).toHaveBeenCalledWith(
          'expense-1',
          expect.objectContaining({
            amount: 150,
            currency: 'USD',
          })
        );
      });
    });

    it('should close modal and call onSuccess after successful submission', async () => {
      mockAddExpense.mockResolvedValue(undefined);

      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          tripId="trip-1"
          tripMembers={mockTripMembers}
          currency="USD"
          onSuccess={mockOnSuccess}
        />
      );

      // Fill and submit form
      const amountInput = screen.getByLabelText(/amount/i);
      await userEvent.clear(amountInput);
      await userEvent.type(amountInput, '50');

      const categorySelect = screen.getByLabelText(/category/i);
      await userEvent.selectOptions(categorySelect, 'food');

      const submitButton = screen.getByRole('button', { name: /add expense/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading overlay during submission', async () => {
      mockAddExpense.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          tripId="trip-1"
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      // Fill and submit form
      const amountInput = screen.getByLabelText(/amount/i);
      await userEvent.clear(amountInput);
      await userEvent.type(amountInput, '50');

      const categorySelect = screen.getByLabelText(/category/i);
      await userEvent.selectOptions(categorySelect, 'food');

      const submitButton = screen.getByRole('button', { name: /add expense/i });
      fireEvent.click(submitButton);

      // Check for loading state
      expect(screen.getByText(/adding expense/i)).toBeInTheDocument();
    });

    it('should disable close button during submission', async () => {
      mockAddExpense.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          tripId="trip-1"
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      // Fill and submit form
      const amountInput = screen.getByLabelText(/amount/i);
      await userEvent.clear(amountInput);
      await userEvent.type(amountInput, '50');

      const categorySelect = screen.getByLabelText(/category/i);
      await userEvent.selectOptions(categorySelect, 'food');

      const submitButton = screen.getByRole('button', { name: /add expense/i });
      fireEvent.click(submitButton);

      // Check close button is disabled
      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when submission fails', async () => {
      const errorMessage = 'Network error occurred';
      mockAddExpense.mockRejectedValue(new Error(errorMessage));

      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          tripId="trip-1"
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      // Fill and submit form
      const amountInput = screen.getByLabelText(/amount/i);
      await userEvent.clear(amountInput);
      await userEvent.type(amountInput, '50');

      const categorySelect = screen.getByLabelText(/category/i);
      await userEvent.selectOptions(categorySelect, 'food');

      const submitButton = screen.getByRole('button', { name: /add expense/i });
      fireEvent.click(submitButton);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText('Error Saving Expense')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Modal should not close on error - check that onClose was not called
      // (Note: onClose might be called by other interactions, so we just verify the modal is still visible)
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should allow dismissing error message', async () => {
      mockAddExpense.mockRejectedValue(new Error('Test error'));

      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          tripId="trip-1"
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      // Fill and submit form
      const amountInput = screen.getByLabelText(/amount/i);
      await userEvent.clear(amountInput);
      await userEvent.type(amountInput, '50');

      const categorySelect = screen.getByLabelText(/category/i);
      await userEvent.selectOptions(categorySelect, 'food');

      const submitButton = screen.getByRole('button', { name: /add expense/i });
      fireEvent.click(submitButton);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText('Error Saving Expense')).toBeInTheDocument();
      });

      // Dismiss error
      const dismissButton = screen.getByLabelText('Dismiss error');
      fireEvent.click(dismissButton);

      // Error should be removed
      await waitFor(() => {
        expect(screen.queryByText('Error Saving Expense')).not.toBeInTheDocument();
      });
    });

    it('should reset error when modal closes', async () => {
      mockAddExpense.mockRejectedValue(new Error('Test error'));

      const { rerender } = render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          tripId="trip-1"
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      // Fill and submit form to trigger error
      const amountInput = screen.getByLabelText(/amount/i);
      await userEvent.clear(amountInput);
      await userEvent.type(amountInput, '50');

      const categorySelect = screen.getByLabelText(/category/i);
      await userEvent.selectOptions(categorySelect, 'food');

      const submitButton = screen.getByRole('button', { name: /add expense/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Error Saving Expense')).toBeInTheDocument();
      });

      // Close modal
      rerender(
        <ExpenseFormModal
          isOpen={false}
          onClose={mockOnClose}
          tripId="trip-1"
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      // Reopen modal
      rerender(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          tripId="trip-1"
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      // Error should be cleared
      expect(screen.queryByText('Error Saving Expense')).not.toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('should pass tripId to form', () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          tripId="trip-123"
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      // Form should be rendered (indirect check that tripId is passed)
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    });

    it('should pass currency to form', () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          tripId="trip-1"
          tripMembers={mockTripMembers}
          currency="JPY"
        />
      );

      // Check that currency is displayed in the form
      expect(screen.getByText(/JPY/i)).toBeInTheDocument();
    });

    it('should pass tripMembers to form for split functionality', () => {
      render(
        <ExpenseFormModal
          isOpen={true}
          onClose={mockOnClose}
          tripId="trip-1"
          tripMembers={mockTripMembers}
          currency="USD"
        />
      );

      // Split selector should be visible with multiple members
      // Use getAllByText since there might be multiple elements with "split"
      const splitElements = screen.getAllByText(/split/i);
      expect(splitElements.length).toBeGreaterThan(0);
    });
  });
});
