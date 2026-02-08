/**
 * TravelCard Component Tests
 * 
 * Unit tests for the TravelCard component covering:
 * - Rendering with different props
 * - Variants and sizes
 * - Interactive behaviors
 * - Loading states
 * - Accessibility
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { TravelCard } from '../TravelCard';

describe('TravelCard', () => {
  const defaultProps = {
    title: 'Paris, France',
    description: 'The City of Light awaits with its iconic landmarks and rich culture.',
    image: 'https://example.com/paris.jpg',
    imageAlt: 'Eiffel Tower in Paris',
  };

  describe('Rendering', () => {
    it('should render with required props', () => {
      render(<TravelCard title="Paris" />);
      expect(screen.getByText('Paris')).toBeInTheDocument();
    });

    it('should render with all props', () => {
      render(
        <TravelCard
          {...defaultProps}
          category="City"
          rating={4.5}
          priceLevel={3}
        />
      );

      expect(screen.getByText('Paris, France')).toBeInTheDocument();
      expect(screen.getByText('The City of Light awaits with its iconic landmarks and rich culture.')).toBeInTheDocument();
      expect(screen.getByText('City')).toBeInTheDocument();
      expect(screen.getByText('4.5')).toBeInTheDocument();
    });

    it('should render image with correct alt text', () => {
      render(<TravelCard {...defaultProps} />);
      const image = screen.getByAltText('Eiffel Tower in Paris');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/paris.jpg');
    });

    it('should render without image', () => {
      render(<TravelCard title="Paris" description="A beautiful city" />);
      expect(screen.getByText('Paris')).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('should render footer content', () => {
      const footer = <div>Footer Content</div>;
      render(<TravelCard title="Paris" footer={footer} />);
      expect(screen.getByText('Footer Content')).toBeInTheDocument();
    });

    it('should render badge content', () => {
      const badge = <span>New</span>;
      render(<TravelCard {...defaultProps} badge={badge} />);
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('should render children content', () => {
      render(
        <TravelCard title="Paris">
          <div>Custom Content</div>
        </TravelCard>
      );
      expect(screen.getByText('Custom Content')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should render default variant', () => {
      const { container } = render(<TravelCard title="Paris" variant="default" />);
      const card = container.firstChild as HTMLElement;
      expect(card).toBeInTheDocument();
    });

    it('should render elevated variant', () => {
      const { container } = render(<TravelCard title="Paris" variant="elevated" />);
      const card = container.firstChild as HTMLElement;
      expect(card).toBeInTheDocument();
    });

    it('should render outlined variant', () => {
      const { container } = render(<TravelCard title="Paris" variant="outlined" />);
      const card = container.firstChild as HTMLElement;
      expect(card).toBeInTheDocument();
    });

    it('should render minimal variant', () => {
      const { container } = render(<TravelCard title="Paris" variant="minimal" />);
      const card = container.firstChild as HTMLElement;
      expect(card).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('should render small size', () => {
      render(<TravelCard title="Paris" size="sm" />);
      const title = screen.getByText('Paris');
      expect(title).toHaveStyle({ fontSize: '1rem' });
    });

    it('should render medium size (default)', () => {
      render(<TravelCard title="Paris" size="md" />);
      const title = screen.getByText('Paris');
      expect(title).toHaveStyle({ fontSize: '1.25rem' });
    });

    it('should render large size', () => {
      render(<TravelCard title="Paris" size="lg" />);
      const title = screen.getByText('Paris');
      expect(title).toHaveStyle({ fontSize: '1.5rem' });
    });
  });

  describe('Interactive Behavior', () => {
    it('should call onClick when interactive card is clicked', () => {
      const handleClick = vi.fn();
      render(<TravelCard title="Paris" interactive onClick={handleClick} />);
      
      const card = screen.getByRole('button');
      fireEvent.click(card);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when non-interactive card is clicked', () => {
      const handleClick = vi.fn();
      render(<TravelCard title="Paris" onClick={handleClick} />);
      
      const card = screen.getByText('Paris').closest('div');
      if (card) {
        fireEvent.click(card);
      }
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should call onClick on Enter key press when interactive', () => {
      const handleClick = vi.fn();
      render(<TravelCard title="Paris" interactive onClick={handleClick} />);
      
      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'Enter' });
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick on Space key press when interactive', () => {
      const handleClick = vi.fn();
      render(<TravelCard title="Paris" interactive onClick={handleClick} />);
      
      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: ' ' });
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should have cursor pointer when interactive', () => {
      const { container } = render(<TravelCard title="Paris" interactive />);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveStyle({ cursor: 'pointer' });
    });

    it('should have cursor default when not interactive', () => {
      const { container } = render(<TravelCard title="Paris" />);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveStyle({ cursor: 'default' });
    });
  });

  describe('Favorite Functionality', () => {
    it('should render favorite button when onFavorite is provided', () => {
      const handleFavorite = vi.fn();
      render(<TravelCard {...defaultProps} onFavorite={handleFavorite} />);
      
      const favoriteButton = screen.getByLabelText('Add to favorites');
      expect(favoriteButton).toBeInTheDocument();
    });

    it('should call onFavorite when favorite button is clicked', () => {
      const handleFavorite = vi.fn();
      render(<TravelCard {...defaultProps} onFavorite={handleFavorite} />);
      
      const favoriteButton = screen.getByLabelText('Add to favorites');
      fireEvent.click(favoriteButton);
      
      expect(handleFavorite).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when favorite button is clicked', () => {
      const handleClick = vi.fn();
      const handleFavorite = vi.fn();
      render(
        <TravelCard
          {...defaultProps}
          interactive
          onClick={handleClick}
          onFavorite={handleFavorite}
        />
      );
      
      const favoriteButton = screen.getByLabelText('Add to favorites');
      fireEvent.click(favoriteButton);
      
      expect(handleFavorite).toHaveBeenCalledTimes(1);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should show filled heart when favorited', () => {
      render(<TravelCard {...defaultProps} onFavorite={() => {}} isFavorite />);
      const favoriteButton = screen.getByLabelText('Remove from favorites');
      expect(favoriteButton).toBeInTheDocument();
      expect(favoriteButton.textContent).toBe('♥');
    });

    it('should show empty heart when not favorited', () => {
      render(<TravelCard {...defaultProps} onFavorite={() => {}} isFavorite={false} />);
      const favoriteButton = screen.getByLabelText('Add to favorites');
      expect(favoriteButton).toBeInTheDocument();
      expect(favoriteButton.textContent).toBe('♡');
    });
  });

  describe('Rating Display', () => {
    it('should render rating stars', () => {
      render(<TravelCard title="Paris" rating={4.5} />);
      expect(screen.getByText('4.5')).toBeInTheDocument();
    });

    it('should not render rating when not provided', () => {
      render(<TravelCard title="Paris" />);
      expect(screen.queryByText(/\d\.\d/)).not.toBeInTheDocument();
    });

    it('should render correct number of filled stars', () => {
      const { container } = render(<TravelCard title="Paris" rating={3} />);
      const stars = container.querySelectorAll('span');
      // Count filled stars (those with the yellow color)
      const filledStars = Array.from(stars).filter(
        star => star.textContent === '★' && star.style.color !== ''
      );
      expect(filledStars.length).toBeGreaterThan(0);
    });
  });

  describe('Price Level Display', () => {
    it('should render price level indicators', () => {
      const { container } = render(<TravelCard title="Paris" priceLevel={3} />);
      const dollarSigns = Array.from(container.querySelectorAll('span')).filter(
        span => span.textContent === '$'
      );
      expect(dollarSigns.length).toBeGreaterThan(0);
    });

    it('should not render price level when not provided', () => {
      const { container } = render(<TravelCard title="Paris" />);
      const dollarSigns = Array.from(container.querySelectorAll('span')).filter(
        span => span.textContent === '$'
      );
      expect(dollarSigns.length).toBe(0);
    });
  });

  describe('Loading State', () => {
    it('should render skeleton when loading', () => {
      const { container } = render(<TravelCard title="Paris" loading />);
      // Check for skeleton elements (they have the shimmer animation style)
      const skeletons = container.querySelectorAll('[style*="linear-gradient"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should not render content when loading', () => {
      render(<TravelCard title="Paris" description="Test" loading />);
      expect(screen.queryByText('Paris')).not.toBeInTheDocument();
      expect(screen.queryByText('Test')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have role="button" when interactive', () => {
      render(<TravelCard title="Paris" interactive />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should not have role="button" when not interactive', () => {
      render(<TravelCard title="Paris" />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should have tabIndex when interactive', () => {
      render(<TravelCard title="Paris" interactive />);
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('should have proper aria-label for favorite button', () => {
      render(<TravelCard {...defaultProps} onFavorite={() => {}} />);
      expect(screen.getByLabelText('Add to favorites')).toBeInTheDocument();
    });

    it('should have proper aria-label for favorited button', () => {
      render(<TravelCard {...defaultProps} onFavorite={() => {}} isFavorite />);
      expect(screen.getByLabelText('Remove from favorites')).toBeInTheDocument();
    });

    it('should support data-testid', () => {
      render(<TravelCard title="Paris" data-testid="travel-card" />);
      expect(screen.getByTestId('travel-card')).toBeInTheDocument();
    });
  });

  describe('Aspect Ratio', () => {
    it('should apply default 16/9 aspect ratio', () => {
      const { container } = render(<TravelCard {...defaultProps} />);
      const imageContainer = container.querySelector('[style*="aspect-ratio"]');
      expect(imageContainer).toBeTruthy();
      if (imageContainer) {
        expect(imageContainer).toHaveStyle({ aspectRatio: '16/9' });
      }
    });

    it('should apply custom aspect ratio', () => {
      const { container } = render(<TravelCard {...defaultProps} aspectRatio="1/1" />);
      const imageContainer = container.querySelector('[style*="aspect-ratio"]');
      expect(imageContainer).toBeTruthy();
      if (imageContainer) {
        expect(imageContainer).toHaveStyle({ aspectRatio: '1/1' });
      }
    });
  });

  describe('Category Display', () => {
    it('should render category with uppercase styling', () => {
      render(<TravelCard title="Paris" category="City" />);
      const category = screen.getByText('City');
      expect(category).toBeInTheDocument();
      expect(category).toHaveStyle({ textTransform: 'uppercase' });
    });

    it('should not render category when not provided', () => {
      render(<TravelCard title="Paris" />);
      expect(screen.queryByText('City')).not.toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(<TravelCard title="Paris" className="custom-class" />);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('custom-class');
    });
  });
});
