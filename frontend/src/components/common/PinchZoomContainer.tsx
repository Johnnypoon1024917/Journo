/**
 * PinchZoomContainer Component
 * 
 * A container that supports pinch-to-zoom gestures:
 * - Pinch gesture recognition
 * - Scale constraints (min/max)
 * - Scale change callback
 * - Smooth animations
 * 
 * Implements Requirement 4.4
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '../../utils/cn';

export interface PinchZoomContainerProps {
  /** Minimum scale factor */
  minScale?: number;
  /** Maximum scale factor */
  maxScale?: number;
  /** Callback when scale changes */
  onScaleChange?: (scale: number) => void;
  /** Container content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Disable pinch zoom */
  disabled?: boolean;
  /** Initial scale */
  initialScale?: number;
}

interface TouchPoint {
  x: number;
  y: number;
}

export const PinchZoomContainer: React.FC<PinchZoomContainerProps> = ({
  minScale = 0.5,
  maxScale = 3,
  onScaleChange,
  children,
  className,
  disabled = false,
  initialScale = 1,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(initialScale);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isPinching, setIsPinching] = useState(false);

  // Store initial pinch state
  const initialDistanceRef = useRef<number>(0);
  const initialScaleRef = useRef<number>(initialScale);
  const initialCenterRef = useRef<TouchPoint>({ x: 0, y: 0 });

  // Calculate distance between two touch points
  const getDistance = useCallback((touch1: Touch, touch2: Touch): number => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Calculate center point between two touches
  const getCenter = useCallback((touch1: Touch, touch2: Touch): TouchPoint => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  }, []);

  // Constrain scale within min/max bounds
  const constrainScale = useCallback(
    (value: number): number => {
      return Math.max(minScale, Math.min(maxScale, value));
    },
    [minScale, maxScale]
  );

  // Handle touch start
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (disabled || e.touches.length !== 2) return;

      e.preventDefault();

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      // Store initial pinch state
      initialDistanceRef.current = getDistance(touch1, touch2);
      initialScaleRef.current = scale;
      initialCenterRef.current = getCenter(touch1, touch2);
      setIsPinching(true);
    },
    [disabled, scale, getDistance, getCenter]
  );

  // Handle touch move
  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (disabled || !isPinching || e.touches.length !== 2) return;

      e.preventDefault();

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      // Calculate new scale based on distance change
      const currentDistance = getDistance(touch1, touch2);
      const distanceRatio = currentDistance / initialDistanceRef.current;
      const newScale = constrainScale(initialScaleRef.current * distanceRatio);

      // Calculate center point for zoom origin
      const currentCenter = getCenter(touch1, touch2);
      const container = containerRef.current;

      if (container) {
        const rect = container.getBoundingClientRect();
        const centerX = currentCenter.x - rect.left;
        const centerY = currentCenter.y - rect.top;

        // Calculate translation to keep zoom centered on pinch point
        const scaleChange = newScale - scale;
        const newTranslateX = translateX - (centerX * scaleChange);
        const newTranslateY = translateY - (centerY * scaleChange);

        setScale(newScale);
        setTranslateX(newTranslateX);
        setTranslateY(newTranslateY);

        // Notify parent of scale change
        onScaleChange?.(newScale);
      }
    },
    [
      disabled,
      isPinching,
      scale,
      translateX,
      translateY,
      getDistance,
      getCenter,
      constrainScale,
      onScaleChange,
    ]
  );

  // Handle touch end
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length < 2) {
        setIsPinching(false);
      }
    },
    []
  );

  // Handle touch cancel
  const handleTouchCancel = useCallback(() => {
    setIsPinching(false);
  }, []);

  // Reset zoom
  const resetZoom = useCallback(() => {
    setScale(initialScale);
    setTranslateX(0);
    setTranslateY(0);
    onScaleChange?.(initialScale);
  }, [initialScale, onScaleChange]);

  // Double tap to reset zoom
  const lastTapRef = useRef<number>(0);
  const handleDoubleTap = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (disabled || e.touches.length !== 1) return;

      const now = Date.now();
      const timeSinceLastTap = now - lastTapRef.current;

      if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
        // Double tap detected
        e.preventDefault();
        if (scale !== initialScale) {
          resetZoom();
        } else {
          // Zoom in to 2x on double tap
          const newScale = constrainScale(2);
          setScale(newScale);
          onScaleChange?.(newScale);
        }
      }

      lastTapRef.current = now;
    },
    [disabled, scale, initialScale, resetZoom, constrainScale, onScaleChange]
  );

  // Expose reset function via ref
  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as any).resetZoom = resetZoom;
    }
  }, [resetZoom]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden touch-manipulation select-none',
        className
      )}
      onTouchStart={(e) => {
        handleTouchStart(e);
        handleDoubleTap(e);
      }}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      style={{
        cursor: disabled ? 'default' : 'grab',
      }}
    >
      <div
        className={cn(
          'origin-center transition-transform',
          !isPinching && 'duration-200 ease-out'
        )}
        style={{
          transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
          willChange: isPinching ? 'transform' : 'auto',
          // Use GPU acceleration
          backfaceVisibility: 'hidden',
          perspective: 1000,
        }}
      >
        {children}
      </div>

      {/* Scale indicator */}
      {isPinching && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium pointer-events-none z-10">
          {Math.round(scale * 100)}%
        </div>
      )}
    </div>
  );
};

PinchZoomContainer.displayName = 'PinchZoomContainer';
