import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  TripTitle,
  StatCard,
  BurnRateIndicator,
  FilterTab,
  FloatingAddButton,
  ExpenseAmount,
  ExpenseCategory,
  SplitInfo,
} from '../index';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/trips/123/budget' }),
}));

// Mock useFABPosition hook
vi.mock('../../../../hooks/useFABPosition', () => ({
  useFABPosition: () => ({ bottom: '72px', right: '1rem', zIndex: 50 }),
  getFABStyle: (position: any) => ({
    position: 'fixed',
    bottom: position.bottom,
    right: position.right,
    zIndex: position.zIndex,
  }),
}));

describe('Budget Atomic Components', () => {
  describe('TripTitle', () => {
    it('renders trip title correctly', () => {
      render(<TripTitle title="Tokyo Adventure" />);
      expect(screen.getByText('Tokyo Adventure')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<TripTitle title="Test" className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('StatCard', () => {
    it('renders label and value', () => {
      render(<StatCard label="Total Budget" value="$1000" />);
      expect(screen.getByText('Total Budget')).toBeInTheDocument();
      expect(screen.getByText('$1000')).toBeInTheDocument();
    });

    it('renders subValue when provided', () => {
      render(<StatCard label="Spent" value="$500" subValue="50% of budget" />);
      expect(screen.getByText('50% of budget')).toBeInTheDocument();
    });

    it('applies variant styles correctly', () => {
      const { container } = render(<StatCard label="Test" value="100" variant="danger" />);
      expect(container.firstChild).toHaveClass('bg-red-50');
    });
  });

  describe('BurnRateIndicator', () => {
    it('renders burn rate information', () => {
      render(<BurnRateIndicator burnRate={50} plannedRate={40} currency="$" />);
      expect(screen.getByText('Burn Rate')).toBeInTheDocument();
      expect(screen.getByText('$50.00/day')).toBeInTheDocument();
    });

    it('shows planned rate', () => {
      render(<BurnRateIndicator burnRate={50} plannedRate={40} currency="$" />);
      expect(screen.getByText(/Planned: \$40\.00\/day/)).toBeInTheDocument();
    });

    it('displays warning status when over budget', () => {
      const { container } = render(
        <BurnRateIndicator burnRate={45} plannedRate={40} currency="$" />
      );
      expect(container.querySelector('.bg-yellow-100')).toBeInTheDocument();
    });

    it('displays danger status when significantly over budget', () => {
      const { container } = render(
        <BurnRateIndicator burnRate={100} plannedRate={40} currency="$" />
      );
      expect(container.querySelector('.bg-red-100')).toBeInTheDocument();
    });
  });

  describe('FilterTab', () => {
    it('renders filter tab with label', () => {
      const onClick = vi.fn();
      render(<FilterTab label="All" value="all" isActive={false} onClick={onClick} />);
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    it('shows count badge when provided', () => {
      const onClick = vi.fn();
      render(<FilterTab label="Pending" value="pending" isActive={false} count={5} onClick={onClick} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('applies active styles when isActive is true', () => {
      const onClick = vi.fn();
      const { container } = render(
        <FilterTab label="Active" value="all" isActive={true} onClick={onClick} />
      );
      expect(container.querySelector('.bg-pink-500')).toBeInTheDocument();
    });

    it('calls onClick with correct value', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<FilterTab label="Test" value="all" isActive={false} onClick={onClick} />);
      
      await user.click(screen.getByText('Test'));
      expect(onClick).toHaveBeenCalledWith('all');
    });
  });

  describe('FloatingAddButton', () => {
    it('renders floating action button', () => {
      const onClick = vi.fn();
      render(<FloatingAddButton onClick={onClick} />);
      expect(screen.getByLabelText('Add Expense')).toBeInTheDocument();
    });

    it('calls onClick when clicked', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<FloatingAddButton onClick={onClick} />);
      
      await user.click(screen.getByLabelText('Add Expense'));
      expect(onClick).toHaveBeenCalled();
    });

    it('uses custom label when provided', () => {
      const onClick = vi.fn();
      render(<FloatingAddButton onClick={onClick} label="Custom Label" />);
      expect(screen.getByLabelText('Custom Label')).toBeInTheDocument();
    });
  });

  describe('ExpenseAmount', () => {
    it('renders amount with currency', () => {
      render(<ExpenseAmount amount={100.50} currency="USD" />);
      expect(screen.getByText('$100.50')).toBeInTheDocument();
    });

    it('shows dual currency when provided', () => {
      render(
        <ExpenseAmount
          amount={1000}
          currency="JPY"
          homeCurrency="USD"
          homeAmount={7.50}
          showBothCurrencies={true}
        />
      );
      expect(screen.getByText('¥1000.00')).toBeInTheDocument();
      expect(screen.getByText('≈ $7.50')).toBeInTheDocument();
    });

    it('does not show dual currency when currencies are the same', () => {
      render(
        <ExpenseAmount
          amount={100}
          currency="USD"
          homeCurrency="USD"
          homeAmount={100}
          showBothCurrencies={true}
        />
      );
      expect(screen.queryByText(/≈/)).not.toBeInTheDocument();
    });
  });

  describe('ExpenseCategory', () => {
    it('renders category with icon and label', () => {
      render(<ExpenseCategory category="food" />);
      expect(screen.getByText('Food')).toBeInTheDocument();
      expect(screen.getByText('🍽️')).toBeInTheDocument();
    });

    it('renders without label when showLabel is false', () => {
      render(<ExpenseCategory category="transport" showLabel={false} />);
      expect(screen.queryByText('Transport')).not.toBeInTheDocument();
      expect(screen.getByText('🚗')).toBeInTheDocument();
    });

    it('applies correct color for each category', () => {
      const { container } = render(<ExpenseCategory category="flights" />);
      expect(container.querySelector('.bg-blue-100')).toBeInTheDocument();
    });
  });

  describe('SplitInfo', () => {
    it('renders nothing when no split info provided', () => {
      const { container } = render(<SplitInfo />);
      expect(container.firstChild).toBeNull();
    });

    it('renders split information', () => {
      render(
        <SplitInfo
          splitType="equal"
          splitWith={['user1', 'user2']}
          paidBy="user1"
          memberNames={{ user1: 'Alice', user2: 'Bob' }}
        />
      );
      expect(screen.getByText(/Split equally with 2 people/)).toBeInTheDocument();
      expect(screen.getByText(/Paid by/)).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('shows settled badge when isSettled is true', () => {
      render(
        <SplitInfo
          splitType="equal"
          splitWith={['user1']}
          isSettled={true}
        />
      );
      expect(screen.getByText('Settled')).toBeInTheDocument();
    });

    it('shows pending badge when not settled', () => {
      render(
        <SplitInfo
          splitType="equal"
          splitWith={['user1']}
          isSettled={false}
        />
      );
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('handles custom split type', () => {
      render(
        <SplitInfo
          splitType="custom"
          splitWith={['user1', 'user2', 'user3']}
        />
      );
      expect(screen.getByText(/Split custom with 3 people/)).toBeInTheDocument();
    });
  });
});
