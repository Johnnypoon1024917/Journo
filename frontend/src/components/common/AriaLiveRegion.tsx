import React, { useEffect, useRef } from 'react';

interface AriaLiveRegionProps {
  message: string;
  priority?: 'polite' | 'assertive';
  clearAfter?: number;
}

/**
 * ARIA Live Region Component
 * Announces dynamic content changes to screen readers
 * 
 * Usage:
 * - For loading states: <AriaLiveRegion message="Loading..." priority="polite" />
 * - For errors: <AriaLiveRegion message="Error occurred" priority="assertive" />
 * - For success: <AriaLiveRegion message="Saved successfully" priority="polite" />
 */
export const AriaLiveRegion: React.FC<AriaLiveRegionProps> = ({
  message,
  priority = 'polite',
  clearAfter = 3000,
}) => {
  const [currentMessage, setCurrentMessage] = React.useState(message);
  
  useEffect(() => {
    if (message) {
      setCurrentMessage(message);
      
      if (clearAfter > 0) {
        const timer = setTimeout(() => {
          setCurrentMessage('');
        }, clearAfter);
        
        return () => clearTimeout(timer);
      }
    }
  }, [message, clearAfter]);
  
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {currentMessage}
    </div>
  );
};

/**
 * Hook to manage ARIA live announcements
 * Returns a function to announce messages
 */
export function useAriaAnnouncer() {
  const [message, setMessage] = React.useState('');
  const [priority, setPriority] = React.useState<'polite' | 'assertive'>('polite');
  
  const announce = (text: string, announcePriority: 'polite' | 'assertive' = 'polite') => {
    setPriority(announcePriority);
    setMessage(text);
  };
  
  const LiveRegion = () => (
    <AriaLiveRegion message={message} priority={priority} />
  );
  
  return { announce, LiveRegion };
}
