/**
 * Header Component Tests
 * 
 * Tests for the modernized navigation header with sticky scroll behavior
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from '../Header';

// Mock the child components
vi.mock('../../bubblequest/Button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('../../notifications/NotificationBell', () => ({
  NotificationBell: () => <div data-testid="notification-bell">Bell</div>,
}));

vi.mock('../../user/UserProfileDropdown', () => ({
  UserProfileDropdown: () => <div data-testid="user-dropdown">Profile</div>,
}));

vi.mock('../../common/OfflineBadge', () => ({
  OfflineBadge: () => <div data-testid="offline-badge">Offline</div>,
}));

const renderHeader = (props = {}) => {
  return render(
    <BrowserRouter>
      <Header {...props} />
    </BrowserRouter>
  );
};

describe('Header Component', () => {
  beforeEach(() => {
    // Reset scroll position
    window.scrollY = 0;
  });

  describe('Unauthenticated State', () => {
    it('renders logo and brand name', () => {
      renderHeader({ isAuthenticated: false });
      
      expect(screen.getByText('J')).toBeInTheDocument();
      expect(screen.getByText('journo')).toBeInTheDocument();
    });

    it('shows user profile dropdown for unauthenticated users', () => {
      renderHeader({ isAuthenticated: false });
      
      expect(screen.getByTestId('user-dropdown')).toBeInTheDocument();
    });

    it('does not show authenticated navigation items', () => {
      renderHeader({ isAuthenticated: false });
      
      expect(screen.queryByText('Discover')).not.toBeInTheDocument();
      expect(screen.queryByText('Create Trip')).not.toBeInTheDocument();
    });

    it('does not show mobile bottom navigation', () => {
      renderHeader({ isAuthenticated: false });
      
      expect(screen.queryByLabelText('Home')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated State', () => {
    it('renders all navigation items on desktop', () => {
      renderHeader({ isAuthenticated: true });
      
      // Use getAllByText since text appears in both desktop and mobile nav
      const discoverButtons = screen.getAllByText('Discover');
      expect(discoverButtons.length).toBeGreaterThan(0);
      
      expect(screen.getByText('Create Trip')).toBeInTheDocument();
      expect(screen.getAllByText('Community').length).toBeGreaterThan(0);
    });

    it('shows notification bell and offline badge', () => {
      renderHeader({ isAuthenticated: true });
      
      expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
      expect(screen.getByTestId('offline-badge')).toBeInTheDocument();
    });

    it('calls onCreateTrip when create button is clicked', () => {
      const onCreateTrip = vi.fn();
      renderHeader({ isAuthenticated: true, onCreateTrip });
      
      const createButton = screen.getByText('Create Trip');
      fireEvent.click(createButton);
      
      expect(onCreateTrip).toHaveBeenCalledTimes(1);
    });

    it('renders mobile bottom navigation', () => {
      renderHeader({ isAuthenticated: true });
      
      expect(screen.getByLabelText('Home')).toBeInTheDocument();
      expect(screen.getByLabelText('Discover')).toBeInTheDocument();
      expect(screen.getByLabelText('Create Trip')).toBeInTheDocument();
      expect(screen.getByLabelText('Community')).toBeInTheDocument();
    });

    it('highlights active route in mobile navigation', () => {
      renderHeader({ isAuthenticated: true, activeRoute: 'home' });
      
      const homeButton = screen.getByLabelText('Home');
      expect(homeButton).toHaveClass('text-bubblequest-primary-600');
    });
  });

  describe('Mobile Menu', () => {
    it('toggles mobile menu when hamburger is clicked', () => {
      renderHeader({ isAuthenticated: true });
      
      // Menu should be closed initially
      expect(screen.queryByText('Discover Destinations')).not.toBeInTheDocument();
      
      // Click hamburger to open
      const menuButton = screen.getByLabelText('Toggle menu');
      fireEvent.click(menuButton);
      
      // Menu items should be visible
      expect(screen.getByText('Discover Destinations')).toBeInTheDocument();
      expect(screen.getByText('Create New Trip')).toBeInTheDocument();
    });

    it('calls onCreateTrip from mobile menu', () => {
      const onCreateTrip = vi.fn();
      renderHeader({ isAuthenticated: true, onCreateTrip });
      
      // Open mobile menu
      const menuButton = screen.getByLabelText('Toggle menu');
      fireEvent.click(menuButton);
      
      // Click create trip in mobile menu
      const createButton = screen.getByText('Create New Trip');
      fireEvent.click(createButton);
      
      expect(onCreateTrip).toHaveBeenCalledTimes(1);
    });
  });

  describe('Scroll Behavior', () => {
    it('applies scroll styles when scrolled', () => {
      const { container } = renderHeader({ isAuthenticated: true });
      
      // Simulate scroll
      window.scrollY = 100;
      fireEvent.scroll(window);
      
      // Header should have scrolled class
      const header = container.querySelector('header');
      expect(header).toHaveClass('backdrop-blur-lg');
    });
  });

  describe('Accessibility', () => {
    it('has proper aria labels for mobile navigation', () => {
      renderHeader({ isAuthenticated: true });
      
      expect(screen.getByLabelText('Home')).toBeInTheDocument();
      expect(screen.getByLabelText('Discover')).toBeInTheDocument();
      expect(screen.getByLabelText('Create Trip')).toBeInTheDocument();
      expect(screen.getByLabelText('Community')).toBeInTheDocument();
    });

    it('has proper aria label for menu toggle', () => {
      renderHeader({ isAuthenticated: true });
      
      expect(screen.getByLabelText('Toggle menu')).toBeInTheDocument();
    });
  });
});
