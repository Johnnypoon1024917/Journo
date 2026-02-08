/**
 * WeatherWidget Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeatherWidget } from '../WeatherWidget';
import type { DailyForecast } from '@/types/trip';

describe('WeatherWidget', () => {
  const mockForecast: DailyForecast = {
    date: '2026-01-14',
    temp_high: 12,
    temp_low: 4,
    condition: 'Partly Cloudy',
    precipitation_chance: 20,
  };

  it('renders weather information correctly', () => {
    render(<WeatherWidget forecast={mockForecast} />);
    
    expect(screen.getByText('12°C')).toBeInTheDocument();
    expect(screen.getByText(/4°C/)).toBeInTheDocument();
    expect(screen.getByText('Partly Cloudy')).toBeInTheDocument();
  });

  it('renders compact version', () => {
    render(<WeatherWidget forecast={mockForecast} compact />);
    
    expect(screen.getByText('12°C')).toBeInTheDocument();
    expect(screen.getByText(/4°C/)).toBeInTheDocument();
  });

  it('shows no data message when forecast is missing', () => {
    render(<WeatherWidget />);
    
    expect(screen.getByText(/no.*data/i)).toBeInTheDocument();
  });

  it('displays precipitation chance when available', () => {
    render(<WeatherWidget forecast={mockForecast} />);
    
    expect(screen.getByText(/20%/)).toBeInTheDocument();
  });
});
