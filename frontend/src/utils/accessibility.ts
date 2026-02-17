/**
 * Accessibility Utilities
 * 
 * Helper functions for ensuring accessibility compliance
 */

/**
 * Calculate relative luminance of a color
 * Used for WCAG contrast ratio calculations
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const val = c / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * Returns a value between 1 and 21
 * WCAG AA requires 4.5:1 for normal text, 3:1 for large text
 * WCAG AAA requires 7:1 for normal text, 4.5:1 for large text
 */
export function getContrastRatio(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number }
): number {
  const l1 = getRelativeLuminance(color1.r, color1.g, color1.b);
  const l2 = getRelativeLuminance(color2.r, color2.g, color2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Check if contrast ratio meets WCAG AA standards
 */
export function meetsWCAGAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);
  
  if (!fg || !bg) return false;
  
  const ratio = getContrastRatio(fg, bg);
  const requiredRatio = isLargeText ? 3 : 4.5;
  
  return ratio >= requiredRatio;
}

/**
 * Check if contrast ratio meets WCAG AAA standards
 */
export function meetsWCAGAAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);
  
  if (!fg || !bg) return false;
  
  const ratio = getContrastRatio(fg, bg);
  const requiredRatio = isLargeText ? 4.5 : 7;
  
  return ratio >= requiredRatio;
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get animation duration respecting reduce motion preference
 * Returns 0ms if user prefers reduced motion, otherwise returns the provided duration
 */
export function getAnimationDuration(durationMs: number): number {
  return prefersReducedMotion() ? 0 : durationMs;
}

/**
 * Get transition duration respecting reduce motion preference
 * Returns 1ms if user prefers reduced motion (to ensure transitions still fire),
 * otherwise returns the provided duration
 */
export function getTransitionDuration(durationMs: number): number {
  return prefersReducedMotion() ? 1 : durationMs;
}

/**
 * Create a CSS transition string respecting reduce motion
 */
export function createAccessibleTransition(
  property: string,
  durationMs: number,
  easing: string = 'ease'
): string {
  const duration = getTransitionDuration(durationMs);
  return `${property} ${duration}ms ${easing}`;
}

/**
 * Create a CSS animation string respecting reduce motion
 */
export function createAccessibleAnimation(
  name: string,
  durationMs: number,
  easing: string = 'ease',
  fillMode: string = 'forwards'
): string {
  const duration = getAnimationDuration(durationMs);
  return `${name} ${duration}ms ${easing} ${fillMode}`;
}

/**
 * Check if user prefers high contrast
 */
export function prefersHighContrast(): boolean {
  return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * Check if forced colors mode is active (Windows High Contrast)
 */
export function isForcedColorsActive(): boolean {
  return window.matchMedia('(forced-colors: active)').matches;
}

/**
 * Get accessible color for text based on background
 * Returns either black or white depending on which has better contrast
 */
export function getAccessibleTextColor(backgroundColor: string): string {
  const bg = hexToRgb(backgroundColor);
  if (!bg) return '#000000';
  
  const whiteContrast = getContrastRatio(bg, { r: 255, g: 255, b: 255 });
  const blackContrast = getContrastRatio(bg, { r: 0, g: 0, b: 0 });
  
  return whiteContrast > blackContrast ? '#ffffff' : '#000000';
}

/**
 * Trap focus within a container (useful for modals)
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };
  
  container.addEventListener('keydown', handleTabKey);
  
  // Focus first element
  firstElement?.focus();
  
  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleTabKey);
  };
}

/**
 * Generate unique ID for accessibility attributes
 */
let idCounter = 0;
export function generateA11yId(prefix: string = 'a11y'): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * Audit interactive elements for missing ARIA labels
 * Returns a list of elements that need accessibility improvements
 */
export interface AccessibilityIssue {
  element: HTMLElement;
  type: 'missing-label' | 'missing-alt' | 'low-contrast' | 'small-touch-target';
  message: string;
  severity: 'error' | 'warning';
}

export function auditAccessibility(container: HTMLElement = document.body): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  
  // Check buttons for labels
  const buttons = container.querySelectorAll<HTMLButtonElement>('button');
  buttons.forEach((button) => {
    const hasLabel = 
      button.getAttribute('aria-label') ||
      button.getAttribute('aria-labelledby') ||
      button.textContent?.trim() ||
      button.querySelector('[aria-label]');
    
    if (!hasLabel) {
      issues.push({
        element: button,
        type: 'missing-label',
        message: 'Button missing accessible label',
        severity: 'error',
      });
    }
  });
  
  // Check links for labels
  const links = container.querySelectorAll<HTMLAnchorElement>('a');
  links.forEach((link) => {
    const hasLabel = 
      link.getAttribute('aria-label') ||
      link.getAttribute('aria-labelledby') ||
      link.textContent?.trim();
    
    if (!hasLabel) {
      issues.push({
        element: link,
        type: 'missing-label',
        message: 'Link missing accessible label',
        severity: 'error',
      });
    }
  });
  
  // Check images for alt text
  const images = container.querySelectorAll<HTMLImageElement>('img');
  images.forEach((img) => {
    const hasAlt = img.getAttribute('alt') !== null;
    const isDecorative = img.getAttribute('role') === 'presentation' || img.getAttribute('aria-hidden') === 'true';
    
    if (!hasAlt && !isDecorative) {
      issues.push({
        element: img,
        type: 'missing-alt',
        message: 'Image missing alt text',
        severity: 'error',
      });
    }
  });
  
  // Check SVGs for accessibility
  const svgs = container.querySelectorAll<SVGElement>('svg');
  svgs.forEach((svg) => {
    const hasLabel = 
      svg.getAttribute('aria-label') ||
      svg.getAttribute('aria-labelledby') ||
      svg.getAttribute('role') === 'presentation' ||
      svg.getAttribute('aria-hidden') === 'true';
    
    if (!hasLabel) {
      issues.push({
        element: svg,
        type: 'missing-label',
        message: 'SVG icon missing accessible label or aria-hidden',
        severity: 'warning',
      });
    }
  });
  
  // Check form inputs for labels
  const inputs = container.querySelectorAll<HTMLInputElement>('input:not([type="hidden"])');
  inputs.forEach((input) => {
    const hasLabel = 
      input.getAttribute('aria-label') ||
      input.getAttribute('aria-labelledby') ||
      container.querySelector(`label[for="${input.id}"]`);
    
    if (!hasLabel) {
      issues.push({
        element: input,
        type: 'missing-label',
        message: 'Input missing associated label',
        severity: 'error',
      });
    }
  });
  
  return issues;
}

/**
 * Log accessibility issues to console (development only)
 */
export function logAccessibilityIssues(container?: HTMLElement): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  const issues = auditAccessibility(container);
  
  if (issues.length === 0) {
    console.log('✅ No accessibility issues found');
    return;
  }
  
  console.group(`⚠️ Found ${issues.length} accessibility issues`);
  
  issues.forEach((issue, index) => {
    const icon = issue.severity === 'error' ? '❌' : '⚠️';
    console.log(`${icon} ${index + 1}. ${issue.message}`, issue.element);
  });
  
  console.groupEnd();
}

/**
 * Ensure element has accessible label
 * Adds aria-label if no label exists
 */
export function ensureAccessibleLabel(
  element: HTMLElement,
  label: string,
  force: boolean = false
): void {
  const hasLabel = 
    element.getAttribute('aria-label') ||
    element.getAttribute('aria-labelledby') ||
    element.textContent?.trim();
  
  if (!hasLabel || force) {
    element.setAttribute('aria-label', label);
  }
}

/**
 * Check if element meets minimum touch target size (44x44px)
 */
export function meetsTouchTargetSize(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width >= 44 && rect.height >= 44;
}

/**
 * Add keyboard navigation support to element
 */
export function makeKeyboardAccessible(
  element: HTMLElement,
  onClick: () => void
): () => void {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };
  
  // Make focusable if not already
  if (!element.hasAttribute('tabindex')) {
    element.setAttribute('tabindex', '0');
  }
  
  // Add role if not already set
  if (!element.hasAttribute('role')) {
    element.setAttribute('role', 'button');
  }
  
  element.addEventListener('keydown', handleKeyDown);
  
  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement = document.body): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not(:disabled)',
    'input:not(:disabled)',
    'select:not(:disabled)',
    'textarea:not(:disabled)',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

/**
 * Get the next focusable element in the tab order
 */
export function getNextFocusableElement(
  currentElement: HTMLElement,
  container: HTMLElement = document.body
): HTMLElement | null {
  const focusableElements = getFocusableElements(container);
  const currentIndex = focusableElements.indexOf(currentElement);
  
  if (currentIndex === -1) return null;
  
  const nextIndex = (currentIndex + 1) % focusableElements.length;
  return focusableElements[nextIndex] || null;
}

/**
 * Get the previous focusable element in the tab order
 */
export function getPreviousFocusableElement(
  currentElement: HTMLElement,
  container: HTMLElement = document.body
): HTMLElement | null {
  const focusableElements = getFocusableElements(container);
  const currentIndex = focusableElements.indexOf(currentElement);
  
  if (currentIndex === -1) return null;
  
  const prevIndex = (currentIndex - 1 + focusableElements.length) % focusableElements.length;
  return focusableElements[prevIndex] || null;
}

/**
 * Ensure logical tab order by checking tabindex values
 * Returns elements with problematic tabindex values
 */
export function auditTabOrder(container: HTMLElement = document.body): HTMLElement[] {
  const problematicElements: HTMLElement[] = [];
  
  const elements = container.querySelectorAll<HTMLElement>('[tabindex]');
  elements.forEach((element) => {
    const tabindex = parseInt(element.getAttribute('tabindex') || '0', 10);
    
    // Positive tabindex values (except 0) are problematic
    // They disrupt natural tab order
    if (tabindex > 0) {
      problematicElements.push(element);
    }
  });
  
  return problematicElements;
}

/**
 * Check if element is currently visible and focusable
 */
export function isElementFocusable(element: HTMLElement): boolean {
  // Check if element is visible
  const style = window.getComputedStyle(element);
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.opacity === '0'
  ) {
    return false;
  }
  
  // Check if element is disabled
  if (element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true') {
    return false;
  }
  
  // Check if element has negative tabindex
  const tabindex = element.getAttribute('tabindex');
  if (tabindex === '-1') {
    return false;
  }
  
  // Check if element is inherently focusable or has tabindex
  const focusableElements = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
  if (focusableElements.includes(element.tagName) || tabindex !== null) {
    return true;
  }
  
  return false;
}

/**
 * Move focus to the first focusable element in a container
 */
export function focusFirstElement(container: HTMLElement): boolean {
  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  
  if (firstElement && isElementFocusable(firstElement)) {
    firstElement.focus();
    return true;
  }
  
  return false;
}

/**
 * Move focus to the last focusable element in a container
 */
export function focusLastElement(container: HTMLElement): boolean {
  const focusableElements = getFocusableElements(container);
  const lastElement = focusableElements[focusableElements.length - 1];
  
  if (lastElement && isElementFocusable(lastElement)) {
    lastElement.focus();
    return true;
  }
  
  return false;
}

/**
 * Create a keyboard event handler for common patterns
 */
export function createKeyboardHandler(handlers: {
  onEnter?: (event: KeyboardEvent) => void;
  onSpace?: (event: KeyboardEvent) => void;
  onEscape?: (event: KeyboardEvent) => void;
  onArrowUp?: (event: KeyboardEvent) => void;
  onArrowDown?: (event: KeyboardEvent) => void;
  onArrowLeft?: (event: KeyboardEvent) => void;
  onArrowRight?: (event: KeyboardEvent) => void;
  onHome?: (event: KeyboardEvent) => void;
  onEnd?: (event: KeyboardEvent) => void;
  onTab?: (event: KeyboardEvent) => void;
}): (event: KeyboardEvent) => void {
  return (event: KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
        handlers.onEnter?.(event);
        break;
      case ' ':
        handlers.onSpace?.(event);
        break;
      case 'Escape':
        handlers.onEscape?.(event);
        break;
      case 'ArrowUp':
        handlers.onArrowUp?.(event);
        break;
      case 'ArrowDown':
        handlers.onArrowDown?.(event);
        break;
      case 'ArrowLeft':
        handlers.onArrowLeft?.(event);
        break;
      case 'ArrowRight':
        handlers.onArrowRight?.(event);
        break;
      case 'Home':
        handlers.onHome?.(event);
        break;
      case 'End':
        handlers.onEnd?.(event);
        break;
      case 'Tab':
        handlers.onTab?.(event);
        break;
    }
  };
}

/**
 * Ensure all interactive elements in a container are keyboard accessible
 * Adds tabindex="0" and role="button" to elements with click handlers but no keyboard support
 */
export function ensureKeyboardAccessibility(container: HTMLElement = document.body): void {
  // Find all elements with click handlers
  const allElements = container.querySelectorAll<HTMLElement>('*');
  
  allElements.forEach((element) => {
    // Check if element has click handler (heuristic: has onclick or cursor pointer)
    const hasClickHandler = 
      element.onclick !== null ||
      window.getComputedStyle(element).cursor === 'pointer';
    
    if (!hasClickHandler) return;
    
    // Check if element is already keyboard accessible
    const isButton = element.tagName === 'BUTTON';
    const isLink = element.tagName === 'A' && element.hasAttribute('href');
    const isInput = ['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName);
    const hasTabIndex = element.hasAttribute('tabindex');
    const hasRole = element.hasAttribute('role');
    
    const isAlreadyAccessible = isButton || isLink || isInput || hasTabIndex;
    
    if (!isAlreadyAccessible) {
      // Make it keyboard accessible
      element.setAttribute('tabindex', '0');
      
      if (!hasRole) {
        element.setAttribute('role', 'button');
      }
      
      // Add keyboard event listener if not already present
      const existingHandler = element.onkeydown;
      if (!existingHandler) {
        element.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            element.click();
          }
        });
      }
    }
  });
}
