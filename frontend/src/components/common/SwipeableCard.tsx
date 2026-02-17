/**
 * SwipeableCard Component
 * 
 * A card component with swipe gesture recognition:
 * - Swipe-left and swipe-right callbacks
 * - 60fps animation performance
 * - Smooth spring animations
 * 
 * Implements Requirements 4.4, 4.7
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '../../utils/cn';

export interface SwipeableCardProps {
  /** Callback when swiped left */
  onSwipeLeft?: () => void;
  /** Callback when swiped right */
  onSwipeRight?: () => void;
  /** Minimum swipe distance to trigger action (px) */
  swipeThreshold?: number;
  /** Card content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Disable swipe gestures */
  disabled?: boolean;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  onSwipeLeft,
  onSwipeRight,
  swipeThreshold = 100,
  children,
  className,
  disabled = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [translateX, setTranslateX] = useState(0);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const animationFrameRef = useRef<number | null>(null);

  // Handle touch start
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (disabled) return;

      const touch = e.touches[0];
      setStartX(touch.clientX);
      setCurrentX(touch.clientX);
      setIsDragging(true);

      // Cancel any ongoing animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    },
    [disabled]
  );

  // Handle touch move with 60fps performance
  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!isDragging || disabled) return;

      const touch = e.touches[0];
      setCurrentX(touch.clientX);

      // Use requestAnimationFrame for smooth 60fps animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        const deltaX = touch.clientX - startX;
        setTranslateX(deltaX);
      });
    },
    [isDragging, disabled, startX]
  );

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (!isDragging || disabled) return;

    const deltaX = currentX - startX;
    const absDeltaX = Math.abs(deltaX);

    // Check if swipe threshold is met
    if (absDeltaX >= swipeThreshold) {
      if (deltaX > 0 && onSwipeRight) {
        // Swiped right
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        // Swiped left
        onSwipeLeft();
      }
    }

    // Reset state with spring animation
    setIsDragging(false);
    animateToZero();
  }, [isDragging, disabled, currentX, startX, swipeThreshold, onSwipeLeft, onSwipeRight]);

  // Handle touch cancel
  const handleTouchCancel = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    animateToZero();
  }, [isDragging]);

  // Animate back to zero position with spring effect
  const animateToZero = useCallback(() => {
    const startValue = translateX;
    const startTime = performance.now();
    const duration = 300; // ms

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const newValue = startValue * (1 - easeOut);

      setTranslateX(newValue);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setTranslateX(0);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [translateX]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Calculate opacity and rotation based on swipe distance
  const swipeProgress = Math.min(Math.abs(translateX) / swipeThreshold, 1);
  const opacity = 1 - swipeProgress * 0.3;
  const rotation = (translateX / swipeThreshold) * 5; // Max 5 degrees rotation

  // Determine swipe direction indicator
  const showLeftIndicator = translateX < -20;
  const showRightIndicator = translateX > 20;

  return (
    <div className={cn('relative', className)}>
      {/* Swipe indicators */}
      {showLeftIndicator && onSwipeLeft && (
        <div
          className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 pointer-events-none z-10"
          style={{ opacity: swipeProgress }}
        >
          <div className="bg-error-500 text-white rounded-full p-2">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        </div>
      )}

      {showRightIndicator && onSwipeRight && (
        <div
          className="absolute inset-y-0 left-0 flex items-center justify-start pl-4 pointer-events-none z-10"
          style={{ opacity: swipeProgress }}
        >
          <div className="bg-success-500 text-white rounded-full p-2">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Swipeable card */}
      <div
        ref={cardRef}
        className={cn(
          'touch-manipulation select-none',
          'transition-shadow duration-200',
          isDragging && 'shadow-lg',
          disabled && 'pointer-events-none'
        )}
        style={{
          transform: `translateX(${translateX}px) rotate(${rotation}deg)`,
          opacity,
          willChange: isDragging ? 'transform' : 'auto',
          // Use GPU acceleration for 60fps
          backfaceVisibility: 'hidden',
          perspective: 1000,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        {children}
      </div>
    </div>
  );
};

SwipeableCard.displayName = 'SwipeableCard';
