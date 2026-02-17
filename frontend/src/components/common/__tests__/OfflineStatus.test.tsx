/**
 * Unit tests for OfflineStatus Component
 * 
 * Tests offline indicator UI functionality
 * Validates: Requirement 11.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import OfflineStatus from '../OfflineStatus';

describe('OfflineStatus Component', () => {
  let onlineGetter: any;

  beforeEach(() => {
    // Mock navigator.onLine
    onlineGetter = vi.spyOn(navigator, 'onLine', 'get');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Requirement 11.5: Display offline indicator when not connected', () => {
    it('should show offline indicator when offline', () => {
      // Set navigator.onLine to false
      onlineGetter.mockReturnValue(false);

      render(<OfflineStatus />);

      // Should show offline message
      expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
    });

    it('should hide offline indicator when online', () => {
      // Start online
      onlineGetter.mockReturnValue(true);

      const { container } = render(<OfflineStatus />);

      // Should not show any message when online
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Visual feedback', () => {
    it('should display appropriate icon when offline', () => {
      onlineGetter.mockReturnValue(false);

      render(<OfflineStatus />);

      // Should have an icon (SVG element)
      const svg = screen.getByText(/you're offline/i).parentElement?.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should use yellow background when offline', () => {
      onlineGetter.mockReturnValue(false);

      render(<OfflineStatus />);

      // Find the parent div with the background color class
      const indicator = screen.getByText(/you're offline/i).closest('div')?.parentElement;
      expect(indicator).toHaveClass('bg-yellow-600');
    });
  });

  describe('Accessibility', () => {
    it('should be positioned at the top of the screen', () => {
      onlineGetter.mockReturnValue(false);

      const { container } = render(<OfflineStatus />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('fixed', 'top-0', 'left-0', 'right-0');
    });

    it('should have high z-index to appear above other content', () => {
      onlineGetter.mockReturnValue(false);

      const { container } = render(<OfflineStatus />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('z-50');
    });

    it('should have clear, readable text', () => {
      onlineGetter.mockReturnValue(false);

      render(<OfflineStatus />);

      const text = screen.getByText(/you're offline/i);
      expect(text).toBeInTheDocument();
      expect(text.textContent).toContain('changes will sync when reconnected');
    });
  });

  describe('Content and messaging', () => {
    it('should inform users that changes will sync when reconnected', () => {
      onlineGetter.mockReturnValue(false);

      render(<OfflineStatus />);

      expect(screen.getByText(/changes will sync when reconnected/i)).toBeInTheDocument();
    });

    it('should display offline status clearly', () => {
      onlineGetter.mockReturnValue(false);

      render(<OfflineStatus />);

      // Should contain "offline" in the message
      const message = screen.getByText(/you're offline/i);
      expect(message).toBeInTheDocument();
    });
  });
});
