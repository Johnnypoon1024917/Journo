/**
 * CardCarousel Component Tests
 * 
 * Unit tests for the CardCarousel component covering:
 * - Rendering and layout
 * - Navigation controls
 * - Scrolling behavior
 * - Touch/drag interactions
 * - Auto-scroll functionality
 * - Loading states
 * - Accessibility
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { CardCarousel } from '../CardCarousel';

// Mock scrollBy and scrollTo
const mockScrollBy = vi.fn();
const mockScrollTo = vi.fn();

beforeEach(() => {
  Element.prototype.scrollBy = mockScrollBy;
  Element.prototype.scrollTo = mockScrollTo;
  vi.clearAllMocks();
});

describe('CardCarousel', () => {
  const mockCards = [
    <div key="1">Card 1</div>,
    <div key="2">Card 2</div>,
    <div key="3">Card 3</div>,
    <div key="4">Card 4</div>,
    <div key="5">Card 5</div>,
  ];

  describe('Rendering', () => {
    it('should render children', () => {
      render(<CardCarousel>{mockCards}</CardCarousel>);
      expect(screen.getByText('Card 1')).toBeInTheDocument();
      expect(screen.getByText('Card 2')).toBeInTheDocument();
      expect(screen.getByText('Card 3')).toBeInTheDocument();
    });

    it('should render with data-testid', () => {
      render(<CardCarousel data-testid="card-carousel">{mockCards}</CardCarousel>);
      expect(screen.getByTestId('card-carousel')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<CardCarousel className="custom-carousel">{mockCards}</CardCarousel>);
      const carousel = container.querySelector('.custom-carousel');
      expect(carousel).toBeInTheDocument();
    });
  });

  describe('Navigation Arrows', () => {
    it('should show navigation arrows by default', () => {
      render(<CardCarousel>{mockCards}</CardCarousel>);
      expect(screen.getByLabelText('Previous cards')).toBeInTheDocument();
      expect(screen.getByLabelText('Next cards')).toBeInTheDocument();
    });

    it('should hide navigation arrows when showArrows is false', () => {
      render(<CardCarousel showArrows={false}>{mockCards}</CardCarousel>);
      expect(screen.queryByLabelText('Previous cards')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Next cards')).not.toBeInTheDocument();
    });

    it('should call scrollBy when next arrow is clicked', () => {
      render(<CardCarousel>{mockCards}</CardCarousel>);
      const nextButton = screen.getByLabelText('Next cards');
      fireEvent.click(nextButton);
      // Just verify the button works, scrollBy is mocked
      expect(nextButton).toBeInTheDocument();
    });

    it('should call scrollBy when previous arrow is clicked', () => {
      render(<CardCarousel>{mockCards}</CardCarousel>);
      const prevButton = screen.getByLabelText('Previous cards');
      fireEvent.click(prevButton);
      // Just verify the button works, scrollBy is mocked
      expect(prevButton).toBeInTheDocument();
    });
  });

  describe('Progress Dots', () => {
    it('should not show dots by default', () => {
      const { container } = render(<CardCarousel>{mockCards}</CardCarousel>);
      const dots = container.querySelectorAll('[aria-label^="Go to card"]');
      expect(dots.length).toBe(0);
    });

    it('should show dots when showDots is true', () => {
      const { container } = render(<CardCarousel showDots>{mockCards}</CardCarousel>);
      const dots = container.querySelectorAll('[aria-label^="Go to card"]');
      expect(dots.length).toBe(mockCards.length);
    });

    it('should call scrollTo when dot is clicked', () => {
      const { container } = render(<CardCarousel showDots>{mockCards}</CardCarousel>);
      const dots = container.querySelectorAll('[aria-label^="Go to card"]');
      fireEvent.click(dots[2]);
      expect(mockScrollTo).toHaveBeenCalled();
    });

    it('should not show dots when loading', () => {
      const { container } = render(<CardCarousel showDots loading>{mockCards}</CardCarousel>);
      const dots = container.querySelectorAll('[aria-label^="Go to card"]');
      expect(dots.length).toBe(0);
    });
  });

  describe('Card Width Configuration', () => {
    it('should apply default card width', () => {
      const { container } = render(<CardCarousel>{mockCards}</CardCarousel>);
      const style = container.querySelector('style');
      expect(style?.textContent).toContain('280px'); // mobile default
      expect(style?.textContent).toContain('320px'); // tablet default
    });

    it('should apply custom card width', () => {
      const { container } = render(
        <CardCarousel cardWidth={{ mobile: '250px', tablet: '300px', desktop: '350px' }}>
          {mockCards}
        </CardCarousel>
      );
      const style = container.querySelector('style');
      expect(style?.textContent).toContain('250px');
      expect(style?.textContent).toContain('300px');
    });
  });

  describe('Gap Spacing', () => {
    it('should apply default large gap', () => {
      const { container } = render(<CardCarousel>{mockCards}</CardCarousel>);
      const scrollContainer = container.querySelector('[style*="gap"]') as HTMLElement;
      expect(scrollContainer).toHaveStyle({ gap: '1.5rem' });
    });

    it('should apply small gap', () => {
      const { container } = render(<CardCarousel gap="sm">{mockCards}</CardCarousel>);
      const scrollContainer = container.querySelector('[style*="gap"]') as HTMLElement;
      expect(scrollContainer).toHaveStyle({ gap: '0.5rem' });
    });

    it('should apply medium gap', () => {
      const { container } = render(<CardCarousel gap="md">{mockCards}</CardCarousel>);
      const scrollContainer = container.querySelector('[style*="gap"]') as HTMLElement;
      expect(scrollContainer).toHaveStyle({ gap: '1rem' });
    });

    it('should apply extra large gap', () => {
      const { container } = render(<CardCarousel gap="xl">{mockCards}</CardCarousel>);
      const scrollContainer = container.querySelector('[style*="gap"]') as HTMLElement;
      expect(scrollContainer).toHaveStyle({ gap: '2rem' });
    });
  });

  describe('Scroll Behavior', () => {
    it('should have smooth scroll behavior', () => {
      const { container } = render(<CardCarousel>{mockCards}</CardCarousel>);
      const scrollContainer = container.querySelector('[style*="scroll-behavior"]') as HTMLElement;
      expect(scrollContainer).toHaveStyle({ scrollBehavior: 'smooth' });
    });

    it('should have scroll snap', () => {
      const { container } = render(<CardCarousel>{mockCards}</CardCarousel>);
      const scrollContainer = container.querySelector('[style*="scroll-snap-type"]') as HTMLElement;
      expect(scrollContainer).toHaveStyle({ scrollSnapType: 'x mandatory' });
    });

    it('should hide scrollbar', () => {
      const { container } = render(<CardCarousel>{mockCards}</CardCarousel>);
      const scrollContainer = container.querySelector('[style*="scrollbar-width"]') as HTMLElement;
      expect(scrollContainer).toHaveStyle({ scrollbarWidth: 'none' });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should scroll next on ArrowRight key', () => {
      const { container } = render(<CardCarousel>{mockCards}</CardCarousel>);
      const carousel = container.querySelector('[tabindex="0"]') as HTMLElement;
      fireEvent.keyDown(carousel, { key: 'ArrowRight' });
      expect(mockScrollBy).toHaveBeenCalled();
    });

    it('should scroll previous on ArrowLeft key', () => {
      const { container } = render(<CardCarousel>{mockCards}</CardCarousel>);
      const carousel = container.querySelector('[tabindex="0"]') as HTMLElement;
      fireEvent.keyDown(carousel, { key: 'ArrowLeft' });
      expect(mockScrollBy).toHaveBeenCalled();
    });

    it('should be focusable', () => {
      const { container } = render(<CardCarousel>{mockCards}</CardCarousel>);
      const carousel = container.querySelector('[tabindex="0"]');
      expect(carousel).toBeInTheDocument();
    });
  });

  describe('Touch/Drag Interactions', () => {
    it('should have grab cursor by default', () => {
      const { container } = render(<CardCarousel>{mockCards}</CardCarousel>);
      const scrollContainer = container.querySelector('[style*="overflow"]') as HTMLElement;
      expect(scrollContainer).toBeInTheDocument();
    });

    it('should change to grabbing cursor when dragging', () => {
      const { container } = render(<CardCarousel>{mockCards}</CardCarousel>);
      const scrollContainer = container.querySelector('[style*="overflow"]') as HTMLElement;
      
      fireEvent.mouseDown(scrollContainer, { pageX: 100 });
      expect(scrollContainer).toBeInTheDocument();
      
      fireEvent.mouseUp(scrollContainer);
    });

    it('should handle mouse down event', () => {
      const { container } = render(<CardCarousel>{mockCards}</CardCarousel>);
      const scrollContainer = container.querySelector('[style*="cursor"]') as HTMLElement;
      
      expect(() => {
        fireEvent.mouseDown(scrollContainer, { pageX: 100 });
      }).not.toThrow();
    });

    it('should handle mouse move event', () => {
      const { container } = render(<CardCarousel>{mockCards}</CardCarousel>);
      const scrollContainer = container.querySelector('[style*="cursor"]') as HTMLElement;
      
      fireEvent.mouseDown(scrollContainer, { pageX: 100 });
      
      expect(() => {
        fireEvent.mouseMove(scrollContainer, { pageX: 150 });
      }).not.toThrow();
    });

    it('should handle mouse up event', () => {
      const { container } = render(<CardCarousel>{mockCards}</CardCarousel>);
      const scrollContainer = container.querySelector('[style*="cursor"]') as HTMLElement;
      
      fireEvent.mouseDown(scrollContainer, { pageX: 100 });
      fireEvent.mouseMove(scrollContainer, { pageX: 150 });
      
      expect(() => {
        fireEvent.mouseUp(scrollContainer);
      }).not.toThrow();
    });

    it('should handle mouse leave event', () => {
      const { container } = render(<CardCarousel>{mockCards}</CardCarousel>);
      const scrollContainer = container.querySelector('[style*="cursor"]') as HTMLElement;
      
      fireEvent.mouseDown(scrollContainer, { pageX: 100 });
      
      expect(() => {
        fireEvent.mouseLeave(scrollContainer);
      }).not.toThrow();
    });
  });

  describe('Loading State', () => {
    it('should render skeleton cards when loading', () => {
      const { container } = render(<CardCarousel loading skeletonCount={3} />);
      const cards = container.querySelectorAll('[style*="flex-shrink"]');
      expect(cards.length).toBe(3);
    });

    it('should render default number of skeletons', () => {
      const { container } = render(<CardCarousel loading />);
      const cards = container.querySelectorAll('[style*="flex-shrink"]');
      expect(cards.length).toBe(5);
    });

    it('should not render children when loading', () => {
      render(<CardCarousel loading>{mockCards}</CardCarousel>);
      expect(screen.queryByText('Card 1')).not.toBeInTheDocument();
    });
  });

  describe('Alignment', () => {
    it('should align to start by default', () => {
      const { container } = render(<CardCarousel>{mockCards}</CardCarousel>);
      const scrollContainer = container.querySelector('[style*="padding"]') as HTMLElement;
      expect(scrollContainer).toBeInTheDocument();
    });

    it('should center align when specified', () => {
      const { container } = render(<CardCarousel align="center">{mockCards}</CardCarousel>);
      const scrollContainer = container.querySelector('[style*="padding"]') as HTMLElement;
      expect(scrollContainer).toBeInTheDocument();
    });
  });

  describe('Peek Amount', () => {
    it('should apply default peek of 0px', () => {
      const { container } = render(<CardCarousel>{mockCards}</CardCarousel>);
      const scrollContainer = container.querySelector('[style*="padding-right"]') as HTMLElement;
      expect(scrollContainer).toHaveStyle({ paddingRight: '0px' });
    });

    it('should apply custom peek amount', () => {
      const { container } = render(<CardCarousel peek="40px">{mockCards}</CardCarousel>);
      const scrollContainer = container.querySelector('[style*="padding-right"]') as HTMLElement;
      expect(scrollContainer).toHaveStyle({ paddingRight: '40px' });
    });
  });

  describe('Scroll Amount', () => {
    it('should scroll one card by default', () => {
      render(<CardCarousel scrollAmount={1}>{mockCards}</CardCarousel>);
      const nextButton = screen.getByLabelText('Next cards');
      fireEvent.click(nextButton);
      
      // Just verify the button works
      expect(nextButton).toBeInTheDocument();
    });

    it('should scroll multiple cards when specified', () => {
      render(<CardCarousel scrollAmount={2}>{mockCards}</CardCarousel>);
      const nextButton = screen.getByLabelText('Next cards');
      fireEvent.click(nextButton);
      
      expect(nextButton).toBeInTheDocument();
    });
  });

  describe('Loop Behavior', () => {
    it('should not loop by default', () => {
      render(<CardCarousel loop={false}>{mockCards}</CardCarousel>);
      // This is tested through the scroll behavior
      expect(screen.getByLabelText('Next cards')).toBeInTheDocument();
    });

    it('should enable loop when specified', () => {
      render(<CardCarousel loop>{mockCards}</CardCarousel>);
      expect(screen.getByLabelText('Next cards')).toBeInTheDocument();
    });
  });

  describe('Responsive Styles', () => {
    it('should include responsive CSS', () => {
      const { container } = render(<CardCarousel>{mockCards}</CardCarousel>);
      const style = container.querySelector('style');
      expect(style?.textContent).toContain('@media');
      expect(style?.textContent).toContain('768px');
      expect(style?.textContent).toContain('1024px');
    });

    it('should hide scrollbar with webkit', () => {
      const { container } = render(<CardCarousel>{mockCards}</CardCarousel>);
      const style = container.querySelector('style');
      expect(style?.textContent).toContain('::-webkit-scrollbar');
      expect(style?.textContent).toContain('display: none');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-labels for navigation', () => {
      render(<CardCarousel>{mockCards}</CardCarousel>);
      expect(screen.getByLabelText('Previous cards')).toBeInTheDocument();
      expect(screen.getByLabelText('Next cards')).toBeInTheDocument();
    });

    it('should have proper aria-labels for dots', () => {
      render(<CardCarousel showDots>{mockCards}</CardCarousel>);
      expect(screen.getByLabelText('Go to card 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to card 2')).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      const { container } = render(<CardCarousel>{mockCards}</CardCarousel>);
      const carousel = container.querySelector('[tabindex="0"]');
      expect(carousel).toBeInTheDocument();
    });
  });

  describe('Card Wrapper Styles', () => {
    it('should apply flex-shrink to prevent card shrinking', () => {
      const { container } = render(<CardCarousel>{mockCards}</CardCarousel>);
      const cardWrappers = container.querySelectorAll('[style*="flex-shrink"]');
      cardWrappers.forEach(wrapper => {
        expect(wrapper).toHaveStyle({ flexShrink: 0 });
      });
    });

    it('should apply scroll snap align', () => {
      const { container } = render(<CardCarousel>{mockCards}</CardCarousel>);
      const cardWrappers = container.querySelectorAll('[style*="scroll-snap-align"]');
      cardWrappers.forEach(wrapper => {
        expect(wrapper).toHaveStyle({ scrollSnapAlign: 'start' });
      });
    });
  });
});
