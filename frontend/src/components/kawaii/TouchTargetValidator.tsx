/**
 * TouchTargetValidator Component
 * 
 * Development tool to validate that interactive elements meet minimum touch target size.
 * 
 * Features:
 * - Validates 44px minimum touch target size
 * - Visual indicators for invalid touch targets
 * - Only runs in development mode
 * - Automatic validation on mount and resize
 * 
 * Requirements: 17.6
 */

import React, { useEffect, useRef, useState } from 'react';
import { meetsMinTouchTarget, MIN_TOUCH_TARGET } from '@/utils/responsive';

export interface TouchTargetValidatorProps {
  /** Whether to show visual indicators (default: true in dev) */
  showIndicators?: boolean;
  /** Whether to log warnings to console (default: true in dev) */
  logWarnings?: boolean;
  /** Selector for interactive elements to validate (default: 'button, a, input, select, textarea, [role="button"]') */
  selector?: string;
}

interface InvalidTarget {
  element: HTMLElement;
  width: number;
  height: number;
  rect: DOMRect;
}

/**
 * TouchTargetValidator Component
 * 
 * Only runs in development mode to help identify touch target accessibility issues.
 */
export const TouchTargetValidator: React.FC<TouchTargetValidatorProps> = ({
  showIndicators = import.meta.env.DEV,
  logWarnings = import.meta.env.DEV,
  selector = 'button, a, input, select, textarea, [role="button"], [role="link"], [role="checkbox"], [role="radio"]',
}) => {
  const [invalidTargets, setInvalidTargets] = useState<InvalidTarget[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Only run in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  useEffect(() => {
    const validateTouchTargets = () => {
      const elements = document.querySelectorAll<HTMLElement>(selector);
      const invalid: InvalidTarget[] = [];

      elements.forEach((element) => {
        // Skip hidden elements
        if (element.offsetParent === null) return;

        // Skip elements with aria-hidden
        if (element.getAttribute('aria-hidden') === 'true') return;

        // Check if element meets minimum touch target
        if (!meetsMinTouchTarget(element)) {
          const rect = element.getBoundingClientRect();
          invalid.push({
            element,
            width: rect.width,
            height: rect.height,
            rect,
          });

          if (logWarnings) {
            console.warn(
              `Touch target too small: ${element.tagName}${element.id ? `#${element.id}` : ''}${element.className ? `.${element.className.split(' ')[0]}` : ''} (${Math.round(rect.width)}x${Math.round(rect.height)}px, minimum: ${MIN_TOUCH_TARGET}x${MIN_TOUCH_TARGET}px)`,
              element
            );
          }
        }
      });

      setInvalidTargets(invalid);
    };

    // Initial validation
    validateTouchTargets();

    // Re-validate on resize
    const handleResize = () => {
      validateTouchTargets();
    };

    window.addEventListener('resize', handleResize);

    // Re-validate on DOM changes (debounced)
    let timeoutId: NodeJS.Timeout;
    const observer = new MutationObserver(() => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(validateTouchTargets, 500);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [selector, logWarnings]);

  // Don't show indicators if disabled
  if (!showIndicators || invalidTargets.length === 0) {
    return null;
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      aria-hidden="true"
    >
      {invalidTargets.map((target, index) => (
        <div
          key={index}
          className="absolute border-2 border-red-500 bg-red-500/10"
          style={{
            left: `${target.rect.left}px`,
            top: `${target.rect.top}px`,
            width: `${target.rect.width}px`,
            height: `${target.rect.height}px`,
          }}
        >
          <div className="absolute -top-6 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {Math.round(target.width)}×{Math.round(target.height)}px
          </div>
        </div>
      ))}

      {/* Legend */}
      {invalidTargets.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg pointer-events-auto">
          <h3 className="font-bold mb-2">Touch Target Issues</h3>
          <p className="text-sm mb-2">
            {invalidTargets.length} element{invalidTargets.length !== 1 ? 's' : ''} below {MIN_TOUCH_TARGET}×{MIN_TOUCH_TARGET}px
          </p>
          <p className="text-xs opacity-75">
            Check console for details
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Hook to validate touch targets programmatically
 */
export function useTouchTargetValidation(
  elementRef: React.RefObject<HTMLElement>,
  options: {
    onInvalid?: (width: number, height: number) => void;
    onValid?: () => void;
  } = {}
): {
  isValid: boolean;
  width: number;
  height: number;
} {
  const [isValid, setIsValid] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!elementRef.current) return;

    const validate = () => {
      const element = elementRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const valid = meetsMinTouchTarget(element);

      setIsValid(valid);
      setDimensions({ width: rect.width, height: rect.height });

      if (!valid && options.onInvalid) {
        options.onInvalid(rect.width, rect.height);
      } else if (valid && options.onValid) {
        options.onValid();
      }
    };

    // Initial validation
    validate();

    // Re-validate on resize
    const handleResize = () => {
      validate();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [elementRef, options]);

  return {
    isValid,
    width: dimensions.width,
    height: dimensions.height,
  };
}

export default TouchTargetValidator;
