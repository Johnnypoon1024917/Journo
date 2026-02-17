import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

/**
 * Reduce Motion Context
 * 
 * Provides reduce motion preference throughout the app
 * Respects user's system preference for reduced motion
 */

interface ReduceMotionContextValue {
  prefersReducedMotion: boolean;
  shouldAnimate: boolean;
  getAnimationDuration: (defaultDuration: number) => number;
  getTransitionDuration: (defaultDuration: number) => number;
}

const ReduceMotionContext = createContext<ReduceMotionContextValue | undefined>(undefined);

interface ReduceMotionProviderProps {
  children: ReactNode;
}

export function ReduceMotionProvider({ children }: ReduceMotionProviderProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setPrefersReducedMotion(event.matches);
      
      // Update CSS custom property for global use
      document.documentElement.style.setProperty(
        '--animation-duration-multiplier',
        event.matches ? '0' : '1'
      );
      
      // Add/remove class for CSS-based animations
      if (event.matches) {
        document.documentElement.classList.add('reduce-motion');
      } else {
        document.documentElement.classList.remove('reduce-motion');
      }
    };

    // Initial setup
    handleChange(mediaQuery);

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const shouldAnimate = !prefersReducedMotion;

  const getAnimationDuration = (defaultDuration: number): number => {
    return prefersReducedMotion ? 0 : defaultDuration;
  };

  const getTransitionDuration = (defaultDuration: number): number => {
    // Use minimal duration (1ms) instead of 0 to ensure transitions still fire
    return prefersReducedMotion ? 1 : defaultDuration;
  };

  const value: ReduceMotionContextValue = {
    prefersReducedMotion,
    shouldAnimate,
    getAnimationDuration,
    getTransitionDuration,
  };

  return (
    <ReduceMotionContext.Provider value={value}>
      {children}
    </ReduceMotionContext.Provider>
  );
}

/**
 * Hook to access reduce motion context
 */
export function useReduceMotion(): ReduceMotionContextValue {
  const context = useContext(ReduceMotionContext);
  
  if (context === undefined) {
    throw new Error('useReduceMotion must be used within a ReduceMotionProvider');
  }
  
  return context;
}

/**
 * Hook to get animation props with reduce motion support
 */
export function useAnimationProps<T extends Record<string, any>>(
  animatedProps: T,
  staticProps: Partial<T> = {}
): T {
  const { shouldAnimate } = useReduceMotion();
  
  if (!shouldAnimate) {
    return { ...animatedProps, ...staticProps } as T;
  }
  
  return animatedProps;
}

/**
 * Hook to conditionally apply animation class
 */
export function useAnimationClass(animationClass: string, fallbackClass: string = ''): string {
  const { shouldAnimate } = useReduceMotion();
  return shouldAnimate ? animationClass : fallbackClass;
}
