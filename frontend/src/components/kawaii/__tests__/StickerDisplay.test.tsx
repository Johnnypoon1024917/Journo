import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StickerDisplay } from '../StickerDisplay';
import { useStickerStore } from '../../../stores/stickerStore';

// Mock the sticker store
vi.mock('../../../stores/stickerStore');

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('StickerDisplay', () => {
  const mockUpdatePlacement = vi.fn();
  const mockRemovePlacement = vi.fn();
  const mockGetElementPlacements = vi.fn();

  const mockStickers = [
    {
      id: 'sticker-1',
      image: '🎒',
      category: 'activities' as const,
      tags: ['travel'],
      aiGenerated: false,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'sticker-2',
      image: '✈️',
      category: 'transportation' as const,
      tags: ['flight'],
      aiGenerated: false,
      created_at: '2024-01-01T00:00:00Z',
    },
  ];

  const mockPlacements = [
    {
      id: 'placement-1',
      stickerId: 'sticker-1',
      elementId: 'day-1',
      elementType: 'day' as const,
      position: { x: 50, y: 50 },
      rotation: 0,
      scale: 1,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'placement-2',
      stickerId: 'sticker-2',
      elementId: 'day-1',
      elementType: 'day' as const,
      position: { x: 100, y: 100 },
      rotation: 15,
      scale: 1.2,
      created_at: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    mockGetElementPlacements.mockReturnValue(mockPlacements);

    (useStickerStore as any).mockReturnValue({
      stickers: mockStickers,
      getElementPlacements: mockGetElementPlacements,
      updatePlacement: mockUpdatePlacement,
      removePlacement: mockRemovePlacement,
    });
  });

  it('renders nothing when no placements exist', () => {
    mockGetElementPlacements.mockReturnValue([]);

    const { container } = render(
      <StickerDisplay
        elementId="day-1"
        elementType="day"
        tripId="trip-1"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders stickers for element', () => {
    render(
      <StickerDisplay
        elementId="day-1"
        elementType="day"
        tripId="trip-1"
      />
    );

    expect(screen.getByText('🎒')).toBeInTheDocument();
    expect(screen.getByText('✈️')).toBeInTheDocument();
  });

  it('calls getElementPlacements with correct elementId', () => {
    render(
      <StickerDisplay
        elementId="day-1"
        elementType="day"
        tripId="trip-1"
      />
    );

    expect(mockGetElementPlacements).toHaveBeenCalledWith('day-1');
  });

  it('shows remove button when editable', () => {
    render(
      <StickerDisplay
        elementId="day-1"
        elementType="day"
        tripId="trip-1"
        editable={true}
      />
    );

    const removeButtons = screen.getAllByLabelText('Remove sticker');
    expect(removeButtons).toHaveLength(2);
  });

  it('does not show remove button when not editable', () => {
    render(
      <StickerDisplay
        elementId="day-1"
        elementType="day"
        tripId="trip-1"
        editable={false}
      />
    );

    const removeButtons = screen.queryAllByLabelText('Remove sticker');
    expect(removeButtons).toHaveLength(0);
  });

  it('calls removePlacement when remove button clicked', async () => {
    render(
      <StickerDisplay
        elementId="day-1"
        elementType="day"
        tripId="trip-1"
        editable={true}
      />
    );

    const removeButtons = screen.getAllByLabelText('Remove sticker');
    fireEvent.click(removeButtons[0]);

    expect(mockRemovePlacement).toHaveBeenCalledWith('trip-1', 'placement-1');
  });

  it('applies correct positioning styles', () => {
    const { container } = render(
      <StickerDisplay
        elementId="day-1"
        elementType="day"
        tripId="trip-1"
      />
    );

    const stickerContainers = container.querySelectorAll('.absolute');
    expect(stickerContainers.length).toBeGreaterThan(0);
  });

  it('handles missing sticker gracefully', () => {
    const placementsWithMissingSticker = [
      {
        id: 'placement-3',
        stickerId: 'non-existent-sticker',
        elementId: 'day-1',
        elementType: 'day' as const,
        position: { x: 50, y: 50 },
        rotation: 0,
        scale: 1,
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    mockGetElementPlacements.mockReturnValue(placementsWithMissingSticker);

    const { container } = render(
      <StickerDisplay
        elementId="day-1"
        elementType="day"
        tripId="trip-1"
      />
    );

    // Should render container but no sticker content
    expect(container.querySelector('.relative')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <StickerDisplay
        elementId="day-1"
        elementType="day"
        tripId="trip-1"
        className="custom-class"
      />
    );

    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});
