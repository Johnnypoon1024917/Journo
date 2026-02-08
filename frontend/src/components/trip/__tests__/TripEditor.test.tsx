/**
 * TripEditor Component Tests
 * 
 * Tests for the Create Trip form component to ensure:
 * - Form validation works correctly
 * - Loading states are displayed properly
 * - Error handling works as expected
 * - Success feedback is provided
 * 
 * Validates Requirements: 9.3, 9.5, 9.6
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TripEditor } from '../TripEditor';

describe('TripEditor - Create Trip Form', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Form Validation', () => {
    it('should display validation error when title is empty', async () => {
      render(
        <TripEditor
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Try to submit without filling in the title
      const submitButton = screen.getByRole('button', { name: /create trip/i });
      fireEvent.click(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });

      // Should not call onSave
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should validate date range (end date after start date)', async () => {
      render(
        <TripEditor
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Fill in title
      const titleInput = screen.getByLabelText(/trip title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Trip' } });

      // Set end date before start date
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      
      fireEvent.change(startDateInput, { target: { value: '2025-12-31' } });
      fireEvent.change(endDateInput, { target: { value: '2025-01-01' } });

      // Try to submit
      const submitButton = screen.getByRole('button', { name: /create trip/i });
      fireEvent.click(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/end date must be after start date/i)).toBeInTheDocument();
      });

      // Should not call onSave
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should validate budget is positive', async () => {
      render(
        <TripEditor
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Fill in title
      const titleInput = screen.getByLabelText(/trip title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Trip' } });

      // Set negative budget
      const budgetInput = screen.getByLabelText(/total budget/i);
      fireEvent.change(budgetInput, { target: { value: '-100' } });

      // Try to submit
      const submitButton = screen.getByRole('button', { name: /create trip/i });
      fireEvent.click(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/must be at least 0/i)).toBeInTheDocument();
      });

      // Should not call onSave
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should clear field error when user corrects the input', async () => {
      render(
        <TripEditor
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Try to submit without title
      const submitButton = screen.getByRole('button', { name: /create trip/i });
      fireEvent.click(submitButton);

      // Should show error
      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });

      // Now fill in the title
      const titleInput = screen.getByLabelText(/trip title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Trip' } });

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/title is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      mockOnSave.mockResolvedValue(undefined);

      render(
        <TripEditor
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Fill in required fields
      const titleInput = screen.getByLabelText(/trip title/i);
      fireEvent.change(titleInput, { target: { value: 'Tokyo Adventure' } });

      const destinationInput = screen.getByLabelText(/destination/i);
      fireEvent.change(destinationInput, { target: { value: 'Tokyo, Japan' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create trip/i });
      fireEvent.click(submitButton);

      // Should call onSave with form data
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Tokyo Adventure',
            destination: 'Tokyo, Japan',
          })
        );
      });
    });

    it('should show loading state during submission', async () => {
      // Make onSave take some time
      mockOnSave.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <TripEditor
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Fill in required fields
      const titleInput = screen.getByLabelText(/trip title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Trip' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create trip/i });
      fireEvent.click(submitButton);

      // Should show loading state
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      // Wait for submission to complete
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('should prevent duplicate submissions', async () => {
      // Make onSave take some time
      mockOnSave.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <TripEditor
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Fill in required fields
      const titleInput = screen.getByLabelText(/trip title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Trip' } });

      // Submit form multiple times
      const submitButton = screen.getByRole('button', { name: /create trip/i });
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);

      // Wait for submission to complete
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });

      // Should only be called once
      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should display error message when submission fails', async () => {
      const errorMessage = 'Failed to create trip. Server error.';
      mockOnSave.mockRejectedValue(new Error(errorMessage));

      render(
        <TripEditor
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Fill in required fields
      const titleInput = screen.getByLabelText(/trip title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Trip' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create trip/i });
      fireEvent.click(submitButton);

      // Should display error message
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should allow retry after submission error', async () => {
      // First call fails, second succeeds
      mockOnSave
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);

      render(
        <TripEditor
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Fill in required fields
      const titleInput = screen.getByLabelText(/trip title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Trip' } });

      // First submission - should fail
      const submitButton = screen.getByRole('button', { name: /create trip/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Retry submission - should succeed
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(2);
      });
    });

    it('should clear error message when user makes changes', async () => {
      mockOnSave.mockRejectedValue(new Error('Submission failed'));

      render(
        <TripEditor
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Fill in required fields
      const titleInput = screen.getByLabelText(/trip title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Trip' } });

      // Submit and get error
      const submitButton = screen.getByRole('button', { name: /create trip/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/submission failed/i)).toBeInTheDocument();
      });

      // Make a change to the form
      fireEvent.change(titleInput, { target: { value: 'Updated Trip' } });

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/submission failed/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Cancel Functionality', () => {
    it('should call onCancel when cancel button is clicked', () => {
      render(
        <TripEditor
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should disable cancel button during submission', async () => {
      mockOnSave.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <TripEditor
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Fill in required fields
      const titleInput = screen.getByLabelText(/trip title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Trip' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create trip/i });
      fireEvent.click(submitButton);

      // Cancel button should be disabled
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await waitFor(() => {
        expect(cancelButton).toBeDisabled();
      });
    });
  });

  describe('Edit Mode', () => {
    it('should populate form with existing trip data in edit mode', () => {
      const existingTrip = {
        id: '123',
        title: 'Existing Trip',
        destination: 'Paris, France',
        start_date: '2025-06-01',
        end_date: '2025-06-10',
        total_budget: 2000,
        currency_code: 'EUR',
        theme: 'romantic' as const,
        is_public: true,
        is_community: false,
        cover_image_url: '',
        user_id: 'user123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      render(
        <TripEditor
          mode="edit"
          trip={existingTrip}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Check that form is populated
      expect(screen.getByDisplayValue('Existing Trip')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Paris, France')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2025-06-01')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2025-06-10')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2000')).toBeInTheDocument();

      // Check button text
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });
  });
});
