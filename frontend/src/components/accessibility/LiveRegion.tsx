/**
 * Live Region Component
 * 
 * ARIA live region for announcing dynamic content changes to screen readers
 * Supports different politeness levels and atomic updates
 */

import React, { useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';

export type LiveRegionPoliteness = 'off' | 'polite' | 'assertive';
export type LiveRegionRole = 'status' | 'alert' | 'log' | 'timer';

interface LiveRegionProps {
  message: string;
  politeness?: LiveRegionPoliteness;
  role?: LiveRegionRole;
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  clearAfter?: number;
  onClear?: () => void;
  className?: string;
}

export function LiveRegion({
  message,
  politeness = 'polite',
  role = 'status',
  atomic = true,
  relevant = 'additions text',
  clearAfter,
  onClear,
  className,
}: LiveRegionProps) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (clearAfter && message) {
      timeoutRef.current = setTimeout(() => {
        onClear?.();
      }, clearAfter);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [message, clearAfter, onClear]);

  if (!message) return null;

  return (
    <div
      role={role}
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={cn('sr-only', className)}
    >
      {message}
    </div>
  );
}

/**
 * Hook for managing live region announcements
 */
export function useLiveRegion() {
  const [message, setMessage] = React.useState('');
  const [politeness, setPoliteness] = React.useState<LiveRegionPoliteness>('polite');

  const announce = (
    newMessage: string,
    newPoliteness: LiveRegionPoliteness = 'polite'
  ) => {
    setMessage(newMessage);
    setPoliteness(newPoliteness);
  };

  const clear = () => {
    setMessage('');
  };

  return {
    message,
    politeness,
    announce,
    clear,
  };
}
