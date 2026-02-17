import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AriaLiveRegion, useAriaAnnouncer } from '../AriaLiveRegion';
import React from 'react';

describe('AriaLiveRegion', () => {
  describe('Component Rendering', () => {
    it('should render with polite priority by default', () => {
      const { container } = render(<AriaLiveRegion message="Test message" />);
      const liveRegion = container.querySelector('[aria-live="polite"]');
      
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveTextContent('Test message');
    });

    it('should render with assertive priority when specified', () => {
      const { container } = render(
        <AriaLiveRegion message="Error message" priority="assertive" />
      );
      const liveRegion = container.querySelector('[aria-live="assertive"]');
      
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveTextContent('Error message');
    });

    it('should have role="status"', () => {
      render(<AriaLiveRegion message="Test message" />);
      const liveRegion = screen.getByRole('status');
      
      expect(liveRegion).toBeInTheDocument();
    });

    it('should have aria-atomic="true"', () => {
      const { container } = render(<AriaLiveRegion message="Test message" />);
      const liveRegion = container.querySelector('[aria-atomic="true"]');
      
      expect(liveRegion).toBeInTheDocument();
    });

    it('should be visually hidden with sr-only class', () => {
      const { container } = render(<AriaLiveRegion message="Test message" />);
      const liveRegion = container.querySelector('.sr-only');
      
      expect(liveRegion).toBeInTheDocument();
    });
  });

  describe('Message Updates', () => {
    it('should update message when prop changes', () => {
      const { rerender } = render(<AriaLiveRegion message="Initial message" />);
      expect(screen.getByRole('status')).toHaveTextContent('Initial message');

      rerender(<AriaLiveRegion message="Updated message" />);
      expect(screen.getByRole('status')).toHaveTextContent('Updated message');
    });
  });

  describe('useAriaAnnouncer Hook', () => {
    it('should provide announce function and LiveRegion component', () => {
      let hookResult: ReturnType<typeof useAriaAnnouncer>;

      function TestComponent() {
        hookResult = useAriaAnnouncer();
        return <hookResult.LiveRegion />;
      }

      render(<TestComponent />);

      expect(hookResult!.announce).toBeDefined();
      expect(hookResult!.LiveRegion).toBeDefined();
      expect(typeof hookResult!.announce).toBe('function');
    });
  });

  describe('Accessibility Requirements', () => {
    it('should validate Requirements 9.6 - Loading state announcements', () => {
      const { rerender } = render(<AriaLiveRegion message="" />);
      
      // Simulate loading state
      rerender(<AriaLiveRegion message="Loading data..." priority="polite" />);
      
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent('Loading data...');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('should validate Requirements 9.6 - Error message announcements', () => {
      const { rerender } = render(<AriaLiveRegion message="" />);
      
      // Simulate error state
      rerender(<AriaLiveRegion message="Error: Failed to load data" priority="assertive" />);
      
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent('Error: Failed to load data');
      expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
    });

    it('should validate Requirements 9.6 - Success confirmation announcements', () => {
      const { rerender } = render(<AriaLiveRegion message="" />);
      
      // Simulate success state
      rerender(<AriaLiveRegion message="Data saved successfully" priority="polite" />);
      
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent('Data saved successfully');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });
  });
});
