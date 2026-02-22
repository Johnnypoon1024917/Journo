/**
 * MediaCarousel Component Tests
 * 
 * Unit tests for the MediaCarousel component functionality.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MediaCarousel } from './MediaCarousel';

describe('MediaCarousel', () => {
  const mockMediaUrls = [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
    'https://example.com/image3.jpg',
  ];

  it('should render nothing when mediaUrls is empty', () => {
    const { container } = render(<MediaCarousel mediaUrls={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render single image without carousel controls', () => {
    render(<MediaCarousel mediaUrls={['https://example.com/image1.jpg']} />);
    
    const image = screen.getByAltText('Post media');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image1.jpg');
    
    // Should not have navigation buttons
    expect(screen.queryByLabelText('Previous image')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Next image')).not.toBeInTheDocument();
  });

  it('should render carousel with navigation controls for multiple images', () => {
    render(<MediaCarousel mediaUrls={mockMediaUrls} />);
    
    // Should show first image
    const image = screen.getByAltText('Post media 1 of 3');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', mockMediaUrls[0]);
    
    // Should have navigation buttons
    expect(screen.getByLabelText('Previous image')).toBeInTheDocument();
    expect(screen.getByLabelText('Next image')).toBeInTheDocument();
    
    // Should show image counter
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('should display pagination dots for multiple images', () => {
    render(<MediaCarousel mediaUrls={mockMediaUrls} />);
    
    const dots = screen.getAllByRole('tab');
    expect(dots).toHaveLength(3);
    
    // First dot should be selected
    expect(dots[0]).toHaveAttribute('aria-selected', 'true');
    expect(dots[1]).toHaveAttribute('aria-selected', 'false');
    expect(dots[2]).toHaveAttribute('aria-selected', 'false');
  });

  it('should navigate to next image when next button is clicked', () => {
    render(<MediaCarousel mediaUrls={mockMediaUrls} />);
    
    const nextButton = screen.getByLabelText('Next image');
    fireEvent.click(nextButton);
    
    // Should show second image
    const image = screen.getByAltText('Post media 2 of 3');
    expect(image).toHaveAttribute('src', mockMediaUrls[1]);
    
    // Counter should update
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('should navigate to previous image when previous button is clicked', () => {
    render(<MediaCarousel mediaUrls={mockMediaUrls} />);
    
    const prevButton = screen.getByLabelText('Previous image');
    fireEvent.click(prevButton);
    
    // Should wrap to last image
    const image = screen.getByAltText('Post media 3 of 3');
    expect(image).toHaveAttribute('src', mockMediaUrls[2]);
    
    // Counter should update
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  it('should navigate to specific image when pagination dot is clicked', () => {
    render(<MediaCarousel mediaUrls={mockMediaUrls} />);
    
    const dots = screen.getAllByRole('tab');
    fireEvent.click(dots[2]);
    
    // Should show third image
    const image = screen.getByAltText('Post media 3 of 3');
    expect(image).toHaveAttribute('src', mockMediaUrls[2]);
    
    // Counter should update
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  it('should call onMediaClick when image is clicked', () => {
    const onMediaClick = vi.fn();
    render(<MediaCarousel mediaUrls={mockMediaUrls} onMediaClick={onMediaClick} />);
    
    const image = screen.getByAltText('Post media 1 of 3');
    fireEvent.click(image.parentElement!);
    
    expect(onMediaClick).toHaveBeenCalledWith(0);
  });

  it('should handle keyboard navigation with arrow keys', () => {
    render(<MediaCarousel mediaUrls={mockMediaUrls} />);
    
    const carousel = screen.getByRole('region');
    
    // Navigate right
    fireEvent.keyDown(carousel, { key: 'ArrowRight' });
    expect(screen.getByAltText('Post media 2 of 3')).toBeInTheDocument();
    
    // Navigate left
    fireEvent.keyDown(carousel, { key: 'ArrowLeft' });
    expect(screen.getByAltText('Post media 1 of 3')).toBeInTheDocument();
  });

  it('should wrap around when navigating past the last image', () => {
    render(<MediaCarousel mediaUrls={mockMediaUrls} />);
    
    const nextButton = screen.getByLabelText('Next image');
    
    // Click next 3 times to wrap around
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);
    
    // Should be back to first image
    const image = screen.getByAltText('Post media 1 of 3');
    expect(image).toHaveAttribute('src', mockMediaUrls[0]);
  });

  it('should handle image load errors gracefully', () => {
    render(<MediaCarousel mediaUrls={['https://example.com/broken.jpg']} />);
    
    const image = screen.getByAltText('Post media') as HTMLImageElement;
    
    // Simulate image load error
    fireEvent.error(image);
    
    expect(image).toHaveAttribute('src', '/placeholder-image.png');
    expect(image).toHaveAttribute('alt', 'Failed to load media');
  });
});
