/**
 * ShoppingScreen Component Tests
 * 
 * Tests for the kawaii shopping screen page component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ShoppingScreen } from '../ShoppingScreen';
import { useEnhancedAuthStore } from '@/stores/enhancedAuthStore';
import { tripService } from '@/services/tripService';
import { shoppingService } from '@/services/shoppingService';

// Mock modules
vi.mock('@/stores/authStore');
vi.mock('@/services/tripService');
vi.mock('@/services/shoppingService');
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));
vi.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: () => false, // Desktop by default
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

describe('ShoppingScreen', () => {
  const mockTrip = {
    id: 'test-trip-id',
    title: 'Test Trip',
    destination: 'Tokyo',
    start_date: '2024-03-01',
    end_date: '2024-03-10',
    owner_id: 'user-1',
    is_public: false,
    is_community: false,
    share_token: 'test-token',
    currency_code: 'USD',
    theme: 'default' as const,
    cover_image_url: null,
    total_budget: null,
    weather_data: null,
    likes_count: 0,
    views_count: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockShoppingItems = [
    {
      id: 'item-1',
      trip_id: 'test-trip-id',
      name: 'Sunscreen',
      store: 'Pharmacy',
      image: null,
      tags: ['重要' as const],
      checked: false,
      priority: 'important' as const,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'item-2',
      trip_id: 'test-trip-id',
      name: 'Snacks',
      store: 'Supermarket',
      image: null,
      tags: ['寄食' as const],
      checked: true,
      priority: 'normal' as const,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  const mockStats = {
    toBuy: 1,
    bought: 1,
    total: 2,
  };

  const mockFilterOptions = [
    { id: 'all', label: 'All Items', count: 2 },
    { id: 'general', label: '一般', tag: '一般' as const, count: 0 },
    { id: 'food', label: '寄食', tag: '寄食' as const, count: 1 },
    { id: 'clothing', label: '服飾', tag: '服飾' as const, count: 0 },
    { id: 'important', label: '重要', tag: '重要' as const, count: 1 },
    { id: 'other', label: '其他', tag: '其他' as const, count: 0 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock auth store
    vi.mocked(useEnhancedAuthStore).mockReturnValue({
      accessToken: 'test-token',
      logout: vi.fn(),
    } as any);

    // Mock trip service
    vi.mocked(tripService.getTripById).mockResolvedValue({
      success: true,
      data: mockTrip,
    } as any);

    // Mock shopping service
    vi.mocked(shoppingService.getShoppingItems).mockResolvedValue({
      success: true,
      data: mockShoppingItems,
    });

    vi.mocked(shoppingService.getShoppingStats).mockResolvedValue({
      success: true,
      data: mockStats,
    });

    vi.mocked(shoppingService.getFilterOptions).mockResolvedValue(
      mockFilterOptions
    );
  });

  it('renders loading state initially', async () => {
    render(
      <BrowserRouter>
        <ShoppingScreen />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Test Trip')).toBeInTheDocument();
    });
  });

  it('renders shopping screen with trip title and stats', async () => {
    render(
      <BrowserRouter>
        <ShoppingScreen />
      </BrowserRouter>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Test Trip')).toBeInTheDocument();
    });

    // Should display shopping title
    expect(screen.getByText('shopping.title')).toBeInTheDocument();

    // Should display stats (component renders the stats)
    await waitFor(() => {
      const statsElements = screen.getAllByText('1');
      expect(statsElements.length).toBeGreaterThan(0);
    });
  });

  it('renders shopping items list', async () => {
    render(
      <BrowserRouter>
        <ShoppingScreen />
      </BrowserRouter>
    );

    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByText('Sunscreen')).toBeInTheDocument();
      expect(screen.getByText('Snacks')).toBeInTheDocument();
    });
  });

  it('renders filter dropdown', async () => {
    render(
      <BrowserRouter>
        <ShoppingScreen />
      </BrowserRouter>
    );

    // Wait for filter to appear
    await waitFor(() => {
      expect(screen.getByLabelText('shopping.filter')).toBeInTheDocument();
    });
  });

  it('renders empty state when no items', async () => {
    // Mock empty items
    vi.mocked(shoppingService.getShoppingItems).mockResolvedValue({
      success: true,
      data: [],
    });

    vi.mocked(shoppingService.getShoppingStats).mockResolvedValue({
      success: true,
      data: { toBuy: 0, bought: 0, total: 0 },
    });

    render(
      <BrowserRouter>
        <ShoppingScreen />
      </BrowserRouter>
    );

    // Wait for empty state
    await waitFor(() => {
      expect(screen.getByText('shopping.noItems')).toBeInTheDocument();
    });

    // Should show emoji
    expect(screen.getByText('🛍️')).toBeInTheDocument();
  });

  it('renders FAB for adding items', async () => {
    render(
      <BrowserRouter>
        <ShoppingScreen />
      </BrowserRouter>
    );

    // Wait for FAB to appear
    await waitFor(() => {
      expect(screen.getByLabelText('shopping.addItem')).toBeInTheDocument();
    });
  });

  it('handles error state', async () => {
    // Mock error
    vi.mocked(tripService.getTripById).mockRejectedValue(
      new Error('Failed to load trip')
    );

    render(
      <BrowserRouter>
        <ShoppingScreen />
      </BrowserRouter>
    );

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText('Failed to load trip')).toBeInTheDocument();
    });

    // Should show sad emoji
    expect(screen.getByText('😢')).toBeInTheDocument();
  });

  it('renders navigation components', async () => {
    render(
      <BrowserRouter>
        <ShoppingScreen />
      </BrowserRouter>
    );

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText('Test Trip')).toBeInTheDocument();
    });

    // Should render side navigation (desktop)
    expect(document.querySelector('.fixed.left-0')).toBeInTheDocument();
  });
});
