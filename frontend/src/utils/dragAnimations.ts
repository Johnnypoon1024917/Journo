/**
 * Drag and Drop Animation Utilities
 * Provides smooth, modern animations for drag and drop interactions
 */

export interface AnimationConfig {
  duration: number;
  easing: string;
  scale?: number;
  rotation?: number;
  opacity?: number;
}

export const ANIMATION_PRESETS = {
  // Drag start animation
  dragStart: {
    duration: 200,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    scale: 1.05,
    rotation: 1,
    opacity: 0.9,
  },
  
  // Drop animation
  drop: {
    duration: 400,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    scale: 1,
    rotation: 0,
    opacity: 1,
  },
  
  // Hover animation
  hover: {
    duration: 200,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    scale: 1.02,
    rotation: 0,
    opacity: 1,
  },
  
  // Success feedback
  success: {
    duration: 600,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    scale: 1.1,
    rotation: 0,
    opacity: 1,
  },
  
  // Error feedback
  error: {
    duration: 500,
    easing: 'cubic-bezier(0.36, 0.07, 0.19, 0.97)',
    scale: 1,
    rotation: 0,
    opacity: 1,
  },
} as const;

/**
 * Apply smooth animation to an element
 */
export const animateElement = (
  element: HTMLElement,
  config: AnimationConfig,
  onComplete?: () => void
): void => {
  const { duration, easing, scale = 1, rotation = 0, opacity = 1 } = config;
  
  element.style.transition = `all ${duration}ms ${easing}`;
  element.style.transform = `scale(${scale}) rotate(${rotation}deg)`;
  element.style.opacity = opacity.toString();
  
  if (onComplete) {
    setTimeout(onComplete, duration);
  }
};

/**
 * Create a spring animation for drag overlay
 */
export const createDragOverlayAnimation = (): string => {
  return `
    @keyframes dragOverlaySpring {
      0% {
        opacity: 0;
        transform: scale(0.9) rotate(-2deg);
      }
      50% {
        opacity: 0.8;
        transform: scale(1.08) rotate(1deg);
      }
      100% {
        opacity: 1;
        transform: scale(1.05) rotate(1deg);
      }
    }
  `;
};

/**
 * Create a bounce animation for successful drops
 */
export const createDropBounceAnimation = (): string => {
  return `
    @keyframes modernDropBounce {
      0% {
        transform: scale(1.1) rotate(1deg);
      }
      30% {
        transform: scale(0.95) rotate(-0.5deg);
      }
      60% {
        transform: scale(1.02) rotate(0.2deg);
      }
      100% {
        transform: scale(1) rotate(0deg);
      }
    }
  `;
};

/**
 * Create a shake animation for errors
 */
export const createErrorShakeAnimation = (): string => {
  return `
    @keyframes errorShake {
      0%, 100% {
        transform: translateX(0);
      }
      10%, 30%, 50%, 70%, 90% {
        transform: translateX(-4px);
      }
      20%, 40%, 60%, 80% {
        transform: translateX(4px);
      }
    }
  `;
};

/**
 * Create a pulse animation for drop zones
 */
export const createDropZonePulseAnimation = (): string => {
  return `
    @keyframes emptyDropPulse {
      0%, 100% {
        transform: scale(1.02);
        opacity: 1;
      }
      50% {
        transform: scale(1.05);
        opacity: 0.9;
      }
    }
  `;
};

/**
 * Apply drag start animation to an element
 */
export const applyDragStartAnimation = (element: HTMLElement): void => {
  animateElement(element, ANIMATION_PRESETS.dragStart);
  element.classList.add('dragging');
};

/**
 * Apply drop animation to an element
 */
export const applyDropAnimation = (element: HTMLElement, onComplete?: () => void): void => {
  animateElement(element, ANIMATION_PRESETS.drop, () => {
    element.classList.remove('dragging');
    element.classList.add('dropping');
    setTimeout(() => {
      element.classList.remove('dropping');
      onComplete?.();
    }, ANIMATION_PRESETS.drop.duration);
  });
};

/**
 * Apply success animation to an element
 */
export const applySuccessAnimation = (element: HTMLElement): void => {
  element.classList.add('success-animation');
  setTimeout(() => {
    element.classList.remove('success-animation');
  }, ANIMATION_PRESETS.success.duration);
};

/**
 * Apply error animation to an element
 */
export const applyErrorAnimation = (element: HTMLElement): void => {
  element.classList.add('error-shake');
  setTimeout(() => {
    element.classList.remove('error-shake');
  }, ANIMATION_PRESETS.error.duration);
};

/**
 * Get CSS transform string for drag state
 */
export const getDragTransform = (
  isDragging: boolean,
  transform?: { x: number; y: number; scaleX: number; scaleY: number }
): string => {
  if (!isDragging || !transform) return '';
  
  const { x, y, scaleX, scaleY } = transform;
  const scale = Math.min(scaleX, scaleY);
  const rotation = isDragging ? Math.sin(x * 0.01) * 2 : 0; // Subtle rotation based on movement
  
  return `translate3d(${x}px, ${y}px, 0) scale(${scale}) rotate(${rotation}deg)`;
};

/**
 * Get box shadow for drag state
 */
export const getDragBoxShadow = (isDragging: boolean, isOver?: boolean): string => {
  if (isDragging) {
    return '0 25px 50px rgba(0, 0, 0, 0.25), 0 10px 20px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(59, 130, 246, 0.3)';
  }
  
  if (isOver) {
    return '0 12px 30px rgba(0, 0, 0, 0.12), 0 6px 15px rgba(0, 0, 0, 0.08)';
  }
  
  return '0 2px 8px rgba(0, 0, 0, 0.06)';
};

/**
 * Create smooth scroll animation
 */
export const smoothScrollTo = (
  element: HTMLElement,
  targetY: number,
  duration: number = 300
): void => {
  const startY = element.scrollTop;
  const distance = targetY - startY;
  const startTime = performance.now();
  
  const animateScroll = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function (ease-out)
    const easeOut = 1 - Math.pow(1 - progress, 3);
    
    element.scrollTop = startY + distance * easeOut;
    
    if (progress < 1) {
      requestAnimationFrame(animateScroll);
    }
  };
  
  requestAnimationFrame(animateScroll);
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get animation duration based on user preferences
 */
export const getAnimationDuration = (defaultDuration: number): number => {
  return prefersReducedMotion() ? 0 : defaultDuration;
};

/**
 * Haptic feedback utilities
 */
export const hapticFeedback = {
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  },
  
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(100);
    }
  },
  
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  },
  
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 50, 50]);
    }
  },
  
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  },
};

export default {
  ANIMATION_PRESETS,
  animateElement,
  applyDragStartAnimation,
  applyDropAnimation,
  applySuccessAnimation,
  applyErrorAnimation,
  getDragTransform,
  getDragBoxShadow,
  smoothScrollTo,
  prefersReducedMotion,
  getAnimationDuration,
  hapticFeedback,
};