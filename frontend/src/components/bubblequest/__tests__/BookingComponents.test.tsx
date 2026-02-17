/**
 * Booking Components Tests
 * 
 * Tests for BoardingPassCard, AccommodationCard, and BookingTabs components.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BoardingPassCard, AccommodationCard, BookingTabs } from '../index';
import type { FlightBooking, AccommodationBooking } from '../index';

// Mock framer-motion with proper layoutId support
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, layoutId, ...props }: any, ref: any) => (
      <div ref={ref} data-layout-id={layoutId} {...props}>{children}</div>
    )),
    button: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <button ref={ref} {...props}>{children}</button>
    )),
    span: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <span ref={ref} {...props}>{children}</span>
    )),
  },
  useMotionValue: () => ({ set: vi.fn() }),
  useTransform: () => 1,
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      // Simple mock that returns the key with params interpolated
      if (params) {
        let result = key;
        Object.keys(params).forEach(param => {
          result = result.replace(`{{${param}}}`, params[param]);
        });
        return result;
      }
      return key;
    },
  }),
}));

describe('BoardingPassCard', () => {
  const mockFlight: FlightBooking = {
    id: '1',
    type: 'flight',
    origin: {
      code: 'LAX',
      name: 'Los Angeles',
      time: '10:30 AM',
    },
    destination: {
      code: 'NRT',
      name: 'Tokyo Narita',
      time: '3:45 PM',
    },
    flightNumber: 'NH175',
    date: 'March 15, 2024',
    route: 'Direct',
  };

  it('renders flight booking information', () => {
    render(<BoardingPassCard booking={mockFlight} />);
    
    expect(screen.getByText('LAX')).toBeInTheDocument();
    expect(screen.getByText('NRT')).toBeInTheDocument();
    expect(screen.getByText('10:30 AM')).toBeInTheDocument();
    expect(screen.getByText('3:45 PM')).toBeInTheDocument();
    expect(screen.getByText('March 15, 2024')).toBeInTheDocument();
  });

  it('displays flight number correctly', () => {
    render(<BoardingPassCard booking={mockFlight} />);
    
    // The component uses t('booking.flightNumber', { number: 'NH175' })
    expect(screen.getByText(/NH175/)).toBeInTheDocument();
  });

  it('shows route information when provided', () => {
    render(<BoardingPassCard booking={mockFlight} />);
    
    expect(screen.getByText('Direct')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(<BoardingPassCard booking={mockFlight} onEdit={onEdit} />);
    
    // Open menu
    const menuButton = screen.getByLabelText('Menu');
    fireEvent.click(menuButton);
    
    // Click edit
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);
    
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    render(<BoardingPassCard booking={mockFlight} onDelete={onDelete} />);
    
    // Open menu
    const menuButton = screen.getByLabelText('Menu');
    fireEvent.click(menuButton);
    
    // Click delete
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);
    
    // Wait for animation
    setTimeout(() => {
      expect(onDelete).toHaveBeenCalledTimes(1);
    }, 400);
  });

  it('renders train booking with correct type', () => {
    const trainBooking: FlightBooking = {
      ...mockFlight,
      type: 'train',
      flightNumber: 'N700S-123',
    };
    
    render(<BoardingPassCard booking={trainBooking} />);
    
    // The component uses t('booking.trainNumber', { number: 'N700S-123' })
    expect(screen.getByText(/N700S-123/)).toBeInTheDocument();
  });
});

describe('AccommodationCard', () => {
  const mockHotel: AccommodationBooking = {
    id: '1',
    name: 'Grand Hotel Tokyo',
    checkIn: 'March 15, 2024',
    checkOut: 'March 20, 2024',
    location: '1-1-1 Marunouchi, Chiyoda-ku, Tokyo',
    confirmationNumber: 'ABC123456',
    notes: 'Room with city view',
  };

  it('renders hotel information', () => {
    render(<AccommodationCard booking={mockHotel} />);
    
    expect(screen.getByText('Grand Hotel Tokyo')).toBeInTheDocument();
    expect(screen.getByText('March 15, 2024')).toBeInTheDocument();
    expect(screen.getByText('March 20, 2024')).toBeInTheDocument();
    expect(screen.getByText('1-1-1 Marunouchi, Chiyoda-ku, Tokyo')).toBeInTheDocument();
  });

  it('displays confirmation number when provided', () => {
    render(<AccommodationCard booking={mockHotel} />);
    
    // The component uses t('booking.confirmationNumber', { number: 'ABC123456' })
    expect(screen.getByText(/ABC123456/)).toBeInTheDocument();
  });

  it('displays notes when provided', () => {
    render(<AccommodationCard booking={mockHotel} />);
    
    expect(screen.getByText('Room with city view')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(<AccommodationCard booking={mockHotel} onEdit={onEdit} />);
    
    // Open menu
    const menuButton = screen.getByLabelText('Menu');
    fireEvent.click(menuButton);
    
    // Click edit
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);
    
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    render(<AccommodationCard booking={mockHotel} onDelete={onDelete} />);
    
    // Open menu
    const menuButton = screen.getByLabelText('Menu');
    fireEvent.click(menuButton);
    
    // Click delete
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);
    
    // Wait for animation
    setTimeout(() => {
      expect(onDelete).toHaveBeenCalledTimes(1);
    }, 400);
  });

  it('renders without image when not provided', () => {
    const hotelWithoutImage = { ...mockHotel, image: undefined };
    render(<AccommodationCard booking={hotelWithoutImage} />);
    
    expect(screen.getByText('Grand Hotel Tokyo')).toBeInTheDocument();
  });
});

describe('BookingTabs', () => {
  it('renders both tabs with labels', () => {
    const onTabChange = vi.fn();
    render(
      <BookingTabs
        activeTab="tickets"
        onTabChange={onTabChange}
        ticketsCount={3}
        accommodationCount={2}
      />
    );
    
    // The component uses t('booking.tickets') and t('booking.accommodation')
    expect(screen.getByText('booking.tickets')).toBeInTheDocument();
    expect(screen.getByText('booking.accommodation')).toBeInTheDocument();
  });

  it('displays count badges', () => {
    const onTabChange = vi.fn();
    render(
      <BookingTabs
        activeTab="tickets"
        onTabChange={onTabChange}
        ticketsCount={3}
        accommodationCount={2}
      />
    );
    
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('calls onTabChange when tab is clicked', () => {
    const onTabChange = vi.fn();
    render(
      <BookingTabs
        activeTab="tickets"
        onTabChange={onTabChange}
        ticketsCount={3}
        accommodationCount={2}
      />
    );
    
    const accommodationTab = screen.getByText('booking.accommodation');
    fireEvent.click(accommodationTab);
    
    expect(onTabChange).toHaveBeenCalledWith('accommodation');
  });

  it('highlights active tab', () => {
    const onTabChange = vi.fn();
    const { container } = render(
      <BookingTabs
        activeTab="tickets"
        onTabChange={onTabChange}
        ticketsCount={3}
        accommodationCount={2}
      />
    );
    
    const ticketsButton = screen.getByText('booking.tickets').closest('button');
    expect(ticketsButton).toHaveAttribute('aria-selected', 'true');
  });

  it('does not display badge when count is 0', () => {
    const onTabChange = vi.fn();
    render(
      <BookingTabs
        activeTab="tickets"
        onTabChange={onTabChange}
        ticketsCount={0}
        accommodationCount={0}
      />
    );
    
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('displays 99+ for counts over 99', () => {
    const onTabChange = vi.fn();
    render(
      <BookingTabs
        activeTab="tickets"
        onTabChange={onTabChange}
        ticketsCount={150}
        accommodationCount={2}
      />
    );
    
    expect(screen.getByText('99+')).toBeInTheDocument();
  });
});
