/**
 * PullToRefresh Component
 * 
 * A wrapper component that adds pull-to-refresh functionality:
 * - Pull down gesture detection
 * - Visual feedback with loading indicator
 * - Smooth animations
 * - Customizable refresh callback
 * 
 * Implements Requirement 4.9
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '../../utils/cn';

export interface PullToRefreshProps {
  /** Callback when refresh is triggered */
  onRefresh: () => Promise<void>;
  /** Content to wrap */
  children: React.ReactNode;
  /** Pull distance threshold to trigger refresh (px) */
  pullThreshold?: number;
  /** Maximum pull distance (px) */
  maxPullDistance?: number;
  /** Additional CSS classes */
  className?: string;
  /** Disable pull-to-refresh */
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  pullThreshold = 80,
  maxPullDistance = 120,
  className,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const animationFrameRef = useRef<number | null>(null);

  // Check if container is scrolled to top
  const isAtTop = useCallback(() => {
    const container = containerRef.current;
    if (!container) return false;
    return container.scrollTop === 0 || window.scrollY === 0;
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (disabled || isRefreshing || !isAtTop()) return;

      const touch = e.touches[0];
      setStartY(touch.clientY);
      setIsPulling(false);
    },
    [disabled, isRefreshing, isAtTop]
  );

  // Handle touch move
  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (disabled || isRefreshing || !isAtTop()) return;

      const touch = e.touches[0];
      const deltaY = touch.clientY - startY;

      // Only pull down
      if (deltaY > 0) {
        setIsPulling(true);

        // Apply resistance to pull distance
        const resistance = 0.5;
        const distance = Math.min(deltaY * resistance, maxPullDistance);

        // Use requestAnimationFrame for smooth animation
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        animationFrameRef.current = requestAnimationFrame(() => {
          setPullDistance(distance);
        });

        // Prevent default scroll if pulling
        if (distance > 10) {
          e.preventDefault();
        }
      }
    },
    [disabled, isRefreshing, isAtTop, startY, maxPullDistance]
  );

  // Handle touch end
  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing) return;

    // Trigger refresh if threshold is met
    if (pullDistance >= pullThreshold) {
      setIsRefreshing(true);
      setPullDistance(pullThreshold); // Lock at threshold during refresh

      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        // Animate back to zero
        animateToZero();
      }
    } else {
      // Animate back to zero if threshold not met
      animateToZero();
    }

    setIsPulling(false);
  }, [disabled, isRefreshing, pullDistance, pullThreshold, onRefresh]);

  // Animate pull distance back to zero
  const animateToZero = useCallback(() => {
    const startValue = pullDistance;
    const startTime = performance.now();
    const duration = 300; // ms

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const newValue = startValue * (1 - easeOut);

      setPullDistance(newValue);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setPullDistance(0);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [pullDistance]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Calculate progress for visual feedback
  const progress = Math.min(pullDistance / pullThreshold, 1);
  const spinnerRotation = progress * 360;

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-auto', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        touchAction: isPulling ? 'none' : 'auto',
      }}
    >
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-50"
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 0 ? 1 : 0,
          transition: isPulling ? 'none' : 'opacity 0.3s ease-out',
        }}
      >
        <div
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-full',
            'bg-white dark:bg-gray-800 shadow-lg',
            'transition-transform duration-200'
          )}
          style={{
            transform: `scale(${Math.min(progress, 1)})`,
          }}
        >
          {isRefreshing ? (
            // Spinning loader
            <svg
              className="w-6 h-6 text-primary-600 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            // Arrow that rotates based on pull progress
            <svg
              className="w-6 h-6 text-primary-600 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{
                transform: `rotate(${spinnerRotation}deg)`,
              }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Content with pull offset */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
};

PullToRefresh.displayName = 'PullToRefresh';
