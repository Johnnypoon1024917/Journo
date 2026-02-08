/**
 * ScheduleScreen Integration Tests
 * 
 * Tests the complete ScheduleScreen component integration including:
 * - Component rendering
 * - Trip data loading
 * - Date selection
 * - Activity interactions
 * - Navigation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ScheduleScreen } from '../ScheduleScreen';

// Mock the services
vi.mock('@/services/tripService', () => ({
  tripService: {
    getTripById: vi.fn(),
  },
}));

vi.mock('@/services/dayService', () => ({
  dayService: {
    getDaysByTrip: vi.fn(),
  },
}));

vi.mock('@/services/weatherService', () => ({
  weatherService: {
    getWeatherForTrip: vi.fn(),
  },
}));

vi.mock('@/stores/authStore', () => ({
  useEnhancedAuthStore: vi.fn(),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: () => false, // Default to desktop
}));

// Mock react-router-dom hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'test-trip-id' }),
    useNavigate: () => vi.fn(),
  };
});

// Mock Framer Motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('ScheduleScreen', () => {
  const mockTrip = {
    id: 'test-trip-id',
    title: 'Test Trip',
    destination: 'Tokyo, Japan',
    start_date: '2026-03-01',
    end_date: '2026-03-05',
    theme: 'default' as const,
    owner_id: 'user-1',
    is_public: false,
    is_community: false,
    share_token: 'test-token',
    total_budget: null,
    currency_code: 'USD',
    weather_data: null,
    likes_count: 0,
    views_count: 0,
    cover_image_url: null,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  };

  const mockDays = [
    {
      id: 'day-1',
      trip_id: 'test-trip-id',
      day_number: 1,
      date: '2026-03-01',
      created_at: '2026-01-01',
      places: [
        {
          id: 'place-1',
          trip_day_id: 'day-1',
          name: 'Tokyo Tower',
          address: '4 Chome-2-8 Shibakoen, Minato City, Tokyo',
          lat: 35.6586,
          lng: 139.7454,
          time_start: '10:00',
          time_end: '12:00',
          notes: 'Visit observation deck',
          image_url: null,
          place_type: 'attraction' as const,
          sticker: null,
          cost: null,
          cost_currency: null,
          budget_category: null,
          transport_mode: null,
          travel_time_seconds: null,
          travel_distance_meters: null,
          travel_time_text: null,
          travel_distance_text: null,
          display_order: 0,
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
          calculated_arrival_time: null,
          is_syncing: false,
          sync_error: null,
        },
      ],
    },
  ];

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const { useEnhancedAuthStore } = await import('@/stores/authStore');
    const { tripService } = await import('@/services/tripService');
    const { dayService } = await import('@/services/dayService');
    const { weatherService } = await import('@/services/weatherService');
    
    // Mock auth store
    (useEnhancedAuthStore as any).mockReturnValue({
      accessToken: 'test-token',
      logout: vi.fn(),
    });

    // Mock trip service
    (tripService.getTripById as any).mockResolvedValue({
      success: true,
      data: mockTrip,
    });

    // Mock day service
    (dayService.getDaysByTrip as any).mockResolvedValue(mockDays);

    // Mock weather service
    (weatherService.getWeatherForTrip as any).mockResolvedValue({
      success: true,
      data: {
        forecast: [
          {
            date: '2026-03-01',
            temperature_high: 15,
            temperature_low: 8,
            condition: 'Clear',
            precipitation_probability: 10,
            icon: '01d',
          },
        ],
        cached_at: '2026-01-01',
      },
    });
  });

  it('renders loading state initially', () => {
    render(
      <BrowserRouter>
        <ScheduleScreen />
      </BrowserRouter>
    );

    // Should show loading spinner (checking for the rotating div)
    const spinner = document.querySelector('[style*="rotate"]');
    expect(spinner).toBeTruthy();
  });

  it('renders trip information after loading', async () => {
    render(
      <BrowserRouter>
        <ScheduleScreen />
      </BrowserRouter>
    );

    // Wait for trip data to load
    await waitFor(() => {
      expect(screen.getByText('Test Trip')).toBeInTheDocument();
    });

    // Check destination is displayed
    expect(screen.getByText(/Tokyo, Japan/)).toBeInTheDocument();
  });

  it('renders countdown timer when trip has start date', async () => {
    render(
      <BrowserRouter>
        <ScheduleScreen />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Trip')).toBeInTheDocument();
    });

    // Countdown timer should be present (checking for "Days" label)
    expect(screen.getByText('Days')).toBeInTheDocument();
  });

  it('renders date selector with trip days', async () => {
    render(
      <BrowserRouter>
        <ScheduleScreen />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Trip')).toBeInTheDocument();
    });

    // Date selector should show the day
    expect(screen.getByText('1')).toBeInTheDocument(); // Day number
  });

  it('renders day card with activities', async () => {
    render(
      <BrowserRouter>
        <ScheduleScreen />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Trip')).toBeInTheDocument();
    });

    // Day card should show day number
    expect(screen.getByText(/Day 1/)).toBeInTheDocument();

    // Activity should be displayed
    expect(screen.getByText('Tokyo Tower')).toBeInTheDocument();
  });

  it('renders FAB for adding activities', async () => {
    render(
      <BrowserRouter>
        <ScheduleScreen />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Trip')).toBeInTheDocument();
    });

    // FAB should be present
    const fab = screen.getByLabelText(/Add Activity/i);
    expect(fab).toBeInTheDocument();
  });

  it('handles error state when trip not found', async () => {
    const { tripService } = await import('@/services/tripService');
    
    // Mock error response
    (tripService.getTripById as any).mockRejectedValue({
      status: 404,
      message: 'Trip not found',
    });

    render(
      <BrowserRouter>
        <ScheduleScreen />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Trip not found')).toBeInTheDocument();
    });

    // Should show error emoji
    expect(screen.getByText('😢')).toBeInTheDocument();

    // Should show "Go Home" button
    expect(screen.getByText('Go Home')).toBeInTheDocument();
  });

  it('handles authentication error', async () => {
    const mockLogout = vi.fn();
    const { useEnhancedAuthStore } = await import('@/stores/authStore');
    const { tripService } = await import('@/services/tripService');
    
    (useEnhancedAuthStore as any).mockReturnValue({
      accessToken: 'test-token',
      logout: mockLogout,
    });

    // Mock 401 error
    (tripService.getTripById as any).mockRejectedValue({
      status: 401,
      message: 'Invalid or expired token',
    });

    render(
      <BrowserRouter>
        <ScheduleScreen />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  it('renders empty state when no days exist', async () => {
    const { dayService } = await import('@/services/dayService');
    
    // Mock empty days
    (dayService.getDaysByTrip as any).mockResolvedValue([]);

    render(
      <BrowserRouter>
        <ScheduleScreen />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Trip')).toBeInTheDocument();
    });

    // Should show empty state
    expect(screen.getByText(/No activities planned yet/i)).toBeInTheDocument();
  });
});
