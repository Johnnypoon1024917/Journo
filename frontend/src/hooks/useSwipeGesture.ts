import { useRef, useEffect, useCallback } from 'react';

export interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  preventDefaultTouchmove?: boolean;
  delta?: number;
}

export interface SwipeGestureState {
  isSwiping: boolean;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  distance: number;
  velocity: number;
}

/**
 * Hook for handling swipe gestures on touch devices
 * Provides callbacks for different swipe directions with customizable thresholds
 */
export function useSwipeGesture(options: SwipeGestureOptions = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    preventDefaultTouchmove = false,
    delta = 10,
  } = options;

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const swipeStateRef = useRef<SwipeGestureState>({
    isSwiping: false,
    direction: null,
    distance: 0,
    velocity: 0,
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    touchEndRef.current = null;
    swipeStateRef.current = {
      isSwiping: false,
      direction: null,
      distance: 0,
      velocity: 0,
    };
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Determine swipe direction
    let direction: 'left' | 'right' | 'up' | 'down' | null = null;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > delta) {
        direction = deltaX > 0 ? 'right' : 'left';
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > delta) {
        direction = deltaY > 0 ? 'down' : 'up';
      }
    }

    swipeStateRef.current = {
      isSwiping: distance > delta,
      direction,
      distance,
      velocity: 0, // Will be calculated on touch end
    };

    // Prevent default if requested and we're swiping
    if (preventDefaultTouchmove && swipeStateRef.current.isSwiping) {
      e.preventDefault();
    }
  }, [delta, preventDefaultTouchmove]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    touchEndRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    const deltaX = touchEndRef.current.x - touchStartRef.current.x;
    const deltaY = touchEndRef.current.y - touchStartRef.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = touchEndRef.current.time - touchStartRef.current.time;
    const velocity = distance / duration; // pixels per millisecond

    // Update final swipe state
    swipeStateRef.current.velocity = velocity;

    // Check if swipe meets threshold requirements
    if (distance < threshold) return;

    // Determine swipe direction and trigger appropriate callback
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    } else {
      // Vertical swipe
      if (deltaY > 0 && onSwipeDown) {
        onSwipeDown();
      } else if (deltaY < 0 && onSwipeUp) {
        onSwipeUp();
      }
    }

    // Reset refs
    touchStartRef.current = null;
    touchEndRef.current = null;
  }, [threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  const handleTouchCancel = useCallback(() => {
    touchStartRef.current = null;
    touchEndRef.current = null;
    swipeStateRef.current = {
      isSwiping: false,
      direction: null,
      distance: 0,
      velocity: 0,
    };
  }, []);

  // Return handlers and current state
  const handlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
  };

  const getSwipeState = useCallback(() => swipeStateRef.current, []);

  return {
    handlers,
    getSwipeState,
  };
}

/**
 * Hook for attaching swipe gestures to a DOM element
 * Returns a ref to attach to the element you want to make swipeable
 */
export function useSwipeableElement(options: SwipeGestureOptions = {}) {
  const elementRef = useRef<HTMLElement>(null);
  const { handlers } = useSwipeGesture(options);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Add event listeners with passive: false for preventDefault to work
    element.addEventListener('touchstart', handlers.onTouchStart, { passive: false });
    element.addEventListener('touchmove', handlers.onTouchMove, { passive: false });
    element.addEventListener('touchend', handlers.onTouchEnd, { passive: false });
    element.addEventListener('touchcancel', handlers.onTouchCancel, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handlers.onTouchStart);
      element.removeEventListener('touchmove', handlers.onTouchMove);
      element.removeEventListener('touchend', handlers.onTouchEnd);
      element.removeEventListener('touchcancel', handlers.onTouchCancel);
    };
  }, [handlers]);

  return elementRef;
}

/**
 * Hook for horizontal swipe navigation (common pattern for carousels, tabs, etc.)
 */
export function useHorizontalSwipe(options: {
  onNext?: () => void;
  onPrevious?: () => void;
  threshold?: number;
} = {}) {
  const { onNext, onPrevious, threshold = 50 } = options;

  return useSwipeGesture({
    onSwipeLeft: onNext,
    onSwipeRight: onPrevious,
    threshold,
    preventDefaultTouchmove: true,
  });
}

/**
 * Hook for vertical swipe navigation (common pattern for pull-to-refresh, drawer, etc.)
 */
export function useVerticalSwipe(options: {
  onUp?: () => void;
  onDown?: () => void;
  threshold?: number;
} = {}) {
  const { onUp, onDown, threshold = 50 } = options;

  return useSwipeGesture({
    onSwipeUp: onUp,
    onSwipeDown: onDown,
    threshold,
    preventDefaultTouchmove: true,
  });
}