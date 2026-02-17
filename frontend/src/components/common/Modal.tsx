import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useA11yId, useFocusTrap } from '../../hooks/useAccessibility';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  ariaLabel,
  ariaDescribedBy,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const titleId = useA11yId('modal-title');
  const focusTrapRef = useFocusTrap(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      document.body.style.overflow = 'hidden';
      // Trigger animation after render
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      document.body.style.overflow = 'unset';
      // Remove from DOM after animation
      setTimeout(() => setShouldRender(false), 300);
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const modalContent = (
    <div 
      className={`fixed inset-0 overflow-y-auto transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ zIndex: 99999 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-label={ariaLabel || (title ? undefined : 'Dialog')}
      aria-describedby={ariaDescribedBy}
    >
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black transition-opacity duration-300 ${
            isVisible ? 'bg-opacity-50' : 'bg-opacity-0'
          }`}
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal */}
        <div
          ref={focusTrapRef as React.RefObject<HTMLDivElement>}
          className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${sizeStyles[size]} transform transition-all duration-300 ${
            isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
          }`}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 
                id={titleId}
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                {title}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors min-h-touch min-w-touch flex items-center justify-center"
                aria-label="Close dialog"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          )}

          {/* Content */}
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  );

  // Render modal in a portal to ensure it's at the top level
  return createPortal(modalContent, document.body);
};
