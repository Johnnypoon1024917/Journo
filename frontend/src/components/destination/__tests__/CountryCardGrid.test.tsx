/**
 * CountryCardGrid Component Tests
 * 
 * Unit tests for the CountryCardGrid component covering:
 * - Grid rendering with various country counts
 * - Responsive layout at different viewports
 * - Keyboard navigation
 * - Loading and empty states
 * 
 * Requirements: 5.1, 5.4, 5.5, 11.1
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CountryCardGrid } from '../CountryCardGrid';
import { CountryRecommendation } from '../../../types/countryRecommendation';

describe('CountryCardGrid Component', () => {
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

  describe('Rendering', () => {
    it('renders grid with countries', () => {
      render(<CountryCardGrid countries={mockCountries} />);
      
      expect(screen.getByText('Japan')).toBeInTheDocument();
      expect(screen.getByText('Iceland')).toBeInTheDocument();
      expect(screen.getByText('Morocco')).toBeInTheDocument();
    });

    it('renders correct number of country cards', () => {
      render(<CountryCardGrid countries={mockCountries} />);
      
      // Check that all 3 countries are rendered by their names
      expect(screen.getByText('Japan')).toBeInTheDocument();
      expect(screen.getByText('Iceland')).toBeInTheDocument();
      expect(screen.getByText('Morocco')).toBeInTheDocument();
    });

    it('renders single country', () => {
      render(<CountryCardGrid countries={[mockCountries[0]]} />);
      
      expect(screen.getByText('Japan')).toBeInTheDocument();
      expect(screen.queryByText('Iceland')).not.toBeInTheDocument();
    });

    it('renders many countries', () => {
      const manyCountries = Array.from({ length: 20 }, (_, i) => ({
        ...mockCountries[0],
        id: `${i}`,
        country_name: `Country ${i}`
      }));
      
      render(<CountryCardGrid countries={manyCountries} />);
      
      // Verify the grid has the correct aria-label
      const grid = screen.getByRole('list', { name: '20 country recommendations' });
      expect(grid).toBeInTheDocument();
      
      // Check a few country names are rendered
      expect(screen.getByText('Country 0')).toBeInTheDocument();
      expect(screen.getByText('Country 10')).toBeInTheDocument();
      expect(screen.getByText('Country 19')).toBeInTheDocument();
    });

    it('has proper ARIA label with country count', () => {
      render(<CountryCardGrid countries={mockCountries} />);
      
      const grid = screen.getByRole('list', { name: '3 country recommendations' });
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('renders loading skeletons when isLoading is true', () => {
      render(<CountryCardGrid countries={[]} isLoading={true} />);
      
      const loadingContainer = screen.getByRole('status', { name: 'Loading country recommendations' });
      expect(loadingContainer).toBeInTheDocument();
    });

    it('does not render countries when loading', () => {
      render(<CountryCardGrid countries={mockCountries} isLoading={true} />);
      
      expect(screen.queryByText('Japan')).not.toBeInTheDocument();
      expect(screen.queryByText('Iceland')).not.toBeInTheDocument();
    });

    it('renders 6 loading skeleton cards', () => {
      const { container } = render(<CountryCardGrid countries={[]} isLoading={true} />);
      
      // Count skeleton cards by their animate-pulse class
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons).toHaveLength(6);
    });

    it('has aria-live="polite" for loading state', () => {
      render(<CountryCardGrid countries={[]} isLoading={true} />);
      
      const loadingContainer = screen.getByRole('status');
      expect(loadingContainer).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Empty State', () => {
    it('renders empty state when no countries', () => {
      render(<CountryCardGrid countries={[]} />);
      
      expect(screen.getByText('No destinations found')).toBeInTheDocument();
    });

    it('shows helpful message in empty state', () => {
      render(<CountryCardGrid countries={[]} />);
      
      expect(screen.getByText(/Try adjusting your travel month/)).toBeInTheDocument();
    });

    it('has proper ARIA attributes for empty state', () => {
      render(<CountryCardGrid countries={[]} />);
      
      const emptyState = screen.getByRole('status');
      expect(emptyState).toHaveAttribute('aria-live', 'polite');
    });

    it('does not render empty state when loading', () => {
      render(<CountryCardGrid countries={[]} isLoading={true} />);
      
      expect(screen.queryByText('No destinations found')).not.toBeInTheDocument();
    });

    it('does not render empty state when countries exist', () => {
      render(<CountryCardGrid countries={mockCountries} />);
      
      expect(screen.queryByText('No destinations found')).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onCountrySelect when a country card is clicked', async () => {
      const user = userEvent.setup();
      const onCountrySelect = vi.fn();
      
      render(<CountryCardGrid countries={mockCountries} onCountrySelect={onCountrySelect} />);
      
      const japanCard = screen.getByRole('button', { name: /Japan/ });
      await user.click(japanCard);
      
      expect(onCountrySelect).toHaveBeenCalledWith(mockCountries[0]);
    });

    it('passes onCountrySelect to all country cards', async () => {
      const user = userEvent.setup();
      const onCountrySelect = vi.fn();
      
      render(<CountryCardGrid countries={mockCountries} onCountrySelect={onCountrySelect} />);
      
      const japanCard = screen.getByRole('button', { name: /Japan/ });
      const icelandCard = screen.getByRole('button', { name: /Iceland/ });
      
      await user.click(japanCard);
      expect(onCountrySelect).toHaveBeenCalledWith(mockCountries[0]);
      
      await user.click(icelandCard);
      expect(onCountrySelect).toHaveBeenCalledWith(mockCountries[1]);
    });

    it('does not make cards clickable when onCountrySelect is not provided', () => {
      render(<CountryCardGrid countries={mockCountries} />);
      
      // Cards should be articles, not buttons
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.getAllByRole('article')).toHaveLength(3);
    });
  });

  describe('Keyboard Navigation', () => {
    it('allows keyboard navigation between cards', async () => {
      const user = userEvent.setup();
      const onCountrySelect = vi.fn();
      
      render(<CountryCardGrid countries={mockCountries} onCountrySelect={onCountrySelect} />);
      
      const cards = screen.getAllByRole('button');
      
      // Tab to first card
      await user.tab();
      expect(cards[0]).toHaveFocus();
      
      // Tab to second card
      await user.tab();
      expect(cards[1]).toHaveFocus();
      
      // Tab to third card
      await user.tab();
      expect(cards[2]).toHaveFocus();
    });

    it('activates card with Enter key', async () => {
      const user = userEvent.setup();
      const onCountrySelect = vi.fn();
      
      render(<CountryCardGrid countries={mockCountries} onCountrySelect={onCountrySelect} />);
      
      const firstCard = screen.getAllByRole('button')[0];
      firstCard.focus();
      
      await user.keyboard('{Enter}');
      
      expect(onCountrySelect).toHaveBeenCalledWith(mockCountries[0]);
    });

    it('activates card with Space key', async () => {
      const user = userEvent.setup();
      const onCountrySelect = vi.fn();
      
      render(<CountryCardGrid countries={mockCountries} onCountrySelect={onCountrySelect} />);
      
      const firstCard = screen.getAllByRole('button')[0];
      firstCard.focus();
      
      await user.keyboard(' ');
      
      expect(onCountrySelect).toHaveBeenCalledWith(mockCountries[0]);
    });
  });

  describe('Responsive Layout', () => {
    it('applies responsive grid classes', () => {
      render(<CountryCardGrid countries={mockCountries} />);
      
      const grid = screen.getByRole('list', { name: '3 country recommendations' });
      expect(grid.className).toContain('grid-cols-1');
      expect(grid.className).toContain('sm:grid-cols-2');
      expect(grid.className).toContain('lg:grid-cols-3');
      expect(grid.className).toContain('xl:grid-cols-4');
    });

    it('applies gap between cards', () => {
      render(<CountryCardGrid countries={mockCountries} />);
      
      const grid = screen.getByRole('list', { name: '3 country recommendations' });
      expect(grid.className).toContain('gap-6');
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined onCountrySelect gracefully', () => {
      expect(() => {
        render(<CountryCardGrid countries={mockCountries} />);
      }).not.toThrow();
    });

    it('handles isLoading default value', () => {
      render(<CountryCardGrid countries={mockCountries} />);
      
      // Should show countries, not loading state
      expect(screen.getByText('Japan')).toBeInTheDocument();
    });

    it('renders correctly with empty avoid_months', () => {
      const countriesWithoutAvoidMonths = mockCountries.map(c => ({
        ...c,
        avoid_months: []
      }));
      
      render(<CountryCardGrid countries={countriesWithoutAvoidMonths} />);
      
      expect(screen.getByText('Japan')).toBeInTheDocument();
    });

    it('renders correctly with single best_month', () => {
      const countriesWithSingleMonth = [{
        ...mockCountries[0],
        best_months: [6]
      }];
      
      render(<CountryCardGrid countries={countriesWithSingleMonth} />);
      
      expect(screen.getByText('Jun')).toBeInTheDocument();
    });
  });
});
