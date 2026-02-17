/**
 * Safe Area Service
 * 
 * Provides safe area inset detection and utilities for iOS devices.
 * Handles notches, home indicators, and other system UI elements.
 * Implements Requirements 3.4, 7.1, 7.2, 7.3, 7.4
 */

export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

type SafeAreaChangeCallback = (insets: SafeAreaInsets) => void;

class SafeAreaService {
  private listeners: Set<SafeAreaChangeCallback> = new Set();
  private currentInsets: SafeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };
  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    this.initializeInsets();
    this.setupResizeObserver();
  }

  /**
   * Get current safe area insets
   * Returns insets in pixels
   */
  getInsets(): SafeAreaInsets {
    return { ...this.currentInsets };
  }

  /**
   * Subscribe to safe area inset changes
   * Returns unsubscribe function
   */
  subscribeToChanges(callback: SafeAreaChangeCallback): () => void {
    this.listeners.add(callback);
    
    // Immediately call with current insets
    callback(this.getInsets());

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Apply safe area styles to an element
   * Adds padding based on safe area insets
   */
  applySafeAreaStyles(element: HTMLElement, options?: {
    top?: boolean;
    right?: boolean;
    bottom?: boolean;
    left?: boolean;
  }): void {
    const { top = true, right = true, bottom = true, left = true } = options || {};
    const insets = this.getInsets();

    if (top) {
      element.style.paddingTop = `${insets.top}px`;
    }
    if (right) {
      element.style.paddingRight = `${insets.right}px`;
    }
    if (bottom) {
      element.style.paddingBottom = `${insets.bottom}px`;
    }
    if (left) {
      element.style.paddingLeft = `${insets.left}px`;
    }
  }

  /**
   * Get CSS custom properties for safe area insets
   * Returns object with CSS variable names and values
   */
  getCSSVariables(): Record<string, string> {
    const insets = this.getInsets();
    return {
      '--safe-area-inset-top': `${insets.top}px`,
      '--safe-area-inset-right': `${insets.right}px`,
      '--safe-area-inset-bottom': `${insets.bottom}px`,
      '--safe-area-inset-left': `${insets.left}px`
    };
  }

  /**
   * Apply safe area CSS variables to document root
   */
  applyCSSVariables(): void {
    const variables = this.getCSSVariables();
    Object.entries(variables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }

  /**
   * Check if device has safe area insets (has notch or home indicator)
   */
  hasSafeAreaInsets(): boolean {
    const insets = this.getInsets();
    return insets.top > 0 || insets.bottom > 0 || insets.left > 0 || insets.right > 0;
  }

  /**
   * Initialize safe area insets from CSS environment variables
   */
  private initializeInsets(): void {
    this.updateInsets();
    this.applyCSSVariables();
  }

  /**
   * Update current insets from CSS environment variables
   */
  private updateInsets(): void {
    const previousInsets = { ...this.currentInsets };

    // Get insets from CSS environment variables
    // These are provided by iOS WebView
    this.currentInsets = {
      top: this.getEnvValue('safe-area-inset-top'),
      right: this.getEnvValue('safe-area-inset-right'),
      bottom: this.getEnvValue('safe-area-inset-bottom'),
      left: this.getEnvValue('safe-area-inset-left')
    };

    // Check if insets changed
    const changed = 
      previousInsets.top !== this.currentInsets.top ||
      previousInsets.right !== this.currentInsets.right ||
      previousInsets.bottom !== this.currentInsets.bottom ||
      previousInsets.left !== this.currentInsets.left;

    // Notify listeners if changed
    if (changed) {
      this.notifyListeners();
    }
  }

  /**
   * Get numeric value from CSS environment variable
   */
  private getEnvValue(variable: string): number {
    // Try to get the value from a temporary element
    const testElement = document.createElement('div');
    testElement.style.position = 'absolute';
    testElement.style.visibility = 'hidden';
    testElement.style.height = `env(${variable}, 0px)`;
    document.body.appendChild(testElement);
    
    const computedHeight = window.getComputedStyle(testElement).height;
    document.body.removeChild(testElement);
    
    // Parse the pixel value
    const value = parseFloat(computedHeight);
    return isNaN(value) ? 0 : value;
  }

  /**
   * Setup resize observer to detect orientation changes
   */
  private setupResizeObserver(): void {
    if (typeof ResizeObserver === 'undefined') {
      // Fallback to window resize event
      window.addEventListener('resize', () => {
        this.updateInsets();
      });
      return;
    }

    this.resizeObserver = new ResizeObserver(() => {
      this.updateInsets();
    });

    this.resizeObserver.observe(document.documentElement);
  }

  /**
   * Notify all listeners of inset changes
   */
  private notifyListeners(): void {
    const insets = this.getInsets();
    this.listeners.forEach(callback => {
      try {
        callback(insets);
      } catch (error) {
        console.error('Error in safe area change listener:', error);
      }
    });

    // Update CSS variables
    this.applyCSSVariables();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.listeners.clear();
  }
}

// Export singleton instance
export const safeAreaService = new SafeAreaService();
