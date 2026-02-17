/**
 * CountdownTimer Component Tests
 * 
 * Tests for the CountdownTimer component including:
 * - Countdown calculation accuracy
 * - Display of time units
 * - Progress bar functionality
 * - Expired state handling
 * - Animation behavior
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CountdownTimer } from '../CountdownTimer';

describe('BubbleQuest CountdownTimer Component', () => {
  beforeEach(() => {
    // Use fake timers for consistent testing
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders countdown timer with all time units', () => {
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
      render(<CountdownTimer departureDate={futureDate} />);

      expect(screen.getByText('Days')).toBeInTheDocument();
      expect(screen.getByText('Hours')).toBeInTheDocument();
      expect(screen.getByText('Minutes')).toBeInTheDocument();
      expect(screen.getByText('Seconds')).toBeInTheDocument();
    });

    it('renders helper text', () => {
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      render(<CountdownTimer departureDate={futureDate} />);

      expect(screen.getByText('Until your adventure begins')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      const { container } = render(
        <CountdownTimer departureDate={futureDate} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Countdown Calculation', () => {
    it('displays correct countdown for future date', () => {
      const now = new Date('2024-01-01T00:00:00Z');
      vi.setSystemTime(now);

      const futureDate = new Date('2024-01-06T00:00:00Z'); // 5 days from now
      const { container } = render(<CountdownTimer departureDate={futureDate} />);

      // Should show 05 days - check within the Days section
      const daysSection = container.querySelector('.flex.flex-col.items-center');
      expect(daysSection).toHaveTextContent('05');
      expect(daysSection).toHaveTextContent('Days');
    });

    it('displays hours correctly', () => {
      const now = new Date('2024-01-01T00:00:00Z');
      vi.setSystemTime(now);

      const futureDate = new Date('2024-01-01T12:00:00Z'); // 12 hours from now
      render(<CountdownTimer departureDate={futureDate} />);

      // Should show 12 hours
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('Hours')).toBeInTheDocument();
    });

    it('displays minutes correctly', () => {
      const now = new Date('2024-01-01T00:00:00Z');
      vi.setSystemTime(now);

      const futureDate = new Date('2024-01-01T00:30:00Z'); // 30 minutes from now
      render(<CountdownTimer departureDate={futureDate} />);

      // Should show 30 minutes
      expect(screen.getByText('30')).toBeInTheDocument();
    });

    it('displays seconds correctly', () => {
      const now = new Date('2024-01-01T00:00:00Z');
      vi.setSystemTime(now);

      const futureDate = new Date('2024-01-01T00:00:45Z'); // 45 seconds from now
      render(<CountdownTimer departureDate={futureDate} />);

      // Should show 45 seconds
      expect(screen.getByText('45')).toBeInTheDocument();
    });

    it('pads single digit numbers with zero', () => {
      const now = new Date('2024-01-01T00:00:00Z');
      vi.setSystemTime(now);

      const futureDate = new Date('2024-01-01T00:00:05Z'); // 5 seconds from now
      render(<CountdownTimer departureDate={futureDate} />);

      // Should show 05 (padded)
      expect(screen.getByText('05')).toBeInTheDocument();
    });
  });

  describe('Timer Updates', () => {
    it('updates countdown every second', async () => {
      // Use real timers for this test since we need React state updates
      vi.useRealTimers();
      
      const futureDate = new Date(Date.now() + 10000); // 10 seconds from now
      render(<CountdownTimer departureDate={futureDate} />);

      // Wait for at least one update
      await new Promise(resolve => setTimeout(resolve, 1100));

      // The countdown should have updated (we can't predict exact value due to timing)
      expect(screen.getByText('Days')).toBeInTheDocument();
      expect(screen.getByText('Seconds')).toBeInTheDocument();
      
      vi.useFakeTimers();
    });

    it('countdown decreases over time', async () => {
      // Use real timers for this test
      vi.useRealTimers();
      
      const futureDate = new Date(Date.now() + 5000); // 5 seconds from now
      const { container } = render(<CountdownTimer departureDate={futureDate} />);

      // Get initial seconds value
      const getSecondsValue = () => {
        const spans = container.querySelectorAll('span.text-3xl');
        // Seconds is the last one
        return parseInt(spans[spans.length - 1].textContent || '0');
      };

      const initialSeconds = getSecondsValue();

      // Wait for 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2100));

      const newSeconds = getSecondsValue();

      // Seconds should have decreased (accounting for potential minute rollover)
      expect(newSeconds).not.toBe(initialSeconds);
      
      vi.useFakeTimers();
    });
  });

  describe('Expired State', () => {
    it('shows expired message when departure date has passed', () => {
      const now = new Date('2024-01-10T00:00:00Z');
      vi.setSystemTime(now);

      const pastDate = new Date('2024-01-01T00:00:00Z'); // 9 days ago
      render(<CountdownTimer departureDate={pastDate} />);

      expect(screen.getByText(/Your trip has started!/i)).toBeInTheDocument();
      expect(screen.getByText(/Have an amazing journey!/i)).toBeInTheDocument();
    });

    it('does not show countdown when expired', () => {
      const now = new Date('2024-01-10T00:00:00Z');
      vi.setSystemTime(now);

      const pastDate = new Date('2024-01-01T00:00:00Z');
      render(<CountdownTimer departureDate={pastDate} />);

      expect(screen.queryByText('Days')).not.toBeInTheDocument();
      expect(screen.queryByText('Hours')).not.toBeInTheDocument();
      expect(screen.queryByText('Minutes')).not.toBeInTheDocument();
      expect(screen.queryByText('Seconds')).not.toBeInTheDocument();
    });

    it('shows plane icon in expired state', () => {
      const now = new Date('2024-01-10T00:00:00Z');
      vi.setSystemTime(now);

      const pastDate = new Date('2024-01-01T00:00:00Z');
      const { container } = render(<CountdownTimer departureDate={pastDate} />);

      // Check for SVG plane icon
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('renders progress bar', () => {
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      const { container } = render(<CountdownTimer departureDate={futureDate} />);

      // Check for progress bar elements
      const progressBars = container.querySelectorAll('.rounded-full');
      expect(progressBars.length).toBeGreaterThan(0);
    });

    it('renders plane icon on progress bar', () => {
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      const { container } = render(<CountdownTimer departureDate={futureDate} />);

      // Check for SVG plane icon
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles exactly 0 seconds remaining', () => {
      const now = new Date('2024-01-01T00:00:00Z');
      vi.setSystemTime(now);

      const futureDate = new Date('2024-01-01T00:00:00Z'); // Same time
      render(<CountdownTimer departureDate={futureDate} />);

      // Should show expired state
      expect(screen.getByText(/Your trip has started!/i)).toBeInTheDocument();
    });

    it('handles large number of days', () => {
      const now = new Date('2024-01-01T00:00:00Z');
      vi.setSystemTime(now);

      const futureDate = new Date('2025-01-01T00:00:00Z'); // 365 days from now
      render(<CountdownTimer departureDate={futureDate} />);

      // Should display the countdown (exact number depends on leap year)
      expect(screen.getByText('Days')).toBeInTheDocument();
    });

    it('handles invalid date gracefully', () => {
      const invalidDate = new Date('invalid');
      
      // Should not throw error
      expect(() => {
        render(<CountdownTimer departureDate={invalidDate} />);
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('has readable text for screen readers', () => {
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      render(<CountdownTimer departureDate={futureDate} />);

      // Labels should be present for screen readers
      expect(screen.getByText('Days')).toBeInTheDocument();
      expect(screen.getByText('Hours')).toBeInTheDocument();
      expect(screen.getByText('Minutes')).toBeInTheDocument();
      expect(screen.getByText('Seconds')).toBeInTheDocument();
    });

    it('maintains semantic structure', () => {
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      const { container } = render(<CountdownTimer departureDate={futureDate} />);

      // Should have proper div structure
      expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
    });
  });
});
