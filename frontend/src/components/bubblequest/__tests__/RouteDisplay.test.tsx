/**
 * RouteDisplay Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouteDisplay } from '../RouteDisplay';

describe('RouteDisplay', () => {
  const mockStops = [
    { name: '難波' },
    { name: '梅田' },
    { name: '天満' },
  ];

  it('renders route stops correctly', () => {
    render(<RouteDisplay stops={mockStops} />);
    
    expect(screen.getByText('難波')).toBeInTheDocument();
    expect(screen.getByText('梅田')).toBeInTheDocument();
    expect(screen.getByText('天満')).toBeInTheDocument();
  });

  it('displays arrows between stops', () => {
    render(<RouteDisplay stops={mockStops} />);
    
    const arrows = screen.getAllByText('→');
    expect(arrows).toHaveLength(2); // 3 stops = 2 arrows
  });

  it('shows transport mode emoji', () => {
    render(<RouteDisplay stops={mockStops} transportMode="train" />);
    
    expect(screen.getByText('🚃')).toBeInTheDocument();
  });

  it('displays travel time when provided', () => {
    render(<RouteDisplay stops={mockStops} travelTime={45} />);
    
    expect(screen.getByText('45min')).toBeInTheDocument();
  });

  it('formats travel time in hours and minutes', () => {
    render(<RouteDisplay stops={mockStops} travelTime={90} />);
    
    expect(screen.getByText('1h 30min')).toBeInTheDocument();
  });

  it('returns null when no stops provided', () => {
    const { container } = render(<RouteDisplay stops={[]} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('shows different transport modes', () => {
    const { rerender } = render(<RouteDisplay stops={mockStops} transportMode="bus" />);
    expect(screen.getByText('🚌')).toBeInTheDocument();
    
    rerender(<RouteDisplay stops={mockStops} transportMode="car" />);
    expect(screen.getByText('🚗')).toBeInTheDocument();
    
    rerender(<RouteDisplay stops={mockStops} transportMode="walk" />);
    expect(screen.getByText('🚶')).toBeInTheDocument();
  });
});
