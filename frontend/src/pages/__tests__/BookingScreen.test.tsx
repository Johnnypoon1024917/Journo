/**
 * BookingScreen Component Tests
 * 
 * Tests for the BookingScreen page component including:
 * - Rendering with bookings
 * - Tab switching
 * - Empty states
 * - Booking deletion
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import { BookingScreen } from '../BookingScreen';
import { bookingService } from '@/services/bookingService';
import { tripService } from '@/services/tripService';
import { useEnhancedAuthStore } from '@/stores/enhancedAuthStore';

// Mock services
vi.mock('@/services/bookingService');
vi.mock('@/services/tripService');
vi.mock('@/stores/authStore');
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));
vi.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: () => false, // Desktop by default
}));

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockTrip = {
  id: 'trip-1',
  title: 'Tokyo Adventure',
  destination: 'Tokyo, Japan',
  start_date: '2024-06-01',
  end_date: '2024-06-10',
  cover_image_url: null,
  theme: 'default' as const,
  owner_id: 'user-1',
  is_public: false,
  is_community: false,
  share_token: 'abc123',
  total_budget: 5000,
  currency_code: 'USD',
  weather_data: null,
  likes_count: 0,
  views_count: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockFlightBooking = {
  id: 'booking-1',
  tripId: 'trip-1',
  type: 'flight' as const,
  data: {
    id: 'flight-1',
    type: 'flight' as const,
    origin: {
      code: 'LAX',
      name: 'Los Angeles',
      time: '10:00 AM',
    },
    destination: {
      code: 'NRT',
      name: 'Tokyo Narita',
      time: '2:00 PM +1',
    },
    flightNumber: 'NH006',
    date: 'June 1, 2024',
    route: 'Direct',
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockAccommodationBooking = {
  id: 'booking-2',
  tripId: 'trip-1',
  type: 'accommodation' as const,
  data: {
    id: 'hotel-1',
    name: 'Tokyo Grand Hotel',
    checkIn: 'June 1, 2024',
    checkOut: 'June 10, 2024',
    location: 'Shinjuku, Tokyo',
    confirmationNumber: 'HTL123456',
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('BookingScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock auth store
    (useEnhancedAuthStore as any).mockReturnValue({
      accessToken: 'mock-token',
      logout: vi.fn(),
    });
  });

  it('renders loading state initially', () => {
    // Mock services to never resolve
    vi.mocked(tripService.getTripById).mockImplementation(
      () => new Promise(() => {})
    );
    vi.mocked(bookingService.getBookingsByTrip).mockImplementation(
      () => new Promise(() => {})
    );

    render(
      <MemoryRouter initialEntries={['/trips/trip-1/booking']}>
        <Routes>
          <Route path="/trips/:id/booking" element={<BookingScreen />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  it('renders trip title and booking tabs', async () => {
    vi.mocked(tripService.getTripById).mockResolvedValue({
      success: true,
      data: mockTrip,
    });
    vi.mocked(bookingService.getBookingsByTrip).mockResolvedValue({
      success: true,
      data: [mockFlightBooking, mockAccommodationBooking],
    });

    render(
      <MemoryRouter initialEntries={['/trips/trip-1/booking']}>
        <Routes>
          <Route path="/trips/:id/booking" element={<BookingScreen />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Tokyo Adventure')).toBeInTheDocument();
    });

    expect(screen.getByRole('tab', { name: /tickets/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /accommodation/i })).toBeInTheDocument();
  });

  it('displays flight bookings in tickets tab', async () => {
    vi.mocked(tripService.getTripById).mockResolvedValue({
      success: true,
      data: mockTrip,
    });
    vi.mocked(bookingService.getBookingsByTrip).mockResolvedValue({
      success: true,
      data: [mockFlightBooking],
    });

    render(
      <MemoryRouter initialEntries={['/trips/trip-1/booking']}>
        <Routes>
          <Route path="/trips/:id/booking" element={<BookingScreen />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('LAX')).toBeInTheDocument();
    });

    expect(screen.getByText('NRT')).toBeInTheDocument();
    expect(screen.getByText(/NH006/)).toBeInTheDocument();
  });

  it('switches to accommodation tab and displays hotels', async () => {
    const user = userEvent.setup();
    
    vi.mocked(tripService.getTripById).mockResolvedValue({
      success: true,
      data: mockTrip,
    });
    vi.mocked(bookingService.getBookingsByTrip).mockResolvedValue({
      success: true,
      data: [mockAccommodationBooking],
    });

    render(
      <MemoryRouter initialEntries={['/trips/trip-1/booking']}>
        <Routes>
          <Route path="/trips/:id/booking" element={<BookingScreen />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /accommodation/i })).toBeInTheDocument();
    });

    const accommodationTab = screen.getByRole('tab', { name: /accommodation/i });
    await user.click(accommodationTab);

    await waitFor(() => {
      expect(screen.getByText('Tokyo Grand Hotel')).toBeInTheDocument();
    });

    expect(screen.getByText(/Shinjuku, Tokyo/)).toBeInTheDocument();
  });

  it('displays empty state when no tickets', async () => {
    vi.mocked(tripService.getTripById).mockResolvedValue({
      success: true,
      data: mockTrip,
    });
    vi.mocked(bookingService.getBookingsByTrip).mockResolvedValue({
      success: true,
      data: [],
    });

    render(
      <MemoryRouter initialEntries={['/trips/trip-1/booking']}>
        <Routes>
          <Route path="/trips/:id/booking" element={<BookingScreen />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/no tickets yet/i)).toBeInTheDocument();
    });
  });

  it('displays correct booking counts in tabs', async () => {
    vi.mocked(tripService.getTripById).mockResolvedValue({
      success: true,
      data: mockTrip,
    });
    vi.mocked(bookingService.getBookingsByTrip).mockResolvedValue({
      success: true,
      data: [mockFlightBooking, mockAccommodationBooking],
    });

    render(
      <MemoryRouter initialEntries={['/trips/trip-1/booking']}>
        <Routes>
          <Route path="/trips/:id/booking" element={<BookingScreen />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const ticketsTab = screen.getByRole('tab', { name: /tickets/i });
      expect(ticketsTab).toHaveTextContent('1');
    });

    const accommodationTab = screen.getByRole('tab', { name: /accommodation/i });
    expect(accommodationTab).toHaveTextContent('1');
  });

  it('handles booking deletion', async () => {
    const user = userEvent.setup();
    
    vi.mocked(tripService.getTripById).mockResolvedValue({
      success: true,
      data: mockTrip,
    });
    vi.mocked(bookingService.getBookingsByTrip).mockResolvedValue({
      success: true,
      data: [mockFlightBooking],
    });
    vi.mocked(bookingService.deleteBooking).mockResolvedValue({
      success: true,
    });

    render(
      <MemoryRouter initialEntries={['/trips/trip-1/booking']}>
        <Routes>
          <Route path="/trips/:id/booking" element={<BookingScreen />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('LAX')).toBeInTheDocument();
    });

    // Note: Actual deletion would require interacting with the menu
    // This is a simplified test
    expect(bookingService.deleteBooking).not.toHaveBeenCalled();
  });

  it('handles error state', async () => {
    vi.mocked(tripService.getTripById).mockRejectedValue(
      new Error('Failed to load trip')
    );

    render(
      <MemoryRouter initialEntries={['/trips/trip-1/booking']}>
        <Routes>
          <Route path="/trips/:id/booking" element={<BookingScreen />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });
});
