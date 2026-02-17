import React, { createContext, useContext, useState, useCallback } from 'react';
import { AriaLiveRegion } from '@/components/common/AriaLiveRegion';

interface AriaAnnouncerContextType {
  announceLoading: (message: string) => void;
  announceError: (message: string) => void;
  announceSuccess: (message: string) => void;
  announceInfo: (message: string) => void;
  clearAnnouncement: () => void;
}

const AriaAnnouncerContext = createContext<AriaAnnouncerContextType | undefined>(undefined);

interface AriaAnnouncerProviderProps {
  children: React.ReactNode;
}

/**
 * AriaAnnouncerProvider
 * 
 * Provides a global ARIA live region announcer for state changes.
 * Announces loading states, errors, and success messages to screen readers.
 * 
 * Usage:
 * - Wrap your app with <AriaAnnouncerProvider>
 * - Use the useAriaAnnouncer hook to announce messages
 */
export const AriaAnnouncerProvider: React.FC<AriaAnnouncerProviderProps> = ({ children }) => {
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'polite' | 'assertive'>('polite');

  const announceLoading = useCallback((msg: string) => {
    setPriority('polite');
    setMessage(msg);
  }, []);

  const announceError = useCallback((msg: string) => {
    setPriority('assertive');
    setMessage(msg);
  }, []);

  const announceSuccess = useCallback((msg: string) => {
    setPriority('polite');
    setMessage(msg);
  }, []);

  const announceInfo = useCallback((msg: string) => {
    setPriority('polite');
    setMessage(msg);
  }, []);

  const clearAnnouncement = useCallback(() => {
    setMessage('');
  }, []);

  return (
    <AriaAnnouncerContext.Provider
      value={{
        announceLoading,
        announceError,
        announceSuccess,
        announceInfo,
        clearAnnouncement,
      }}
    >
      {children}
      <AriaLiveRegion message={message} priority={priority} clearAfter={3000} />
    </AriaAnnouncerContext.Provider>
  );
};

/**
 * Hook to access the ARIA announcer
 * 
 * @returns Functions to announce loading, error, success, and info messages
 * 
 * @example
 * const { announceLoading, announceSuccess, announceError } = useAriaAnnouncer();
 * 
 * // Announce loading state
 * announceLoading('Loading trip data...');
 * 
 * // Announce success
 * announceSuccess('Trip saved successfully');
 * 
 * // Announce error
 * announceError('Failed to save trip');
 */
export const useAriaAnnouncer = (): AriaAnnouncerContextType => {
  const context = useContext(AriaAnnouncerContext);
  if (!context) {
    throw new Error('useAriaAnnouncer must be used within AriaAnnouncerProvider');
  }
  return context;
};
