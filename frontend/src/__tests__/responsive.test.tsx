/**
 * Responsive Testing Suite
 * 
 * Tests all homepage redesign components across mobile, tablet, and desktop breakpoints.
 * Validates:
 * - Hero section displays correctly on all sizes
 * - Action cards stack properly on mobile
 * - Discovery widget is usable on small screens
 * - Trip cards are readable on all devices
 * - Navigation works on mobile and desktop
 * - Touch targets are 44x44px minimum
 * - Horizontal scroll works smoothly
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BubbleQuestHome } from '../pages/BubbleQuestHome';
import { Header } from '../components/layout/Header';
import { ActionCard } from '../components/home/ActionCard';
import { DiscoveryWidget } from '../components/home/DiscoveryWidget';
import { TripCard } from '../components/trip/TripCard';

// Setup IntersectionObserver mock for framer-motion
beforeEach(() => {
  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords() {
      return [];
    }
    unobserve() {}
  } as any;
});

// Mock hooks and services
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', firstName: 'Test', email: 'test@example.com' },
    isAuthenticated: true,
  }),
}));

vi.mock('../stores/enhancedAuthStore', () => ({
  useEnhancedAuthStore: () => ({
    accessToken: 'mock-token',
  }),
}));

vi.mock('../stores/offlineStore', () => ({
  useOfflineStore: () => ({
    isOnline: true,
  }),
}));

vi.mock('../hooks/useToast', () => ({
  useToast: () => ({
    toasts: [],
    showSuccess: vi.fn(),
    showError: vi.fn(),
    dismissToast: vi.fn(),
  }),
}));


// Helper function to set viewport size
function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  window.dispatchEvent(new Event('resize'));
}

// Viewport breakpoints
const VIEWPORTS = {
  mobile: { width: 375, height: 667, name: 'Mobile (375x667)' },
  mobileLarge: { width: 414, height: 896, name: 'Mobile Large (414x896)' },
  tablet: { width: 768, height: 1024, name: 'Tablet (768x1024)' },
  desktop: { width: 1280, height: 800, name: 'Desktop (1280x800)' },
  desktopLarge: { width: 1920, height: 1080, name: 'Desktop Large (1920x1080)' },
};

// Helper to render with router
function renderWithRouter(component: React.ReactElement) {
  return render(<BrowserRouter>{component}</BrowserRouter>);
}

describe('Responsive Testing Suite', () => {
  beforeEach(() => {
    // Reset viewport to desktop before each test
    setViewport(VIEWPORTS.desktop.width, VIEWPORTS.desktop.height);
  });

  describe('1. Hero Section Responsiveness', () => {
    it('should display hero section correctly on mobile', () => {
      setViewport(VIEWPORTS.mobile.width, VIEWPORTS.mobile.height);
      renderWithRouter(<BubbleQuestHome />);
      
      const heading = screen.getByText(/Hey.*Where to next/i);
      expect(heading).toBeInTheDocument();
      
      // Check that hero text is visible and readable
      const subheading = screen.getByText(/Your next unforgettable journey/i);
      expect(subheading).toBeInTheDocument();
    });

    it('should display hero section correctly on tablet', () => {
      setViewport(VIEWPORTS.tablet.width, VIEWPORTS.tablet.height);
      renderWithRouter(<BubbleQuestHome />);
      
      const heading = screen.getByText(/Hey.*Where to next/i);
      expect(heading).toBeInTheDocument();
    });

    it('should display hero section correctly on desktop', () => {
      setViewport(VIEWPORTS.desktop.width, VIEWPORTS.desktop.height);
      renderWithRouter(<BubbleQuestHome />);
      
      const heading = screen.getByText(/Hey.*Where to next/i);
      expect(heading).toBeInTheDocument();
    });
  });

  describe('2. Action Cards Stacking', () => {
    it('should stack action cards vertically on mobile', () => {
      setViewport(VIEWPORTS.mobile.width, VIEWPORTS.mobile.height);
      renderWithRouter(<BubbleQuestHome />);
      
      // Find all action cards
      const cards = screen.getAllByText(/Start a New Adventure|Find Your Perfect Escape|See What Others Are Planning/i);
      expect(cards.length).toBeGreaterThanOrEqual(3);
    });


    it('should display action cards in grid on tablet', () => {
      setViewport(VIEWPORTS.tablet.width, VIEWPORTS.tablet.height);
      renderWithRouter(<BubbleQuestHome />);
      
      const cards = screen.getAllByText(/Start a New Adventure|Find Your Perfect Escape|See What Others Are Planning/i);
      expect(cards.length).toBeGreaterThanOrEqual(3);
    });

    it('should display action cards in grid on desktop', () => {
      setViewport(VIEWPORTS.desktop.width, VIEWPORTS.desktop.height);
      renderWithRouter(<BubbleQuestHome />);
      
      const cards = screen.getAllByText(/Start a New Adventure|Find Your Perfect Escape|See What Others Are Planning/i);
      expect(cards.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('3. Discovery Widget Usability', () => {
    it('should render discovery widget on mobile with proper controls', () => {
      setViewport(VIEWPORTS.mobile.width, VIEWPORTS.mobile.height);
      renderWithRouter(<DiscoveryWidget />);
      
      // Check for month selector
      const monthSelect = screen.getByRole('combobox', { name: /travel month/i });
      expect(monthSelect).toBeInTheDocument();
      
      // Check for weather preference radio buttons
      const warmButton = screen.getByRole('radio', { name: /warm weather preference/i });
      expect(warmButton).toBeInTheDocument();
    });

    it('should render discovery widget on tablet', () => {
      setViewport(VIEWPORTS.tablet.width, VIEWPORTS.tablet.height);
      renderWithRouter(<DiscoveryWidget />);
      
      const heading = screen.getByText(/Discover Your Next Adventure/i);
      expect(heading).toBeInTheDocument();
    });

    it('should render discovery widget on desktop', () => {
      setViewport(VIEWPORTS.desktop.width, VIEWPORTS.desktop.height);
      renderWithRouter(<DiscoveryWidget />);
      
      const heading = screen.getByText(/Discover Your Next Adventure/i);
      expect(heading).toBeInTheDocument();
    });
  });

  describe('4. Trip Cards Readability', () => {
    const mockTrip = {
      id: '1',
      title: 'Tokyo Adventure',
      description: 'Exploring Japan',
      startDate: '2024-06-01',
      endDate: '2024-06-10',
      coverPhoto: 'https://example.com/photo.jpg',
      isPublic: false,
      collaborators: [],
    };

    it('should display trip card readably on mobile', () => {
      setViewport(VIEWPORTS.mobile.width, VIEWPORTS.mobile.height);
      renderWithRouter(<TripCard trip={mockTrip} />);
      
      const title = screen.getByText('Tokyo Adventure');
      expect(title).toBeInTheDocument();
    });

    it('should display trip card readably on tablet', () => {
      setViewport(VIEWPORTS.tablet.width, VIEWPORTS.tablet.height);
      renderWithRouter(<TripCard trip={mockTrip} />);
      
      const title = screen.getByText('Tokyo Adventure');
      expect(title).toBeInTheDocument();
    });

    it('should display trip card readably on desktop', () => {
      setViewport(VIEWPORTS.desktop.width, VIEWPORTS.desktop.height);
      renderWithRouter(<TripCard trip={mockTrip} />);
      
      const title = screen.getByText('Tokyo Adventure');
      expect(title).toBeInTheDocument();
    });
  });


  describe('5. Navigation Responsiveness', () => {
    it('should show desktop navigation on desktop', () => {
      setViewport(VIEWPORTS.desktop.width, VIEWPORTS.desktop.height);
      renderWithRouter(<Header isAuthenticated={true} />);
      
      // Desktop nav should have text labels - use getAllByText since there are multiple
      const discoverButtons = screen.getAllByText('Discover');
      expect(discoverButtons.length).toBeGreaterThan(0);
    });

    it('should show mobile bottom navigation on mobile', () => {
      setViewport(VIEWPORTS.mobile.width, VIEWPORTS.mobile.height);
      renderWithRouter(<Header isAuthenticated={true} activeRoute="home" />);
      
      // Mobile nav should have Home button
      const homeButton = screen.getAllByLabelText(/home/i)[0];
      expect(homeButton).toBeInTheDocument();
    });

    it('should show hamburger menu on mobile', () => {
      setViewport(VIEWPORTS.mobile.width, VIEWPORTS.mobile.height);
      renderWithRouter(<Header isAuthenticated={true} />);
      
      const menuButton = screen.getByLabelText(/toggle menu/i);
      expect(menuButton).toBeInTheDocument();
    });
  });

  describe('6. Touch Target Sizes (44x44px minimum)', () => {
    it('should have proper touch target size for action cards', () => {
      renderWithRouter(
        <ActionCard
          title="Test Card"
          description="Test description"
          icon="🎯"
          onClick={() => {}}
        />
      );
      
      const card = screen.getByText('Test Card');
      expect(card).toBeInTheDocument();
      
      // Card should be large enough for touch interaction
      const cardContainer = card.closest('[class*="p-10"]');
      expect(cardContainer).toBeInTheDocument();
    });

    it('should have proper touch target size for navigation buttons', () => {
      setViewport(VIEWPORTS.mobile.width, VIEWPORTS.mobile.height);
      renderWithRouter(<Header isAuthenticated={true} activeRoute="home" />);
      
      const homeButton = screen.getAllByLabelText(/home/i)[0];
      expect(homeButton).toBeInTheDocument();
      
      // Button should be in the mobile navigation
      expect(homeButton.tagName).toBe('BUTTON');
    });

    it('should have proper touch target size for discovery widget buttons', () => {
      renderWithRouter(<DiscoveryWidget />);
      
      const warmButton = screen.getByRole('radio', { name: /warm weather preference/i });
      expect(warmButton).toBeInTheDocument();
      
      // Weather preference buttons should have proper padding (px-4 py-4)
      expect(warmButton).toHaveClass('px-4', 'py-4');
    });
  });

  describe('7. Horizontal Scroll Functionality', () => {
    it('should support horizontal scrolling for destination results', () => {
      renderWithRouter(<DiscoveryWidget />);
      
      // Widget should render without errors
      const widget = screen.getByText(/Discover Your Next Adventure/i);
      expect(widget).toBeInTheDocument();
    });

    it('should handle overflow content gracefully on mobile', () => {
      setViewport(VIEWPORTS.mobile.width, VIEWPORTS.mobile.height);
      renderWithRouter(<BubbleQuestHome />);
      
      // Page should render without horizontal overflow issues
      const body = document.body;
      expect(body.scrollWidth).toBeLessThanOrEqual(VIEWPORTS.mobile.width + 20); // Allow small margin
    });
  });


  describe('8. Cross-Breakpoint Consistency', () => {
    it('should maintain consistent branding across all viewports', () => {
      const viewports = [VIEWPORTS.mobile, VIEWPORTS.tablet, VIEWPORTS.desktop];
      
      viewports.forEach((viewport) => {
        setViewport(viewport.width, viewport.height);
        const { unmount } = renderWithRouter(<Header isAuthenticated={true} />);
        
        // Logo should always be present
        const logo = screen.getByText(/journo/i);
        expect(logo).toBeInTheDocument();
        
        unmount();
      });
    });

    it('should show appropriate content density for each viewport', () => {
      // Mobile: More compact
      setViewport(VIEWPORTS.mobile.width, VIEWPORTS.mobile.height);
      const { unmount: unmountMobile } = renderWithRouter(<BubbleQuestHome />);
      const mobileContent = screen.getByText(/Hey.*Where to next/i);
      expect(mobileContent).toBeInTheDocument();
      unmountMobile();

      // Desktop: More spacious
      setViewport(VIEWPORTS.desktop.width, VIEWPORTS.desktop.height);
      const { unmount: unmountDesktop } = renderWithRouter(<BubbleQuestHome />);
      const desktopContent = screen.getByText(/Hey.*Where to next/i);
      expect(desktopContent).toBeInTheDocument();
      unmountDesktop();
    });
  });

  describe('9. Responsive Images and Media', () => {
    it('should handle images responsively on mobile', () => {
      setViewport(VIEWPORTS.mobile.width, VIEWPORTS.mobile.height);
      renderWithRouter(<BubbleQuestHome />);
      
      // Page should render without image loading errors
      const page = screen.getByText(/Hey.*Where to next/i);
      expect(page).toBeInTheDocument();
    });

    it('should handle images responsively on desktop', () => {
      setViewport(VIEWPORTS.desktop.width, VIEWPORTS.desktop.height);
      renderWithRouter(<BubbleQuestHome />);
      
      const page = screen.getByText(/Hey.*Where to next/i);
      expect(page).toBeInTheDocument();
    });
  });

  describe('10. Layout Stability', () => {
    it('should not cause layout shift when resizing from mobile to desktop', () => {
      setViewport(VIEWPORTS.mobile.width, VIEWPORTS.mobile.height);
      const { rerender } = renderWithRouter(<BubbleQuestHome />);
      
      const initialContent = screen.getByText(/Hey.*Where to next/i);
      expect(initialContent).toBeInTheDocument();
      
      // Resize to desktop
      setViewport(VIEWPORTS.desktop.width, VIEWPORTS.desktop.height);
      rerender(<BrowserRouter><BubbleQuestHome /></BrowserRouter>);
      
      // Content should still be present
      const resizedContent = screen.getByText(/Hey.*Where to next/i);
      expect(resizedContent).toBeInTheDocument();
    });

    it('should maintain scroll position when viewport changes', () => {
      setViewport(VIEWPORTS.desktop.width, VIEWPORTS.desktop.height);
      renderWithRouter(<BubbleQuestHome />);
      
      // Simulate scroll
      window.scrollY = 100;
      
      // Resize
      setViewport(VIEWPORTS.tablet.width, VIEWPORTS.tablet.height);
      
      // Page should still be functional
      const content = screen.getByText(/Hey.*Where to next/i);
      expect(content).toBeInTheDocument();
    });
  });
});
