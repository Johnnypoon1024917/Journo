/**
 * Focus Trap Component
 * 
 * Traps keyboard focus within a container (e.g., modals, dialogs)
 * Ensures keyboard users can't accidentally navigate outside
 */

import React, { useEffect, useRef, ReactNode } from 'react';

interface FocusTrapProps {
  children: ReactNode;
  active?: boolean;
  initialFocus?: HTMLElement | null;
  returnFocus?: boolean;
  className?: string;
}

export function FocusTrap({
  children,
  active = true,
  initialFocus,
  returnFocus = true,
  className,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    // Store the currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Get all focusable elements
    const getFocusableElements = (): HTMLElement[] => {
      if (!containerRef.current) return [];

      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]',
      ].join(', ');

      return Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
      ).filter((el) => {
        // Filter out hidden elements
        return el.offsetParent !== null && !el.hasAttribute('aria-hidden');
      });
    };

    // Focus the initial element or first focusable element
    const focusableElements = getFocusableElements();
    if (initialFocus) {
      initialFocus.focus();
    } else if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Handle Tab key to trap focus
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab: move focus backwards
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: move focus forwards
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // Return focus to the previously focused element
      if (returnFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [active, initialFocus, returnFocus]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
