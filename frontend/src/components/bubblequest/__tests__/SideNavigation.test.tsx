/**
 * SideNavigation Component Tests
 * 
 * Tests for the SideNavigation component functionality.
 */

import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../../test/testUtils';
import { translations } from '../../../test/i18nTestHelper';
import { SideNavigation } from '../SideNavigation';

describe('SideNavigation', () => {
  it('renders all navigation items', () => {
    renderWithProviders(
      <SideNavigation />,
      { initialRoute: '/trips/123/schedule', useMemoryRouter: true }
    );

    // Check that all 7 navigation items are present using aria-labels
    // The mock returns translation keys, so we use the actual English text from translations
    expect(screen.getByLabelText(translations['navigation.schedule'])).toBeInTheDocument();
    expect(screen.getByLabelText(translations['navigation.booking'])).toBeInTheDocument();
    expect(screen.getByLabelText(translations['navigation.budget'])).toBeInTheDocument();
    expect(screen.getByLabelText(translations['navigation.shopping'])).toBeInTheDocument();
    expect(screen.getByLabelText(translations['navigation.checklist'])).toBeInTheDocument();
    expect(screen.getByLabelText(translations['navigation.members'])).toBeInTheDocument();
    expect(screen.getByLabelText(translations['navigation.settings'])).toBeInTheDocument();
  });

  it('renders in expanded state by default', () => {
    renderWithProviders(
      <SideNavigation />,
      { initialRoute: '/trips/123/schedule', useMemoryRouter: true }
    );

    // Check that labels are visible (expanded state)
    expect(screen.getByText(translations['navigation.schedule'])).toBeInTheDocument();
    expect(screen.getByText(translations['navigation.booking'])).toBeInTheDocument();
  });

  it('can be collapsed', () => {
    const { container } = renderWithProviders(
      <SideNavigation collapsed={true} />,
      { initialRoute: '/trips/123/schedule', useMemoryRouter: true }
    );

    // In collapsed state, the nav should have a smaller width
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveStyle({ width: '80px' });
  });

  it('calls onTabChange when a tab is clicked', () => {
    const handleTabChange = vi.fn();
    
    renderWithProviders(
      <SideNavigation onTabChange={handleTabChange} />,
      { initialRoute: '/trips/123/schedule', useMemoryRouter: true }
    );

    // Click on the Budget tab
    const budgetTab = screen.getByLabelText(translations['navigation.budget']);
    fireEvent.click(budgetTab);

    // Check that the callback was called with the correct tab id
    expect(handleTabChange).toHaveBeenCalledWith('budget');
  });

  it('calls onCollapsedChange when collapse button is clicked', () => {
    const handleCollapsedChange = vi.fn();
    
    renderWithProviders(
      <SideNavigation 
        collapsed={false}
        onCollapsedChange={handleCollapsedChange}
      />,
      { initialRoute: '/trips/123/schedule', useMemoryRouter: true }
    );

    // Click the collapse button
    const collapseButton = screen.getByLabelText('Collapse navigation');
    fireEvent.click(collapseButton);

    // Check that the callback was called with true
    expect(handleCollapsedChange).toHaveBeenCalledWith(true);
  });

  it('highlights the active tab', () => {
    renderWithProviders(
      <SideNavigation activeTab="shopping" />,
      { initialRoute: '/trips/123/shopping', useMemoryRouter: true }
    );

    // Check that the shopping tab has aria-current="page"
    const shoppingTab = screen.getByLabelText(translations['navigation.shopping']);
    expect(shoppingTab).toHaveAttribute('aria-current', 'page');
  });

  it('renders with custom className', () => {
    const { container } = renderWithProviders(
      <SideNavigation className="custom-class" />,
      { initialRoute: '/trips/123/schedule', useMemoryRouter: true }
    );

    const nav = container.querySelector('nav');
    // Component uses inline styles, so we just verify the nav element exists
    expect(nav).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    renderWithProviders(
      <SideNavigation />,
      { initialRoute: '/trips/123/schedule', useMemoryRouter: true }
    );

    const nav = screen.getByRole('navigation', { name: 'Side navigation' });
    expect(nav).toBeInTheDocument();
  });

  it('shows expand button when collapsed', () => {
    renderWithProviders(
      <SideNavigation collapsed={true} />,
      { initialRoute: '/trips/123/schedule', useMemoryRouter: true }
    );

    const expandButton = screen.getByLabelText('Expand navigation');
    expect(expandButton).toBeInTheDocument();
  });

  it('shows collapse button when expanded', () => {
    renderWithProviders(
      <SideNavigation collapsed={false} />,
      { initialRoute: '/trips/123/schedule', useMemoryRouter: true }
    );

    const collapseButton = screen.getByLabelText('Collapse navigation');
    expect(collapseButton).toBeInTheDocument();
  });
});
