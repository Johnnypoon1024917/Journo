/**
 * Unit tests for ActivityItem component
 * 
 * Tests:
 * - Rendering with different activity data
 * - Google Maps URL generation
 * - Completion toggle functionality
 * - Click handlers
 * - Visual states (completed, dragging)
 * - Accessibility
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActivityItem } from '../ActivityItem';
import { Place } from '@/types/trip';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Helper to create a mock activity
const createMockActivity = (overrides?: Partial<Place>): Place => ({
  id: '1',
  trip_day_id: 'day-1',
  name: 'Tokyo Tower',
  address: '4 Chome-2-8 Shibakoen, Minato City, Tokyo',
  lat: 35.6586,
  lng: 139.7454,
  time_start: '10:00',
  time_end: null,
  notes: 'Great views of the city!',
  image_url: null,
  place_type: 'attraction',
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
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  calculated_arrival_time: null,
  is_syncing: false,
  sync_error: null,
  ...overrides,
});

describe('ActivityItem', () => {
  describe('Rendering', () => {
    it('renders activity name', () => {
      const activity = createMockActivity();
      render(<ActivityItem activity={activity} />);
      
      expect(screen.getByText('Tokyo Tower')).toBeInTheDocument();
    });

    it('renders time when time_start is provided', () => {
      const activity = createMockActivity({ time_start: '10:00' });
      render(<ActivityItem activity={activity} />);
      
      expect(screen.getByText('10:00')).toBeInTheDocument();
    });

    it('renders place type icon when no time_start', () => {
      const activity = createMockActivity({ time_start: null, place_type: 'food' });
      render(<ActivityItem activity={activity} />);
      
      // Check for food emoji
      expect(screen.getByText('🍜')).toBeInTheDocument();
    });

    it('renders address when provided', () => {
      const activity = createMockActivity();
      render(<ActivityItem activity={activity} />);
      
      expect(screen.getByText('4 Chome-2-8 Shibakoen, Minato City, Tokyo')).toBeInTheDocument();
    });

    it('renders notes when provided', () => {
      const activity = createMockActivity();
      render(<ActivityItem activity={activity} />);
      
      expect(screen.getByText('Great views of the city!')).toBeInTheDocument();
    });

    it('renders travel time info when provided', () => {
      const activity = createMockActivity({
        travel_time_text: '15 mins',
        travel_distance_text: '1.2 km',
      });
      render(<ActivityItem activity={activity} />);
      
      expect(screen.getByText('15 mins')).toBeInTheDocument();
      expect(screen.getByText('1.2 km')).toBeInTheDocument();
    });

    it('does not render location button when no address or coordinates', () => {
      const activity = createMockActivity({
        address: null,
        lat: null,
        lng: null,
      });
      render(<ActivityItem activity={activity} />);
      
      // Should not have "View on map" button
      expect(screen.queryByText(/View on map/i)).not.toBeInTheDocument();
    });
  });

  describe('Place Type Icons', () => {
    it('renders attraction icon', () => {
      const activity = createMockActivity({ place_type: 'attraction', time_start: null });
      render(<ActivityItem activity={activity} />);
      expect(screen.getByText('🎭')).toBeInTheDocument();
    });

    it('renders food icon', () => {
      const activity = createMockActivity({ place_type: 'food', time_start: null });
      render(<ActivityItem activity={activity} />);
      expect(screen.getByText('🍜')).toBeInTheDocument();
    });

    it('renders hotel icon', () => {
      const activity = createMockActivity({ place_type: 'hotel', time_start: null });
      render(<ActivityItem activity={activity} />);
      expect(screen.getByText('🏨')).toBeInTheDocument();
    });

    it('renders transport icon', () => {
      const activity = createMockActivity({ place_type: 'transport', time_start: null });
      render(<ActivityItem activity={activity} />);
      expect(screen.getByText('🚗')).toBeInTheDocument();
    });

    it('renders default icon for other type', () => {
      const activity = createMockActivity({ place_type: 'other', time_start: null });
      render(<ActivityItem activity={activity} />);
      expect(screen.getByText('📍')).toBeInTheDocument();
    });

    it('renders default icon for null type', () => {
      const activity = createMockActivity({ place_type: null, time_start: null });
      render(<ActivityItem activity={activity} />);
      expect(screen.getByText('📍')).toBeInTheDocument();
    });
  });

  describe('Google Maps Integration', () => {
    it('opens Google Maps with coordinates when available', () => {
      const activity = createMockActivity();
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      
      render(<ActivityItem activity={activity} />);
      
      const locationButton = screen.getByText('4 Chome-2-8 Shibakoen, Minato City, Tokyo');
      fireEvent.click(locationButton);
      
      expect(windowOpenSpy).toHaveBeenCalledWith(
        'https://www.google.com/maps/search/?api=1&query=35.6586,139.7454',
        '_blank'
      );
      
      windowOpenSpy.mockRestore();
    });

    it('opens Google Maps with address when coordinates not available', () => {
      const activity = createMockActivity({ lat: null, lng: null });
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      
      render(<ActivityItem activity={activity} />);
      
      const locationButton = screen.getByText('4 Chome-2-8 Shibakoen, Minato City, Tokyo');
      fireEvent.click(locationButton);
      
      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://www.google.com/maps/search/?api=1&query='),
        '_blank'
      );
      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('4 Chome-2-8 Shibakoen, Minato City, Tokyo')),
        '_blank'
      );
      
      windowOpenSpy.mockRestore();
    });

    it('opens Google Maps with name when no address or coordinates', () => {
      const activity = createMockActivity({ address: null, lat: null, lng: null });
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      
      // Render with coordinates to show the button
      const activityWithCoords = createMockActivity({ address: 'Test Address', lat: null, lng: null });
      render(<ActivityItem activity={activityWithCoords} />);
      
      const locationButton = screen.getByText('Test Address');
      fireEvent.click(locationButton);
      
      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://www.google.com/maps/search/?api=1&query='),
        '_blank'
      );
      
      windowOpenSpy.mockRestore();
    });

    it('does not propagate click event when location is clicked', () => {
      const activity = createMockActivity();
      const onClickSpy = vi.fn();
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      
      render(<ActivityItem activity={activity} onClick={onClickSpy} />);
      
      const locationButton = screen.getByText('4 Chome-2-8 Shibakoen, Minato City, Tokyo');
      fireEvent.click(locationButton);
      
      expect(windowOpenSpy).toHaveBeenCalled();
      expect(onClickSpy).not.toHaveBeenCalled();
      
      windowOpenSpy.mockRestore();
    });
  });

  describe('Completion Toggle', () => {
    it('renders uncompleted state by default', () => {
      const activity = createMockActivity();
      render(<ActivityItem activity={activity} />);
      
      const checkbox = screen.getByLabelText('Mark as complete');
      expect(checkbox).toBeInTheDocument();
    });

    it('renders completed state when completed prop is true', () => {
      const activity = createMockActivity();
      render(<ActivityItem activity={activity} completed={true} />);
      
      const checkbox = screen.getByLabelText('Mark as incomplete');
      expect(checkbox).toBeInTheDocument();
    });

    it('calls onCompletionToggle when checkbox is clicked', () => {
      const activity = createMockActivity();
      const onCompletionToggle = vi.fn();
      
      render(<ActivityItem activity={activity} onCompletionToggle={onCompletionToggle} />);
      
      const checkbox = screen.getByLabelText('Mark as complete');
      fireEvent.click(checkbox);
      
      expect(onCompletionToggle).toHaveBeenCalledWith(true);
    });

    it('toggles from completed to uncompleted', () => {
      const activity = createMockActivity();
      const onCompletionToggle = vi.fn();
      
      render(<ActivityItem activity={activity} completed={true} onCompletionToggle={onCompletionToggle} />);
      
      const checkbox = screen.getByLabelText('Mark as incomplete');
      fireEvent.click(checkbox);
      
      expect(onCompletionToggle).toHaveBeenCalledWith(false);
    });

    it('does not propagate click event when checkbox is clicked', () => {
      const activity = createMockActivity();
      const onClick = vi.fn();
      const onCompletionToggle = vi.fn();
      
      render(<ActivityItem activity={activity} onClick={onClick} onCompletionToggle={onCompletionToggle} />);
      
      const checkbox = screen.getByLabelText('Mark as complete');
      fireEvent.click(checkbox);
      
      expect(onCompletionToggle).toHaveBeenCalled();
      expect(onClick).not.toHaveBeenCalled();
    });

    it('applies completed styling when completed', () => {
      const activity = createMockActivity();
      const { container } = render(<ActivityItem activity={activity} completed={true} />);
      
      // Check for line-through on name
      const name = screen.getByText('Tokyo Tower');
      expect(name).toHaveClass('line-through');
    });
  });

  describe('Click Handlers', () => {
    it('calls onClick when activity card is clicked', () => {
      const activity = createMockActivity();
      const onClick = vi.fn();
      
      render(<ActivityItem activity={activity} onClick={onClick} />);
      
      const card = screen.getByText('Tokyo Tower').closest('div');
      fireEvent.click(card!);
      
      expect(onClick).toHaveBeenCalled();
    });

    it('does not add cursor-pointer class when onClick is not provided', () => {
      const activity = createMockActivity();
      const { container } = render(<ActivityItem activity={activity} />);
      
      const card = container.firstChild as HTMLElement;
      expect(card).not.toHaveClass('cursor-pointer');
    });
  });

  describe('Drag Handle', () => {
    it('shows drag handle when showDragHandle is true', () => {
      const activity = createMockActivity();
      render(<ActivityItem activity={activity} showDragHandle={true} />);
      
      // Check for Bars3Icon (drag handle)
      const dragHandle = document.querySelector('svg');
      expect(dragHandle).toBeInTheDocument();
    });

    it('does not show drag handle by default', () => {
      const activity = createMockActivity();
      const { container } = render(<ActivityItem activity={activity} />);
      
      // Should not have drag handle icon
      const dragHandles = container.querySelectorAll('.cursor-grab');
      expect(dragHandles.length).toBe(0);
    });
  });

  describe('Visual States', () => {
    it('applies dragging styles when isDragging is true', () => {
      const activity = createMockActivity();
      const { container } = render(<ActivityItem activity={activity} isDragging={true} />);
      
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('opacity-50');
      expect(card).toHaveClass('shadow-lg');
    });

    it('applies custom className', () => {
      const activity = createMockActivity();
      const { container } = render(<ActivityItem activity={activity} className="custom-class" />);
      
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA label for completion button', () => {
      const activity = createMockActivity();
      render(<ActivityItem activity={activity} />);
      
      expect(screen.getByLabelText('Mark as complete')).toBeInTheDocument();
    });

    it('has proper ARIA label for Google Maps link', () => {
      const activity = createMockActivity();
      render(<ActivityItem activity={activity} />);
      
      expect(screen.getByLabelText('Open Tokyo Tower in Google Maps')).toBeInTheDocument();
    });

    it('disables completion button when onCompletionToggle is not provided', () => {
      const activity = createMockActivity();
      render(<ActivityItem activity={activity} />);
      
      const checkbox = screen.getByLabelText('Mark as complete');
      expect(checkbox).toBeDisabled();
    });
  });
});
