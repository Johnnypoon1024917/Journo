import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BudgetDashboard } from '../BudgetDashboard';
import { BudgetPageSummary } from '../../../../types/expense';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver as any;

describe('BudgetDashboard', () => {
  const mockOnCurrencyChange = vi.fn();

  const createMockSummary = (overrides?: Partial<BudgetPageSummary>): BudgetPageSummary => ({
    totalBudget: 10000,
    totalSpent: 5000,
    remaining: 5000,
    percentageSpent: 50,
    status: 'safe',
    burnRate: 250,
    projectedTotal: 9000,
    daysElapsed: 10,
    daysRemaining: 10,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('Rendering', () => {
    it('renders trip title correctly', () => {
      const summary = createMockSummary();
      render(
        <BudgetDashboard
          tripId="trip-1"
          tripTitle="Tokyo Adventure"
          summary={summary}
          currency="JPY"
          onCurrencyChange={mockOnCurrencyChange}
        />
      );

      expect(screen.getByText('Tokyo Adventure')).toBeInTheDocument();
    });

    it('renders budget progress ring with correct data', () => {
      const summary = createMockSummary();
      render(
        <BudgetDashboard
          tripId="trip-1"
          tripTitle="Test Trip"
          summary={summary}
          currency="HKD"
          onCurrencyChange={mockOnCurrencyChange}
        />
      );

      // Check for percentage display
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('spent')).toBeInTheDocument();
    });

    it('renders cat animation', () => {
      const summary = createMockSummary();
      render(
        <BudgetDashboard
          tripId="trip-1"
          tripTitle="Test Trip"
          summary={summary}
          currency="HKD"
          onCurrencyChange={mockOnCurrencyChange}
        />
      );

      // Cat animation should be present
      expect(screen.getByRole('img', { name: /Cat/i })).toBeInTheDocument();
    });

    it('renders budget stats cards', () => {
      const summary = createMockSummary();
      render(
        <BudgetDashboard
          tripId="trip-1"
          tripTitle="Test Trip"
          summary={summary}
          currency="HKD"
          onCurrencyChange={mockOnCurrencyChange}
        />
      );

      expect(screen.getByText('Days Elapsed')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('10 days left')).toBeInTheDocument();
      expect(screen.getByText('Projected Total')).toBeInTheDocument();
    });

    it('renders burn rate indicator', () => {
      const summary = createMockSummary();
      render(
        <BudgetDashboard
          tripId="trip-1"
          tripTitle="Test Trip"
          summary={summary}
          currency="HKD"
          onCurrencyChange={mockOnCurrencyChange}
        />
      );

      expect(screen.getByText('Burn Rate')).toBeInTheDocument();
      expect(screen.getByText(/HKD250\.00\/day/)).toBeInTheDocument();
    });

    it('renders currency selector', () => {
      const summary = createMockSummary();
      render(
        <BudgetDashboard
          tripId="trip-1"
          tripTitle="Test Trip"
          summary={summary}
          currency="HKD"
          onCurrencyChange={mockOnCurrencyChange}
        />
      );

      const selector = screen.getByRole('combobox');
      expect(selector).toBeInTheDocument();
      expect(selector).toHaveValue('HKD');
    });
  });

  describe('Currency Selection', () => {
    it('calls onCurrencyChange when currency is changed', () => {
      const summary = createMockSummary();
      render(
        <BudgetDashboard
          tripId="trip-1"
          tripTitle="Test Trip"
          summary={summary}
          currency="HKD"
          onCurrencyChange={mockOnCurrencyChange}
        />
      );

      const selector = screen.getByRole('combobox');
      fireEvent.change(selector, { target: { value: 'USD' } });

      expect(mockOnCurrencyChange).toHaveBeenCalledWith('USD');
    });
  });

  describe('Alert Banners', () => {
    it('displays warning alert at 70% budget', () => {
      const summary = createMockSummary({
        percentageSpent: 75,
        totalSpent: 7500,
        remaining: 2500,
        status: 'warning',
      });

      render(
        <BudgetDashboard
          tripId="trip-1"
          tripTitle="Test Trip"
          summary={summary}
          currency="HKD"
          onCurrencyChange={mockOnCurrencyChange}
        />
      );

      expect(screen.getByText('⚡ Budget Warning')).toBeInTheDocument();
      expect(screen.getByText(/You've used 75% of your budget/)).toBeInTheDocument();
    });

    it('displays critical warning alert at 90% budget', () => {
      const summary = createMockSummary({
        percentageSpent: 92,
        totalSpent: 9200,
        remaining: 800,
        status: 'danger',
      });

      render(
        <BudgetDashboard
          tripId="trip-1"
          tripTitle="Test Trip"
          summary={summary}
          currency="HKD"
          onCurrencyChange={mockOnCurrencyChange}
        />
      );

      expect(screen.getByText('⚠️ Critical Budget Warning')).toBeInTheDocument();
      expect(screen.getByText(/You've used 92% of your budget/)).toBeInTheDocument();
    });

    it('displays over-budget alert at 100%+ budget', () => {
      const summary = createMockSummary({
        percentageSpent: 105,
        totalSpent: 10500,
        remaining: -500,
        status: 'over',
      });

      render(
        <BudgetDashboard
          tripId="trip-1"
          tripTitle="Test Trip"
          summary={summary}
          currency="HKD"
          onCurrencyChange={mockOnCurrencyChange}
        />
      );

      expect(screen.getByText('⚠️ Budget Exceeded')).toBeInTheDocument();
      expect(screen.getByText(/exceeded your budget by HKD 500/)).toBeInTheDocument();
    });

    it('displays burn rate warning when 20% over planned', () => {
      // Planned daily budget: 10000 / 20 days = 500/day
      // Burn rate of 610 is 22% over planned (610/500 = 1.22)
      const summary = createMockSummary({
        totalBudget: 10000,
        burnRate: 610,
        daysElapsed: 10,
        daysRemaining: 10,
        percentageSpent: 50, // Keep under 70% to avoid budget warning
        status: 'safe',
      });

      render(
        <BudgetDashboard
          tripId="trip-1"
          tripTitle="Test Trip"
          summary={summary}
          currency="HKD"
          onCurrencyChange={mockOnCurrencyChange}
        />
      );

      expect(screen.getByText('🔥 High Burn Rate')).toBeInTheDocument();
      expect(screen.getByText(/Your daily spending.*is 20% higher than planned/)).toBeInTheDocument();
    });

    it('does not display alerts when under 70% budget', () => {
      const summary = createMockSummary({
        percentageSpent: 50,
        status: 'safe',
      });

      render(
        <BudgetDashboard
          tripId="trip-1"
          tripTitle="Test Trip"
          summary={summary}
          currency="HKD"
          onCurrencyChange={mockOnCurrencyChange}
        />
      );

      expect(screen.queryByText(/Budget Warning/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Budget Exceeded/)).not.toBeInTheDocument();
    });
  });

  describe('Alert Dismissal', () => {
    it('dismisses alert when dismiss button is clicked', async () => {
      const summary = createMockSummary({
        percentageSpent: 75,
        status: 'warning',
      });

      render(
        <BudgetDashboard
          tripId="trip-1"
          tripTitle="Test Trip"
          summary={summary}
          currency="HKD"
          onCurrencyChange={mockOnCurrencyChange}
        />
      );

      const alert = screen.getByText('⚡ Budget Warning');
      expect(alert).toBeInTheDocument();

      const dismissButton = screen.getByLabelText('Dismiss alert');
      fireEvent.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByText('⚡ Budget Warning')).not.toBeInTheDocument();
      });
    });

    it('saves dismissed alert to localStorage', async () => {
      const summary = createMockSummary({
        percentageSpent: 75,
        status: 'warning',
      });

      render(
        <BudgetDashboard
          tripId="trip-1"
          tripTitle="Test Trip"
          summary={summary}
          currency="HKD"
          onCurrencyChange={mockOnCurrencyChange}
        />
      );

      const dismissButton = screen.getByLabelText('Dismiss alert');
      fireEvent.click(dismissButton);

      await waitFor(() => {
        const stored = localStorageMock.getItem('budget-dismissed-alerts-trip-1');
        expect(stored).toBeTruthy();
        const parsed = JSON.parse(stored!);
        expect(parsed['budget-warning']).toBeDefined();
      });
    });

    it('does not show dismissed alert on re-render within 24 hours', () => {
      const summary = createMockSummary({
        percentageSpent: 75,
        status: 'warning',
      });

      // Pre-populate localStorage with dismissed alert
      const dismissedAlerts = {
        'budget-warning': Date.now(),
      };
      localStorageMock.setItem(
        'budget-dismissed-alerts-trip-1',
        JSON.stringify(dismissedAlerts)
      );

      render(
        <BudgetDashboard
          tripId="trip-1"
          tripTitle="Test Trip"
          summary={summary}
          currency="HKD"
          onCurrencyChange={mockOnCurrencyChange}
        />
      );

      expect(screen.queryByText('⚡ Budget Warning')).not.toBeInTheDocument();
    });

    it('shows dismissed alert after 24 hours', () => {
      const summary = createMockSummary({
        percentageSpent: 75,
        status: 'warning',
      });

      // Pre-populate localStorage with old dismissed alert (25 hours ago)
      const dismissedAlerts = {
        'budget-warning': Date.now() - 25 * 60 * 60 * 1000,
      };
      localStorageMock.setItem(
        'budget-dismissed-alerts-trip-1',
        JSON.stringify(dismissedAlerts)
      );

      render(
        <BudgetDashboard
          tripId="trip-1"
          tripTitle="Test Trip"
          summary={summary}
          currency="HKD"
          onCurrencyChange={mockOnCurrencyChange}
        />
      );

      expect(screen.getByText('⚡ Budget Warning')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('applies custom className', () => {
      const summary = createMockSummary();
      const { container } = render(
        <BudgetDashboard
          tripId="trip-1"
          tripTitle="Test Trip"
          summary={summary}
          currency="HKD"
          onCurrencyChange={mockOnCurrencyChange}
          className="custom-class"
        />
      );

      const dashboard = container.querySelector('.custom-class');
      expect(dashboard).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for alerts', () => {
      const summary = createMockSummary({
        percentageSpent: 75,
        status: 'warning',
      });

      render(
        <BudgetDashboard
          tripId="trip-1"
          tripTitle="Test Trip"
          summary={summary}
          currency="HKD"
          onCurrencyChange={mockOnCurrencyChange}
        />
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });

    it('has accessible dismiss button', () => {
      const summary = createMockSummary({
        percentageSpent: 75,
        status: 'warning',
      });

      render(
        <BudgetDashboard
          tripId="trip-1"
          tripTitle="Test Trip"
          summary={summary}
          currency="HKD"
          onCurrencyChange={mockOnCurrencyChange}
        />
      );

      const dismissButton = screen.getByLabelText('Dismiss alert');
      expect(dismissButton).toBeInTheDocument();
    });
  });
});
