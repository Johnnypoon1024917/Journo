/**
 * MediaLightbox Component
 * 
 * Displays media in fullscreen mode with navigation controls.
 * Supports keyboard navigation (ESC to close, arrow keys to navigate).
 * 
 * Requirements: 19.3, 19.4
 */

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface MediaLightboxProps {
  mediaUrls: string[];
  initialIndex?: number;
  onClose: () => void;
}

export function MediaLightbox({ 
  mediaUrls, 
  initialIndex = 0, 
  onClose 
}: MediaLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);

  // Minimum swipe distance (in px) to trigger navigation
  const minSwipeDistance = 50;

  useEffect(() => {
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = 'hidden';

    // Handle ESC key to close
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Focus the lightbox for keyboard navigation
    lightboxRef.current?.focus();

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? mediaUrls.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === mediaUrls.length - 1 ? 0 : prev + 1));
  };

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Close only if clicking the backdrop, not the image
    if (e.target === e.currentTarget) {
      onClose();
    }
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

  const lightboxContent = (
    <div
      ref={lightboxRef}
      className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center"
      onClick={handleBackdropClick}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label="Media lightbox"
      tabIndex={-1}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Close lightbox"
      >
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M6 18L18 6M6 6l12 12" 
          />
        </svg>
      </button>

      {/* Image counter */}
      {mediaUrls.length > 1 && (
        <div 
          className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 text-white text-lg px-4 py-2 rounded"
          aria-live="polite"
          aria-atomic="true"
        >
          {currentIndex + 1} / {mediaUrls.length}
        </div>
      )}

      {/* Main image container */}
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <img
          src={mediaUrls[currentIndex]}
          alt={`Media ${currentIndex + 1} of ${mediaUrls.length}`}
          className="max-w-full max-h-full object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-image.png';
            target.alt = 'Failed to load media';
          }}
        />
      </div>

      {/* Navigation buttons - only show if multiple images */}
      {mediaUrls.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Previous image"
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 19l-7-7 7-7" 
              />
            </svg>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Next image"
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 5l7 7-7 7" 
              />
            </svg>
          </button>

          {/* Pagination dots */}
          <div 
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-3"
            role="tablist"
            aria-label="Media navigation"
          >
            {mediaUrls.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  goToIndex(index);
                }}
                className={`rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white ${
                  index === currentIndex
                    ? 'bg-white w-5 h-3'
                    : 'bg-white bg-opacity-50 hover:bg-opacity-75 w-3 h-3'
                }`}
                aria-label={`Go to image ${index + 1}`}
                aria-current={index === currentIndex}
                role="tab"
                aria-selected={index === currentIndex}
              />
            ))}
          </div>
        </>
      )}

      {/* Instructions hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm opacity-70 text-center">
        <p>Press ESC to close {mediaUrls.length > 1 && '• Use arrow keys to navigate'}</p>
      </div>
    </div>
  );

  // Render lightbox in a portal to ensure it's on top of everything
  return createPortal(lightboxContent, document.body);
}
