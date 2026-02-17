/**
 * ActivityCard Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActivityCard } from '../ActivityCard';
import type { Place } from '@/types/trip';

describe('ActivityCard', () => {
  const mockActivity: Place = {
    id: '1',
    name: 'Osaka Castle',
    address: '1-1 Osakajo, Chuo Ward, Osaka',
    category: 'castle',
    lat: 34.6873,
    lng: 135.5262,
    place_type: 'attraction',
  };

  it('renders activity information correctly', () => {
    render(<ActivityCard activity={mockActivity} />);
    
    expect(screen.getByText('Osaka Castle')).toBeInTheDocument();
    expect(screen.getByText(/1-1 Osakajo/)).toBeInTheDocument();
  });

  it('displays time when provided', () => {
    render(<ActivityCard activity={mockActivity} time="12:45" />);
    
    expect(screen.getByText('12:45')).toBeInTheDocument();
  });

  it('formats duration correctly', () => {
    render(<ActivityCard activity={mockActivity} duration={90} />);
    
    expect(screen.getByText('1h 30min')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<ActivityCard activity={mockActivity} onClick={handleClick} />);
    
    fireEvent.click(screen.getByText('Osaka Castle'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows correct category emoji', () => {
    render(<ActivityCard activity={mockActivity} />);
    
    // Castle emoji should be present
    expect(screen.getByText('🏯')).toBeInTheDocument();
  });

  it('truncates long notes', () => {
    const activityWithNotes: Place = {
      ...mockActivity,
      notes: 'This is a very long note that should be truncated when displayed in the activity card component',
    };
    
    render(<ActivityCard activity={activityWithNotes} />);
    
    expect(screen.getByText(/This is a very long note/)).toBeInTheDocument();
  });
});
