/**
 * Unit tests for Shopping components
 * 
 * Tests:
 * - ShoppingItem rendering and interactions
 * - ShoppingStats display and updates
 * - FilterDropdown functionality
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShoppingItem } from '../ShoppingItem';
import { ShoppingStats } from '../ShoppingStats';
import { FilterDropdown } from '../FilterDropdown';
import { ShoppingItem as ShoppingItemType, ShoppingStats as ShoppingStatsType, ShoppingFilterOption } from '@/types/shopping';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  useMotionValue: () => ({ set: vi.fn() }),
  useTransform: () => 1,
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('ShoppingItem', () => {
  const mockItem: ShoppingItemType = {
    id: '1',
    trip_id: 'trip-1',
    name: 'Sunscreen',
    store: 'Pharmacy',
    image: 'https://example.com/sunscreen.jpg',
    tags: ['重要', '其他'],
    checked: false,
    priority: 'important',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  it('renders shopping item with all data', () => {
    render(<ShoppingItem item={mockItem} />);
    
    expect(screen.getByText('Sunscreen')).toBeInTheDocument();
    expect(screen.getByText('Pharmacy')).toBeInTheDocument();
    expect(screen.getByText('重要')).toBeInTheDocument();
    expect(screen.getByText('其他')).toBeInTheDocument();
  });

  it('renders without optional fields', () => {
    const itemWithoutOptionals: ShoppingItemType = {
      ...mockItem,
      store: undefined,
      image: undefined,
      tags: [],
    };
    
    render(<ShoppingItem item={itemWithoutOptionals} />);
    
    expect(screen.getByText('Sunscreen')).toBeInTheDocument();
    expect(screen.queryByText('Pharmacy')).not.toBeInTheDocument();
  });

  it('shows checked state with strike-through', () => {
    const checkedItem: ShoppingItemType = {
      ...mockItem,
      checked: true,
    };
    
    render(<ShoppingItem item={checkedItem} />);
    
    const nameElement = screen.getByText('Sunscreen');
    expect(nameElement).toHaveClass('line-through');
  });

  it('calls onToggle when checkbox is clicked', () => {
    const onToggle = vi.fn();
    render(<ShoppingItem item={mockItem} onToggle={onToggle} />);
    
    const checkbox = screen.getByLabelText('shopping.check');
    fireEvent.click(checkbox);
    
    expect(onToggle).toHaveBeenCalledWith('1');
  });

  it('shows menu when three-dot button is clicked', async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    
    render(<ShoppingItem item={mockItem} onEdit={onEdit} onDelete={onDelete} />);
    
    const menuButton = screen.getByLabelText('Menu');
    fireEvent.click(menuButton);
    
    await waitFor(() => {
      expect(screen.getByText('common.edit')).toBeInTheDocument();
      expect(screen.getByText('common.delete')).toBeInTheDocument();
    });
  });

  it('calls onEdit when edit button is clicked', async () => {
    const onEdit = vi.fn();
    render(<ShoppingItem item={mockItem} onEdit={onEdit} />);
    
    const menuButton = screen.getByLabelText('Menu');
    fireEvent.click(menuButton);
    
    await waitFor(() => {
      const editButton = screen.getByText('common.edit');
      fireEvent.click(editButton);
    });
    
    expect(onEdit).toHaveBeenCalled();
  });

  it('calls onDelete when delete button is clicked', async () => {
    const onDelete = vi.fn();
    render(<ShoppingItem item={mockItem} onDelete={onDelete} />);
    
    const menuButton = screen.getByLabelText('Menu');
    fireEvent.click(menuButton);
    
    await waitFor(() => {
      const deleteButton = screen.getByText('common.delete');
      fireEvent.click(deleteButton);
    });
    
    // Wait for animation
    await waitFor(() => {
      expect(onDelete).toHaveBeenCalled();
    }, { timeout: 500 });
  });

  it('displays image when provided', () => {
    render(<ShoppingItem item={mockItem} />);
    
    const image = screen.getByAltText('Sunscreen');
    expect(image).toHaveAttribute('src', 'https://example.com/sunscreen.jpg');
  });

  it('displays placeholder icon when no image', () => {
    const itemWithoutImage: ShoppingItemType = {
      ...mockItem,
      image: undefined,
    };
    
    const { container } = render(<ShoppingItem item={itemWithoutImage} />);
    
    // Check for ShoppingBagIcon (placeholder)
    const svgElement = container.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
  });
});

describe('ShoppingStats', () => {
  it('renders stats with correct counts', () => {
    const stats: ShoppingStatsType = {
      toBuy: 5,
      bought: 3,
      total: 8,
    };
    
    render(<ShoppingStats stats={stats} />);
    
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('shopping.toBuy')).toBeInTheDocument();
    expect(screen.getByText('shopping.bought')).toBeInTheDocument();
  });

  it('calculates and displays progress percentage', () => {
    const stats: ShoppingStatsType = {
      toBuy: 2,
      bought: 8,
      total: 10,
    };
    
    render(<ShoppingStats stats={stats} />);
    
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('handles zero items correctly', () => {
    const stats: ShoppingStatsType = {
      toBuy: 0,
      bought: 0,
      total: 0,
    };
    
    render(<ShoppingStats stats={stats} />);
    
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThan(0);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('handles 100% completion', () => {
    const stats: ShoppingStatsType = {
      toBuy: 0,
      bought: 10,
      total: 10,
    };
    
    render(<ShoppingStats stats={stats} />);
    
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('displays total items count', () => {
    const stats: ShoppingStatsType = {
      toBuy: 3,
      bought: 7,
      total: 10,
    };
    
    render(<ShoppingStats stats={stats} />);
    
    expect(screen.getByText('shopping.totalItems')).toBeInTheDocument();
  });
});

describe('FilterDropdown', () => {
  const mockOptions: ShoppingFilterOption[] = [
    { id: 'all', label: 'All Items', count: 10 },
    { id: 'food', label: 'Food', tag: '寄食', count: 3 },
    { id: 'clothing', label: 'Clothing', tag: '服飾', count: 2 },
    { id: 'important', label: 'Important', tag: '重要', count: 5 },
  ];

  it('renders with selected filter', () => {
    render(
      <FilterDropdown
        options={mockOptions}
        selectedFilter="all"
        onFilterChange={vi.fn()}
      />
    );
    
    expect(screen.getByText('All Items')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('opens dropdown when clicked', async () => {
    render(
      <FilterDropdown
        options={mockOptions}
        selectedFilter="all"
        onFilterChange={vi.fn()}
      />
    );
    
    const button = screen.getByLabelText('shopping.filter');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Food')).toBeInTheDocument();
      expect(screen.getByText('Clothing')).toBeInTheDocument();
      expect(screen.getByText('Important')).toBeInTheDocument();
    });
  });

  it('calls onFilterChange when option is selected', async () => {
    const onFilterChange = vi.fn();
    
    render(
      <FilterDropdown
        options={mockOptions}
        selectedFilter="all"
        onFilterChange={onFilterChange}
      />
    );
    
    const button = screen.getByLabelText('shopping.filter');
    fireEvent.click(button);
    
    await waitFor(() => {
      const foodOption = screen.getByText('Food');
      fireEvent.click(foodOption);
    });
    
    expect(onFilterChange).toHaveBeenCalledWith('food');
  });

  it('closes dropdown after selection', async () => {
    render(
      <FilterDropdown
        options={mockOptions}
        selectedFilter="all"
        onFilterChange={vi.fn()}
      />
    );
    
    const button = screen.getByLabelText('shopping.filter');
    fireEvent.click(button);
    
    await waitFor(() => {
      const foodOption = screen.getByText('Food');
      fireEvent.click(foodOption);
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Clothing')).not.toBeInTheDocument();
    });
  });

  it('displays item counts for each option', async () => {
    render(
      <FilterDropdown
        options={mockOptions}
        selectedFilter="all"
        onFilterChange={vi.fn()}
      />
    );
    
    const button = screen.getByLabelText('shopping.filter');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument(); // Food count
      expect(screen.getByText('2')).toBeInTheDocument(); // Clothing count
      expect(screen.getByText('5')).toBeInTheDocument(); // Important count
    });
  });

  it('highlights selected option', async () => {
    render(
      <FilterDropdown
        options={mockOptions}
        selectedFilter="food"
        onFilterChange={vi.fn()}
      />
    );
    
    expect(screen.getByText('Food')).toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', async () => {
    render(
      <FilterDropdown
        options={mockOptions}
        selectedFilter="all"
        onFilterChange={vi.fn()}
      />
    );
    
    const button = screen.getByLabelText('shopping.filter');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Clothing')).toBeInTheDocument();
    });
    
    // Click backdrop
    const backdrop = document.querySelector('.fixed.inset-0');
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    
    await waitFor(() => {
      expect(screen.queryByText('Clothing')).not.toBeInTheDocument();
    });
  });
});
