/**
 * MediaCarousel Component
 * 
 * Displays a swipeable carousel for multiple media items with pagination dots.
 * Supports touch gestures for mobile and click navigation for desktop.
 * 
 * Requirements: 19.1, 19.2, 19.3
 */

import { useState, useRef, useEffect } from 'react';

interface MediaCarouselProps {
  mediaUrls: string[];
  onMediaClick?: (index: number) => void;
}

export function MediaCarousel({ mediaUrls, onMediaClick }: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Minimum swipe distance (in px) to trigger navigation
  const minSwipeDistance = 50;

  useEffect(() => {
    // Reset index if mediaUrls change
    setCurrentIndex(0);
  }, [mediaUrls]);

  const goToPrevious = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? mediaUrls.length - 1 : prev - 1));
  };

  const goToNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === mediaUrls.length - 1 ? 0 : prev + 1));
  };

  const goToIndex = (index: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex(index);
  };

  const handleMediaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMediaClick?.(currentIndex);
  };

  // Touch event handlers for swipe support
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }

    // Reset touch state
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToPrevious();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goToNext();
    }
  };

  if (mediaUrls.length === 0) return null;

  // Single image - no carousel controls needed
  if (mediaUrls.length === 1) {
    return (
      <div 
        className="rounded-lg overflow-hidden cursor-pointer"
        onClick={handleMediaClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleMediaClick(e as any);
          }
        }}
        aria-label="View media in fullscreen"
      >
        <img
          src={mediaUrls[0]}
          alt="Post media"
          className="w-full max-h-96 object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-image.png';
            target.alt = 'Failed to load media';
          }}
        />
      </div>
    );
  }

  // Multiple images - show carousel with controls
  return (
    <div
      ref={carouselRef}
      className="relative rounded-lg overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label={`Media carousel with ${mediaUrls.length} items`}
      aria-roledescription="carousel"
    >
      {/* Main image */}
      <div
        className="cursor-pointer"
        onClick={handleMediaClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleMediaClick(e as any);
          }
        }}
        aria-label={`View image ${currentIndex + 1} of ${mediaUrls.length} in fullscreen`}
      >
        <img
          src={mediaUrls[currentIndex]}
          alt={`Post media ${currentIndex + 1} of ${mediaUrls.length}`}
          className="w-full max-h-96 object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-image.png';
            target.alt = 'Failed to load media';
          }}
        />
      </div>

      {/* Navigation buttons */}
      <button
        onClick={goToPrevious}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
        aria-label="Previous image"
        tabIndex={0}
      >
        <svg 
          className="w-5 h-5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <button
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
        aria-label="Next image"
        tabIndex={0}
      >
        <svg 
          className="w-5 h-5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Pagination dots */}
      <div 
        className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2"
        role="tablist"
        aria-label="Media carousel navigation"
      >
        {mediaUrls.map((_, index) => (
          <button
            key={index}
            onClick={(e) => goToIndex(index, e)}
            className={`rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white ${
              index === currentIndex
                ? 'bg-white w-4 h-2'
                : 'bg-white bg-opacity-50 hover:bg-opacity-75 w-2 h-2'
            }`}
            aria-label={`Go to image ${index + 1}`}
            aria-current={index === currentIndex}
            role="tab"
            aria-selected={index === currentIndex}
            tabIndex={index === currentIndex ? 0 : -1}
          />
        ))}
      </div>

      {/* Image counter */}
      <div 
        className="absolute top-3 right-3 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded"
        aria-live="polite"
        aria-atomic="true"
      >
        {currentIndex + 1} / {mediaUrls.length}
      </div>
    </div>
  );
}
