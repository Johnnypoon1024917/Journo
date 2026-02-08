/**
 * CardGrid Component Tests
 * 
 * Unit tests for the CardGrid component covering:
 * - Rendering with different layouts
 * - Responsive columns
 * - Gap spacing
 * - Loading states
 * - Empty states
 * - Animation behavior
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CardGrid } from '../CardGrid';

describe('CardGrid', () => {
  const mockCards = [
    <div key="1">Card 1</div>,
    <div key="2">Card 2</div>,
    <div key="3">Card 3</div>,
  ];

  describe('Rendering', () => {
    it('should render children', () => {
      render(<CardGrid>{mockCards}</CardGrid>);
      expect(screen.getByText('Card 1')).toBeInTheDocument();
      expect(screen.getByText('Card 2')).toBeInTheDocument();
      expect(screen.getByText('Card 3')).toBeInTheDocument();
    });

    it('should render with data-testid', () => {
      render(<CardGrid data-testid="card-grid">{mockCards}</CardGrid>);
      expect(screen.getByTestId('card-grid')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<CardGrid className="custom-grid">{mockCards}</CardGrid>);
      const grid = container.querySelector('.custom-grid');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Layout Modes', () => {
    it('should render grid layout by default', () => {
      const { container } = render(<CardGrid>{mockCards}</CardGrid>);
      const grid = container.querySelector('.card-grid-responsive');
      expect(grid).toBeInTheDocument();
    });

    it('should render grid layout when specified', () => {
      const { container } = render(<CardGrid layout="grid">{mockCards}</CardGrid>);
      const grid = container.querySelector('.card-grid-responsive');
      expect(grid).toBeInTheDocument();
    });

    it('should render masonry layout when specified', () => {
      const { container } = render(<CardGrid layout="masonry">{mockCards}</CardGrid>);
      const grid = container.querySelector('.card-grid-masonry');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Gap Spacing', () => {
    it('should apply small gap', () => {
      const { container } = render(<CardGrid gap="sm">{mockCards}</CardGrid>);
      const grid = container.querySelector('[style*="gap"]') as HTMLElement;
      expect(grid).toHaveStyle({ gap: '0.5rem' });
    });

    it('should apply medium gap', () => {
      const { container } = render(<CardGrid gap="md">{mockCards}</CardGrid>);
      const grid = container.querySelector('[style*="gap"]') as HTMLElement;
      expect(grid).toHaveStyle({ gap: '1rem' });
    });

    it('should apply large gap (default)', () => {
      const { container } = render(<CardGrid gap="lg">{mockCards}</CardGrid>);
      const grid = container.querySelector('[style*="gap"]') as HTMLElement;
      expect(grid).toHaveStyle({ gap: '1.5rem' });
    });

    it('should apply extra large gap', () => {
      const { container } = render(<CardGrid gap="xl">{mockCards}</CardGrid>);
      const grid = container.querySelector('[style*="gap"]') as HTMLElement;
      expect(grid).toHaveStyle({ gap: '2rem' });
    });
  });

  describe('Column Configuration', () => {
    it('should use default column configuration', () => {
      const { container } = render(<CardGrid>{mockCards}</CardGrid>);
      const grid = container.querySelector('[style*="grid-template-columns"]') as HTMLElement;
      expect(grid).toHaveStyle({ gridTemplateColumns: 'repeat(1, 1fr)' });
    });

    it('should apply custom column configuration', () => {
      const { container } = render(
        <CardGrid columns={{ mobile: 2, tablet: 3, desktop: 4 }}>
          {mockCards}
        </CardGrid>
      );
      const grid = container.querySelector('[style*="grid-template-columns"]') as HTMLElement;
      expect(grid).toHaveStyle({ gridTemplateColumns: 'repeat(2, 1fr)' });
    });
  });

  describe('Loading State', () => {
    it('should render skeleton cards when loading', () => {
      const { container } = render(<CardGrid loading skeletonCount={3} />);
      const skeletons = container.querySelectorAll('[style*="animation-delay"]');
      expect(skeletons.length).toBe(3);
    });

    it('should render default number of skeletons', () => {
      const { container } = render(<CardGrid loading />);
      const skeletons = container.querySelectorAll('[style*="animation-delay"]');
      expect(skeletons.length).toBe(6);
    });

    it('should not render children when loading', () => {
      render(<CardGrid loading>{mockCards}</CardGrid>);
      expect(screen.queryByText('Card 1')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should render empty state when no children', () => {
      const emptyState = <div>No cards available</div>;
      render(<CardGrid emptyState={emptyState} />);
      expect(screen.getByText('No cards available')).toBeInTheDocument();
    });

    it('should not render empty state when children exist', () => {
      const emptyState = <div>No cards available</div>;
      render(<CardGrid emptyState={emptyState}>{mockCards}</CardGrid>);
      expect(screen.queryByText('No cards available')).not.toBeInTheDocument();
      expect(screen.getByText('Card 1')).toBeInTheDocument();
    });

    it('should not render empty state when loading', () => {
      const emptyState = <div>No cards available</div>;
      render(<CardGrid loading emptyState={emptyState} />);
      expect(screen.queryByText('No cards available')).not.toBeInTheDocument();
    });

    it('should center empty state content', () => {
      const emptyState = <div>No cards available</div>;
      const { container } = render(<CardGrid emptyState={emptyState} />);
      const emptyContainer = container.querySelector('[style*="justify-content"]') as HTMLElement;
      expect(emptyContainer).toHaveStyle({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      });
    });
  });

  describe('Animation', () => {
    it('should animate entrance by default', () => {
      const { container } = render(<CardGrid>{mockCards}</CardGrid>);
      const animatedCards = container.querySelectorAll('[style*="animation"]');
      expect(animatedCards.length).toBeGreaterThan(0);
    });

    it('should not animate when animateEntrance is false', () => {
      const { container } = render(<CardGrid animateEntrance={false}>{mockCards}</CardGrid>);
      const cards = container.querySelectorAll('[style*="animation-delay"]');
      // Cards should still have animation-delay but set to 0ms
      cards.forEach(card => {
        const style = (card as HTMLElement).style;
        expect(style.animationDelay).toBe('0ms');
      });
    });

    it('should stagger animation delays', () => {
      const { container } = render(<CardGrid>{mockCards}</CardGrid>);
      const cards = container.querySelectorAll('[style*="animation-delay"]');
      
      // Check that each card has a different delay
      const delays = Array.from(cards).map(card => 
        (card as HTMLElement).style.animationDelay
      );
      
      expect(delays[0]).toBe('0ms');
      expect(delays[1]).toBe('50ms');
      expect(delays[2]).toBe('100ms');
    });
  });

  describe('Masonry Layout', () => {
    it('should use auto-fit for masonry layout', () => {
      const { container } = render(<CardGrid layout="masonry">{mockCards}</CardGrid>);
      const grid = container.querySelector('[style*="grid-template-columns"]') as HTMLElement;
      expect(grid.style.gridTemplateColumns).toContain('auto-fit');
    });

    it('should use custom min card width for masonry', () => {
      const { container } = render(
        <CardGrid layout="masonry" minCardWidth="300px">
          {mockCards}
        </CardGrid>
      );
      const grid = container.querySelector('[style*="grid-template-columns"]') as HTMLElement;
      expect(grid.style.gridTemplateColumns).toContain('300px');
    });

    it('should apply dense grid flow for masonry', () => {
      const { container } = render(<CardGrid layout="masonry">{mockCards}</CardGrid>);
      const grid = container.querySelector('[style*="grid-auto-flow"]') as HTMLElement;
      expect(grid).toHaveStyle({ gridAutoFlow: 'dense' });
    });
  });

  describe('Responsive Behavior', () => {
    it('should include responsive CSS classes', () => {
      const { container } = render(<CardGrid>{mockCards}</CardGrid>);
      const style = container.querySelector('style');
      expect(style?.textContent).toContain('@media');
      expect(style?.textContent).toContain('card-grid-responsive');
    });

    it('should define breakpoint styles', () => {
      const { container } = render(<CardGrid>{mockCards}</CardGrid>);
      const style = container.querySelector('style');
      expect(style?.textContent).toContain('640px'); // sm breakpoint
      expect(style?.textContent).toContain('1024px'); // lg breakpoint
    });
  });

  describe('Grid Display', () => {
    it('should use CSS grid display', () => {
      const { container } = render(<CardGrid>{mockCards}</CardGrid>);
      const grid = container.querySelector('[style*="display"]') as HTMLElement;
      expect(grid).toHaveStyle({ display: 'grid' });
    });

    it('should set width to 100%', () => {
      const { container } = render(<CardGrid>{mockCards}</CardGrid>);
      const grid = container.querySelector('[style*="width"]') as HTMLElement;
      expect(grid).toHaveStyle({ width: '100%' });
    });
  });

  describe('Children Handling', () => {
    it('should handle single child', () => {
      render(<CardGrid><div>Single Card</div></CardGrid>);
      expect(screen.getByText('Single Card')).toBeInTheDocument();
    });

    it('should handle multiple children', () => {
      render(<CardGrid>{mockCards}</CardGrid>);
      expect(screen.getByText('Card 1')).toBeInTheDocument();
      expect(screen.getByText('Card 2')).toBeInTheDocument();
      expect(screen.getByText('Card 3')).toBeInTheDocument();
    });

    it('should handle empty children array', () => {
      const { container } = render(<CardGrid>{[]}</CardGrid>);
      const grid = container.querySelector('[style*="display"]');
      // Should render empty state or nothing
      expect(grid).toBeTruthy();
    });
  });
});
