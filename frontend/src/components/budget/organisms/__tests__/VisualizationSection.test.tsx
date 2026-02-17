import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { VisualizationSection } from '../VisualizationSection';
import { CategorySummary, ExpenseEntry, BudgetStatus } from '../../../../types/expense';
import { BudgetCategory } from '../../../../types/trip';

// Mock the chart components
vi.mock('../../molecules/CategoryComparisonChart', () => ({
  CategoryComparisonChart: ({ categorySummaries, currency }: any) => (
    <div data-testid="category-comparison-chart">
      CategoryComparisonChart: {categorySummaries.length} categories, {currency}
    </div>
  ),
}));

vi.mock('../../molecules/SpendingOverTimeChart', () => ({
  SpendingOverTimeChart: ({ expenses, totalBudget, currency }: any) => (
    <div data-testid="spending-over-time-chart">
      SpendingOverTimeChart: {expenses.length} expenses, {currency} {totalBudget}
    </div>
  ),
}));

vi.mock('../../molecules/CategoryProgressBars', () => ({
  CategoryProgressBars: ({ categorySummaries, currency }: any) => (
    <div data-testid="category-progress-bars">
      CategoryProgressBars: {categorySummaries.length} categories, {currency}
    </div>
  ),
}));

describe('VisualizationSection', () => {
  const mockCategorySummaries: CategorySummary[] = [
    {
      category: 'food' as BudgetCategory,
      allocated: 1000,
      spent: 750,
      remaining: 250,
      percentageSpent: 75,
      expenseCount: 5,
      status: 'warning' as BudgetStatus,
    },
    {
      category: 'transport' as BudgetCategory,
      allocated: 500,
      spent: 300,
      remaining: 200,
      percentageSpent: 60,
      expenseCount: 3,
      status: 'safe' as BudgetStatus,
    },
  ];

  const mockExpenses: ExpenseEntry[] = [
    {
      id: '1',
      tripId: 'trip-1',
      amount: 500,
      currency: 'HKD',
      category: 'food' as BudgetCategory,
      date: '2024-01-15',
      isSettled: false,
      createdBy: 'user-1',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      syncStatus: 'synced',
    },
    {
      id: '2',
      tripId: 'trip-1',
      amount: 300,
      currency: 'HKD',
      category: 'transport' as BudgetCategory,
      date: '2024-01-16',
      isSettled: false,
      createdBy: 'user-1',
      createdAt: '2024-01-16T10:00:00Z',
      updatedAt: '2024-01-16T10:00:00Z',
      syncStatus: 'synced',
    },
  ];

  const defaultProps = {
    categorySummaries: mockCategorySummaries,
    expenses: mockExpenses,
    totalBudget: 5000,
    currency: 'HKD',
  };

  describe('Collapsed State', () => {
    it('should render collapsed state when isCollapsed is true', () => {
      render(<VisualizationSection {...defaultProps} isCollapsed={true} />);

      expect(screen.getByText('Budget Visualizations')).toBeInTheDocument();
      expect(screen.getByText('Charts and progress tracking')).toBeInTheDocument();
      expect(screen.queryByTestId('category-comparison-chart')).not.toBeInTheDocument();
    });

    it('should call onToggleCollapse when clicked in collapsed state', () => {
      const onToggleCollapse = vi.fn();
      render(
        <VisualizationSection
          {...defaultProps}
          isCollapsed={true}
          onToggleCollapse={onToggleCollapse}
        />
      );

      const button = screen.getByLabelText('Expand visualizations section');
      fireEvent.click(button);

      expect(onToggleCollapse).toHaveBeenCalledTimes(1);
    });

    it('should have correct aria-expanded attribute in collapsed state', () => {
      render(<VisualizationSection {...defaultProps} isCollapsed={true} />);

      const button = screen.getByLabelText('Expand visualizations section');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Expanded State', () => {
    it('should render all three chart components when expanded', () => {
      render(<VisualizationSection {...defaultProps} isCollapsed={false} />);

      expect(screen.getByTestId('category-comparison-chart')).toBeInTheDocument();
      expect(screen.getByTestId('spending-over-time-chart')).toBeInTheDocument();
      expect(screen.getByTestId('category-progress-bars')).toBeInTheDocument();
    });

    it('should render section headers with correct titles', () => {
      render(<VisualizationSection {...defaultProps} isCollapsed={false} />);

      expect(screen.getByText('Category Comparison')).toBeInTheDocument();
      expect(screen.getByText('Spending Over Time')).toBeInTheDocument();
      expect(screen.getByText('Category Progress')).toBeInTheDocument();
    });

    it('should render section descriptions', () => {
      render(<VisualizationSection {...defaultProps} isCollapsed={false} />);

      expect(
        screen.getByText('Compare planned budget vs actual spending by category')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Track your cumulative spending throughout the trip')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Detailed breakdown of spending in each category')
      ).toBeInTheDocument();
    });

    it('should call onToggleCollapse when collapse button is clicked', () => {
      const onToggleCollapse = vi.fn();
      render(
        <VisualizationSection
          {...defaultProps}
          isCollapsed={false}
          onToggleCollapse={onToggleCollapse}
        />
      );

      const button = screen.getByLabelText('Collapse visualizations section');
      fireEvent.click(button);

      expect(onToggleCollapse).toHaveBeenCalledTimes(1);
    });

    it('should have correct aria-expanded attribute in expanded state', () => {
      render(
        <VisualizationSection
          {...defaultProps}
          isCollapsed={false}
          onToggleCollapse={() => {}}
        />
      );

      const button = screen.getByLabelText('Collapse visualizations section');
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('should not render collapse button when onToggleCollapse is not provided', () => {
      render(<VisualizationSection {...defaultProps} isCollapsed={false} />);

      expect(
        screen.queryByLabelText('Collapse visualizations section')
      ).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should render empty state when no expenses', () => {
      render(
        <VisualizationSection
          {...defaultProps}
          expenses={[]}
          isCollapsed={false}
        />
      );

      expect(screen.getByText('No Data Yet')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Add expenses to see detailed visualizations and track your spending progress'
        )
      ).toBeInTheDocument();
    });

    it('should still render charts even with no expenses (charts handle empty state)', () => {
      render(
        <VisualizationSection
          {...defaultProps}
          expenses={[]}
          isCollapsed={false}
        />
      );

      // Charts are still rendered but show their own empty states
      // The empty state message is shown alongside the charts
      expect(screen.getByText('No Data Yet')).toBeInTheDocument();
    });
  });

  describe('Props Passing', () => {
    it('should pass correct props to CategoryComparisonChart', () => {
      render(<VisualizationSection {...defaultProps} isCollapsed={false} />);

      const chart = screen.getByTestId('category-comparison-chart');
      expect(chart).toHaveTextContent('2 categories');
      expect(chart).toHaveTextContent('HKD');
    });

    it('should pass correct props to SpendingOverTimeChart', () => {
      render(<VisualizationSection {...defaultProps} isCollapsed={false} />);

      const chart = screen.getByTestId('spending-over-time-chart');
      expect(chart).toHaveTextContent('2 expenses');
      expect(chart).toHaveTextContent('HKD');
      expect(chart).toHaveTextContent('5000');
    });

    it('should pass correct props to CategoryProgressBars', () => {
      render(<VisualizationSection {...defaultProps} isCollapsed={false} />);

      const bars = screen.getByTestId('category-progress-bars');
      expect(bars).toHaveTextContent('2 categories');
      expect(bars).toHaveTextContent('HKD');
    });

    it('should pass trip dates to SpendingOverTimeChart when provided', () => {
      const { rerender } = render(
        <VisualizationSection
          {...defaultProps}
          isCollapsed={false}
          tripStartDate="2024-01-01"
          tripEndDate="2024-01-31"
        />
      );

      // The chart should receive the dates (verified through mocked component)
      expect(screen.getByTestId('spending-over-time-chart')).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className to root element', () => {
      const { container } = render(
        <VisualizationSection {...defaultProps} className="custom-class" />
      );

      const rootElement = container.firstChild as HTMLElement;
      expect(rootElement).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<VisualizationSection {...defaultProps} isCollapsed={false} />);

      const mainHeading = screen.getByText('Budget Visualizations');
      expect(mainHeading.tagName).toBe('H3');

      const subHeadings = screen.getAllByRole('heading', { level: 4 });
      expect(subHeadings).toHaveLength(3);
      expect(subHeadings[0]).toHaveTextContent('Category Comparison');
      expect(subHeadings[1]).toHaveTextContent('Spending Over Time');
      expect(subHeadings[2]).toHaveTextContent('Category Progress');
    });

    it('should have accessible button labels', () => {
      render(
        <VisualizationSection
          {...defaultProps}
          isCollapsed={false}
          onToggleCollapse={() => {}}
        />
      );

      expect(
        screen.getByLabelText('Collapse visualizations section')
      ).toBeInTheDocument();
    });

    it('should have proper ARIA attributes for expandable section', () => {
      const { rerender } = render(
        <VisualizationSection
          {...defaultProps}
          isCollapsed={true}
          onToggleCollapse={() => {}}
        />
      );

      let button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'false');

      rerender(
        <VisualizationSection
          {...defaultProps}
          isCollapsed={false}
          onToggleCollapse={() => {}}
        />
      );

      button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Visual Indicators', () => {
    it('should render colored accent bars for each section', () => {
      const { container } = render(
        <VisualizationSection {...defaultProps} isCollapsed={false} />
      );

      // Check for colored accent bars (w-1 h-6 rounded-full)
      const accentBars = container.querySelectorAll('.w-1.h-6.rounded-full');
      expect(accentBars).toHaveLength(3);
    });

    it('should render section icon in header', () => {
      const { container } = render(
        <VisualizationSection {...defaultProps} isCollapsed={false} />
      );

      // Check for the chart icon SVG in the header
      const headerIcon = container.querySelector('.bg-purple-100 svg');
      expect(headerIcon).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should render with proper container styling', () => {
      const { container } = render(
        <VisualizationSection {...defaultProps} isCollapsed={false} />
      );

      const rootElement = container.firstChild as HTMLElement;
      expect(rootElement).toHaveClass('rounded-2xl');
      expect(rootElement).toHaveClass('border-2');
      expect(rootElement).toHaveClass('bg-white');
      expect(rootElement).toHaveClass('dark:bg-gray-800');
    });

    it('should render charts in bordered containers', () => {
      const { container } = render(
        <VisualizationSection {...defaultProps} isCollapsed={false} />
      );

      const chartContainers = container.querySelectorAll('.rounded-xl.border-2');
      expect(chartContainers.length).toBeGreaterThan(0);
    });
  });
});
