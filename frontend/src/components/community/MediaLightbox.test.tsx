/**
 * MediaLightbox Component Tests
 * 
 * Unit tests for the MediaLightbox component functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MediaLightbox } from './MediaLightbox';

describe('MediaLightbox', () => {
  const mockMediaUrls = [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
    'https://example.com/image3.jpg',
  ];
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  afterEach(() => {
    // Clean up body overflow style
    document.body.style.overflow = '';
  });

  it('should render lightbox with media', () => {
    render(<MediaLightbox mediaUrls={mockMediaUrls} onClose={mockOnClose} />);
    
    const image = screen.getByAltText('Media 1 of 3');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', mockMediaUrls[0]);
  });

  it('should prevent body scroll when open', () => {
    render(<MediaLightbox mediaUrls={mockMediaUrls} onClose={mockOnClose} />);
    
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('should restore body scroll when unmounted', () => {
    const { unmount } = render(<MediaLightbox mediaUrls={mockMediaUrls} onClose={mockOnClose} />);
    
    unmount();
    
    expect(document.body.style.overflow).toBe('');
  });

  it('should display close button', () => {
    render(<MediaLightbox mediaUrls={mockMediaUrls} onClose={mockOnClose} />);
    
    const closeButton = screen.getByLabelText('Close lightbox');
    expect(closeButton).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(<MediaLightbox mediaUrls={mockMediaUrls} onClose={mockOnClose} />);
    
    const closeButton = screen.getByLabelText('Close lightbox');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when ESC key is pressed', () => {
    render(<MediaLightbox mediaUrls={mockMediaUrls} onClose={mockOnClose} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', () => {
    render(<MediaLightbox mediaUrls={mockMediaUrls} onClose={mockOnClose} />);
    
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not close when image is clicked', () => {
    render(<MediaLightbox mediaUrls={mockMediaUrls} onClose={mockOnClose} />);
    
    const image = screen.getByAltText('Media 1 of 3');
    fireEvent.click(image);
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should display image counter for multiple images', () => {
    render(<MediaLightbox mediaUrls={mockMediaUrls} onClose={mockOnClose} />);
    
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('should not display image counter for single image', () => {
    render(<MediaLightbox mediaUrls={['https://example.com/image1.jpg']} onClose={mockOnClose} />);
    
    expect(screen.queryByText('1 / 1')).not.toBeInTheDocument();
  });

  it('should display navigation buttons for multiple images', () => {
    render(<MediaLightbox mediaUrls={mockMediaUrls} onClose={mockOnClose} />);
    
    expect(screen.getByLabelText('Previous image')).toBeInTheDocument();
    expect(screen.getByLabelText('Next image')).toBeInTheDocument();
  });

  it('should not display navigation buttons for single image', () => {
    render(<MediaLightbox mediaUrls={['https://example.com/image1.jpg']} onClose={mockOnClose} />);
    
    expect(screen.queryByLabelText('Previous image')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Next image')).not.toBeInTheDocument();
  });

  it('should navigate to next image when next button is clicked', () => {
    render(<MediaLightbox mediaUrls={mockMediaUrls} onClose={mockOnClose} />);
    
    const nextButton = screen.getByLabelText('Next image');
    fireEvent.click(nextButton);
    
    const image = screen.getByAltText('Media 2 of 3');
    expect(image).toHaveAttribute('src', mockMediaUrls[1]);
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('should navigate to previous image when previous button is clicked', () => {
    render(<MediaLightbox mediaUrls={mockMediaUrls} onClose={mockOnClose} />);
    
    const prevButton = screen.getByLabelText('Previous image');
    fireEvent.click(prevButton);
    
    // Should wrap to last image
    const image = screen.getByAltText('Media 3 of 3');
    expect(image).toHaveAttribute('src', mockMediaUrls[2]);
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  it('should navigate with arrow keys', () => {
    render(<MediaLightbox mediaUrls={mockMediaUrls} onClose={mockOnClose} />);
    
    // Navigate right
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByAltText('Media 2 of 3')).toBeInTheDocument();
    
    // Navigate left
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(screen.getByAltText('Media 1 of 3')).toBeInTheDocument();
  });

  it('should start at initialIndex when provided', () => {
    render(<MediaLightbox mediaUrls={mockMediaUrls} initialIndex={1} onClose={mockOnClose} />);
    
    const image = screen.getByAltText('Media 2 of 3');
    expect(image).toHaveAttribute('src', mockMediaUrls[1]);
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('should display pagination dots for multiple images', () => {
    render(<MediaLightbox mediaUrls={mockMediaUrls} onClose={mockOnClose} />);
    
    const dots = screen.getAllByRole('tab');
    expect(dots).toHaveLength(3);
    
    // First dot should be selected
    expect(dots[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('should navigate to specific image when pagination dot is clicked', () => {
    render(<MediaLightbox mediaUrls={mockMediaUrls} onClose={mockOnClose} />);
    
    const dots = screen.getAllByRole('tab');
    fireEvent.click(dots[2]);
    
    const image = screen.getByAltText('Media 3 of 3');
    expect(image).toHaveAttribute('src', mockMediaUrls[2]);
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  it('should wrap around when navigating past the last image', () => {
    render(<MediaLightbox mediaUrls={mockMediaUrls} onClose={mockOnClose} />);
    
    const nextButton = screen.getByLabelText('Next image');
    
    // Click next 3 times to wrap around
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);
    
    // Should be back to first image
    const image = screen.getByAltText('Media 1 of 3');
    expect(image).toHaveAttribute('src', mockMediaUrls[0]);
  });

  it('should handle image load errors gracefully', () => {
    render(<MediaLightbox mediaUrls={['https://example.com/broken.jpg']} onClose={mockOnClose} />);
    
    const image = screen.getByAltText('Media 1 of 1') as HTMLImageElement;
    
    // Simulate image load error
    fireEvent.error(image);
    
    expect(image).toHaveAttribute('src', '/placeholder-image.png');
    expect(image).toHaveAttribute('alt', 'Failed to load media');
  });

  it('should display keyboard instructions', () => {
    render(<MediaLightbox mediaUrls={mockMediaUrls} onClose={mockOnClose} />);
    
    expect(screen.getByText(/Press ESC to close/)).toBeInTheDocument();
    expect(screen.getByText(/Use arrow keys to navigate/)).toBeInTheDocument();
  });
});
