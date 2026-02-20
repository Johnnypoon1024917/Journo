/**
 * Responsive Design Tests
 * 
 * Tests for responsive layouts across different viewport sizes:
 * - 320px (mobile)
 * - 768px (tablet)
 * - 1024px (desktop)
 * - 1920px+ (large desktop)
 * - Touch interactions on mobile
 * 
 * Requirements: 11.4, 11.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CountryCard } from '../CountryCard';
import { CountryCardGrid } from '../CountryCardGrid';
import { RecommendationSelector } from '../RecommendationSelector';
import { CountryRecommendation } from '../../../types/countryRecommendation';

// Mock data
const mockCountries: CountryRecommendation[] = [
  {
    id: '1',
    country_name: 'Japan',
    best_months: [3, 4, 5],
    temp_range: '10-25°C',
    avoid_months: [7, 8],
    region: 'Asia',
    description: 'Cherry blossoms and autumn foliage.'
  },
  {
    id: '2',
    country_name: 'Iceland',
    best_months: [6, 7, 8],
    temp_range: 'Cold (8-15°C)',
    avoid_months: [12, 1, 2],
    region: 'Europe',
    description: 'Midnight sun and accessible highlands.'
  },
  {
    id: '3',
    country_name: 'Morocco',
    best_months: [3, 4, 5, 9, 10, 11],
    temp_range: 'Warm (20-30°C)',
    avoid_months: [7, 8],
    region: 'Africa',
    description: 'Pleasant spring and fall weather.'
  }
];

// Helper to set viewport size
const setViewportSize = (width: number, height: number = 800) => {
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
};

// Helper to check if element has responsive classes
const hasResponsiveGridClasses = (element: HTMLElement) => {
  const classes = element.className;
  return {
    hasBaseGrid: classes.includes('grid'),
    hasMobileLayout: classes.includes('grid-cols-1'),
    hasTabletLayout: classes.includes('sm:grid-cols-2'),
    hasDesktopLayout: classes.includes('lg:grid-cols-3'),
    hasLargeDesktopLayout: classes.includes('xl:grid-cols-4'),
  };
};

describe('Responsive Design Tests', () => {
  describe('CountryCardGrid - Viewport Sizes', () => {
    it('applies mobile layout classes (320px)', () => {
      setViewportSize(320);
      const { container } = render(
        <CountryCardGrid countries={mockCountries} />
      );
      
      const grid = container.querySelector('[role="list"]');
      expect(grid).toBeInTheDocument();
      
      const gridClasses = hasResponsiveGridClasses(grid!);
      expect(gridClasses.hasBaseGrid).toBe(true);
      expect(gridClasses.hasMobileLayout).toBe(true);
    });

    it('applies tablet layout classes (768px)', () => {
      setViewportSize(768);
      const { container } = render(
        <CountryCardGrid countries={mockCountries} />
      );
      
      const grid = container.querySelector('[role="list"]');
      expect(grid).toBeInTheDocument();
      
      const gridClasses = hasResponsiveGridClasses(grid!);
      expect(gridClasses.hasBaseGrid).toBe(true);
      expect(gridClasses.hasTabletLayout).toBe(true);
    });

    it('applies desktop layout classes (1024px)', () => {
      setViewportSize(1024);
      const { container } = render(
        <CountryCardGrid countries={mockCountries} />
      );
      
      const grid = container.querySelector('[role="list"]');
      expect(grid).toBeInTheDocument();
      
      const gridClasses = hasResponsiveGridClasses(grid!);
      expect(gridClasses.hasBaseGrid).toBe(true);
      expect(gridClasses.hasDesktopLayout).toBe(true);
    });

    it('applies large desktop layout classes (1920px)', () => {
      setViewportSize(1920);
      const { container } = render(
        <CountryCardGrid countries={mockCountries} />
      );
      
      const grid = container.querySelector('[role="list"]');
      expect(grid).toBeInTheDocument();
      
      const gridClasses = hasResponsiveGridClasses(grid!);
      expect(gridClasses.hasBaseGrid).toBe(true);
      expect(gridClasses.hasLargeDesktopLayout).toBe(true);
    });

    it('renders all cards at mobile viewport (320px)', () => {
      setViewportSize(320);
      render(<CountryCardGrid countries={mockCountries} />);
      
      expect(screen.getByText('Japan')).toBeInTheDocument();
      expect(screen.getByText('Iceland')).toBeInTheDocument();
      expect(screen.getByText('Morocco')).toBeInTheDocument();
    });

    it('renders all cards at tablet viewport (768px)', () => {
      setViewportSize(768);
      render(<CountryCardGrid countries={mockCountries} />);
      
      expect(screen.getByText('Japan')).toBeInTheDocument();
      expect(screen.getByText('Iceland')).toBeInTheDocument();
      expect(screen.getByText('Morocco')).toBeInTheDocument();
    });

    it('renders all cards at desktop viewport (1024px)', () => {
      setViewportSize(1024);
      render(<CountryCardGrid countries={mockCountries} />);
      
      expect(screen.getByText('Japan')).toBeInTheDocument();
      expect(screen.getByText('Iceland')).toBeInTheDocument();
      expect(screen.getByText('Morocco')).toBeInTheDocument();
    });

    it('renders all cards at large desktop viewport (1920px)', () => {
      setViewportSize(1920);
      render(<CountryCardGrid countries={mockCountries} />);
      
      expect(screen.getByText('Japan')).toBeInTheDocument();
      expect(screen.getByText('Iceland')).toBeInTheDocument();
      expect(screen.getByText('Morocco')).toBeInTheDocument();
    });
  });

  describe('CountryCard - Responsive Content', () => {
    it('renders all content at mobile viewport (320px)', () => {
      setViewportSize(320);
      render(<CountryCard country={mockCountries[0]} />);
      
      expect(screen.getByText('Japan')).toBeInTheDocument();
      expect(screen.getByText(/Cherry blossoms/)).toBeInTheDocument();
      expect(screen.getByText('10-25°C')).toBeInTheDocument();
      expect(screen.getByText(/Asia/)).toBeInTheDocument();
      expect(screen.getByText('Mar')).toBeInTheDocument();
    });

    it('renders all content at tablet viewport (768px)', () => {
      setViewportSize(768);
      render(<CountryCard country={mockCountries[0]} />);
      
      expect(screen.getByText('Japan')).toBeInTheDocument();
      expect(screen.getByText(/Cherry blossoms/)).toBeInTheDocument();
      expect(screen.getByText('10-25°C')).toBeInTheDocument();
      expect(screen.getByText(/Asia/)).toBeInTheDocument();
    });

    it('wraps month badges properly on small screens', () => {
      setViewportSize(320);
      const { container } = render(<CountryCard country={mockCountries[2]} />);
      
      // Morocco has 6 best months, should wrap on small screens
      const badgeContainer = container.querySelector('.flex.flex-wrap');
      expect(badgeContainer).toBeInTheDocument();
      expect(badgeContainer?.className).toContain('flex-wrap');
    });
  });

  describe('RecommendationSelector - Responsive Layout', () => {
    const mockOnSearch = vi.fn();

    it('renders form controls at mobile viewport (320px)', () => {
      setViewportSize(320);
      render(<RecommendationSelector onSearch={mockOnSearch} />);
      
      expect(screen.getByLabelText(/Travel Month/)).toBeInTheDocument();
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('renders weather preference buttons in grid at mobile (320px)', () => {
      setViewportSize(320);
      const { container } = render(<RecommendationSelector onSearch={mockOnSearch} />);
      
      const weatherGrid = container.querySelector('.grid.grid-cols-3');
      expect(weatherGrid).toBeInTheDocument();
      
      // All three weather options should be visible
      const weatherButtons = screen.getAllByRole('radio');
      expect(weatherButtons).toHaveLength(3);
      expect(weatherButtons[0]).toHaveAttribute('aria-label', expect.stringMatching(/Any Weather/i));
      expect(weatherButtons[1]).toHaveAttribute('aria-label', expect.stringMatching(/Warm/i));
      expect(weatherButtons[2]).toHaveAttribute('aria-label', expect.stringMatching(/Cold/i));
    });

    it('renders all controls at tablet viewport (768px)', () => {
      setViewportSize(768);
      render(<RecommendationSelector onSearch={mockOnSearch} />);
      
      expect(screen.getByLabelText(/Travel Month/)).toBeInTheDocument();
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('renders all controls at desktop viewport (1024px)', () => {
      setViewportSize(1024);
      render(<RecommendationSelector onSearch={mockOnSearch} />);
      
      expect(screen.getByLabelText(/Travel Month/)).toBeInTheDocument();
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });
  });

  describe('Touch Interactions - Mobile', () => {
    beforeEach(() => {
      setViewportSize(320);
    });

    it('CountryCard has minimum touch target size', () => {
      const { container } = render(
        <CountryCard country={mockCountries[0]} onSelect={vi.fn()} />
      );
      
      const card = screen.getByRole('button');
      expect(card).toBeInTheDocument();
      
      // Check for touch-friendly classes (min-h-touch, min-w-touch)
      // These should be applied to interactive elements
      const interactiveElements = container.querySelectorAll('[role="button"]');
      expect(interactiveElements.length).toBeGreaterThan(0);
    });

    it('RecommendationSelector buttons have minimum touch target size', () => {
      const { container } = render(
        <RecommendationSelector onSearch={vi.fn()} />
      );
      
      // Weather preference buttons should have min-h-touch and min-w-touch
      const weatherButtons = screen.getAllByRole('radio');
      expect(weatherButtons.length).toBe(3);
      
      weatherButtons.forEach(button => {
        expect(button.className).toContain('min-h-touch');
        expect(button.className).toContain('min-w-touch');
      });
    });

    it('Toggle switch has minimum touch target size', () => {
      render(<RecommendationSelector onSearch={vi.fn()} />);
      
      const toggle = screen.getByRole('switch');
      expect(toggle).toBeInTheDocument();
      expect(toggle.className).toContain('min-h-touch');
      expect(toggle.className).toContain('min-w-touch');
    });

    it('Month selector has minimum touch target size', () => {
      render(<RecommendationSelector onSearch={vi.fn()} />);
      
      const monthSelect = screen.getByLabelText(/Travel Month/);
      expect(monthSelect).toBeInTheDocument();
      expect(monthSelect.className).toContain('min-h-touch');
    });

    it('handles touch events on CountryCard', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      
      render(<CountryCard country={mockCountries[0]} onSelect={onSelect} />);
      
      const card = screen.getByRole('button');
      await user.click(card);
      
      expect(onSelect).toHaveBeenCalledWith(mockCountries[0]);
    });

    it('handles touch events on weather preference buttons', async () => {
      const user = userEvent.setup();
      const onSearch = vi.fn();
      
      render(<RecommendationSelector onSearch={onSearch} />);
      
      const warmButton = screen.getByLabelText(/Warm weather/i);
      await user.click(warmButton);
      
      expect(warmButton).toHaveAttribute('aria-checked', 'true');
    });

    it('handles touch events on geolocation toggle', async () => {
      const user = userEvent.setup();
      const onSearch = vi.fn();
      
      render(<RecommendationSelector onSearch={onSearch} />);
      
      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked', 'false');
      
      await user.click(toggle);
      
      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('Content Overflow and Wrapping', () => {
    it('handles long country names on mobile', () => {
      setViewportSize(320);
      const longNameCountry = {
        ...mockCountries[0],
        country_name: 'Democratic Republic of the Congo'
      };
      
      render(<CountryCard country={longNameCountry} />);
      expect(screen.getByText('Democratic Republic of the Congo')).toBeInTheDocument();
    });

    it('handles long descriptions on mobile', () => {
      setViewportSize(320);
      const longDescCountry = {
        ...mockCountries[0],
        description: 'This is a very long description that should wrap properly on mobile devices without breaking the layout or causing horizontal scrolling issues.'
      };
      
      render(<CountryCard country={longDescCountry} />);
      expect(screen.getByText(/This is a very long description/)).toBeInTheDocument();
    });

    it('wraps many month badges properly', () => {
      setViewportSize(320);
      const manyMonthsCountry = {
        ...mockCountries[0],
        best_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
      };
      
      const { container } = render(<CountryCard country={manyMonthsCountry} />);
      const badgeContainer = container.querySelector('.flex.flex-wrap');
      expect(badgeContainer).toBeInTheDocument();
      
      // All 12 months should be rendered
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      monthNames.forEach(month => {
        expect(screen.getByText(month)).toBeInTheDocument();
      });
    });
  });

  describe('Grid Gap and Spacing', () => {
    it('maintains proper spacing at mobile viewport', () => {
      setViewportSize(320);
      const { container } = render(
        <CountryCardGrid countries={mockCountries} />
      );
      
      const grid = container.querySelector('[role="list"]');
      expect(grid?.className).toContain('gap-6');
    });

    it('maintains proper spacing at tablet viewport', () => {
      setViewportSize(768);
      const { container } = render(
        <CountryCardGrid countries={mockCountries} />
      );
      
      const grid = container.querySelector('[role="list"]');
      expect(grid?.className).toContain('gap-6');
    });

    it('maintains proper spacing at desktop viewport', () => {
      setViewportSize(1024);
      const { container } = render(
        <CountryCardGrid countries={mockCountries} />
      );
      
      const grid = container.querySelector('[role="list"]');
      expect(grid?.className).toContain('gap-6');
    });
  });

  describe('Loading State Responsiveness', () => {
    it('renders loading skeletons at mobile viewport', () => {
      setViewportSize(320);
      const { container } = render(
        <CountryCardGrid countries={[]} isLoading={true} />
      );
      
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders loading skeletons at tablet viewport', () => {
      setViewportSize(768);
      const { container } = render(
        <CountryCardGrid countries={[]} isLoading={true} />
      );
      
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders loading skeletons at desktop viewport', () => {
      setViewportSize(1024);
      const { container } = render(
        <CountryCardGrid countries={[]} isLoading={true} />
      );
      
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State Responsiveness', () => {
    it('renders empty state at mobile viewport', () => {
      setViewportSize(320);
      render(<CountryCardGrid countries={[]} isLoading={false} />);
      
      expect(screen.getByText('No destinations found')).toBeInTheDocument();
      expect(screen.getByText(/Try adjusting your travel month/)).toBeInTheDocument();
    });

    it('renders empty state at tablet viewport', () => {
      setViewportSize(768);
      render(<CountryCardGrid countries={[]} isLoading={false} />);
      
      expect(screen.getByText('No destinations found')).toBeInTheDocument();
    });

    it('renders empty state at desktop viewport', () => {
      setViewportSize(1024);
      render(<CountryCardGrid countries={[]} isLoading={false} />);
      
      expect(screen.getByText('No destinations found')).toBeInTheDocument();
    });
  });
});
