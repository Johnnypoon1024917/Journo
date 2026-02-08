/**
 * Tests for DateSelector Component
 * 
 * Tests cover:
 * - Rendering date pills
 * - Selected date highlighting
 * - Date selection interaction
 * - Auto-scroll behavior
 * - Responsive design
 * - Edge cases (empty dates, single date)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DateSelector } from '../DateSelector';
import { addDays } from 'date-fns';

describe('DateSelector', () => {
  const mockOnDateSelect = vi.fn();
  const baseDate = new Date('2024-03-15T12:00:00Z');
  const dates = [
    baseDate,
    addDays(baseDate, 1),
    addDays(baseDate, 2),
    addDays(baseDate, 3),
    addDays(baseDate, 4),
  ];

  beforeEach(() => {
    mockOnDateSelect.mockClear();
  });

  describe('Rendering', () => {
    it('renders all date pills', () => {
      render(
        <DateSelector
          dates={dates}
          selectedDate={baseDate}
          onDateSelect={mockOnDateSelect}
        />
      );

      // Check that all dates are rendered (looking for day numbers)
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('16')).toBeInTheDocument();
      expect(screen.getByText('17')).toBeInTheDocument();
      expect(screen.getByText('18')).toBeInTheDocument();
      expect(screen.getByText('19')).toBeInTheDocument();
    });

    it('renders day of week and month for each date', () => {
      render(
        <DateSelector
          dates={[baseDate]}
          selectedDate={baseDate}
          onDateSelect={mockOnDateSelect}
        />
      );

      // Check for day of week (Fri for March 15, 2024)
      expect(screen.getByText('Fri')).toBeInTheDocument();
      
      // Check for month
      expect(screen.getByText('Mar')).toBeInTheDocument();
    });

    it('renders nothing when dates array is empty', () => {
      const { container } = render(
        <DateSelector
          dates={[]}
          selectedDate={baseDate}
          onDateSelect={mockOnDateSelect}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('handles single date', () => {
      render(
        <DateSelector
          dates={[baseDate]}
          selectedDate={baseDate}
          onDateSelect={mockOnDateSelect}
        />
      );

      expect(screen.getByText('15')).toBeInTheDocument();
    });
  });

  describe('Selected Date Highlighting', () => {
    it('highlights the selected date', () => {
      render(
        <DateSelector
          dates={dates}
          selectedDate={dates[2]} // Select the third date
          onDateSelect={mockOnDateSelect}
        />
      );

      const selectedButton = screen.getByText('17').closest('button');
      expect(selectedButton).toHaveClass('from-kawaii-primary-500');
      expect(selectedButton).toHaveClass('to-kawaii-primary-400');
    });

    it('does not highlight non-selected dates', () => {
      render(
        <DateSelector
          dates={dates}
          selectedDate={dates[2]} // Select the third date
          onDateSelect={mockOnDateSelect}
        />
      );

      const nonSelectedButton = screen.getByText('15').closest('button');
      expect(nonSelectedButton).not.toHaveClass('from-kawaii-primary-500');
      expect(nonSelectedButton).toHaveClass('bg-white');
    });

    it('updates highlighting when selected date changes', () => {
      const { rerender } = render(
        <DateSelector
          dates={dates}
          selectedDate={dates[0]}
          onDateSelect={mockOnDateSelect}
        />
      );

      let selectedButton = screen.getByText('15').closest('button');
      expect(selectedButton).toHaveClass('from-kawaii-primary-500');

      // Change selected date
      rerender(
        <DateSelector
          dates={dates}
          selectedDate={dates[1]}
          onDateSelect={mockOnDateSelect}
        />
      );

      selectedButton = screen.getByText('16').closest('button');
      expect(selectedButton).toHaveClass('from-kawaii-primary-500');

      const previousButton = screen.getByText('15').closest('button');
      expect(previousButton).not.toHaveClass('from-kawaii-primary-500');
    });
  });

  describe('Date Selection Interaction', () => {
    it('calls onDateSelect when a date pill is clicked', () => {
      render(
        <DateSelector
          dates={dates}
          selectedDate={dates[0]}
          onDateSelect={mockOnDateSelect}
        />
      );

      const dateButton = screen.getByText('17').closest('button');
      fireEvent.click(dateButton!);

      expect(mockOnDateSelect).toHaveBeenCalledTimes(1);
      expect(mockOnDateSelect).toHaveBeenCalledWith(dates[2]);
    });

    it('calls onDateSelect with correct date for each pill', () => {
      render(
        <DateSelector
          dates={dates}
          selectedDate={dates[0]}
          onDateSelect={mockOnDateSelect}
        />
      );

      // Click first date
      fireEvent.click(screen.getByText('15').closest('button')!);
      expect(mockOnDateSelect).toHaveBeenLastCalledWith(dates[0]);

      // Click last date
      fireEvent.click(screen.getByText('19').closest('button')!);
      expect(mockOnDateSelect).toHaveBeenLastCalledWith(dates[4]);
    });

    it('allows clicking the already selected date', () => {
      render(
        <DateSelector
          dates={dates}
          selectedDate={dates[2]}
          onDateSelect={mockOnDateSelect}
        />
      );

      const selectedButton = screen.getByText('17').closest('button');
      fireEvent.click(selectedButton!);

      expect(mockOnDateSelect).toHaveBeenCalledWith(dates[2]);
    });
  });

  describe('Auto-scroll Behavior', () => {
    it('attempts to scroll to selected date on mount', async () => {
      const scrollToMock = vi.fn();
      
      // Mock scrollTo
      Element.prototype.scrollTo = scrollToMock;

      render(
        <DateSelector
          dates={dates}
          selectedDate={dates[3]}
          onDateSelect={mockOnDateSelect}
        />
      );

      await waitFor(() => {
        expect(scrollToMock).toHaveBeenCalled();
      });
    });

    it('scrolls when selected date changes', async () => {
      const scrollToMock = vi.fn();
      Element.prototype.scrollTo = scrollToMock;

      const { rerender } = render(
        <DateSelector
          dates={dates}
          selectedDate={dates[0]}
          onDateSelect={mockOnDateSelect}
        />
      );

      scrollToMock.mockClear();

      // Change selected date
      rerender(
        <DateSelector
          dates={dates}
          selectedDate={dates[4]}
          onDateSelect={mockOnDateSelect}
        />
      );

      await waitFor(() => {
        expect(scrollToMock).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('renders date pills as buttons', () => {
      render(
        <DateSelector
          dates={dates}
          selectedDate={dates[0]}
          onDateSelect={mockOnDateSelect}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(dates.length);
    });

    it('has focus styles on date pills', () => {
      render(
        <DateSelector
          dates={dates}
          selectedDate={dates[0]}
          onDateSelect={mockOnDateSelect}
        />
      );

      const button = screen.getByText('15').closest('button');
      expect(button).toHaveClass('focus:outline-none');
      expect(button).toHaveClass('focus:ring-2');
    });

    it('supports keyboard navigation', () => {
      render(
        <DateSelector
          dates={dates}
          selectedDate={dates[0]}
          onDateSelect={mockOnDateSelect}
        />
      );

      const firstButton = screen.getByText('15').closest('button');
      firstButton?.focus();
      
      expect(document.activeElement).toBe(firstButton);
    });
  });

  describe('Styling and Layout', () => {
    it('applies custom className', () => {
      const { container } = render(
        <DateSelector
          dates={dates}
          selectedDate={dates[0]}
          onDateSelect={mockOnDateSelect}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('has horizontal scroll container', () => {
      const { container } = render(
        <DateSelector
          dates={dates}
          selectedDate={dates[0]}
          onDateSelect={mockOnDateSelect}
        />
      );

      const scrollContainer = container.querySelector('.overflow-x-auto');
      expect(scrollContainer).toBeInTheDocument();
    });

    it('has gradient fade edges', () => {
      const { container } = render(
        <DateSelector
          dates={dates}
          selectedDate={dates[0]}
          onDateSelect={mockOnDateSelect}
        />
      );

      const gradients = container.querySelectorAll('.bg-gradient-to-r, .bg-gradient-to-l');
      expect(gradients.length).toBeGreaterThanOrEqual(2); // Left and right gradients
    });

    it('has minimum touch target size', () => {
      render(
        <DateSelector
          dates={dates}
          selectedDate={dates[0]}
          onDateSelect={mockOnDateSelect}
        />
      );

      const button = screen.getByText('15').closest('button');
      expect(button).toHaveClass('min-h-[80px]');
    });
  });

  describe('Edge Cases', () => {
    it('handles dates from different months', () => {
      const crossMonthDates = [
        new Date('2024-03-30T12:00:00Z'),
        new Date('2024-03-31T12:00:00Z'),
        new Date('2024-04-01T12:00:00Z'),
        new Date('2024-04-02T12:00:00Z'),
      ];

      render(
        <DateSelector
          dates={crossMonthDates}
          selectedDate={crossMonthDates[0]}
          onDateSelect={mockOnDateSelect}
        />
      );

      expect(screen.getByText('30')).toBeInTheDocument();
      expect(screen.getByText('31')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      
      // Check for both months
      expect(screen.getAllByText('Mar')).toHaveLength(2);
      expect(screen.getAllByText('Apr')).toHaveLength(2);
    });

    it('handles dates from different years', () => {
      const crossYearDates = [
        new Date('2024-12-30T12:00:00Z'),
        new Date('2024-12-31T12:00:00Z'),
        new Date('2025-01-01T12:00:00Z'),
      ];

      render(
        <DateSelector
          dates={crossYearDates}
          selectedDate={crossYearDates[0]}
          onDateSelect={mockOnDateSelect}
        />
      );

      expect(screen.getByText('30')).toBeInTheDocument();
      expect(screen.getByText('31')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('handles same date appearing multiple times', () => {
      const duplicateDates = [baseDate, baseDate, addDays(baseDate, 1)];

      render(
        <DateSelector
          dates={duplicateDates}
          selectedDate={baseDate}
          onDateSelect={mockOnDateSelect}
        />
      );

      // Should render all pills even with duplicates
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
    });
  });
});
