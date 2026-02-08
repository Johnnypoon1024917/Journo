/**
 * Mobile touch enhancement utilities
 * Provides better touch interactions, haptic feedback, and mobile-specific optimizations
 */

// Touch gesture detection
export interface TouchGesture {
  type: 'tap' | 'longPress' | 'swipeLeft' | 'swipeRight' | 'swipeUp' | 'swipeDown' | 'pinch';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
  distance: number;
}

export class TouchGestureDetector {
  private startTime: number = 0;
  private startX: number = 0;
  private startY: number = 0;
  private longPressTimer: NodeJS.Timeout | null = null;
  private readonly longPressDelay = 500; // ms
  private readonly swipeThreshold = 50; // px
  private readonly tapThreshold = 10; // px

  constructor(
    private element: HTMLElement,
    private onGesture: (gesture: TouchGesture) => void
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this));
  }

  private handleTouchStart(e: TouchEvent): void {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      this.startTime = Date.now();
      this.startX = touch.clientX;
      this.startY = touch.clientY;

      // Start long press timer
      this.longPressTimer = setTimeout(() => {
        this.triggerHaptic('medium');
        this.onGesture({
          type: 'longPress',
          startX: this.startX,
          startY: this.startY,
          endX: this.startX,
          endY: this.startY,
          duration: this.longPressDelay,
          distance: 0,
        });
      }, this.longPressDelay);
    }
  }

  private handleTouchMove(_e: TouchEvent): void {
    // Cancel long press if finger moves
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    const touch = e.changedTouches[0];
    const endTime = Date.now();
    const endX = touch.clientX;
    const endY = touch.clientY;

    const duration = endTime - this.startTime;
    const deltaX = endX - this.startX;
    const deltaY = endY - this.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Determine gesture type
    if (distance < this.tapThreshold && duration < 300) {
      // Tap
      this.triggerHaptic('light');
      this.onGesture({
        type: 'tap',
        startX: this.startX,
        startY: this.startY,
        endX,
        endY,
        duration,
        distance,
      });
    } else if (distance > this.swipeThreshold) {
      // Swipe
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      let swipeType: 'swipeLeft' | 'swipeRight' | 'swipeUp' | 'swipeDown';
      
      if (absX > absY) {
        swipeType = deltaX > 0 ? 'swipeRight' : 'swipeLeft';
      } else {
        swipeType = deltaY > 0 ? 'swipeDown' : 'swipeUp';
      }

      this.triggerHaptic('light');
      this.onGesture({
        type: swipeType,
        startX: this.startX,
        startY: this.startY,
        endX,
        endY,
        duration,
        distance,
      });
    }
  }

  private handleTouchCancel(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private triggerHaptic(intensity: 'light' | 'medium' | 'heavy'): void {
    if ('vibrate' in navigator) {
      const patterns = { light: 10, medium: 20, heavy: 30 };
      navigator.vibrate(patterns[intensity]);
    }
  }

  public destroy(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
  }
}

// Touch-friendly button enhancement
export const enhanceButtonForTouch = (button: HTMLElement): void => {
  // Ensure minimum touch target size (44x44px)
  const computedStyle = window.getComputedStyle(button);
  const width = parseInt(computedStyle.width);
  const height = parseInt(computedStyle.height);
  
  if (width < 44 || height < 44) {
    button.style.minWidth = '44px';
    button.style.minHeight = '44px';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
  }

  // Add touch-friendly styles
  button.style.touchAction = 'manipulation';
  (button.style as any).webkitTapHighlightColor = 'transparent';
  
  // Add active state feedback
  const addActiveState = () => {
    button.style.transform = 'scale(0.95)';
    button.style.opacity = '0.8';
  };
  
  const removeActiveState = () => {
    button.style.transform = '';
    button.style.opacity = '';
  };

  button.addEventListener('touchstart', addActiveState, { passive: true });
  button.addEventListener('touchend', removeActiveState, { passive: true });
  button.addEventListener('touchcancel', removeActiveState, { passive: true });
};

// Scroll momentum enhancement for iOS
export const enhanceScrolling = (element: HTMLElement): void => {
  (element.style as any).webkitOverflowScrolling = 'touch';
  element.style.scrollBehavior = 'smooth';
  
  // Add momentum scrolling indicators
  let isScrolling = false;
  let scrollTimeout: NodeJS.Timeout;

  const handleScrollStart = () => {
    if (!isScrolling) {
      isScrolling = true;
      element.classList.add('is-scrolling');
    }
    
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isScrolling = false;
      element.classList.remove('is-scrolling');
    }, 150);
  };

  element.addEventListener('scroll', handleScrollStart, { passive: true });
};

// Safe area handling for devices with notches
export const applySafeAreaInsets = (element: HTMLElement): void => {
  // Check if device supports safe area insets
  if (CSS.supports('padding-top: env(safe-area-inset-top)')) {
    element.style.paddingTop = 'max(16px, env(safe-area-inset-top))';
    element.style.paddingBottom = 'max(16px, env(safe-area-inset-bottom))';
    element.style.paddingLeft = 'max(16px, env(safe-area-inset-left))';
    element.style.paddingRight = 'max(16px, env(safe-area-inset-right))';
  }
};

// Prevent zoom on input focus (iOS Safari)
export const preventZoomOnInputFocus = (): void => {
  const addMaximumScaleToMetaViewport = () => {
    const el = document.querySelector('meta[name=viewport]') as HTMLMetaElement;
    if (el !== null) {
      let content = el.content;
      const re = /maximum-scale=[0-9.]+/g;
      
      if (re.test(content)) {
        content = content.replace(re, 'maximum-scale=1.0');
      } else {
        content = [content, 'maximum-scale=1.0'].join(', ');
      }
      
      el.content = content;
    }
  };

  const disableIosTextFieldZoom = addMaximumScaleToMetaViewport;
  const enableIosTextFieldZoom = () => {
    const el = document.querySelector('meta[name=viewport]') as HTMLMetaElement;
    if (el !== null) {
      el.content = el.content.replace(/maximum-scale=[0-9.]+/g, 'maximum-scale=5.0');
    }
  };

  // Disable zoom on focus
  document.addEventListener('focusin', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      disableIosTextFieldZoom();
    }
  });

  // Re-enable zoom on blur
  document.addEventListener('focusout', () => {
    enableIosTextFieldZoom();
  });
};

// Device orientation handling
export const handleOrientationChange = (callback: (orientation: 'portrait' | 'landscape') => void): void => {
  const checkOrientation = () => {
    const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    callback(orientation);
  };

  // Initial check
  checkOrientation();

  // Listen for orientation changes
  window.addEventListener('orientationchange', () => {
    // Small delay to ensure dimensions are updated
    setTimeout(checkOrientation, 100);
  });

  window.addEventListener('resize', checkOrientation);
};

// Performance optimization for touch interactions
export const optimizeForTouch = (): void => {
  // Add CSS for better touch performance
  const style = document.createElement('style');
  style.textContent = `
    * {
      -webkit-tap-highlight-color: transparent;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      -khtml-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
    
    input, textarea, [contenteditable] {
      -webkit-user-select: auto;
      -khtml-user-select: auto;
      -moz-user-select: auto;
      -ms-user-select: auto;
      user-select: auto;
    }
    
    .touch-optimized {
      touch-action: manipulation;
      will-change: transform;
    }
    
    .is-scrolling {
      pointer-events: none;
    }
    
    @media (hover: none) and (pointer: coarse) {
      .hover-only {
        display: none !important;
      }
      
      .touch-only {
        display: block !important;
      }
      
      button, [role="button"] {
        min-height: 44px;
        min-width: 44px;
      }
    }
    
    @media (hover: hover) and (pointer: fine) {
      .touch-only {
        display: none !important;
      }
      
      .hover-only {
        display: block !important;
      }
    }
  `;
  
  document.head.appendChild(style);
};

// Initialize touch enhancements
export const initializeTouchEnhancements = (): void => {
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    optimizeForTouch();
    preventZoomOnInputFocus();
    
    // Enhance all buttons
    document.querySelectorAll('button, [role="button"]').forEach(button => {
      enhanceButtonForTouch(button as HTMLElement);
    });
    
    // Enhance scrollable elements
    document.querySelectorAll('[data-scrollable]').forEach(element => {
      enhanceScrolling(element as HTMLElement);
    });
  }
};

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTouchEnhancements);
  } else {
    initializeTouchEnhancements();
  }
}