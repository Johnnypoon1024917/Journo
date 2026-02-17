/**
 * Animation utilities for enhanced user experience
 */

// Easing functions
export const easings = {
  // Standard Material Design easing
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
  accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  
  // Custom easing for specific interactions
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  
  // Drag and drop specific
  dragStart: 'cubic-bezier(0.2, 0, 0, 1)',
  dragEnd: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
} as const;

// Duration constants (in milliseconds)
export const durations = {
  instant: 0,
  fast: 150,
  normal: 200,
  slow: 300,
  slower: 500,
  
  // Specific interactions
  hover: 150,
  click: 100,
  drag: 200,
  modal: 300,
  page: 500,
} as const;

// Animation classes for CSS-in-JS
export const animations = {
  // Fade animations
  fadeIn: {
    opacity: 0,
    animation: `fadeIn ${durations.normal}ms ${easings.standard} forwards`,
  },
  
  fadeOut: {
    opacity: 1,
    animation: `fadeOut ${durations.normal}ms ${easings.standard} forwards`,
  },
  
  // Scale animations
  scaleIn: {
    transform: 'scale(0.95)',
    opacity: 0,
    animation: `scaleIn ${durations.normal}ms ${easings.bounce} forwards`,
  },
  
  scaleOut: {
    transform: 'scale(1)',
    opacity: 1,
    animation: `scaleOut ${durations.fast}ms ${easings.accelerate} forwards`,
  },
  
  // Slide animations
  slideInRight: {
    transform: 'translateX(100%)',
    animation: `slideInRight ${durations.normal}ms ${easings.decelerate} forwards`,
  },
  
  slideInLeft: {
    transform: 'translateX(-100%)',
    animation: `slideInLeft ${durations.normal}ms ${easings.decelerate} forwards`,
  },
  
  slideInUp: {
    transform: 'translateY(100%)',
    animation: `slideInUp ${durations.normal}ms ${easings.decelerate} forwards`,
  },
  
  slideInDown: {
    transform: 'translateY(-100%)',
    animation: `slideInDown ${durations.normal}ms ${easings.decelerate} forwards`,
  },
  
  // Bounce animation
  bounce: {
    animation: `bounce ${durations.slower}ms ${easings.bounce}`,
  },
  
  // Pulse animation
  pulse: {
    animation: `pulse 2s ${easings.standard} infinite`,
  },
  
  // Shake animation (for errors)
  shake: {
    animation: `shake ${durations.normal}ms ${easings.sharp}`,
  },
  
  // Drag animations
  dragStart: {
    transform: 'scale(1.02) rotate(2deg)',
    opacity: 0.9,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.24)',
    transition: `all ${durations.fast}ms ${easings.dragStart}`,
    zIndex: 1000,
  },
  
  dragEnd: {
    transform: 'scale(1) rotate(0deg)',
    opacity: 1,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    transition: `all ${durations.drag}ms ${easings.dragEnd}`,
  },
  
  // Loading animations
  spin: {
    animation: `spin 1s linear infinite`,
  },
  
  // Hover effects
  hoverLift: {
    transition: `all ${durations.hover}ms ${easings.standard}`,
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
  },
  
  hoverScale: {
    transition: `transform ${durations.hover}ms ${easings.standard}`,
    '&:hover': {
      transform: 'scale(1.05)',
    },
  },
  
  // Focus effects
  focusRing: {
    '&:focus-visible': {
      outline: '3px solid #3b82f6',
      outlineOffset: '2px',
      transition: `outline ${durations.fast}ms ${easings.standard}`,
    },
  },
} as const;

// CSS keyframes as strings (for injection into style tags)
export const keyframes = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  
  @keyframes scaleIn {
    from { 
      opacity: 0; 
      transform: scale(0.95); 
    }
    to { 
      opacity: 1; 
      transform: scale(1); 
    }
  }
  
  @keyframes scaleOut {
    from { 
      opacity: 1; 
      transform: scale(1); 
    }
    to { 
      opacity: 0; 
      transform: scale(0.95); 
    }
  }
  
  @keyframes slideInRight {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  
  @keyframes slideInLeft {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }
  
  @keyframes slideInUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
  
  @keyframes slideInDown {
    from { transform: translateY(-100%); }
    to { transform: translateY(0); }
  }
  
  @keyframes bounce {
    0%, 20%, 53%, 80%, 100% {
      transform: translate3d(0, 0, 0);
    }
    40%, 43% {
      transform: translate3d(0, -8px, 0);
    }
    70% {
      transform: translate3d(0, -4px, 0);
    }
    90% {
      transform: translate3d(0, -2px, 0);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.05);
    }
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
    20%, 40%, 60%, 80% { transform: translateX(4px); }
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes glow {
    0%, 100% {
      box-shadow: 0 0 5px rgba(59, 130, 246, 0.5);
    }
    50% {
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.8);
    }
  }
  
  @keyframes ripple {
    0% {
      transform: scale(0);
      opacity: 1;
    }
    100% {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  @keyframes float {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
  
  @keyframes slideUpFade {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideDownFade {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(20px);
    }
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

// Utility functions
export const createTransition = (
  properties: string | string[],
  duration: keyof typeof durations = 'normal',
  easing: keyof typeof easings = 'standard'
): string => {
  const props = Array.isArray(properties) ? properties.join(', ') : properties;
  const durationMs = durations[duration];
  
  // Check for reduced motion preference
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return `${props} 1ms ${easings[easing]}`;
  }
  
  return `${props} ${durationMs}ms ${easings[easing]}`;
};

export const createAnimation = (
  name: string,
  duration: keyof typeof durations = 'normal',
  easing: keyof typeof easings = 'standard',
  fillMode: 'forwards' | 'backwards' | 'both' | 'none' = 'forwards'
): string => {
  const durationMs = durations[duration];
  
  // Check for reduced motion preference
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return `${name} 0ms ${easings[easing]} ${fillMode}`;
  }
  
  return `${name} ${durationMs}ms ${easings[easing]} ${fillMode}`;
};

/**
 * Get animation duration respecting reduce motion preference
 */
export const getAnimationDuration = (duration: keyof typeof durations): number => {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 0;
  }
  return durations[duration];
};

/**
 * Get transition duration respecting reduce motion preference
 */
export const getTransitionDuration = (duration: keyof typeof durations): number => {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 1; // 1ms to ensure transitions still fire
  }
  return durations[duration];
};

// Haptic feedback utility (for mobile)
export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light'): void => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: 10,
      medium: 20,
      heavy: 30,
    };
    navigator.vibrate(patterns[type]);
  }
  
  // iOS Haptic Feedback API
  if ('HapticFeedback' in window && typeof (window as any).HapticFeedback === 'object') {
    try {
      (window as any).HapticFeedback.impact({ style: type });
    } catch (e) {
      // Silently fail if haptic feedback is not available
    }
  }
};

// Intersection Observer for scroll animations
export const createScrollAnimationObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver => {
  const defaultOptions: IntersectionObserverInit = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
    ...options,
  };
  
  return new IntersectionObserver(callback, defaultOptions);
};

// Performance-optimized animation frame utility
export const requestAnimationFramePromise = (): Promise<number> => {
  return new Promise(resolve => {
    requestAnimationFrame(resolve);
  });
};

// Stagger animation utility
export const staggerAnimation = (
  elements: NodeListOf<Element> | Element[],
  animationClass: string,
  delay: number = 100
): void => {
  Array.from(elements).forEach((element, index) => {
    setTimeout(() => {
      element.classList.add(animationClass);
    }, index * delay);
  });
};

// Inject keyframes into document
export const injectKeyframes = (): void => {
  if (typeof document !== 'undefined') {
    const existingStyle = document.getElementById('animation-keyframes');
    if (!existingStyle) {
      const style = document.createElement('style');
      style.id = 'animation-keyframes';
      style.textContent = keyframes;
      document.head.appendChild(style);
    }
  }
};

// Auto-inject keyframes when module is imported
if (typeof window !== 'undefined') {
  injectKeyframes();
}