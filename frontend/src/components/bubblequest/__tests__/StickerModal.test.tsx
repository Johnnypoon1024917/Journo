import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StickerModal } from '../StickerModal';
import { useStickerStore } from '../../../stores/stickerStore';

// Mock the sticker store
vi.mock('../../../stores/stickerStore');

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'stickers.selectSticker': 'Select a Sticker',
        'stickers.attach': 'Attach',
        'stickers.categories.all': 'All',
        'stickers.categories.characters': 'Characters',
        'stickers.categories.activities': 'Activities',
        'stickers.categories.transportation': 'Transportation',
        'stickers.categories.food': 'Food',
        'stickers.categories.landmarks': 'Landmarks',
        'stickers.categories.emotions': 'Emotions',
        'stickers.categories.weather': 'Weather',
        'stickers.categories.seasonal': 'Seasonal',
        'actions.close': 'Close',
        'actions.cancel': 'Cancel',
      };
      return translations[key] || key;
    },
  }),
}));

describe('StickerModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSelect = vi.fn();
  const mockLoadStickers = vi.fn();
  const mockSetCategory = vi.fn();
  const mockSelectSticker = vi.fn();
  const mockGetFilteredStickers = vi.fn();

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
    {
      id: 'sticker-3',
      image: '🍜',
      category: 'food' as const,
      tags: ['food'],
      aiGenerated: false,
      created_at: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useStickerStore as any).mockReturnValue({
      selectedCategory: 'all',
      setCategory: mockSetCategory,
      selectedSticker: null,
      selectSticker: mockSelectSticker,
      getFilteredStickers: mockGetFilteredStickers,
      loadStickers: mockLoadStickers,
      isLoading: false,
    });

    mockGetFilteredStickers.mockReturnValue(mockStickers);
  });

  it('renders modal when open', () => {
    render(
      <StickerModal
        isOpen={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
        tripId="trip-1"
      />
    );

    expect(screen.getByText('Select a Sticker')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <StickerModal
        isOpen={false}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
        tripId="trip-1"
      />
    );

    expect(screen.queryByText('Select a Sticker')).not.toBeInTheDocument();
  });

  it('loads stickers when opened', () => {
    render(
      <StickerModal
        isOpen={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
        tripId="trip-1"
      />
    );

    expect(mockLoadStickers).toHaveBeenCalledWith('trip-1');
  });

  it('displays all category tabs', () => {
    render(
      <StickerModal
        isOpen={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
        tripId="trip-1"
      />
    );

    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Characters')).toBeInTheDocument();
    expect(screen.getByText('Activities')).toBeInTheDocument();
    expect(screen.getByText('Transportation')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Landmarks')).toBeInTheDocument();
    expect(screen.getByText('Emotions')).toBeInTheDocument();
    expect(screen.getByText('Weather')).toBeInTheDocument();
    expect(screen.getByText('Seasonal')).toBeInTheDocument();
  });

  it('displays stickers in grid', () => {
    render(
      <StickerModal
        isOpen={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
        tripId="trip-1"
      />
    );

    expect(screen.getByText('🎒')).toBeInTheDocument();
    expect(screen.getByText('✈️')).toBeInTheDocument();
    expect(screen.getByText('🍜')).toBeInTheDocument();
  });

  it('changes category when tab clicked', () => {
    render(
      <StickerModal
        isOpen={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
        tripId="trip-1"
      />
    );

    const foodTab = screen.getByText('Food');
    fireEvent.click(foodTab);

    expect(mockSetCategory).toHaveBeenCalledWith('food');
  });

  it('selects sticker when clicked', () => {
    render(
      <StickerModal
        isOpen={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
        tripId="trip-1"
      />
    );

    const sticker = screen.getByText('🎒');
    fireEvent.click(sticker);

    expect(mockSelectSticker).toHaveBeenCalledWith('sticker-1');
  });

  it('calls onClose when close button clicked', () => {
    render(
      <StickerModal
        isOpen={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
        tripId="trip-1"
      />
    );

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when cancel button clicked', () => {
    render(
      <StickerModal
        isOpen={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
        tripId="trip-1"
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('disables attach button when no sticker selected', () => {
    render(
      <StickerModal
        isOpen={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
        tripId="trip-1"
      />
    );

    const attachButton = screen.getByText('Attach');
    expect(attachButton).toBeDisabled();
  });

  it('enables attach button when sticker selected', () => {
    (useStickerStore as any).mockReturnValue({
      selectedCategory: 'all',
      setCategory: mockSetCategory,
      selectedSticker: 'sticker-1',
      selectSticker: mockSelectSticker,
      getFilteredStickers: mockGetFilteredStickers,
      loadStickers: mockLoadStickers,
      isLoading: false,
    });

    render(
      <StickerModal
        isOpen={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
        tripId="trip-1"
      />
    );

    const attachButton = screen.getByText('Attach');
    expect(attachButton).not.toBeDisabled();
  });

  it('calls onSelect and onClose when attach clicked with selection', () => {
    (useStickerStore as any).mockReturnValue({
      selectedCategory: 'all',
      setCategory: mockSetCategory,
      selectedSticker: 'sticker-1',
      selectSticker: mockSelectSticker,
      getFilteredStickers: mockGetFilteredStickers,
      loadStickers: mockLoadStickers,
      isLoading: false,
    });

    render(
      <StickerModal
        isOpen={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
        tripId="trip-1"
      />
    );

    const attachButton = screen.getByText('Attach');
    fireEvent.click(attachButton);

    expect(mockOnSelect).toHaveBeenCalledWith('sticker-1');
    expect(mockSelectSticker).toHaveBeenCalledWith(null);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    (useStickerStore as any).mockReturnValue({
      selectedCategory: 'all',
      setCategory: mockSetCategory,
      selectedSticker: null,
      selectSticker: mockSelectSticker,
      getFilteredStickers: mockGetFilteredStickers,
      loadStickers: mockLoadStickers,
      isLoading: true,
    });

    render(
      <StickerModal
        isOpen={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
        tripId="trip-1"
      />
    );

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('shows empty state when no stickers', () => {
    mockGetFilteredStickers.mockReturnValue([]);

    render(
      <StickerModal
        isOpen={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
        tripId="trip-1"
      />
    );

    expect(screen.getByText('stickers.noStickers')).toBeInTheDocument();
  });
});
