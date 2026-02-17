import React, { useEffect, useRef } from 'react';
import { 
  announceToScreenReader, 
  prefersReducedMotion,
  generateA11yId,
  trapFocus,
  makeKeyboardAccessible
} from '../utils/accessibility';

/**
 * Hook to announce messages to screen readers
 */
export function useScreenReaderAnnouncement() {
  return (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announceToScreenReader(message, priority);
  };
}

/**
 * Hook to check if user prefers reduced motion
 * Returns an object with utilities for handling animations
 */
export function useReducedMotion() {
  const [prefersReduced, setPrefersReduced] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return prefersReducedMotion();
  });
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setPrefersReduced(event.matches);
    };
    
    // Initial check
    handleChange(mediaQuery);
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);
  
  return {
    prefersReducedMotion: prefersReduced,
    shouldAnimate: !prefersReduced,
    getAnimationDuration: (duration: number) => prefersReduced ? 0 : duration,
    getTransitionDuration: (duration: number) => prefersReduced ? 1 : duration,
  };
}

/**
 * Hook to generate stable accessibility IDs
 */
export function useA11yId(prefix?: string): string {
  const idRef = useRef<string>();
  
  if (!idRef.current) {
    idRef.current = generateA11yId(prefix);
  }
  
  return idRef.current;
}

/**
 * Hook to trap focus within a container (for modals, dialogs)
 */
export function useFocusTrap(isActive: boolean = true) {
  const containerRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    if (!isActive || !containerRef.current) return;
    
    const cleanup = trapFocus(containerRef.current);
    
    return cleanup;
  }, [isActive]);
  
  return containerRef;
}

/**
 * Hook to make an element keyboard accessible
 */
export function useKeyboardAccessible(onClick: () => void) {
  const elementRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    if (!elementRef.current) return;
    
    const cleanup = makeKeyboardAccessible(elementRef.current, onClick);
    
    return cleanup;
  }, [onClick]);
  
  return elementRef;
}

/**
 * Hook to manage ARIA live region for dynamic content
 */
export function useAriaLiveRegion(priority: 'polite' | 'assertive' = 'polite') {
  const regionRef = useRef<HTMLDivElement>(null);
  
  const announce = (message: string) => {
    if (regionRef.current) {
      regionRef.current.textContent = message;
    }
  };
  
  return { regionRef, announce };
}
