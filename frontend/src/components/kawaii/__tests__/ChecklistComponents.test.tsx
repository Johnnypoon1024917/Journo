/**
 * Tests for Checklist Components
 * 
 * Tests the ChecklistItem and ChecklistProgress components.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChecklistItem } from '../ChecklistItem';
import { ChecklistProgress } from '../ChecklistProgress';
import { PackingItem, PackingListProgress } from '@/types/packing';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: (namespace?: string) => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'checklist.check': 'Mark as complete',
        'checklist.uncheck': 'Mark as incomplete',
        'common.actions.edit': 'Edit',
        'common.actions.delete': 'Delete',
        'actions.edit': 'Edit',
        'actions.delete': 'Delete',
        'checklist.categories.essentials': 'Essentials',
        'checklist.categories.clothing': 'Clothing',
        'checklist.categories.documents': 'Documents',
        'checklist.totalItems': 'Total Items',
        'checklist.completed': 'Completed',
        'checklist.progress': 'Progress',
        'checklist.allComplete': 'All items completed!',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('ChecklistItem', () => {
  const mockItem: PackingItem = {
    id: '1',
    trip_id: 'trip-1',
    item: 'Passport',
    category: 'documents',
    is_checked: false,
    added_by: 'user-1',
    is_custom: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  it('renders checklist item with title and category', () => {
    render(<ChecklistItem item={mockItem} />);
    
    expect(screen.getByText('Passport')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
  });

  it('shows unchecked state for incomplete items', () => {
    render(<ChecklistItem item={mockItem} />);
    
    const checkbox = screen.getByLabelText('Mark as complete');
    expect(checkbox).toBeInTheDocument();
  });

  it('shows checked state for completed items', () => {
    const checkedItem = { ...mockItem, is_checked: true };
    render(<ChecklistItem item={checkedItem} />);
    
    const checkbox = screen.getByLabelText('Mark as incomplete');
    expect(checkbox).toBeInTheDocument();
  });

  it('applies strike-through to completed items', () => {
    const checkedItem = { ...mockItem, is_checked: true };
    const { container } = render(<ChecklistItem item={checkedItem} />);
    
    const titleElement = screen.getByText('Passport');
    expect(titleElement).toHaveClass('line-through');
  });

  it('calls onToggle when checkbox is clicked', () => {
    const onToggle = vi.fn();
    render(<ChecklistItem item={mockItem} onToggle={onToggle} />);
    
    const checkbox = screen.getByLabelText('Mark as complete');
    fireEvent.click(checkbox);
    
    expect(onToggle).toHaveBeenCalledWith('1');
  });

  it('shows menu when three-dot button is clicked', () => {
    render(<ChecklistItem item={mockItem} onEdit={vi.fn()} onDelete={vi.fn()} />);
    
    const menuButton = screen.getByLabelText('Menu');
    fireEvent.click(menuButton);
    
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(<ChecklistItem item={mockItem} onEdit={onEdit} onDelete={vi.fn()} />);
    
    const menuButton = screen.getByLabelText('Menu');
    fireEvent.click(menuButton);
    
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);
    
    expect(onEdit).toHaveBeenCalled();
  });

  it('renders without category badge when category is null', () => {
    const itemWithoutCategory = { ...mockItem, category: null };
    render(<ChecklistItem item={itemWithoutCategory} />);
    
    expect(screen.getByText('Passport')).toBeInTheDocument();
    expect(screen.queryByText('Documents')).not.toBeInTheDocument();
  });
});

describe('ChecklistProgress', () => {
  it('renders progress with correct counts', () => {
    const progress: PackingListProgress = {
      total_items: 10,
      checked_items: 3,
      percentage: 30,
      by_category: {},
    };

    render(<ChecklistProgress progress={progress} />);
    
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  it('shows 0% progress when no items', () => {
    const progress: PackingListProgress = {
      total_items: 0,
      checked_items: 0,
      percentage: 0,
      by_category: {},
    };

    render(<ChecklistProgress progress={progress} />);
    
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('shows 100% progress when all items completed', () => {
    const progress: PackingListProgress = {
      total_items: 5,
      checked_items: 5,
      percentage: 100,
      by_category: {},
    };

    render(<ChecklistProgress progress={progress} />);
    
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('shows completion message when all items are completed', () => {
    const progress: PackingListProgress = {
      total_items: 5,
      checked_items: 5,
      percentage: 100,
      by_category: {},
    };

    render(<ChecklistProgress progress={progress} />);
    
    expect(screen.getByText(/All items completed!/)).toBeInTheDocument();
  });

  it('does not show completion message when items are incomplete', () => {
    const progress: PackingListProgress = {
      total_items: 5,
      checked_items: 3,
      percentage: 60,
      by_category: {},
    };

    render(<ChecklistProgress progress={progress} />);
    
    expect(screen.queryByText(/All items completed!/)).not.toBeInTheDocument();
  });

  it('handles partial progress correctly', () => {
    const progress: PackingListProgress = {
      total_items: 8,
      checked_items: 5,
      percentage: 62.5,
      by_category: {},
    };

    render(<ChecklistProgress progress={progress} />);
    
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('63%')).toBeInTheDocument(); // Rounded
  });
});
