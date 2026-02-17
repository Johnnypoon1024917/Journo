import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PresenceIndicator } from '../PresenceIndicator';
import { EditingIndicator } from '../EditingIndicator';
import { ConnectionStatusIndicator } from '../ConnectionStatusIndicator';
import { useRealtimeStore } from '../../../stores/realtimeStore';
import { useSocket } from '../../../hooks/useSocket';

// Mock the hooks
vi.mock('../../../hooks/useSocket', () => ({
  useSocket: vi.fn(),
}));

vi.mock('../../../stores/realtimeStore', () => ({
  useRealtimeStore: vi.fn(),
}));

describe('Collaboration Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PresenceIndicator', () => {
    it('should not render when no viewers', () => {
      (useRealtimeStore as any).mockReturnValue(undefined);
      
      const { container } = render(<PresenceIndicator tripId="trip-123" />);
      expect(container.firstChild).toBeNull();
    });

    it('should render viewer count', () => {
      (useRealtimeStore as any).mockReturnValue({
        viewerCount: 2,
        viewers: [
          { userId: '1', userEmail: 'user1@example.com' },
          { userId: '2', userEmail: 'user2@example.com' },
        ],
      });
      
      render(<PresenceIndicator tripId="trip-123" />);
      expect(screen.getByText(/2 viewers/i)).toBeInTheDocument();
    });

    it('should render single viewer text', () => {
      (useRealtimeStore as any).mockReturnValue({
        viewerCount: 1,
        viewers: [
          { userId: '1', userEmail: 'user1@example.com' },
        ],
      });
      
      render(<PresenceIndicator tripId="trip-123" />);
      expect(screen.getByText(/1 viewer/i)).toBeInTheDocument();
    });

    it('should show viewer initials', () => {
      (useRealtimeStore as any).mockReturnValue({
        viewerCount: 1,
        viewers: [
          { userId: '1', userEmail: 'john.doe@example.com' },
        ],
      });
      
      render(<PresenceIndicator tripId="trip-123" />);
      expect(screen.getByText('JO')).toBeInTheDocument();
    });
  });

  describe('EditingIndicator', () => {
    it('should not render when no one is editing', () => {
      (useRealtimeStore as any).mockReturnValue(vi.fn(() => undefined));
      
      const { container } = render(
        <EditingIndicator tripId="trip-123" itemId="item-456" />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render when someone is editing', () => {
      const mockGetUserEditingItem = vi.fn(() => ({
        userId: 'user-123',
        userEmail: 'john@example.com',
        userName: 'John Doe',
        itemId: 'item-456',
        itemType: 'activity',
        startedAt: new Date(),
      }));
      
      (useRealtimeStore as any).mockReturnValue(mockGetUserEditingItem);
      
      render(<EditingIndicator tripId="trip-123" itemId="item-456" />);
      expect(screen.getByText(/John Doe is editing/i)).toBeInTheDocument();
    });

    it('should use email as fallback for name', () => {
      const mockGetUserEditingItem = vi.fn(() => ({
        userId: 'user-123',
        userEmail: 'john.doe@example.com',
        itemId: 'item-456',
        itemType: 'activity',
        startedAt: new Date(),
      }));
      
      (useRealtimeStore as any).mockReturnValue(mockGetUserEditingItem);
      
      render(<EditingIndicator tripId="trip-123" itemId="item-456" />);
      expect(screen.getByText(/john\.doe is editing/i)).toBeInTheDocument();
    });
  });

  describe('ConnectionStatusIndicator', () => {
    it('should not render when connected by default', () => {
      (useSocket as any).mockReturnValue({
        connectionState: 'connected',
        reconnect: vi.fn(),
      });
      
      const { container } = render(<ConnectionStatusIndicator />);
      expect(container.firstChild).toBeNull();
    });

    it('should render when connected if showWhenConnected is true', () => {
      (useSocket as any).mockReturnValue({
        connectionState: 'connected',
        reconnect: vi.fn(),
      });
      
      render(<ConnectionStatusIndicator showWhenConnected={true} />);
      expect(screen.getByText(/connected/i)).toBeInTheDocument();
    });

    it('should render connecting state', () => {
      (useSocket as any).mockReturnValue({
        connectionState: 'connecting',
        reconnect: vi.fn(),
      });
      
      render(<ConnectionStatusIndicator />);
      expect(screen.getByText(/connecting/i)).toBeInTheDocument();
    });

    it('should render reconnecting state with retry button', () => {
      (useSocket as any).mockReturnValue({
        connectionState: 'reconnecting',
        reconnect: vi.fn(),
      });
      
      render(<ConnectionStatusIndicator />);
      expect(screen.getByText(/reconnecting/i)).toBeInTheDocument();
      expect(screen.getByText(/retry/i)).toBeInTheDocument();
    });

    it('should render disconnected state with retry button', () => {
      (useSocket as any).mockReturnValue({
        connectionState: 'disconnected',
        reconnect: vi.fn(),
      });
      
      render(<ConnectionStatusIndicator />);
      expect(screen.getByText(/disconnected/i)).toBeInTheDocument();
      expect(screen.getByText(/retry/i)).toBeInTheDocument();
    });
  });
});
