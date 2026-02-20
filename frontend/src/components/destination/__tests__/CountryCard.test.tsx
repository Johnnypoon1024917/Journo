/**
 * CountryCard Component Tests
 * 
 * Unit tests for the CountryCard component covering:
 * - Rendering with various country data
 * - Badge rendering for best_months
 * - Accessibility attributes
 * - Optional distance indicator
 * - Click and keyboard interactions
 * 
 * Requirements: 5.2, 5.3, 11.2
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CountryCard } from '../CountryCard';
import { CountryRecommendation } from '../../../types/countryRecommendation';

describe('CountryCard Component', () => {
  const mockCountry: CountryRecommendation = {
    id: '1',
    country_name: 'Japan',
    best_months: [3, 4, 5, 10, 11],
    temp_range: '10-25°C',
    avoid_months: [7, 8],
    region: 'Asia',
    description: 'Experience cherry blossoms in spring or vibrant autumn foliage. Avoid humid summer months.'
  };

  it('renders country name', () => {
    render(<CountryCard country={mockCountry} />);
    expect(screen.getByText('Japan')).toBeInTheDocument();
  });

  it('renders country description', () => {
    render(<CountryCard country={mockCountry} />);
    expect(screen.getByText(/Experience cherry blossoms/)).toBeInTheDocument();
  });

  it('renders temperature range', () => {
    render(<CountryCard country={mockCountry} />);
    expect(screen.getByText('10-25°C')).toBeInTheDocument();
  });

  it('renders region', () => {
    render(<CountryCard country={mockCountry} />);
    expect(screen.getByText(/Asia/)).toBeInTheDocument();
  });

  it('renders best months as badges', () => {
    render(<CountryCard country={mockCountry} />);
    
    // Check for month badges
    expect(screen.getByText('Mar')).toBeInTheDocument();
    expect(screen.getByText('Apr')).toBeInTheDocument();
    expect(screen.getByText('May')).toBeInTheDocument();
    expect(screen.getByText('Oct')).toBeInTheDocument();
    expect(screen.getByText('Nov')).toBeInTheDocument();
  });

  it('renders avoid months when present', () => {
    render(<CountryCard country={mockCountry} />);
    expect(screen.getByText(/Avoid:/)).toBeInTheDocument();
    expect(screen.getByText(/Jul, Aug/)).toBeInTheDocument();
  });

  it('does not render avoid months section when empty', () => {
    const countryWithoutAvoidMonths = {
      ...mockCountry,
      avoid_months: []
    };
    render(<CountryCard country={countryWithoutAvoidMonths} />);
    expect(screen.queryByText(/Avoid:/)).not.toBeInTheDocument();
  });

  it('renders distance indicator when provided', () => {
    render(<CountryCard country={mockCountry} distance={1234} />);
    expect(screen.getByText(/1234 km away/)).toBeInTheDocument();
  });

  it('does not render distance indicator when not provided', () => {
    render(<CountryCard country={mockCountry} />);
    expect(screen.queryByText(/km away/)).not.toBeInTheDocument();
  });

  it('calls onSelect when clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    
    render(<CountryCard country={mockCountry} onSelect={onSelect} />);
    
    const card = screen.getByRole('button');
    await user.click(card);
    
    expect(onSelect).toHaveBeenCalledWith(mockCountry);
  });

  it('calls onSelect when Enter key is pressed', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    
    render(<CountryCard country={mockCountry} onSelect={onSelect} />);
    
    const card = screen.getByRole('button');
    card.focus();
    await user.keyboard('{Enter}');
    
    expect(onSelect).toHaveBeenCalledWith(mockCountry);
  });

  it('calls onSelect when Space key is pressed', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    
    render(<CountryCard country={mockCountry} onSelect={onSelect} />);
    
    const card = screen.getByRole('button');
    card.focus();
    await user.keyboard(' ');
    
    expect(onSelect).toHaveBeenCalledWith(mockCountry);
  });

  it('has proper ARIA label', () => {
    render(<CountryCard country={mockCountry} />);
    const card = screen.getByLabelText(/Japan in Asia.*Experience cherry blossoms/);
    expect(card).toBeInTheDocument();
  });

  it('renders as button role when onSelect is provided', () => {
    render(<CountryCard country={mockCountry} onSelect={vi.fn()} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders as article role when onSelect is not provided', () => {
    render(<CountryCard country={mockCountry} />);
    expect(screen.getByRole('article')).toBeInTheDocument();
  });

  it('is keyboard focusable when clickable', () => {
    render(<CountryCard country={mockCountry} onSelect={vi.fn()} />);
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('tabIndex', '0');
  });

  it('is not keyboard focusable when not clickable', () => {
    render(<CountryCard country={mockCountry} />);
    const card = screen.getByRole('article');
    expect(card).not.toHaveAttribute('tabIndex');
  });

  it('renders all months correctly', () => {
    const countryWithAllMonths = {
      ...mockCountry,
      best_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    };
    
    render(<CountryCard country={countryWithAllMonths} />);
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    monthNames.forEach(month => {
      expect(screen.getByText(month)).toBeInTheDocument();
    });
  });

  it('handles different regions correctly', () => {
    const regions: Array<CountryRecommendation['region']> = [
      'Asia', 'Europe', 'Americas', 'Africa', 'Oceania', 'Middle East'
    ];
    
    regions.forEach(region => {
      const countryWithRegion = { ...mockCountry, region };
      const { unmount } = render(<CountryCard country={countryWithRegion} />);
      // Use regex to match text that may be split by elements (emoji)
      expect(screen.getByText(new RegExp(region))).toBeInTheDocument();
      unmount();
    });
  });
});
