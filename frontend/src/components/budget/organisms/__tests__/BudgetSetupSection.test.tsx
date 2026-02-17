import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BudgetSetupSection } from '../BudgetSetupSection';
import { BudgetConfig } from '../../../../types/expense';
import { BudgetCategory } from '../../../../types/trip';

// Mock the child components
vi.mock('../../molecules/TotalBudgetInput', () => ({
  TotalBudgetInput: ({ value, onChange, error, label }: any) => (
    <div data-testid="total-budget-input">
      <label>{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        data-testid="budget-input"
      />
      {error && <span data-testid="budget-error">{error}</span>}
    </div>
  ),
}));

vi.mock('../../molecules/CategoryAllocationItem', () => ({
  CategoryAllocationItem: ({ category, percentage, onPercentageChange }: any) => (
    <div data-testid={`category-item-${category}`}>
      <span>{category}</span>
      <input
        type="number"
        value={percentage}
        onChange={(e) => onPercentageChange(category, parseFloat(e.target.value) || 0)}
        data-testid={`category-input-${category}`}
      />
    </div>
  ),
}));

vi.mock('../../molecules/BudgetPieChart', () => ({
  BudgetPieChart: ({ categoryAllocations }: any) => (
    <div data-testid="budget-pie-chart">
      Chart with {categoryAllocations.length} categories
    </div>
  ),
}));

describe('BudgetSetupSection', () => {
  const mockOnSave = vi.fn();
  const mockOnToggleCollapse = vi.fn();

  const mockBudgetConfig: BudgetConfig = {
    id: 'config-1',
    tripId: 'trip-1',
    totalBudget: 10000,
    homeCurrency: 'HKD',
    tripCurrency: 'JPY',
    categoryAllocations: [
      { category: 'flights' as BudgetCategory, percentage: 30, allocatedAmount: 3000 },
      { category: 'accommodation' as BudgetCategory, percentage: 25, allocatedAmount: 2500 },
      { category: 'food' as BudgetCategory, percentage: 15, allocatedAmount: 1500 },
      { category: 'transport' as BudgetCategory, percentage: 10, allocatedAmount: 1000 },
      { category: 'activities' as BudgetCategory, percentage: 10, allocatedAmount: 1000 },
      { category: 'shopping' as BudgetCategory, percentage: 5, allocatedAmount: 500 },
      { category: 'misc' as BudgetCategory, percentage: 5, allocatedAmount: 500 },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render in expanded state by default', () => {
      render(<BudgetSetupSection budgetConfig={null} onSave={mockOnSave} />);

      expect(screen.getByText('Budget Setup')).toBeInTheDocument();
      expect(screen.getByText('Configure your trip budget and category allocations')).toBeInTheDocument();
      expect(screen.getByTestId('total-budget-input')).toBeInTheDocument();
    });

    it('should render in collapsed state when isCollapsed is true', () => {
      render(
        <BudgetSetupSection
          budgetConfig={mockBudgetConfig}
          onSave={mockOnSave}
          isCollapsed={true}
          onToggleCollapse={mockOnToggleCollapse}
        />
      );

      expect(screen.getByText('Budget Setup')).toBeInTheDocument();
      expect(screen.getByText(/JPY 10,000.00/)).toBeInTheDocument();
      expect(screen.queryByTestId('total-budget-input')).not.toBeInTheDocument();
    });

    it('should render all 7 category allocation items', () => {
      render(<BudgetSetupSection budgetConfig={mockBudgetConfig} onSave={mockOnSave} />);

      const categories: BudgetCategory[] = ['flights', 'accommodation', 'food', 'transport', 'activities', 'shopping', 'misc'];
      categories.forEach(category => {
        expect(screen.getByTestId(`category-item-${category}`)).toBeInTheDocument();
      });
    });

    it('should render pie chart when budget is set', () => {
      render(<BudgetSetupSection budgetConfig={mockBudgetConfig} onSave={mockOnSave} />);

      expect(screen.getByTestId('budget-pie-chart')).toBeInTheDocument();
    });

    it('should not render pie chart when budget is zero', () => {
      render(<BudgetSetupSection budgetConfig={null} onSave={mockOnSave} />);

      expect(screen.queryByTestId('budget-pie-chart')).not.toBeInTheDocument();
    });
  });

  describe('Collapsible Behavior', () => {
    it('should call onToggleCollapse when collapse button is clicked in expanded state', () => {
      render(
        <BudgetSetupSection
          budgetConfig={mockBudgetConfig}
          onSave={mockOnSave}
          isCollapsed={false}
          onToggleCollapse={mockOnToggleCollapse}
        />
      );

      const collapseButton = screen.getByLabelText('Collapse budget setup section');
      fireEvent.click(collapseButton);

      expect(mockOnToggleCollapse).toHaveBeenCalledTimes(1);
    });

    it('should call onToggleCollapse when expand button is clicked in collapsed state', () => {
      render(
        <BudgetSetupSection
          budgetConfig={mockBudgetConfig}
          onSave={mockOnSave}
          isCollapsed={true}
          onToggleCollapse={mockOnToggleCollapse}
        />
      );

      const expandButton = screen.getByLabelText('Expand budget setup section');
      fireEvent.click(expandButton);

      expect(mockOnToggleCollapse).toHaveBeenCalledTimes(1);
    });
  });

  describe('Budget Input', () => {
    it('should update total budget when input changes', () => {
      render(<BudgetSetupSection budgetConfig={null} onSave={mockOnSave} />);

      const budgetInput = screen.getByTestId('budget-input');
      fireEvent.change(budgetInput, { target: { value: '5000' } });

      expect(budgetInput).toHaveValue(5000);
    });

    it('should initialize with budget config value', () => {
      render(<BudgetSetupSection budgetConfig={mockBudgetConfig} onSave={mockOnSave} />);

      const budgetInput = screen.getByTestId('budget-input');
      expect(budgetInput).toHaveValue(10000);
    });
  });

  describe('Category Allocation', () => {
    it('should update category percentage when input changes', () => {
      render(<BudgetSetupSection budgetConfig={mockBudgetConfig} onSave={mockOnSave} />);

      const flightsInput = screen.getByTestId('category-input-flights');
      fireEvent.change(flightsInput, { target: { value: '35' } });

      expect(flightsInput).toHaveValue(35);
    });

    it('should display allocation sum', () => {
      render(<BudgetSetupSection budgetConfig={mockBudgetConfig} onSave={mockOnSave} />);

      expect(screen.getByText(/Total: 100.0%/)).toBeInTheDocument();
    });

    it('should show validation error when allocation sum is not 100%', () => {
      render(<BudgetSetupSection budgetConfig={mockBudgetConfig} onSave={mockOnSave} />);

      // Change flights to 35% (total becomes 105%)
      const flightsInput = screen.getByTestId('category-input-flights');
      fireEvent.change(flightsInput, { target: { value: '35' } });

      expect(screen.getByText(/Total: 105.0%/)).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should disable save button when budget is zero', () => {
      render(<BudgetSetupSection budgetConfig={null} onSave={mockOnSave} />);

      const saveButton = screen.getByLabelText('Save budget configuration');
      expect(saveButton).toBeDisabled();
    });

    it('should disable save button when allocation sum is not 100%', () => {
      render(<BudgetSetupSection budgetConfig={mockBudgetConfig} onSave={mockOnSave} />);

      // Change flights to 35% (total becomes 105%)
      const flightsInput = screen.getByTestId('category-input-flights');
      fireEvent.change(flightsInput, { target: { value: '35' } });

      const saveButton = screen.getByLabelText('Save budget configuration');
      expect(saveButton).toBeDisabled();
    });

    it('should enable save button when budget and allocations are valid', () => {
      render(<BudgetSetupSection budgetConfig={mockBudgetConfig} onSave={mockOnSave} />);

      const saveButton = screen.getByLabelText('Save budget configuration');
      expect(saveButton).not.toBeDisabled();
    });

    it('should show error in TotalBudgetInput when budget is zero', () => {
      render(<BudgetSetupSection budgetConfig={null} onSave={mockOnSave} />);

      // The error is shown by the TotalBudgetInput component
      expect(screen.getByTestId('budget-error')).toHaveTextContent('Budget must be greater than 0');
    });

    it('should show validation error when save is attempted with invalid allocation sum', async () => {
      render(<BudgetSetupSection budgetConfig={mockBudgetConfig} onSave={mockOnSave} />);

      // Change flights to 35% (total becomes 105%)
      const flightsInput = screen.getByTestId('category-input-flights');
      fireEvent.change(flightsInput, { target: { value: '35' } });

      // The save button should be disabled
      const saveButton = screen.getByLabelText('Save budget configuration');
      expect(saveButton).toBeDisabled();

      // The total should show as invalid
      expect(screen.getByText(/Total: 105.0%/)).toBeInTheDocument();
    });
  });

  describe('Save Functionality', () => {
    it('should call onSave with correct data when save button is clicked', async () => {
      mockOnSave.mockResolvedValue(undefined);

      render(<BudgetSetupSection budgetConfig={mockBudgetConfig} onSave={mockOnSave} />);

      const saveButton = screen.getByLabelText('Save budget configuration');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1);
        expect(mockOnSave).toHaveBeenCalledWith({
          totalBudget: 10000,
          categoryAllocations: expect.arrayContaining([
            expect.objectContaining({ category: 'flights', percentage: 30 }),
            expect.objectContaining({ category: 'accommodation', percentage: 25 }),
          ]),
        });
      });
    });

    it('should show loading state while saving', async () => {
      mockOnSave.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<BudgetSetupSection budgetConfig={mockBudgetConfig} onSave={mockOnSave} />);

      const saveButton = screen.getByLabelText('Save budget configuration');
      fireEvent.click(saveButton);

      expect(screen.getByText('Saving...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
      });
    });

    it('should show error message when save fails', async () => {
      mockOnSave.mockRejectedValue(new Error('Network error'));

      render(<BudgetSetupSection budgetConfig={mockBudgetConfig} onSave={mockOnSave} />);

      const saveButton = screen.getByLabelText('Save budget configuration');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('Default Allocations', () => {
    it('should initialize with default allocations when no config provided', () => {
      render(<BudgetSetupSection budgetConfig={null} onSave={mockOnSave} />);

      // Check that default percentages are set
      expect(screen.getByTestId('category-input-flights')).toHaveValue(30);
      expect(screen.getByTestId('category-input-accommodation')).toHaveValue(25);
      expect(screen.getByTestId('category-input-food')).toHaveValue(15);
      expect(screen.getByTestId('category-input-transport')).toHaveValue(10);
      expect(screen.getByTestId('category-input-activities')).toHaveValue(10);
      expect(screen.getByTestId('category-input-shopping')).toHaveValue(5);
      expect(screen.getByTestId('category-input-misc')).toHaveValue(5);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<BudgetSetupSection budgetConfig={mockBudgetConfig} onSave={mockOnSave} />);

      expect(screen.getByLabelText('Save budget configuration')).toBeInTheDocument();
    });

    it('should have proper ARIA expanded state in collapsed mode', () => {
      render(
        <BudgetSetupSection
          budgetConfig={mockBudgetConfig}
          onSave={mockOnSave}
          isCollapsed={true}
          onToggleCollapse={mockOnToggleCollapse}
        />
      );

      const button = screen.getByLabelText('Expand budget setup section');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('should have proper ARIA expanded state in expanded mode', () => {
      render(
        <BudgetSetupSection
          budgetConfig={mockBudgetConfig}
          onSave={mockOnSave}
          isCollapsed={false}
          onToggleCollapse={mockOnToggleCollapse}
        />
      );

      const button = screen.getByLabelText('Collapse budget setup section');
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });
});
