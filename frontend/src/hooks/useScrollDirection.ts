import { useState, useEffect, useRef } from 'react';

/**
 * useScrollDirection Hook
 * 
 * Detects scroll direction to show/hide FABs following iOS design patterns.
 * FABs hide when scrolling down and show when scrolling up.
 */

export type ScrollDirection = 'up' | 'down' | 'none';

interface UseScrollDirectionOptions {
  threshold?: number; // Minimum scroll distance to trigger direction change
  element?: HTMLElement | null; // Element to track scroll on (defaults to window)
}

export function useScrollDirection(options: UseScrollDirectionOptions = {}) {
  const { threshold = 10, element } = options;
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>('none');
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const scrollElement = element || window;
    
    const updateScrollDirection = () => {
      const scrollY = element 
        ? element.scrollTop 
        : window.pageYOffset || document.documentElement.scrollTop;

      console.log('📜 Scroll detected:', { scrollY, lastScrollY: lastScrollY.current, threshold });

      // Check if at top
      const atTop = scrollY < 10;
      setIsAtTop(atTop);

      // Determine scroll direction
      if (Math.abs(scrollY - lastScrollY.current) < threshold) {
        ticking.current = false;
        return;
      }

      const direction = scrollY > lastScrollY.current ? 'down' : 'up';
      
      console.log('🎯 Direction changed:', direction, 'from', scrollDirection);
      
      if (direction !== scrollDirection) {
        setScrollDirection(direction);
      }

      lastScrollY.current = scrollY > 0 ? scrollY : 0;
      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking.current = true;
      }
    };

    // Initial check
    updateScrollDirection();

    // Add scroll listener
    if (element) {
      element.addEventListener('scroll', onScroll);
    } else {
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    return () => {
      if (element) {
        element.removeEventListener('scroll', onScroll);
      } else {
        window.removeEventListener('scroll', onScroll);
      }
    };
  }, [scrollDirection, threshold, element]);

  return {
    scrollDirection,
    isAtTop,
    isScrollingDown: scrollDirection === 'down',
    isScrollingUp: scrollDirection === 'up',
  };
}
