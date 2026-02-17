/**
 * DayCard Component Tests
 * 
 * Tests for the DayCard component functionality.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DayCard } from '../DayCard';
import { TripDayWithPlaces, DailyForecast, Place } from '@/types/trip';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'dayCard.day': 'Day',
        'dayCard.hotel': 'Hotel',
        'dayCard.flights': 'Flights',
        'dayCard.activities': 'Activities',
        'dayCard.noActivities': 'No activities planned yet',
      };
      return translations[key] || key;
    },
  }),
}));

describe('DayCard', () => {
  const mockForecast: DailyForecast = {
    date: '2024-03-15',
    temperature_high: 22,
    temperature_low: 15,
    condition: 'Partly Cloudy',
    precipitation_probability: 20,
    icon: 'partly-cloudy',
  };

  const createMockPlace = (overrides: Partial<Place> = {}): Place => ({
    id: 'place-1',
    trip_day_id: 'day-1',
    name: 'Test Place',
    address: '123 Test St',
    lat: 35.6595,
    lng: 139.7004,
    time_start: '10:00',
    time_end: '12:00',
    notes: 'Test notes',
    image_url: null,
    place_type: 'attraction',
    sticker: null,
    cost: 1000,
    cost_currency: 'JPY',
    budget_category: 'activities',
    transport_mode: null,
    travel_time_seconds: null,
    travel_distance_meters: null,
    travel_time_text: null,
    travel_distance_text: null,
    display_order: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    calculated_arrival_time: null,
    is_syncing: false,
    sync_error: null,
    ...overrides,
  });

  const createMockDay = (places: Place[] = []): TripDayWithPlaces => ({
    id: 'day-1',
    trip_id: 'trip-1',
    day_number: 1,
    date: '2024-03-15',
    created_at: '2024-01-01T00:00:00Z',
    places,
  });

  it('renders day number and date', () => {
    const day = createMockDay();
    render(<DayCard day={day} />);

    // Check for day number in the header (combined text)
    expect(screen.getByText(/Day\s+1/)).toBeInTheDocument();
    expect(screen.getByText(/Friday, March 15, 2024/)).toBeInTheDocument();
  });

  it.skip('renders weather widget when forecast is provided', () => {
    const day = createMockDay();
    render(<DayCard day={day} forecast={mockForecast} />);

    // WeatherWidget should be rendered (we can check for temperature or condition)
    // This is a basic check - the WeatherWidget has its own tests
    expect(screen.getByText(/22°/)).toBeInTheDocument();
  });

  it('does not render weather widget when forecast is not provided', () => {
    const day = createMockDay();
    render(<DayCard day={day} />);

    // Should not show temperature
    expect(screen.queryByText(/22°/)).not.toBeInTheDocument();
  });

  it('renders hotel section when hotel place exists', () => {
    const hotel = createMockPlace({
      id: 'hotel-1',
      name: 'Test Hotel',
      place_type: 'hotel',
    });
    const day = createMockDay([hotel]);
    render(<DayCard day={day} />);

    expect(screen.getByText('Hotel')).toBeInTheDocument();
  });

  it('expands hotel section when clicked', () => {
    const hotel = createMockPlace({
      id: 'hotel-1',
      name: 'Test Hotel',
      address: '123 Hotel St',
      place_type: 'hotel',
    });
    const day = createMockDay([hotel]);
    render(<DayCard day={day} />);

    const hotelButton = screen.getByText('Hotel').closest('button');
    expect(hotelButton).toBeInTheDocument();

    // Initially, hotel details should not be visible
    expect(screen.queryByText('Test Hotel')).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(hotelButton!);

    // Now hotel details should be visible
    expect(screen.getByText('Test Hotel')).toBeInTheDocument();
  });

  it('renders flights section when flight places exist', () => {
    const flight = createMockPlace({
      id: 'flight-1',
      name: 'HKG → NRT',
      place_type: 'transport',
      transport_mode: 'flight',
    });
    const day = createMockDay([flight]);
    render(<DayCard day={day} />);

    expect(screen.getByText(/Flights/i)).toBeInTheDocument();
    expect(screen.getByText(/\(1\)/)).toBeInTheDocument();
  });

  it('renders activities section when activity places exist', () => {
    const activity = createMockPlace({
      id: 'activity-1',
      name: 'Test Activity',
      place_type: 'attraction',
    });
    const day = createMockDay([activity]);
    render(<DayCard day={day} />);

    expect(screen.getByText(/Activities/i)).toBeInTheDocument();
    expect(screen.getByText(/\(1\)/)).toBeInTheDocument();
  });

  it('renders activity details in expanded activities section', () => {
    const activity = createMockPlace({
      id: 'activity-1',
      name: 'Test Activity',
      address: '123 Activity St',
      place_type: 'attraction',
    });
    const day = createMockDay([activity]);
    render(<DayCard day={day} />);

    // Activities section is expanded by default
    expect(screen.getByText('Test Activity')).toBeInTheDocument();
    expect(screen.getByText('123 Activity St')).toBeInTheDocument();
  });

  it('calls onActivityClick when activity is clicked', () => {
    const activity = createMockPlace({
      id: 'activity-1',
      name: 'Test Activity',
      place_type: 'attraction',
    });
    const day = createMockDay([activity]);
    const onActivityClick = vi.fn();

    render(<DayCard day={day} onActivityClick={onActivityClick} />);

    const activityCard = screen.getByText('Test Activity').closest('div');
    fireEvent.click(activityCard!);

    expect(onActivityClick).toHaveBeenCalledWith(activity);
  });

  it('renders empty state when no places exist', () => {
    const day = createMockDay([]);
    render(<DayCard day={day} />);

    expect(screen.getByText('No activities planned yet')).toBeInTheDocument();
  });

  it('separates hotel, flights, and activities correctly', () => {
    const hotel = createMockPlace({
      id: 'hotel-1',
      name: 'Test Hotel',
      place_type: 'hotel',
    });
    const flight = createMockPlace({
      id: 'flight-1',
      name: 'Test Flight',
      place_type: 'transport',
      transport_mode: 'flight',
    });
    const activity = createMockPlace({
      id: 'activity-1',
      name: 'Test Activity',
      place_type: 'attraction',
    });
    const day = createMockDay([hotel, flight, activity]);
    render(<DayCard day={day} />);

    // All sections should be present
    expect(screen.getByText('Hotel')).toBeInTheDocument();
    expect(screen.getByText(/Flights/i)).toBeInTheDocument();
    expect(screen.getByText(/Activities/i)).toBeInTheDocument();

    // Activity should be visible (expanded by default)
    expect(screen.getByText('Test Activity')).toBeInTheDocument();
  });

  it('opens Google Maps when hotel address is clicked', () => {
    const hotel = createMockPlace({
      id: 'hotel-1',
      name: 'Test Hotel',
      address: '123 Hotel St',
      lat: 35.6595,
      lng: 139.7004,
      place_type: 'hotel',
    });
    const day = createMockDay([hotel]);

    // Mock window.open
    const originalOpen = window.open;
    window.open = vi.fn();

    render(<DayCard day={day} />);

    // Expand hotel section
    const hotelButton = screen.getByText('Hotel').closest('button');
    fireEvent.click(hotelButton!);

    // Click on address
    const addressLink = screen.getByText('123 Hotel St');
    fireEvent.click(addressLink);

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('google.com/maps'),
      '_blank'
    );

    // Restore window.open
    window.open = originalOpen;
  });

  it('opens Google Maps when activity address is clicked', () => {
    const activity = createMockPlace({
      id: 'activity-1',
      name: 'Test Activity',
      address: '123 Activity St',
      lat: 35.6595,
      lng: 139.7004,
      place_type: 'attraction',
    });
    const day = createMockDay([activity]);

    // Mock window.open
    const originalOpen = window.open;
    window.open = vi.fn();

    render(<DayCard day={day} />);

    // Click on address (activities are expanded by default)
    const addressLink = screen.getByText('123 Activity St');
    fireEvent.click(addressLink);

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('google.com/maps'),
      '_blank'
    );

    // Restore window.open
    window.open = originalOpen;
  });

  it('displays activity time when available', () => {
    const activity = createMockPlace({
      id: 'activity-1',
      name: 'Test Activity',
      time_start: '10:00',
      place_type: 'attraction',
    });
    const day = createMockDay([activity]);
    render(<DayCard day={day} />);

    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  it('displays activity notes when available', () => {
    const activity = createMockPlace({
      id: 'activity-1',
      name: 'Test Activity',
      notes: 'Important notes',
      place_type: 'attraction',
    });
    const day = createMockDay([activity]);
    render(<DayCard day={day} />);

    expect(screen.getByText('Important notes')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const day = createMockDay();
    const { container } = render(<DayCard day={day} className="custom-class" />);

    const card = container.querySelector('.custom-class');
    expect(card).toBeInTheDocument();
  });
});
