/**
 * HotelCard Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HotelCard } from '../HotelCard';

describe('HotelCard', () => {
  it('renders hotel name correctly', () => {
    render(<HotelCard name="Hotel IL Cuore Namba" />);
    
    expect(screen.getByText('Hotel IL Cuore Namba')).toBeInTheDocument();
  });

  it('displays address when provided', () => {
    render(
      <HotelCard
        name="Hotel IL Cuore Namba"
        address="1-2-3 Namba, Chuo-ku, Osaka"
      />
    );
    
    expect(screen.getByText(/1-2-3 Namba/)).toBeInTheDocument();
  });

  it('shows check-in and check-out times', () => {
    render(
      <HotelCard
        name="Hotel IL Cuore Namba"
        checkIn="15:00"
        checkOut="11:00"
      />
    );
    
    expect(screen.getByText(/15:00/)).toBeInTheDocument();
    expect(screen.getByText(/11:00/)).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<HotelCard name="Hotel IL Cuore Namba" onClick={handleClick} />);
    
    fireEvent.click(screen.getByText('Hotel IL Cuore Namba'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('displays hotel emoji', () => {
    render(<HotelCard name="Hotel IL Cuore Namba" />);
    
    expect(screen.getByText('🏨')).toBeInTheDocument();
  });
});
