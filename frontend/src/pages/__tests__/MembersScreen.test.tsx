/**
 * Tests for MembersScreen
 * 
 * Tests the MembersScreen page component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import type { TripCollaboratorWithUser, TripPermissions } from '@/types/collaboration';
import type { Trip } from '@/types/trip';

// Define mock data before mocks
const mockTripData: Trip = {
  id: 'test-trip-id',
  title: 'Test Trip',
  destination: 'Tokyo',
  start_date: '2024-06-01',
  end_date: '2024-06-10',
  user_id: 'user-1',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

const mockMembersData: TripCollaboratorWithUser[] = [
  {
    id: 'collab-1',
    trip_id: 'test-trip-id',
    user_id: 'user-1',
    role: 'owner',
    invited_by: null,
    created_at: '2024-01-01',
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
    },
  },
  {
    id: 'collab-2',
    trip_id: 'test-trip-id',
    user_id: 'user-2',
    role: 'editor',
    invited_by: 'user-1',
    created_at: '2024-01-02',
    user: {
      id: 'user-2',
      name: 'Editor User',
      email: 'editor@example.com',
    },
  },
];

const mockPermissionsData: TripPermissions = {
  can_view: true,
  can_edit: true,
  can_delete: true,
  can_manage_collaborators: true,
  can_share: true,
  role: 'owner',
};

// Mock modules
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'test-trip-id' }),
    useNavigate: () => vi.fn(),
  };
});

vi.mock('@/stores/authStore', () => ({
  useEnhancedAuthStore: () => ({
    accessToken: 'test-token',
    user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
    logout: vi.fn(),
  }),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: () => false, // Desktop by default
}));

vi.mock('@/services/socketService', () => ({
  socketService: {
    isConnected: () => false,
    joinTrip: vi.fn(),
    leaveTrip: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock services
vi.mock('@/services/tripService', () => ({
  tripService: {
    getTripById: vi.fn(() => Promise.resolve({ data: mockTripData })),
  },
}));

vi.mock('@/services/collaboratorService', () => ({
  collaboratorService: {
    getTripCollaborators: vi.fn(() => Promise.resolve(mockMembersData)),
    getTripPermissions: vi.fn(() => Promise.resolve(mockPermissionsData)),
    addCollaboratorByEmail: vi.fn(),
    updateCollaboratorRole: vi.fn(),
    removeCollaborator: vi.fn(),
  },
}));

// Import component after mocks
const { MembersScreen } = await import('../MembersScreen');

describe('MembersScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(
      <BrowserRouter>
        <MembersScreen />
      </BrowserRouter>
    );

    // Should show loading spinner
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('renders members list after loading', async () => {
    render(
      <BrowserRouter>
        <MembersScreen />
      </BrowserRouter>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Test Trip')).toBeInTheDocument();
    });

    // Should display trip title
    expect(screen.getByText('Test Trip')).toBeInTheDocument();

    // Should display members title
    expect(screen.getByText('members.title')).toBeInTheDocument();
  });

  it('displays member count', async () => {
    render(
      <BrowserRouter>
        <MembersScreen />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Trip')).toBeInTheDocument();
    });

    // Should show member count
    expect(screen.getByText(/2 members/)).toBeInTheDocument();
  });

  it('renders MemberCard components for each member', async () => {
    render(
      <BrowserRouter>
        <MembersScreen />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Should display all members
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Editor User')).toBeInTheDocument();
  });
});
