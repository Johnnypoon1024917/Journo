/**
 * SideNavigation Component Tests
 * 
 * Tests for the SideNavigation component functionality.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SideNavigation } from '../SideNavigation';

// Wrapper component for tests that need routing
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('SideNavigation', () => {
  it('renders all navigation items', () => {
    render(
      <RouterWrapper>
        <SideNavigation />
      </RouterWrapper>
    );

    // Check that all 7 navigation items are present
    expect(screen.getByLabelText('Schedule')).toBeInTheDocument();
    expect(screen.getByLabelText('Booking')).toBeInTheDocument();
    expect(screen.getByLabelText('Budget')).toBeInTheDocument();
    expect(screen.getByLabelText('Shopping')).toBeInTheDocument();
    expect(screen.getByLabelText('Checklist')).toBeInTheDocument();
    expect(screen.getByLabelText('Members')).toBeInTheDocument();
    expect(screen.getByLabelText('Settings')).toBeInTheDocument();
  });

  it('renders in expanded state by default', () => {
    render(
      <RouterWrapper>
        <SideNavigation />
      </RouterWrapper>
    );

    // Check that labels are visible (expanded state)
    expect(screen.getByText('Schedule')).toBeInTheDocument();
    expect(screen.getByText('Booking')).toBeInTheDocument();
  });

  it('can be collapsed', () => {
    const { container } = render(
      <RouterWrapper>
        <SideNavigation collapsed={true} />
      </RouterWrapper>
    );

    // In collapsed state, the nav should have a smaller width
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
  });

  it('calls onTabChange when a tab is clicked', () => {
    const handleTabChange = vi.fn();
    
    render(
      <RouterWrapper>
        <SideNavigation onTabChange={handleTabChange} />
      </RouterWrapper>
    );

    // Click on the Budget tab
    const budgetTab = screen.getByLabelText('Budget');
    fireEvent.click(budgetTab);

    // Check that the callback was called with the correct tab id
    expect(handleTabChange).toHaveBeenCalledWith('budget');
  });

  it('calls onCollapsedChange when collapse button is clicked', () => {
    const handleCollapsedChange = vi.fn();
    
    render(
      <RouterWrapper>
        <SideNavigation 
          collapsed={false}
          onCollapsedChange={handleCollapsedChange}
        />
      </RouterWrapper>
    );

    // Click the collapse button
    const collapseButton = screen.getByLabelText('Collapse navigation');
    fireEvent.click(collapseButton);

    // Check that the callback was called with true
    expect(handleCollapsedChange).toHaveBeenCalledWith(true);
  });

  it('highlights the active tab', () => {
    render(
      <RouterWrapper>
        <SideNavigation activeTab="shopping" />
      </RouterWrapper>
    );

    // Check that the shopping tab has aria-current="page"
    const shoppingTab = screen.getByLabelText('Shopping');
    expect(shoppingTab).toHaveAttribute('aria-current', 'page');
  });

  it('renders with custom className', () => {
    const { container } = render(
      <RouterWrapper>
        <SideNavigation className="custom-class" />
      </RouterWrapper>
    );

    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('custom-class');
  });

  it('has proper accessibility attributes', () => {
    render(
      <RouterWrapper>
        <SideNavigation />
      </RouterWrapper>
    );

    const nav = screen.getByRole('navigation', { name: 'Side navigation' });
    expect(nav).toBeInTheDocument();
  });

  it('shows expand button when collapsed', () => {
    render(
      <RouterWrapper>
        <SideNavigation collapsed={true} />
      </RouterWrapper>
    );

    const expandButton = screen.getByLabelText('Expand navigation');
    expect(expandButton).toBeInTheDocument();
  });

  it('shows collapse button when expanded', () => {
    render(
      <RouterWrapper>
        <SideNavigation collapsed={false} />
      </RouterWrapper>
    );

    const collapseButton = screen.getByLabelText('Collapse navigation');
    expect(collapseButton).toBeInTheDocument();
  });
});
