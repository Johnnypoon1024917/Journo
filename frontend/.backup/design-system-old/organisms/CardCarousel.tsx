/**
 * CardCarousel Component
 * 
 * A horizontal scrolling carousel for displaying cards with smooth momentum,
 * navigation controls, and touch/swipe support.
 * 
 * Features:
 * - Smooth horizontal scrolling with momentum
 * - Navigation arrows with keyboard support
 * - Touch/swipe gestures for mobile
 * - Snap-to-card alignment
 * - Progress indicators
 * - Responsive card sizing
 * - Auto-scroll support
 */

import React, { useRef, useState, useEffect } from 'react';
import { colors, spacing, shadows, borderRadius } from '../tokens';
import { transitions } from '../animations';
import type { BaseComponentProps } from '../types';

export interface CardCarouselProps extends BaseComponentProps {
  /** Card width for different breakpoints */
  cardWidth?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  
  /** Gap between cards */
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  
  /** Whether to show navigation arrows */
  showArrows?: boolean;
  
  /** Whether to show progress dots */
  showDots?: boolean;
  
  /** Whether to enable auto-scroll */
  autoScroll?: boolean;
  
  /** Auto-scroll interval in milliseconds */
  autoScrollInterval?: number;
  
  /** Number of cards to scroll at once */
  scrollAmount?: number;
  
  /** Whether to loop back to start */
  loop?: boolean;
  
  /** Peek amount (show partial next card) */
  peek?: string;
  
  /** Alignment of cards */
  align?: 'start' | 'center';
  
  /** Loading state */
  loading?: boolean;
  
  /** Number of skeleton cards to show when loading */
  skeletonCount?: number;
}

export const CardCarousel: React.FC<CardCarouselProps> = ({
  cardWidth = {
    mobile: '280px',
    tablet: '320px',
    desktop: '360px',
  },
  gap = 'lg',
  showArrows = true,
  showDots = false,
  autoScroll = false,
  autoScrollInterval = 5000,
  scrollAmount = 1,
  loop = false,
  peek = '0px',
  align = 'start',
  loading = false,
  skeletonCount = 5,
  className = '',
  children,
  'data-testid': dataTestId,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const childCount = React.Children.count(children);

  // Gap sizes
  const gapSizes = {
    sm: spacing.sm,
    md: spacing.md,
    lg: spacing.lg,
    xl: spacing.xl,
  };

  const gapSize = gapSizes[gap];

  // Check scroll position
  const checkScrollPosition = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);

    // Calculate current index based on scroll position
    const cardWidthValue = parseInt(cardWidth.desktop || '360px');
    const gapValue = parseInt(gapSize);
    const index = Math.round(scrollLeft / (cardWidthValue + gapValue));
    setCurrentIndex(index);
  };

  useEffect(() => {
    checkScrollPosition();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, [children]);

  // Auto-scroll functionality
  useEffect(() => {
    if (!autoScroll || loading || isDragging) return;

    const interval = setInterval(() => {
      scrollNext();
    }, autoScrollInterval);

    return () => clearInterval(interval);
  }, [autoScroll, autoScrollInterval, loading, isDragging, currentIndex, childCount]);

  // Scroll functions
  const scrollNext = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidthValue = parseInt(cardWidth.desktop || '360px');
    const gapValue = parseInt(gapSize);
    const scrollDistance = (cardWidthValue + gapValue) * scrollAmount;

    if (loop && !canScrollRight) {
      container.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollDistance, behavior: 'smooth' });
    }
  };

  const scrollPrev = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidthValue = parseInt(cardWidth.desktop || '360px');
    const gapValue = parseInt(gapSize);
    const scrollDistance = (cardWidthValue + gapValue) * scrollAmount;

    if (loop && !canScrollLeft) {
      container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: -scrollDistance, behavior: 'smooth' });
    }
  };

  const scrollToIndex = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidthValue = parseInt(cardWidth.desktop || '360px');
    const gapValue = parseInt(gapSize);
    const scrollPosition = (cardWidthValue + gapValue) * index;

    container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
  };

  // Touch/drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setIsDragging(true);
    setStartX(e.pageX - container.offsetLeft);
    setScrollLeft(container.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    const container = scrollContainerRef.current;
    if (!container) return;

    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    container.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollNext();
    }
  };

  // Styles
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
  };

  const scrollContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: gapSize,
    overflowX: 'auto',
    overflowY: 'hidden',
    scrollSnapType: 'x mandatory',
    scrollBehavior: 'smooth',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    cursor: isDragging ? 'grabbing' : 'grab',
    paddingLeft: align === 'center' ? 'calc(50% - 180px)' : '0',
    paddingRight: peek,
  };

  const cardWrapperStyle: React.CSSProperties = {
    flexShrink: 0,
    width: cardWidth.desktop,
    scrollSnapAlign: align,
  };

  const arrowButtonStyle = (direction: 'left' | 'right'): React.CSSProperties => ({
    position: 'absolute',
    top: '50%',
    [direction]: spacing.md,
    transform: 'translateY(-50%)',
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: `1px solid ${colors.neutral[200]}`,
    borderRadius: borderRadius.full,
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: shadows.md,
    transition: transitions.all.property + ' ' + transitions.all.duration + ' ' + transitions.all.easing,
    opacity: direction === 'left' ? (canScrollLeft ? 1 : 0.3) : (canScrollRight ? 1 : 0.3),
    pointerEvents: direction === 'left' ? (canScrollLeft ? 'auto' : 'none') : (canScrollRight ? 'auto' : 'none'),
  });

  const dotsContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  };

  const dotStyle = (isActive: boolean): React.CSSProperties => ({
    width: isActive ? '24px' : '8px',
    height: '8px',
    borderRadius: borderRadius.full,
    backgroundColor: isActive ? colors.primary[500] : colors.neutral[300],
    cursor: 'pointer',
    transition: transitions.all.property + ' ' + transitions.all.duration + ' ' + transitions.all.easing,
  });

  // Render skeleton cards
  const renderSkeletons = () => {
    return Array.from({ length: skeletonCount }).map((_, index) => (
      <div key={`skeleton-${index}`} style={cardWrapperStyle}>
        {/* Skeleton content will be provided by TravelCard with loading prop */}
      </div>
    ));
  };

  // Render children
  const renderChildren = () => {
    if (!children) return null;

    return React.Children.map(children, (child, index) => (
      <div key={index} style={cardWrapperStyle}>
        {child}
      </div>
    ));
  };

  return (
    <>
      <style>
        {`
          .card-carousel-container::-webkit-scrollbar {
            display: none;
          }

          /* Responsive card widths */
          @media (max-width: 768px) {
            .card-carousel-card {
              width: ${cardWidth.mobile};
            }
          }

          @media (min-width: 769px) and (max-width: 1024px) {
            .card-carousel-card {
              width: ${cardWidth.tablet};
            }
          }
        `}
      </style>

      <div
        className={className}
        data-testid={dataTestId}
        style={containerStyle}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {showArrows && (
          <>
            <button
              style={arrowButtonStyle('left')}
              onClick={scrollPrev}
              aria-label="Previous cards"
              disabled={!canScrollLeft && !loop}
            >
              <span style={{ fontSize: '1.5rem', color: colors.neutral[700] }}>‹</span>
            </button>
            <button
              style={arrowButtonStyle('right')}
              onClick={scrollNext}
              aria-label="Next cards"
              disabled={!canScrollRight && !loop}
            >
              <span style={{ fontSize: '1.5rem', color: colors.neutral[700] }}>›</span>
            </button>
          </>
        )}

        <div
          ref={scrollContainerRef}
          className="card-carousel-container"
          style={scrollContainerStyle}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {loading ? renderSkeletons() : renderChildren()}
        </div>

        {showDots && !loading && childCount > 0 && (
          <div style={dotsContainerStyle}>
            {Array.from({ length: childCount }).map((_, index) => (
              <button
                key={index}
                style={dotStyle(index === currentIndex)}
                onClick={() => scrollToIndex(index)}
                aria-label={`Go to card ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default CardCarousel;
