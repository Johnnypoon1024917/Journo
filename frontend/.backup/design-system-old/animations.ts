/**
 * Animation System
 * 
 * Smooth transitions and micro-interactions for modern UI/UX
 * with accessibility support and performance optimization.
 */

import type { AnimationConfig, MicroInteraction, TransitionConfig } from './types';

// ============================================
// Animation Presets
// ============================================

export const animationPresets = {
  // Fade animations
  fadeIn: {
    duration: 200,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    fillMode: 'forwards',
  } as AnimationConfig,

  fadeOut: {
    duration: 150,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    fillMode: 'forwards',
  } as AnimationConfig,

  // Scale animations
  scaleIn: {
    duration: 200,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    fillMode: 'forwards',
  } as AnimationConfig,

  scaleOut: {
    duration: 150,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    fillMode: 'forwards',
  } as AnimationConfig,

  // Slide animations
  slideInUp: {
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    fillMode: 'forwards',
  } as AnimationConfig,

  slideInDown: {
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    fillMode: 'forwards',
  } as AnimationConfig,

  slideInLeft: {
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    fillMode: 'forwards',
  } as AnimationConfig,

  slideInRight: {
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    fillMode: 'forwards',
  } as AnimationConfig,

  // Bounce animation
  bounce: {
    duration: 600,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    fillMode: 'forwards',
  } as AnimationConfig,

  // Pulse animation
  pulse: {
    duration: 1000,
    easing: 'cubic-bezier(0.4, 0, 0.6, 1)',
    fillMode: 'forwards',
  } as AnimationConfig,

  // Shake animation for errors
  shake: {
    duration: 400,
    easing: 'cubic-bezier(0.36, 0.07, 0.19, 0.97)',
    fillMode: 'forwards',
  } as AnimationConfig,

  // Spring animation for success
  spring: {
    duration: 500,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    fillMode: 'forwards',
  } as AnimationConfig,
};

// ============================================
// Micro-interactions
// ============================================

export const microInteractions = {
  // Button interactions
  buttonPress: {
    trigger: 'active',
    animation: {
      duration: 150,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    scale: 0.95,
  } as MicroInteraction,

  buttonHover: {
    trigger: 'hover',
    animation: {
      duration: 200,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    translate: { y: -2 },
  } as MicroInteraction,

  // Card interactions
  cardHover: {
    trigger: 'hover',
    animation: {
      duration: 250,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    translate: { y: -4 },
    scale: 1.02,
  } as MicroInteraction,

  cardPress: {
    trigger: 'active',
    animation: {
      duration: 150,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    scale: 0.98,
  } as MicroInteraction,

  // Input interactions
  inputFocus: {
    trigger: 'focus',
    animation: {
      duration: 200,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    scale: 1.02,
  } as MicroInteraction,

  // Icon interactions
  iconHover: {
    trigger: 'hover',
    animation: {
      duration: 200,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
    scale: 1.1,
  } as MicroInteraction,

  iconPress: {
    trigger: 'active',
    animation: {
      duration: 100,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    scale: 0.9,
  } as MicroInteraction,

  // Loading states
  loadingPulse: {
    trigger: 'load',
    animation: {
      duration: 1500,
      easing: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  } as MicroInteraction,

  // Success feedback
  successFeedback: {
    trigger: 'click',
    animation: {
      duration: 600,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
    scale: 1.05,
  } as MicroInteraction,
};

// ============================================
// Transition Configurations
// ============================================

export const transitions = {
  // Standard transitions
  all: {
    property: 'all',
    duration: '300ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  } as TransitionConfig,

  fast: {
    property: 'all',
    duration: '150ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  } as TransitionConfig,

  slow: {
    property: 'all',
    duration: '500ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  } as TransitionConfig,

  // Specific property transitions
  transform: {
    property: 'transform',
    duration: '300ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  } as TransitionConfig,

  opacity: {
    property: 'opacity',
    duration: '200ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  } as TransitionConfig,

  colors: {
    property: 'color, background-color, border-color',
    duration: '200ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  } as TransitionConfig,

  shadow: {
    property: 'box-shadow',
    duration: '250ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  } as TransitionConfig,

  // Spring transitions
  spring: {
    property: 'transform',
    duration: '400ms',
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  } as TransitionConfig,

  springFast: {
    property: 'transform',
    duration: '250ms',
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  } as TransitionConfig,
};

// ============================================
// CSS Keyframes
// ============================================

export const keyframes = {
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `,

  fadeOut: `
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `,

  scaleIn: `
    @keyframes scaleIn {
      from { 
        opacity: 0; 
        transform: scale(0.9); 
      }
      to { 
        opacity: 1; 
        transform: scale(1); 
      }
    }
  `,

  scaleOut: `
    @keyframes scaleOut {
      from { 
        opacity: 1; 
        transform: scale(1); 
      }
      to { 
        opacity: 0; 
        transform: scale(0.9); 
      }
    }
  `,

  slideInUp: `
    @keyframes slideInUp {
      from { 
        opacity: 0; 
        transform: translateY(100%); 
      }
      to { 
        opacity: 1; 
        transform: translateY(0); 
      }
    }
  `,

  slideInDown: `
    @keyframes slideInDown {
      from { 
        opacity: 0; 
        transform: translateY(-100%); 
      }
      to { 
        opacity: 1; 
        transform: translateY(0); 
      }
    }
  `,

  slideInLeft: `
    @keyframes slideInLeft {
      from { 
        opacity: 0; 
        transform: translateX(-100%); 
      }
      to { 
        opacity: 1; 
        transform: translateX(0); 
      }
    }
  `,

  slideInRight: `
    @keyframes slideInRight {
      from { 
        opacity: 0; 
        transform: translateX(100%); 
      }
      to { 
        opacity: 1; 
        transform: translateX(0); 
      }
    }
  `,

  bounce: `
    @keyframes bounce {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
  `,

  pulse: `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `,

  shake: `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
      20%, 40%, 60%, 80% { transform: translateX(4px); }
    }
  `,

  spin: `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `,

  shimmer: `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `,

  float: `
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
  `,

  glow: `
    @keyframes glow {
      0%, 100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
      50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8); }
    }
  `,
};

// ============================================
// Animation Utilities
// ============================================

export const createAnimation = (
  name: string,
  config: AnimationConfig
): string => {
  const { duration = 300, easing = 'ease', delay = 0, fillMode = 'both' } = config;
  return `${name} ${duration}ms ${easing} ${delay}ms ${fillMode}`;
};

export const createTransition = (config: TransitionConfig): string => {
  const { property, duration, easing, delay = '0ms' } = config;
  return `${property} ${duration} ${easing} ${delay}`;
};

export const combineTransitions = (configs: TransitionConfig[]): string => {
  return configs.map(createTransition).join(', ');
};

// ============================================
// Performance Optimizations
// ============================================

export const performanceOptimizations = {
  // GPU acceleration
  gpuAcceleration: {
    transform: 'translateZ(0)',
    willChange: 'transform',
    backfaceVisibility: 'hidden',
  },

  // Optimize for animations
  animationOptimization: {
    willChange: 'transform, opacity',
    backfaceVisibility: 'hidden',
    perspective: '1000px',
  },

  // Contain layout shifts
  containment: {
    contain: 'layout style paint',
  },
};

// ============================================
// Accessibility Considerations
// ============================================

export const accessibilityAnimations = {
  // Reduced motion media query
  reducedMotion: `
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
  `,

  // Respect user preferences
  respectPreferences: {
    animationPlayState: 'var(--animation-play-state, running)',
    transitionDuration: 'var(--transition-duration, 300ms)',
  },
};

// ============================================
// Animation Classes
// ============================================

export const animationClasses = {
  // Entrance animations
  'animate-fade-in': 'animation: fadeIn 200ms cubic-bezier(0.4, 0, 0.2, 1) forwards;',
  'animate-scale-in': 'animation: scaleIn 200ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;',
  'animate-slide-in-up': 'animation: slideInUp 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;',
  'animate-slide-in-down': 'animation: slideInDown 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;',
  'animate-slide-in-left': 'animation: slideInLeft 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;',
  'animate-slide-in-right': 'animation: slideInRight 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;',

  // Exit animations
  'animate-fade-out': 'animation: fadeOut 150ms cubic-bezier(0.4, 0, 0.2, 1) forwards;',
  'animate-scale-out': 'animation: scaleOut 150ms cubic-bezier(0.4, 0, 0.2, 1) forwards;',

  // Feedback animations
  'animate-bounce': 'animation: bounce 600ms cubic-bezier(0.34, 1.56, 0.64, 1);',
  'animate-pulse': 'animation: pulse 1000ms cubic-bezier(0.4, 0, 0.6, 1) infinite;',
  'animate-shake': 'animation: shake 400ms cubic-bezier(0.36, 0.07, 0.19, 0.97);',
  'animate-spin': 'animation: spin 1000ms linear infinite;',
  'animate-shimmer': 'animation: shimmer 1500ms ease-in-out infinite;',
  'animate-float': 'animation: float 3000ms ease-in-out infinite;',
  'animate-glow': 'animation: glow 2000ms ease-in-out infinite;',

  // Transition classes
  'transition-all': 'transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);',
  'transition-fast': 'transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);',
  'transition-slow': 'transition: all 500ms cubic-bezier(0.4, 0, 0.2, 1);',
  'transition-transform': 'transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);',
  'transition-opacity': 'transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1);',
  'transition-colors': 'transition: color 200ms cubic-bezier(0.4, 0, 0.2, 1), background-color 200ms cubic-bezier(0.4, 0, 0.2, 1), border-color 200ms cubic-bezier(0.4, 0, 0.2, 1);',
  'transition-shadow': 'transition: box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1);',
  'transition-spring': 'transition: transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1);',

  // Performance optimizations
  'gpu-accelerated': 'transform: translateZ(0); will-change: transform; backface-visibility: hidden;',
  'animation-optimized': 'will-change: transform, opacity; backface-visibility: hidden; perspective: 1000px;',
};

// ============================================
// Export All Keyframes as CSS
// ============================================

export const allKeyframes = Object.values(keyframes).join('\n\n');

// ============================================
// Complete Animation System Export
// ============================================

export const animationSystem = {
  presets: animationPresets,
  microInteractions,
  transitions,
  keyframes,
  classes: animationClasses,
  utilities: {
    createAnimation,
    createTransition,
    combineTransitions,
  },
  performance: performanceOptimizations,
  accessibility: accessibilityAnimations,
};