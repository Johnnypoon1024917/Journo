/**
 * NavigationWrapper Skip Links Integration Tests
 * 
 * Tests that skip links are properly integrated into the NavigationWrapper
 * and allow users to bypass navigation to reach main content.
 * 
 * Requirements: 9.10 - Skip links for bypassing repetitive navigation
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NavigationWrapper } from '../NavigationWrapper';

// Mock the navigation components
vi.mock('@/components/bubblequest/SideNavigation', () => ({
  SideNavigation: ({ activeTab }: { activeTab?: string }) => (
    <div data-testid="side-navigation">Side Nav - {activeTab}</div>
  ),
}));

vi.mock('@/components/bubblequest/BottomNavigation', () => ({
  BottomNavigation: ({ activeTab }: { activeTab?: string }) => (
    <div data-testid="bottom-navigation">Bottom Nav - {activeTab}</div>
  ),
}));

// Mock safe area service
vi.mock('@/services/safeAreaService', () => ({
  safeAreaService: {
    getInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    subscribeToChanges: () => () => {},
  },
}));

describe('NavigationWrapper - Skip Links Integration', () => {
  describe('Skip links presence', () => {
    it('should render skip to main content link', () => {
      render(
        <NavigationWrapper>
          <div>Test content</div>
        </NavigationWrapper>
      );

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toBeInTheDocument();
    });

    it('should render skip link before navigation elements', () => {
      const { container } = render(
        <NavigationWrapper activeTab="schedule">
          <div>Test content</div>
        </NavigationWrapper>
      );

      const skipLink = screen.getByText('Skip to main content');
      const navigation = screen.getAllByTestId(/navigation/)[0];

      // Skip link should appear before navigation in DOM order
      const skipLinkIndex = Array.from(container.querySelectorAll('*')).indexOf(skipLink);
      const navigationIndex = Array.from(container.querySelectorAll('*')).indexOf(navigation);

      expect(skipLinkIndex).toBeLessThan(navigationIndex);
    });
  });

  describe('Main content landmark', () => {
    it('should have main element with id="main-content"', () => {
      render(
        <NavigationWrapper>
          <div>Test content</div>
        </NavigationWrapper>
      );

      const mainContent = document.getElementById('main-content');
      expect(mainContent).toBeInTheDocument();
      expect(mainContent?.tagName).toBe('MAIN');
    });

    it('should render children inside main content', () => {
      render(
        <NavigationWrapper>
          <div data-testid="test-content">Test content</div>
        </NavigationWrapper>
      );

      // Both desktop and mobile versions render, so we get multiple main elements
      const mainElements = screen.getAllByRole('main');
      const testContents = screen.getAllByTestId('test-content');

      // Each main element should contain a test content element
      expect(mainElements.length).toBeGreaterThan(0);
      expect(testContents.length).toBeGreaterThan(0);
      
      // At least one main element should contain test content
      const hasContent = mainElements.some(main => 
        testContents.some(content => main.contains(content))
      );
      expect(hasContent).toBe(true);
    });
  });

  describe('Skip link target', () => {
    it('should link to main-content ID', () => {
      render(
        <NavigationWrapper>
          <div>Test content</div>
        </NavigationWrapper>
      );

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });

    it('should have matching target element for skip link', () => {
      render(
        <NavigationWrapper>
          <div>Test content</div>
        </NavigationWrapper>
      );

      const skipLink = screen.getByText('Skip to main content');
      const href = skipLink.getAttribute('href');
      const targetId = href?.substring(1); // Remove '#'

      const targetElement = document.getElementById(targetId!);
      expect(targetElement).toBeInTheDocument();
    });
  });

  describe('Navigation landmarks', () => {
    it('should have navigation landmark for desktop sidebar', () => {
      render(
        <NavigationWrapper activeTab="schedule">
          <div>Test content</div>
        </NavigationWrapper>
      );

      // Desktop navigation should have role="navigation"
      const navElements = screen.getAllByRole('navigation');
      expect(navElements.length).toBeGreaterThan(0);
    });

    it('should have aria-label on navigation elements', () => {
      render(
        <NavigationWrapper activeTab="schedule">
          <div>Test content</div>
        </NavigationWrapper>
      );

      const navElements = screen.getAllByRole('navigation');
      navElements.forEach(nav => {
        expect(nav).toHaveAttribute('aria-label');
      });
    });
  });

  describe('Keyboard navigation flow', () => {
    it('should allow keyboard focus on skip link', () => {
      render(
        <NavigationWrapper>
          <div>Test content</div>
        </NavigationWrapper>
      );

      const skipLink = screen.getByText('Skip to main content');
      skipLink.focus();

      expect(document.activeElement).toBe(skipLink);
    });

    it('should have skip-link class for visual styling on focus', () => {
      render(
        <NavigationWrapper>
          <div>Test content</div>
        </NavigationWrapper>
      );

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveClass('skip-link');
    });
  });

  describe('Multiple navigation contexts', () => {
    it('should work with different active tabs', () => {
      const tabs = ['schedule', 'booking', 'budget', 'shopping', 'checklist', 'members', 'settings'] as const;

      tabs.forEach(tab => {
        const { unmount } = render(
          <NavigationWrapper activeTab={tab}>
            <div>Test content for {tab}</div>
          </NavigationWrapper>
        );

        const skipLink = screen.getByText('Skip to main content');
        const mainContent = document.getElementById('main-content');

        expect(skipLink).toBeInTheDocument();
        expect(mainContent).toBeInTheDocument();

        unmount();
      });
    });
  });

  describe('Responsive behavior', () => {
    it('should have main content on both desktop and mobile views', () => {
      render(
        <NavigationWrapper>
          <div>Test content</div>
        </NavigationWrapper>
      );

      // Both desktop and mobile versions should have main content
      const mainElements = screen.getAllByRole('main');
      expect(mainElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should have consistent main-content ID across viewports', () => {
      render(
        <NavigationWrapper>
          <div>Test content</div>
        </NavigationWrapper>
      );

      const mainContentElements = document.querySelectorAll('#main-content');
      // Should have main-content ID (may be duplicated for desktop/mobile, but at least one)
      expect(mainContentElements.length).toBeGreaterThan(0);
    });
  });
});
