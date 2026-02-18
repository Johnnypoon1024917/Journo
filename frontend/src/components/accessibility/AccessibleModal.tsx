/**
 * Accessible Modal Component
 * 
 * Fully accessible modal dialog with:
 * - Focus trap
 * - Keyboard navigation (Escape to close)
 * - ARIA attributes
 * - Screen reader announcements
 */

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import { FocusTrap } from './FocusTrap';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import { useReducedMotion } from '../../hooks/useAccessibility';

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
  overlayClassName?: string;
}

export function AccessibleModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
  overlayClassName,
}: AccessibleModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).substr(2, 9)}`);
  const descId = useRef(`modal-desc-${Math.random().toString(36).substr(2, 9)}`);
  const { shouldAnimate } = useReducedMotion();

  // Handle Escape key
  useKeyboardNavigation({
    enableEscape: closeOnEscape,
    onEscape: onClose,
  });

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      // Announce modal opening to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.className = 'sr-only';
      announcement.textContent = `Dialog opened: ${title}`;
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        if (document.body.contains(announcement)) {
          document.body.removeChild(announcement);
        }
      }, 1000);

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, title]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4',
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'p-4',
        overlayClassName
      )}
      onClick={handleOverlayClick}
      role="presentation"
    >
      {/* Overlay */}
      <div
        className={cn(
          'absolute inset-0 bg-black',
          shouldAnimate ? 'transition-opacity duration-300' : '',
          isOpen ? 'opacity-50' : 'opacity-0'
        )}
        aria-hidden="true"
      />

      {/* Modal */}
      <FocusTrap active={isOpen}>
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId.current}
          aria-describedby={description ? descId.current : undefined}
          className={cn(
            'relative z-10 w-full',
            sizeClasses[size],
            'bg-white dark:bg-neutral-800',
            'rounded-lg shadow-xl',
            'max-h-[90vh] overflow-y-auto',
            shouldAnimate ? 'transition-all duration-300' : '',
            isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
            className
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex-1">
              <h2
                id={titleId.current}
                className="text-xl font-semibold text-neutral-900 dark:text-white"
              >
                {title}
              </h2>
              {description && (
                <p
                  id={descId.current}
                  className="mt-1 text-sm text-neutral-600 dark:text-neutral-400"
                >
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                onClick={onClose}
                className={cn(
                  'ml-4 p-2 rounded-lg',
                  'text-neutral-400 hover:text-neutral-600',
                  'dark:text-neutral-500 dark:hover:text-neutral-300',
                  'hover:bg-neutral-100 dark:hover:bg-neutral-700',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500',
                  'transition-colors duration-200'
                )}
                aria-label="Close dialog"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6">{children}</div>
        </div>
      </FocusTrap>
    </div>
  );

  return createPortal(modalContent, document.body);
}
