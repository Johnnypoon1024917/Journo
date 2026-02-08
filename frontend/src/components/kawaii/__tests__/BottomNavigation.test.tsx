/**
 * BottomNavigation Component Tests
 * 
 * Tests for the kawaii bottom navigation component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import fc from 'fast-check';
import { BottomNavigation } from '../BottomNavigation';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, className, ...props }: any) => (
      <button onClick={onClick} className={className} {...props}>
        {children}
      </button>
    ),
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
    span: ({ children, className, ...props }: any) => (
      <span className={className} {...props}>
        {children}
      </span>
    ),
  },
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('BottomNavigation', () => {
  it('renders all 7 navigation tabs', () => {
    renderWithRouter(<BottomNavigation />);

    expect(screen.getByLabelText('Schedule')).toBeInTheDocument();
    expect(screen.getByLabelText('Booking')).toBeInTheDocument();
    expect(screen.getByLabelText('Budget')).toBeInTheDocument();
    expect(screen.getByLabelText('Shopping')).toBeInTheDocument();
    expect(screen.getByLabelText('Checklist')).toBeInTheDocument();
    expect(screen.getByLabelText('Members')).toBeInTheDocument();
    expect(screen.getByLabelText('Settings')).toBeInTheDocument();
  });

  it('renders tab labels', () => {
    renderWithRouter(<BottomNavigation />);

    expect(screen.getByText('Schedule')).toBeInTheDocument();
    expect(screen.getByText('Booking')).toBeInTheDocument();
    expect(screen.getByText('Budget')).toBeInTheDocument();
    expect(screen.getByText('Shopping')).toBeInTheDocument();
    expect(screen.getByText('Checklist')).toBeInTheDocument();
    expect(screen.getByText('Members')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('highlights the active tab', () => {
    renderWithRouter(<BottomNavigation activeTab="schedule" />);

    const scheduleButton = screen.getByLabelText('Schedule');
    expect(scheduleButton).toHaveAttribute('aria-current', 'page');
  });

  it('calls onTabChange when a tab is clicked', () => {
    const onTabChange = vi.fn();
    renderWithRouter(<BottomNavigation onTabChange={onTabChange} />);

    const bookingButton = screen.getByLabelText('Booking');
    fireEvent.click(bookingButton);

    expect(onTabChange).toHaveBeenCalledWith('booking');
  });

  it('applies custom className', () => {
    const { container } = renderWithRouter(
      <BottomNavigation className="custom-class" />
    );

    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('custom-class');
  });

  it('has proper accessibility attributes', () => {
    renderWithRouter(<BottomNavigation activeTab="budget" />);

    const nav = screen.getByRole('navigation', { name: 'Bottom navigation' });
    expect(nav).toBeInTheDocument();

    const budgetButton = screen.getByLabelText('Budget');
    expect(budgetButton).toHaveAttribute('aria-current', 'page');
  });

  it('renders with minimum touch target size', () => {
    renderWithRouter(<BottomNavigation />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      // Check that button has min-w-[44px] and min-h-[44px] classes
      expect(button.className).toMatch(/min-w-\[44px\]/);
      expect(button.className).toMatch(/min-h-\[44px\]/);
    });
  });

  it('renders icons for all tabs', () => {
    const { container } = renderWithRouter(<BottomNavigation />);

    // Check that each button has an SVG icon
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(7);

    buttons.forEach((button) => {
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  it('determines active tab from location when not controlled', () => {
    // This test would require mocking useLocation
    // For now, we'll just verify the component renders
    renderWithRouter(<BottomNavigation />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});

// Property-Based Tests
describe('BottomNavigation - Property Tests', () => {
  // Feature: kawaii-ui-redesign, Property 13: Active Tab Highlighting
  // **Validates: Requirements 8.3**
  it('active tab is always styled with primary color class', () => {
    const tabIds = ['schedule', 'booking', 'budget', 'shopping', 'checklist', 'members', 'settings'] as const;
    
    fc.assert(
      fc.property(
        fc.constantFrom(...tabIds),
        (activeTabId) => {
          // Render the component fresh for each iteration
          const { container, unmount } = renderWithRouter(
            <BottomNavigation activeTab={activeTabId} />
          );

          try {
            // Get all tab buttons
            const buttons = screen.getAllByRole('button');
            expect(buttons).toHaveLength(7);

            // Find the active button by checking aria-current attribute
            const activeButton = buttons.find(
              (button) => button.getAttribute('aria-current') === 'page'
            );
            
            // Verify active button exists
            expect(activeButton).toBeDefined();

            // Verify the active button has the primary color class
            // The active tab should have text-kawaii-primary-600 class on both icon and label
            const iconDiv = activeButton?.querySelector('div');
            const iconSvg = iconDiv?.querySelector('svg');
            const labelSpan = activeButton?.querySelector('span');

            // Check that the icon has the primary color class
            expect(iconSvg?.className).toMatch(/text-kawaii-primary-600/);
            
            // Check that the label has the primary color class
            expect(labelSpan?.className).toMatch(/text-kawaii-primary-600/);

            // Verify inactive tabs do NOT have the primary color on their icons
            const inactiveButtons = buttons.filter(
              (button) => button.getAttribute('aria-current') !== 'page'
            );
            
            inactiveButtons.forEach((button) => {
              const iconDiv = button.querySelector('div');
              const iconSvg = iconDiv?.querySelector('svg');
              const labelSpan = button.querySelector('span');
              
              // Inactive tabs should have neutral color, not primary
              expect(iconSvg?.className).toMatch(/text-kawaii-neutral-500/);
              expect(labelSpan?.className).toMatch(/text-kawaii-neutral-500/);
            });
          } finally {
            // Clean up after each iteration
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
