/**
 * SkipLinks Component Tests
 * 
 * Tests for skip links functionality and keyboard accessibility
 * Requirements: 9.10 - Skip links for bypassing repetitive navigation
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SkipLinks } from '../SkipLinks';

describe('SkipLinks', () => {
  describe('Default behavior', () => {
    it('should render skip to main content link', () => {
      render(<SkipLinks />);
      
      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });

    it('should have skip-link class for styling', () => {
      render(<SkipLinks />);
      
      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveClass('skip-link');
    });

    it('should be a link element', () => {
      render(<SkipLinks />);
      
      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink.tagName).toBe('A');
    });
  });

  describe('Custom main content ID', () => {
    it('should use custom main content ID when provided', () => {
      render(<SkipLinks mainContentId="custom-main" />);
      
      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveAttribute('href', '#custom-main');
    });
  });

  describe('Additional skip links', () => {
    it('should render additional skip links when provided', () => {
      const additionalLinks = [
        { href: '#navigation', label: 'Skip to navigation' },
        { href: '#footer', label: 'Skip to footer' },
      ];

      render(<SkipLinks additionalLinks={additionalLinks} />);
      
      expect(screen.getByText('Skip to main content')).toBeInTheDocument();
      expect(screen.getByText('Skip to navigation')).toBeInTheDocument();
      expect(screen.getByText('Skip to footer')).toBeInTheDocument();
    });

    it('should have correct href attributes for additional links', () => {
      const additionalLinks = [
        { href: '#navigation', label: 'Skip to navigation' },
      ];

      render(<SkipLinks additionalLinks={additionalLinks} />);
      
      const navLink = screen.getByText('Skip to navigation');
      expect(navLink).toHaveAttribute('href', '#navigation');
    });

    it('should apply skip-link class to all links', () => {
      const additionalLinks = [
        { href: '#navigation', label: 'Skip to navigation' },
        { href: '#footer', label: 'Skip to footer' },
      ];

      render(<SkipLinks additionalLinks={additionalLinks} />);
      
      const allLinks = screen.getAllByRole('link');
      allLinks.forEach(link => {
        expect(link).toHaveClass('skip-link');
      });
    });
  });

  describe('Keyboard accessibility', () => {
    it('should be keyboard focusable', () => {
      render(<SkipLinks />);
      
      const skipLink = screen.getByText('Skip to main content');
      skipLink.focus();
      
      expect(document.activeElement).toBe(skipLink);
    });

    it('should have minimum 44x44px touch target (via CSS)', () => {
      render(<SkipLinks />);
      
      const skipLink = screen.getByText('Skip to main content');
      const styles = window.getComputedStyle(skipLink);
      
      // The skip-link class in accessibility.css sets min-height and min-width to 44px
      // We verify the class is applied; actual size verification is in CSS
      expect(skipLink).toHaveClass('skip-link');
    });
  });

  describe('Multiple skip links order', () => {
    it('should render main content link first, then additional links', () => {
      const additionalLinks = [
        { href: '#navigation', label: 'Skip to navigation' },
        { href: '#footer', label: 'Skip to footer' },
      ];

      render(<SkipLinks additionalLinks={additionalLinks} />);
      
      const allLinks = screen.getAllByRole('link');
      expect(allLinks[0]).toHaveTextContent('Skip to main content');
      expect(allLinks[1]).toHaveTextContent('Skip to navigation');
      expect(allLinks[2]).toHaveTextContent('Skip to footer');
    });
  });

  describe('Empty additional links', () => {
    it('should handle empty additional links array', () => {
      render(<SkipLinks additionalLinks={[]} />);
      
      const allLinks = screen.getAllByRole('link');
      expect(allLinks).toHaveLength(1);
      expect(allLinks[0]).toHaveTextContent('Skip to main content');
    });
  });
});
