import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import {
  CurrencySelector,
  TotalBudgetInput,
  CategoryAllocationItem,
  BudgetProgressRing,
  CatEatingAnimation,
  AlertBanner,
  ExpenseCard,
  ExpenseForm,
  AmountInput,
  CategorySelect,
  DatePicker,
  NoteInput,
  SplitSelector,
  BudgetPieChart,
  CategoryComparisonChart,
  SpendingOverTimeChart,
  CategoryProgressBars,
} from '../index';

describe('Budget Molecules', () => {
  describe('CurrencySelector', () => {
    it('renders with selected currency', () => {
      const onCurrencyChange = vi.fn();
      render(
        <CurrencySelector
          selectedCurrency="USD"
          onCurrencyChange={onCurrencyChange}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('USD');
      // Check for the currency info text that appears below the select
      expect(screen.getByText(/Selected:/)).toBeInTheDocument();
    });

    it('calls onCurrencyChange when currency is changed', () => {
      const onCurrencyChange = vi.fn();
      render(
        <CurrencySelector
          selectedCurrency="USD"
          onCurrencyChange={onCurrencyChange}
        />
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'JPY' } });

      expect(onCurrencyChange).toHaveBeenCalledWith('JPY');
    });

    it('displays custom label when provided', () => {
      render(
        <CurrencySelector
          selectedCurrency="USD"
          onCurrencyChange={vi.fn()}
          label="Trip Currency"
        />
      );

      expect(screen.getByText('Trip Currency')).toBeInTheDocument();
    });

    it('has accessible label', () => {
      render(
        <CurrencySelector
          selectedCurrency="USD"
          onCurrencyChange={vi.fn()}
          label="Currency"
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveAccessibleName('Currency');
    });
  });

  describe('TotalBudgetInput', () => {
    it('renders with initial value', () => {
      render(
        <TotalBudgetInput
          value={1000}
          currency="HKD"
          onChange={vi.fn()}
        />
      );

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveValue(1000);
      expect(screen.getByText('HKD')).toBeInTheDocument();
    });

    it('calls onChange when value changes', () => {
      const onChange = vi.fn();
      render(
        <TotalBudgetInput
          value={1000}
          currency="HKD"
          onChange={onChange}
        />
      );

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '2000' } });

      expect(onChange).toHaveBeenCalledWith(2000);
    });

    it('displays error message when provided', () => {
      render(
        <TotalBudgetInput
          value={0}
          currency="HKD"
          onChange={vi.fn()}
          error="Budget must be greater than 0"
        />
      );

      expect(screen.getByText(/Budget must be greater than 0/i)).toBeInTheDocument();
    });

    it('shows validation icon for valid input', () => {
      render(
        <TotalBudgetInput
          value={1000}
          currency="HKD"
          onChange={vi.fn()}
        />
      );

      // Check for green checkmark SVG
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveClass('border-green-300');
    });

    it('formats value on blur', async () => {
      const onChange = vi.fn();
      render(
        <TotalBudgetInput
          value={1000}
          currency="HKD"
          onChange={onChange}
        />
      );

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '1234.5' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(input).toHaveValue(1234.5);
      });
    });

    it('handles empty input gracefully', () => {
      const onChange = vi.fn();
      render(
        <TotalBudgetInput
          value={1000}
          currency="HKD"
          onChange={onChange}
        />
      );

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '' } });

      expect(onChange).toHaveBeenCalledWith(0);
    });

    it('has accessible error description', () => {
      render(
        <TotalBudgetInput
          value={0}
          currency="HKD"
          onChange={vi.fn()}
          error="Invalid amount"
        />
      );

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'budget-error');
    });
  });

  describe('CategoryAllocationItem', () => {
    it('renders category with correct info', () => {
      render(
        <CategoryAllocationItem
          category="food"
          percentage={15}
          allocatedAmount={1500}
          currency="HKD"
          onPercentageChange={vi.fn()}
        />
      );

      expect(screen.getByText('Food')).toBeInTheDocument();
      expect(screen.getByText('🍜')).toBeInTheDocument();
      expect(screen.getByText(/HKD 1,500.00/)).toBeInTheDocument();
    });

    it('calls onPercentageChange when slider changes', () => {
      const onPercentageChange = vi.fn();
      render(
        <CategoryAllocationItem
          category="food"
          percentage={15}
          allocatedAmount={1500}
          currency="HKD"
          onPercentageChange={onPercentageChange}
        />
      );

      const slider = screen.getByLabelText(/Food allocation slider/i);
      fireEvent.change(slider, { target: { value: '20' } });

      expect(onPercentageChange).toHaveBeenCalledWith('food', 20);
    });

    it('calls onPercentageChange when input changes', () => {
      const onPercentageChange = vi.fn();
      render(
        <CategoryAllocationItem
          category="food"
          percentage={15}
          allocatedAmount={1500}
          currency="HKD"
          onPercentageChange={onPercentageChange}
        />
      );

      const input = screen.getByLabelText(/Food percentage/i);
      fireEvent.change(input, { target: { value: '25' } });

      expect(onPercentageChange).toHaveBeenCalledWith('food', 25);
    });

    it('validates percentage range (0-100)', () => {
      const onPercentageChange = vi.fn();
      render(
        <CategoryAllocationItem
          category="food"
          percentage={15}
          allocatedAmount={1500}
          currency="HKD"
          onPercentageChange={onPercentageChange}
        />
      );

      const input = screen.getByLabelText(/Food percentage/i);
      
      // Try to set value > 100
      fireEvent.change(input, { target: { value: '150' } });
      expect(onPercentageChange).not.toHaveBeenCalled();

      // Try to set negative value
      fireEvent.change(input, { target: { value: '-10' } });
      expect(onPercentageChange).not.toHaveBeenCalled();
    });

    it('handles empty input', () => {
      const onPercentageChange = vi.fn();
      render(
        <CategoryAllocationItem
          category="food"
          percentage={15}
          allocatedAmount={1500}
          currency="HKD"
          onPercentageChange={onPercentageChange}
        />
      );

      const input = screen.getByLabelText(/Food percentage/i);
      fireEvent.change(input, { target: { value: '' } });

      expect(onPercentageChange).toHaveBeenCalledWith('food', 0);
    });
  });

  describe('BudgetProgressRing', () => {
    it('renders with budget stats', () => {
      render(
        <BudgetProgressRing
          totalBudget={10000}
          spent={7500}
          remaining={2500}
          currency="HKD"
          percentageSpent={75}
          status="warning"
        />
      );

      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText(/HKD 10,000/)).toBeInTheDocument();
      expect(screen.getByText(/HKD 7,500/)).toBeInTheDocument();
      expect(screen.getByText(/HKD 2,500/)).toBeInTheDocument();
    });

    it('displays correct status message for safe status', () => {
      render(
        <BudgetProgressRing
          totalBudget={10000}
          spent={5000}
          remaining={5000}
          currency="HKD"
          percentageSpent={50}
          status="safe"
        />
      );

      expect(screen.getByText(/On track/i)).toBeInTheDocument();
    });

    it('displays correct status message for warning status', () => {
      render(
        <BudgetProgressRing
          totalBudget={10000}
          spent={7500}
          remaining={2500}
          currency="HKD"
          percentageSpent={75}
          status="warning"
        />
      );

      expect(screen.getByText(/Watch your spending/i)).toBeInTheDocument();
    });

    it('displays correct status message for danger status', () => {
      render(
        <BudgetProgressRing
          totalBudget={10000}
          spent={9500}
          remaining={500}
          currency="HKD"
          percentageSpent={95}
          status="danger"
        />
      );

      expect(screen.getByText(/Approaching budget limit/i)).toBeInTheDocument();
    });

    it('displays over budget message when exceeded', () => {
      render(
        <BudgetProgressRing
          totalBudget={10000}
          spent={11000}
          remaining={-1000}
          currency="HKD"
          percentageSpent={110}
          status="over"
        />
      );

      expect(screen.getByText(/Over budget by/i)).toBeInTheDocument();
      expect(screen.getByText(/HKD 1,000/)).toBeInTheDocument();
    });

    it('renders different sizes correctly', () => {
      const { rerender } = render(
        <BudgetProgressRing
          totalBudget={10000}
          spent={5000}
          remaining={5000}
          currency="HKD"
          percentageSpent={50}
          status="safe"
          size="sm"
        />
      );

      // Just verify the component renders without errors for different sizes
      expect(screen.getByText('50%')).toBeInTheDocument();

      rerender(
        <BudgetProgressRing
          totalBudget={10000}
          spent={5000}
          remaining={5000}
          currency="HKD"
          percentageSpent={50}
          status="safe"
          size="lg"
        />
      );

      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });

  describe('CatEatingAnimation', () => {
    it('renders happy cat when budget is low', () => {
      render(<CatEatingAnimation percentageSpent={30} />);

      expect(screen.getByText('😻')).toBeInTheDocument();
      expect(screen.getByText(/Great spending!/i)).toBeInTheDocument();
    });

    it('renders eating cat when budget is moderate', () => {
      render(<CatEatingAnimation percentageSpent={60} />);

      expect(screen.getByText('😸')).toBeInTheDocument();
      expect(screen.getByText(/Nom nom nom/i)).toBeInTheDocument();
    });

    it('renders worried cat when budget is high', () => {
      render(<CatEatingAnimation percentageSpent={80} />);

      expect(screen.getByText('😿')).toBeInTheDocument();
      expect(screen.getByText(/Watch your budget/i)).toBeInTheDocument();
    });

    it('renders sad cat when budget is exceeded', () => {
      render(<CatEatingAnimation percentageSpent={110} />);

      expect(screen.getByText('🙀')).toBeInTheDocument();
      expect(screen.getAllByText(/Budget exceeded!/i).length).toBeGreaterThan(0);
    });

    it('has accessible role and label', () => {
      render(<CatEatingAnimation percentageSpent={50} />);

      const catElement = screen.getByRole('img');
      expect(catElement).toHaveAttribute('aria-label');
    });

    it('renders different sizes', () => {
      const { rerender } = render(<CatEatingAnimation percentageSpent={50} size="sm" />);
      
      let catElement = screen.getByRole('img');
      expect(catElement).toHaveClass('w-16', 'h-16');

      rerender(<CatEatingAnimation percentageSpent={50} size="lg" />);
      
      catElement = screen.getByRole('img');
      expect(catElement).toHaveClass('w-32', 'h-32');
    });
  });

  describe('AlertBanner', () => {
    it('renders with title and message', () => {
      render(
        <AlertBanner
          type="warning"
          title="Budget Warning"
          message="You've spent 70% of your budget"
        />
      );

      expect(screen.getByText('Budget Warning')).toBeInTheDocument();
      expect(screen.getByText(/You've spent 70% of your budget/i)).toBeInTheDocument();
    });

    it('renders different alert types with correct styling', () => {
      const { rerender } = render(
        <AlertBanner
          type="info"
          title="Info"
          message="Information message"
        />
      );

      let alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-blue-50');

      rerender(
        <AlertBanner
          type="danger"
          title="Danger"
          message="Danger message"
        />
      );

      alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-red-50');
    });

    it('calls onDismiss when dismiss button is clicked', () => {
      const onDismiss = vi.fn();
      render(
        <AlertBanner
          type="warning"
          title="Warning"
          message="Warning message"
          dismissible={true}
          onDismiss={onDismiss}
        />
      );

      const dismissButton = screen.getByLabelText(/Dismiss alert/i);
      fireEvent.click(dismissButton);

      expect(onDismiss).toHaveBeenCalled();
    });

    it('hides alert after dismissal', () => {
      render(
        <AlertBanner
          type="warning"
          title="Warning"
          message="Warning message"
          dismissible={true}
        />
      );

      const dismissButton = screen.getByLabelText(/Dismiss alert/i);
      fireEvent.click(dismissButton);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('renders action button when provided', () => {
      const onAction = vi.fn();
      render(
        <AlertBanner
          type="warning"
          title="Warning"
          message="Warning message"
          action={{
            label: 'View Details',
            onClick: onAction,
          }}
        />
      );

      const actionButton = screen.getByText('View Details');
      expect(actionButton).toBeInTheDocument();

      fireEvent.click(actionButton);
      expect(onAction).toHaveBeenCalled();
    });

    it('does not render dismiss button when not dismissible', () => {
      render(
        <AlertBanner
          type="warning"
          title="Warning"
          message="Warning message"
          dismissible={false}
        />
      );

      expect(screen.queryByLabelText(/Dismiss alert/i)).not.toBeInTheDocument();
    });

    it('has accessible live region', () => {
      render(
        <AlertBanner
          type="warning"
          title="Warning"
          message="Warning message"
        />
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('AmountInput', () => {
    it('renders with initial value', () => {
      render(
        <AmountInput
          value={100.50}
          currency="HKD"
          onChange={vi.fn()}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('100.5');
      expect(screen.getByText('HKD')).toBeInTheDocument();
    });

    it('calls onChange when value changes', () => {
      const onChange = vi.fn();
      render(
        <AmountInput
          value={0}
          currency="HKD"
          onChange={onChange}
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '50.25' } });

      expect(onChange).toHaveBeenCalledWith(50.25);
    });

    it('validates decimal places (max 2)', () => {
      const onChange = vi.fn();
      render(
        <AmountInput
          value={0}
          currency="HKD"
          onChange={onChange}
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '50.123' } });

      // Should not call onChange for more than 2 decimal places
      expect(input).toHaveValue('');
    });

    it('formats value on blur', async () => {
      render(
        <AmountInput
          value={50}
          currency="HKD"
          onChange={vi.fn()}
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '50.5' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(input).toHaveValue('50.50');
      });
    });

    it('displays error message when provided', () => {
      render(
        <AmountInput
          value={0}
          currency="HKD"
          onChange={vi.fn()}
          error="Amount must be greater than 0"
        />
      );

      expect(screen.getByText(/Amount must be greater than 0/i)).toBeInTheDocument();
    });

    it('shows validation icon for valid input', () => {
      render(
        <AmountInput
          value={100}
          currency="HKD"
          onChange={vi.fn()}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-green-300');
    });

    it('handles empty input gracefully', () => {
      const onChange = vi.fn();
      render(
        <AmountInput
          value={100}
          currency="HKD"
          onChange={onChange}
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '' } });

      expect(onChange).toHaveBeenCalledWith(0);
    });

    it('shows required indicator when required', () => {
      render(
        <AmountInput
          value={0}
          currency="HKD"
          onChange={vi.fn()}
          label="Amount"
          required
        />
      );

      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('CategorySelect', () => {
    it('renders with placeholder when no value', () => {
      render(
        <CategorySelect
          value=""
          onChange={vi.fn()}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('');
      expect(screen.getByText('Select a category...')).toBeInTheDocument();
    });

    it('renders with selected category', () => {
      render(
        <CategorySelect
          value="food"
          onChange={vi.fn()}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('food');
      expect(screen.getByText('🍜')).toBeInTheDocument();
      // Food appears in both the select option and the badge below
      const foodElements = screen.queryAllByText((content, element) => {
        return element?.textContent?.includes('Food') || false;
      });
      expect(foodElements.length).toBeGreaterThan(0);
    });

    it('calls onChange when category is selected', () => {
      const onChange = vi.fn();
      render(
        <CategorySelect
          value=""
          onChange={onChange}
        />
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'transport' } });

      expect(onChange).toHaveBeenCalledWith('transport');
    });

    it('displays all category options', () => {
      render(
        <CategorySelect
          value=""
          onChange={vi.fn()}
        />
      );

      const options = screen.getAllByRole('option');
      // 7 categories + 1 placeholder
      expect(options).toHaveLength(8);
    });

    it('displays error message when provided', () => {
      render(
        <CategorySelect
          value=""
          onChange={vi.fn()}
          error="Please select a category"
        />
      );

      expect(screen.getByText(/Please select a category/i)).toBeInTheDocument();
    });

    it('shows required indicator when required', () => {
      render(
        <CategorySelect
          value=""
          onChange={vi.fn()}
          label="Category"
          required
        />
      );

      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('DatePicker', () => {
    it('renders with initial date', () => {
      const date = new Date('2024-03-15').toISOString();
      render(
        <DatePicker
          value={date}
          onChange={vi.fn()}
        />
      );

      const input = screen.getByLabelText(/Date/i);
      expect(input).toHaveValue('2024-03-15');
    });

    it('calls onChange when date is selected', () => {
      const onChange = vi.fn();
      render(
        <DatePicker
          value={new Date('2024-03-15').toISOString()}
          onChange={onChange}
        />
      );

      const input = screen.getByLabelText(/Date/i);
      fireEvent.change(input, { target: { value: '2024-03-20' } });

      expect(onChange).toHaveBeenCalled();
      const callArg = onChange.mock.calls[0][0];
      expect(callArg).toContain('2024-03-20');
    });

    it('displays formatted date below input', () => {
      const date = new Date('2024-03-15').toISOString();
      render(
        <DatePicker
          value={date}
          onChange={vi.fn()}
        />
      );

      expect(screen.getByText(/Mar 15, 2024/i)).toBeInTheDocument();
    });

    it('displays error message when provided', () => {
      render(
        <DatePicker
          value=""
          onChange={vi.fn()}
          error="Please select a date"
        />
      );

      expect(screen.getByText(/Please select a date/i)).toBeInTheDocument();
    });

    it('shows required indicator when required', () => {
      render(
        <DatePicker
          value=""
          onChange={vi.fn()}
          label="Date"
          required
        />
      );

      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('respects min and max date constraints', () => {
      const minDate = new Date('2024-01-01').toISOString();
      const maxDate = new Date('2024-12-31').toISOString();
      
      render(
        <DatePicker
          value={new Date('2024-06-15').toISOString()}
          onChange={vi.fn()}
          min={minDate}
          max={maxDate}
        />
      );

      const input = screen.getByLabelText(/Date/i);
      expect(input).toHaveAttribute('min', '2024-01-01');
      expect(input).toHaveAttribute('max', '2024-12-31');
    });
  });

  describe('NoteInput', () => {
    it('renders with initial value', () => {
      render(
        <NoteInput
          value="Test note"
          onChange={vi.fn()}
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('Test note');
    });

    it('calls onChange when value changes', () => {
      const onChange = vi.fn();
      render(
        <NoteInput
          value=""
          onChange={onChange}
        />
      );

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'New note' } });

      expect(onChange).toHaveBeenCalledWith('New note');
    });

    it('displays character count', () => {
      render(
        <NoteInput
          value="Test"
          onChange={vi.fn()}
          maxLength={200}
        />
      );

      expect(screen.getByText('4/200')).toBeInTheDocument();
    });

    it('enforces max length', () => {
      const onChange = vi.fn();
      render(
        <NoteInput
          value=""
          onChange={onChange}
          maxLength={10}
        />
      );

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'This is a very long text' } });

      // Should not call onChange for text exceeding max length
      expect(onChange).not.toHaveBeenCalled();
    });

    it('shows clear button when value is present', () => {
      const onChange = vi.fn();
      render(
        <NoteInput
          value="Test note"
          onChange={onChange}
        />
      );

      const clearButton = screen.getByLabelText(/Clear note/i);
      expect(clearButton).toBeInTheDocument();

      fireEvent.click(clearButton);
      expect(onChange).toHaveBeenCalledWith('');
    });

    it('highlights character count when near limit', () => {
      render(
        <NoteInput
          value={'A'.repeat(180)}
          onChange={vi.fn()}
          maxLength={200}
        />
      );

      const charCount = screen.getByText('180/200');
      expect(charCount).toHaveClass('text-yellow-600');
    });
  });

  describe('ExpenseCard', () => {
    const mockExpense = {
      id: '1',
      tripId: 'trip1',
      amount: 1200,
      currency: 'JPY',
      category: 'food' as const,
      date: new Date('2024-03-15').toISOString(),
      note: 'Dinner at restaurant',
      isSettled: false,
      createdBy: 'user1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced' as const,
    };

    it('renders expense details correctly', () => {
      render(
        <ExpenseCard
          expense={mockExpense}
          homeCurrency="HKD"
          exchangeRate={0.058}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByText('Food')).toBeInTheDocument();
      expect(screen.getByText('🍜')).toBeInTheDocument();
      expect(screen.getByText(/JPY 1,200.00/)).toBeInTheDocument();
      expect(screen.getByText(/HKD 69.60/)).toBeInTheDocument();
      expect(screen.getByText('Dinner at restaurant')).toBeInTheDocument();
    });

    it('calls onEdit when edit button is clicked', () => {
      const onEdit = vi.fn();
      render(
        <ExpenseCard
          expense={mockExpense}
          homeCurrency="HKD"
          exchangeRate={0.058}
          onEdit={onEdit}
          onDelete={vi.fn()}
        />
      );

      const editButton = screen.getByLabelText(/Edit expense/i);
      fireEvent.click(editButton);

      expect(onEdit).toHaveBeenCalledWith(mockExpense);
    });

    it('calls onDelete with confirmation when delete button is clicked', () => {
      const onDelete = vi.fn();
      window.confirm = vi.fn(() => true);

      render(
        <ExpenseCard
          expense={mockExpense}
          homeCurrency="HKD"
          exchangeRate={0.058}
          onEdit={vi.fn()}
          onDelete={onDelete}
        />
      );

      const deleteButton = screen.getByLabelText(/Delete expense/i);
      fireEvent.click(deleteButton);

      expect(window.confirm).toHaveBeenCalled();
      expect(onDelete).toHaveBeenCalledWith('1');
    });

    it('displays split information when expense is split', () => {
      const splitExpense = {
        ...mockExpense,
        splitWith: ['user2', 'user3'],
        splitType: 'equal' as const,
      };

      render(
        <ExpenseCard
          expense={splitExpense}
          homeCurrency="HKD"
          exchangeRate={0.058}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByText('Equal')).toBeInTheDocument();
      expect(screen.getByText(/with 2 people/i)).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('displays settled status for settled expenses', () => {
      const settledExpense = {
        ...mockExpense,
        splitWith: ['user2'],
        splitType: 'equal' as const,
        isSettled: true,
      };

      render(
        <ExpenseCard
          expense={settledExpense}
          homeCurrency="HKD"
          exchangeRate={0.058}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByText('Settled')).toBeInTheDocument();
    });

    it('displays sync status when not synced', () => {
      const pendingExpense = {
        ...mockExpense,
        syncStatus: 'pending' as const,
      };

      render(
        <ExpenseCard
          expense={pendingExpense}
          homeCurrency="HKD"
          exchangeRate={0.058}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByText(/Syncing.../i)).toBeInTheDocument();
    });

    it('does not show home currency when same as expense currency', () => {
      render(
        <ExpenseCard
          expense={mockExpense}
          homeCurrency="JPY"
          exchangeRate={1}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const amounts = screen.getAllByText(/JPY 1,200.00/);
      expect(amounts).toHaveLength(1);
    });
  });

  describe('SplitSelector', () => {
    const mockMembers = [
      { id: 'user1', name: 'Alice', email: 'alice@example.com' },
      { id: 'user2', name: 'Bob', email: 'bob@example.com' },
      { id: 'user3', name: 'Charlie', email: 'charlie@example.com' },
    ];

    it('renders collapsed by default', () => {
      render(
        <SplitSelector
          tripMembers={mockMembers}
          totalAmount={300}
          onPaidByChange={vi.fn()}
          onSplitWithChange={vi.fn()}
          onSplitTypeChange={vi.fn()}
          onCustomSplitsChange={vi.fn()}
        />
      );

      expect(screen.getByText('Add Split')).toBeInTheDocument();
      expect(screen.queryByText('Paid By')).not.toBeInTheDocument();
    });

    it('expands when toggle button is clicked', () => {
      render(
        <SplitSelector
          tripMembers={mockMembers}
          totalAmount={300}
          onPaidByChange={vi.fn()}
          onSplitWithChange={vi.fn()}
          onSplitTypeChange={vi.fn()}
          onCustomSplitsChange={vi.fn()}
        />
      );

      const toggleButton = screen.getByText('Add Split');
      fireEvent.click(toggleButton);

      expect(screen.getByText('Paid By')).toBeInTheDocument();
      expect(screen.getByText('Split With')).toBeInTheDocument();
    });

    it('displays all trip members as checkboxes', () => {
      render(
        <SplitSelector
          tripMembers={mockMembers}
          totalAmount={300}
          onPaidByChange={vi.fn()}
          onSplitWithChange={vi.fn()}
          onSplitTypeChange={vi.fn()}
          onCustomSplitsChange={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('Add Split'));

      expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Bob').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Charlie').length).toBeGreaterThan(0);
    });

    it('calls onSplitWithChange when member is selected', () => {
      const onSplitWithChange = vi.fn();
      render(
        <SplitSelector
          tripMembers={mockMembers}
          splitWith={[]}
          totalAmount={300}
          onPaidByChange={vi.fn()}
          onSplitWithChange={onSplitWithChange}
          onSplitTypeChange={vi.fn()}
          onCustomSplitsChange={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('Add Split'));

      const aliceCheckbox = screen.getByRole('checkbox', { name: /Alice/i });
      fireEvent.click(aliceCheckbox);

      expect(onSplitWithChange).toHaveBeenCalledWith(['user1']);
    });

    it('displays equal split preview', () => {
      render(
        <SplitSelector
          tripMembers={mockMembers}
          splitWith={['user1', 'user2', 'user3']}
          splitType="equal"
          totalAmount={300}
          onPaidByChange={vi.fn()}
          onSplitWithChange={vi.fn()}
          onSplitTypeChange={vi.fn()}
          onCustomSplitsChange={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText(/Split with 3/i));

      expect(screen.getByText('Each person pays:')).toBeInTheDocument();
      expect(screen.getByText('100.00')).toBeInTheDocument();
    });

    it('displays custom split inputs', () => {
      render(
        <SplitSelector
          tripMembers={mockMembers}
          splitWith={['user1', 'user2']}
          splitType="custom"
          customSplits={[
            { userId: 'user1', amount: 100 },
            { userId: 'user2', amount: 200 },
          ]}
          totalAmount={300}
          onPaidByChange={vi.fn()}
          onSplitWithChange={vi.fn()}
          onSplitTypeChange={vi.fn()}
          onCustomSplitsChange={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText(/Split with 2/i));

      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs).toHaveLength(2);
    });

    it('validates custom split total matches expense amount', () => {
      render(
        <SplitSelector
          tripMembers={mockMembers}
          splitWith={['user1', 'user2']}
          splitType="custom"
          customSplits={[
            { userId: 'user1', amount: 100 },
            { userId: 'user2', amount: 150 },
          ]}
          totalAmount={300}
          onPaidByChange={vi.fn()}
          onSplitWithChange={vi.fn()}
          onSplitTypeChange={vi.fn()}
          onCustomSplitsChange={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText(/Split with 2/i));

      expect(screen.getByText('Difference:')).toBeInTheDocument();
      expect(screen.getByText('50.00')).toBeInTheDocument();
    });
  });

  describe('ExpenseForm', () => {
    const mockMembers = [
      { id: 'user1', name: 'Alice', email: 'alice@example.com' },
      { id: 'user2', name: 'Bob', email: 'bob@example.com' },
    ];

    it('renders all form fields', () => {
      render(
        <ExpenseForm
          tripId="trip1"
          tripMembers={mockMembers}
          currency="HKD"
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Note/i)).toBeInTheDocument();
    });

    it('validates required fields on submit', async () => {
      const onSubmit = vi.fn();
      render(
        <ExpenseForm
          tripId="trip1"
          tripMembers={mockMembers}
          currency="HKD"
          onSubmit={onSubmit}
          onCancel={vi.fn()}
        />
      );

      const submitButton = screen.getByText(/Add Expense/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Amount must be greater than 0/i)).toBeInTheDocument();
        expect(screen.getByText(/Please select a category/i)).toBeInTheDocument();
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits form with valid data', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(
        <ExpenseForm
          tripId="trip1"
          tripMembers={mockMembers}
          currency="HKD"
          onSubmit={onSubmit}
          onCancel={vi.fn()}
        />
      );

      // Fill in required fields
      const amountInput = screen.getByLabelText(/Amount/i);
      fireEvent.change(amountInput, { target: { value: '100' } });

      const categorySelect = screen.getByLabelText(/Category/i);
      fireEvent.change(categorySelect, { target: { value: 'food' } });

      const submitButton = screen.getByText(/Add Expense/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 100,
            category: 'food',
          })
        );
      });
    });

    it('calls onCancel with confirmation when cancel button is clicked', () => {
      const onCancel = vi.fn();
      window.confirm = vi.fn(() => true);

      render(
        <ExpenseForm
          tripId="trip1"
          tripMembers={mockMembers}
          currency="HKD"
          onSubmit={vi.fn()}
          onCancel={onCancel}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(window.confirm).toHaveBeenCalled();
      expect(onCancel).toHaveBeenCalled();
    });

    it('populates form with initial data when editing', () => {
      const initialData = {
        id: '1',
        tripId: 'trip1',
        amount: 150,
        currency: 'HKD',
        category: 'food' as const,
        date: new Date('2024-03-15').toISOString(),
        note: 'Test note',
        isSettled: false,
        createdBy: 'user1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'synced' as const,
      };

      render(
        <ExpenseForm
          tripId="trip1"
          initialData={initialData}
          tripMembers={mockMembers}
          currency="HKD"
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByLabelText(/Amount/i)).toHaveValue('150');
      expect(screen.getByLabelText(/Category/i)).toHaveValue('food');
      expect(screen.getByRole('textbox', { name: /Note/i })).toHaveValue('Test note');
      expect(screen.getByText(/Update Expense/i)).toBeInTheDocument();
    });

    it('disables submit button while submitting', async () => {
      const onSubmit = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(
        <ExpenseForm
          tripId="trip1"
          tripMembers={mockMembers}
          currency="HKD"
          onSubmit={onSubmit}
          onCancel={vi.fn()}
        />
      );

      // Fill in required fields
      const amountInput = screen.getByLabelText(/Amount/i);
      fireEvent.change(amountInput, { target: { value: '100' } });

      const categorySelect = screen.getByLabelText(/Category/i);
      fireEvent.change(categorySelect, { target: { value: 'food' } });

      const submitButton = screen.getByText(/Add Expense/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(screen.getByText(/Saving.../i)).toBeInTheDocument();
      });
    });
  });
});

  describe('BudgetPieChart', () => {
    const mockAllocations = [
      { category: 'food' as const, percentage: 30, allocatedAmount: 3000 },
      { category: 'transport' as const, percentage: 20, allocatedAmount: 2000 },
      { category: 'accommodation' as const, percentage: 25, allocatedAmount: 2500 },
      { category: 'activities' as const, percentage: 15, allocatedAmount: 1500 },
      { category: 'shopping' as const, percentage: 10, allocatedAmount: 1000 },
    ];

    it('renders pie chart without errors', () => {
      const { container } = render(
        <BudgetPieChart
          categoryAllocations={mockAllocations}
          currency="HKD"
        />
      );

      // Check that the recharts container is rendered
      const responsiveContainer = container.querySelector('.recharts-responsive-container');
      expect(responsiveContainer).toBeInTheDocument();
    });

    it('displays empty state when no allocations', () => {
      render(
        <BudgetPieChart
          categoryAllocations={[]}
          currency="HKD"
        />
      );

      expect(screen.getByText('No budget allocations')).toBeInTheDocument();
      expect(screen.getByText('Set up your budget to see the chart')).toBeInTheDocument();
    });

    it('filters out zero percentage allocations', () => {
      const allocationsWithZero = [
        { category: 'food' as const, percentage: 30, allocatedAmount: 3000 },
        { category: 'misc' as const, percentage: 0, allocatedAmount: 0 },
      ];

      const { container } = render(
        <BudgetPieChart
          categoryAllocations={allocationsWithZero}
          currency="HKD"
        />
      );

      // Should render chart (not empty state)
      const responsiveContainer = container.querySelector('.recharts-responsive-container');
      expect(responsiveContainer).toBeInTheDocument();
    });

    it('renders with custom height', () => {
      const { container } = render(
        <BudgetPieChart
          categoryAllocations={mockAllocations}
          currency="HKD"
          height={400}
        />
      );

      const responsiveContainer = container.querySelector('.recharts-responsive-container');
      expect(responsiveContainer).toBeInTheDocument();
    });

    it('renders with showLegend prop', () => {
      const { container } = render(
        <BudgetPieChart
          categoryAllocations={mockAllocations}
          currency="HKD"
          showLegend={false}
        />
      );

      const responsiveContainer = container.querySelector('.recharts-responsive-container');
      expect(responsiveContainer).toBeInTheDocument();
    });
  });

  describe('CategoryComparisonChart', () => {
    const mockSummaries = [
      {
        category: 'food' as const,
        allocated: 3000,
        spent: 2500,
        remaining: 500,
        percentageSpent: 83.33,
        expenseCount: 5,
        status: 'warning' as const,
      },
      {
        category: 'transport' as const,
        allocated: 2000,
        spent: 1500,
        remaining: 500,
        percentageSpent: 75,
        expenseCount: 3,
        status: 'warning' as const,
      },
      {
        category: 'accommodation' as const,
        allocated: 2500,
        spent: 2600,
        remaining: -100,
        percentageSpent: 104,
        expenseCount: 2,
        status: 'over' as const,
      },
    ];

    it('renders bar chart without errors', () => {
      const { container } = render(
        <CategoryComparisonChart
          categorySummaries={mockSummaries}
          currency="HKD"
        />
      );

      // Check that the recharts container is rendered
      const responsiveContainer = container.querySelector('.recharts-responsive-container');
      expect(responsiveContainer).toBeInTheDocument();
    });

    it('displays empty state when no summaries', () => {
      render(
        <CategoryComparisonChart
          categorySummaries={[]}
          currency="HKD"
        />
      );

      expect(screen.getByText('No category data')).toBeInTheDocument();
      expect(screen.getByText('Add expenses to see the comparison')).toBeInTheDocument();
    });

    it('filters out categories with zero allocation', () => {
      const summariesWithZero = [
        {
          category: 'food' as const,
          allocated: 3000,
          spent: 2500,
          remaining: 500,
          percentageSpent: 83.33,
          expenseCount: 5,
          status: 'warning' as const,
        },
        {
          category: 'misc' as const,
          allocated: 0,
          spent: 0,
          remaining: 0,
          percentageSpent: 0,
          expenseCount: 0,
          status: 'safe' as const,
        },
      ];

      const { container } = render(
        <CategoryComparisonChart
          categorySummaries={summariesWithZero}
          currency="HKD"
        />
      );

      // Should render chart (not empty state)
      const responsiveContainer = container.querySelector('.recharts-responsive-container');
      expect(responsiveContainer).toBeInTheDocument();
    });

    it('renders with showLegend prop', () => {
      const { container } = render(
        <CategoryComparisonChart
          categorySummaries={mockSummaries}
          currency="HKD"
          showLegend={false}
        />
      );

      const responsiveContainer = container.querySelector('.recharts-responsive-container');
      expect(responsiveContainer).toBeInTheDocument();
    });

    it('renders with custom height', () => {
      const { container } = render(
        <CategoryComparisonChart
          categorySummaries={mockSummaries}
          currency="HKD"
          height={400}
        />
      );

      const responsiveContainer = container.querySelector('.recharts-responsive-container');
      expect(responsiveContainer).toBeInTheDocument();
    });
  });

  describe('SpendingOverTimeChart', () => {
    const mockExpenses = [
      {
        id: '1',
        tripId: 'trip1',
        amount: 500,
        currency: 'HKD',
        category: 'food' as const,
        date: '2024-03-15T00:00:00.000Z',
        isSettled: false,
        createdBy: 'user1',
        createdAt: '2024-03-15T00:00:00.000Z',
        updatedAt: '2024-03-15T00:00:00.000Z',
        syncStatus: 'synced' as const,
      },
      {
        id: '2',
        tripId: 'trip1',
        amount: 300,
        currency: 'HKD',
        category: 'transport' as const,
        date: '2024-03-16T00:00:00.000Z',
        isSettled: false,
        createdBy: 'user1',
        createdAt: '2024-03-16T00:00:00.000Z',
        updatedAt: '2024-03-16T00:00:00.000Z',
        syncStatus: 'synced' as const,
      },
      {
        id: '3',
        tripId: 'trip1',
        amount: 200,
        currency: 'HKD',
        category: 'food' as const,
        date: '2024-03-16T00:00:00.000Z',
        isSettled: false,
        createdBy: 'user1',
        createdAt: '2024-03-16T00:00:00.000Z',
        updatedAt: '2024-03-16T00:00:00.000Z',
        syncStatus: 'synced' as const,
      },
    ];

    it('renders line chart without errors', () => {
      const { container } = render(
        <SpendingOverTimeChart
          expenses={mockExpenses}
          totalBudget={10000}
          currency="HKD"
        />
      );

      // Check that the recharts container is rendered
      const responsiveContainer = container.querySelector('.recharts-responsive-container');
      expect(responsiveContainer).toBeInTheDocument();
    });

    it('displays empty state when no expenses', () => {
      render(
        <SpendingOverTimeChart
          expenses={[]}
          totalBudget={10000}
          currency="HKD"
        />
      );

      expect(screen.getByText('No spending data')).toBeInTheDocument();
      expect(screen.getByText('Add expenses to see spending over time')).toBeInTheDocument();
    });

    it('renders with showLegend prop', () => {
      const { container } = render(
        <SpendingOverTimeChart
          expenses={mockExpenses}
          totalBudget={10000}
          currency="HKD"
          showLegend={false}
        />
      );

      const responsiveContainer = container.querySelector('.recharts-responsive-container');
      expect(responsiveContainer).toBeInTheDocument();
    });

    it('renders with custom height', () => {
      const { container } = render(
        <SpendingOverTimeChart
          expenses={mockExpenses}
          totalBudget={10000}
          currency="HKD"
          height={400}
        />
      );

      const responsiveContainer = container.querySelector('.recharts-responsive-container');
      expect(responsiveContainer).toBeInTheDocument();
    });

    it('handles trip date range props', () => {
      const { container } = render(
        <SpendingOverTimeChart
          expenses={mockExpenses}
          totalBudget={10000}
          currency="HKD"
          tripStartDate="2024-03-01T00:00:00.000Z"
          tripEndDate="2024-03-31T00:00:00.000Z"
        />
      );

      const responsiveContainer = container.querySelector('.recharts-responsive-container');
      expect(responsiveContainer).toBeInTheDocument();
    });
  });

  describe('CategoryProgressBars', () => {
    const mockSummaries = [
      {
        category: 'food' as const,
        allocated: 3000,
        spent: 2500,
        remaining: 500,
        percentageSpent: 83.33,
        expenseCount: 5,
        status: 'warning' as const,
      },
      {
        category: 'transport' as const,
        allocated: 2000,
        spent: 1000,
        remaining: 1000,
        percentageSpent: 50,
        expenseCount: 3,
        status: 'safe' as const,
      },
      {
        category: 'accommodation' as const,
        allocated: 2500,
        spent: 2600,
        remaining: -100,
        percentageSpent: 104,
        expenseCount: 2,
        status: 'over' as const,
      },
    ];

    it('renders progress bars for all categories', () => {
      render(
        <CategoryProgressBars
          categorySummaries={mockSummaries}
          currency="HKD"
        />
      );

      expect(screen.getByText('Food')).toBeInTheDocument();
      expect(screen.getByText('Transport')).toBeInTheDocument();
      expect(screen.getByText('Accommodation')).toBeInTheDocument();
    });

    it('displays category emojis', () => {
      render(
        <CategoryProgressBars
          categorySummaries={mockSummaries}
          currency="HKD"
        />
      );

      expect(screen.getByText('🍜')).toBeInTheDocument();
      expect(screen.getByText('🚇')).toBeInTheDocument();
      expect(screen.getByText('🏨')).toBeInTheDocument();
    });

    it('shows expense count for each category', () => {
      render(
        <CategoryProgressBars
          categorySummaries={mockSummaries}
          currency="HKD"
        />
      );

      expect(screen.getByText('5 expenses')).toBeInTheDocument();
      expect(screen.getByText('3 expenses')).toBeInTheDocument();
      expect(screen.getByText('2 expenses')).toBeInTheDocument();
    });

    it('displays percentage spent', () => {
      render(
        <CategoryProgressBars
          categorySummaries={mockSummaries}
          currency="HKD"
        />
      );

      expect(screen.getByText('83%')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('104%')).toBeInTheDocument();
    });

    it('shows over budget warning for exceeded categories', () => {
      render(
        <CategoryProgressBars
          categorySummaries={mockSummaries}
          currency="HKD"
        />
      );

      expect(screen.getByText('⚠️ Over')).toBeInTheDocument();
      expect(screen.getByText(/Over by HKD 100/)).toBeInTheDocument();
    });

    it('shows remaining amount for under-budget categories', () => {
      render(
        <CategoryProgressBars
          categorySummaries={mockSummaries}
          currency="HKD"
        />
      );

      expect(screen.getByText(/HKD 500 remaining/)).toBeInTheDocument();
      expect(screen.getByText(/HKD 1,000 remaining/)).toBeInTheDocument();
    });

    it('displays empty state when no allocations', () => {
      render(
        <CategoryProgressBars
          categorySummaries={[]}
          currency="HKD"
        />
      );

      expect(screen.getByText('No category allocations')).toBeInTheDocument();
      expect(screen.getByText('Set up your budget to see progress')).toBeInTheDocument();
    });

    it('filters out categories with zero allocation', () => {
      const summariesWithZero = [
        ...mockSummaries,
        {
          category: 'misc' as const,
          allocated: 0,
          spent: 0,
          remaining: 0,
          percentageSpent: 0,
          expenseCount: 0,
          status: 'safe' as const,
        },
      ];

      render(
        <CategoryProgressBars
          categorySummaries={summariesWithZero}
          currency="HKD"
        />
      );

      // Should only show 3 categories, not 4
      const categoryCards = screen.getAllByText(/expenses?/);
      expect(categoryCards).toHaveLength(3);
    });

    it('displays spent and budget amounts', () => {
      render(
        <CategoryProgressBars
          categorySummaries={mockSummaries}
          currency="HKD"
        />
      );

      expect(screen.getAllByText(/Spent:/)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Budget:/)[0]).toBeInTheDocument();
      // Check that amounts are displayed (multiple instances expected)
      expect(screen.getAllByText(/HKD 2,500/).length).toBeGreaterThan(0);
      expect(screen.getByText(/HKD 3,000/)).toBeInTheDocument();
    });
  });
