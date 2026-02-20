/**
 * useInstallPrompt Hook
 * Manages PWA install prompt behavior with visit tracking
 */

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface InstallPromptState {
  canInstall: boolean;
  isInstalled: boolean;
  shouldShowPrompt: boolean;
  visitCount: number;
  isDismissed: boolean;
}

const STORAGE_KEYS = {
  VISIT_COUNT: 'journo_visit_count',
  DISMISSED: 'journo_install_prompt_dismissed',
  LAST_VISIT: 'journo_last_visit',
} as const;

const MIN_VISITS_TO_SHOW = 2;
const HOURS_BETWEEN_VISITS = 1; // Consider a new visit after 1 hour

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [state, setState] = useState<InstallPromptState>({
    canInstall: false,
    isInstalled: false,
    shouldShowPrompt: false,
    visitCount: 0,
    isDismissed: false,
  });

  // Check if app is already installed
  const checkIfInstalled = useCallback((): boolean => {
    // Check if running in standalone mode (installed PWA)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return true;
    }
    
    // Check for iOS standalone mode
    if ((window.navigator as any).standalone === true) {
      return true;
    }
    
    return false;
  }, []);

  // Track visits
  const trackVisit = useCallback((): number => {
    try {
      const now = Date.now();
      const lastVisit = localStorage.getItem(STORAGE_KEYS.LAST_VISIT);
      const lastVisitTime = lastVisit ? parseInt(lastVisit, 10) : 0;
      
      // Check if enough time has passed since last visit
      const hoursSinceLastVisit = (now - lastVisitTime) / (1000 * 60 * 60);
      
      let visitCount = parseInt(localStorage.getItem(STORAGE_KEYS.VISIT_COUNT) || '0', 10);
      
      if (hoursSinceLastVisit >= HOURS_BETWEEN_VISITS) {
        visitCount += 1;
        localStorage.setItem(STORAGE_KEYS.VISIT_COUNT, visitCount.toString());
      }
      
      localStorage.setItem(STORAGE_KEYS.LAST_VISIT, now.toString());
      
      return visitCount;
    } catch (error) {
      console.error('Failed to track visit:', error);
      return 0;
    }
  }, []);

  // Check if prompt was dismissed
  const checkDismissed = useCallback((): boolean => {
    try {
      return localStorage.getItem(STORAGE_KEYS.DISMISSED) === 'true';
    } catch (error) {
      console.error('Failed to check dismissed status:', error);
      return false;
    }
  }, []);

  // Initialize state
  useEffect(() => {
    const isInstalled = checkIfInstalled();
    const visitCount = trackVisit();
    const isDismissed = checkDismissed();
    
    setState(prev => ({
      ...prev,
      isInstalled,
      visitCount,
      isDismissed,
    }));
  }, [checkIfInstalled, trackVisit, checkDismissed]);

  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      setState(prev => ({
        ...prev,
        canInstall: true,
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Listen for app installed event
  useEffect(() => {
    const handleAppInstalled = () => {
      setState(prev => ({
        ...prev,
        isInstalled: true,
        canInstall: false,
        shouldShowPrompt: false,
      }));
      
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Determine if we should show the prompt
  useEffect(() => {
    const shouldShow = 
      state.canInstall &&
      !state.isInstalled &&
      !state.isDismissed &&
      state.visitCount >= MIN_VISITS_TO_SHOW;
    
    setState(prev => ({
      ...prev,
      shouldShowPrompt: shouldShow,
    }));
  }, [state.canInstall, state.isInstalled, state.isDismissed, state.visitCount]);

  // Show the install prompt
  const showInstallPrompt = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.warn('Install prompt not available');
      return false;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setState(prev => ({
          ...prev,
          shouldShowPrompt: false,
        }));
        return true;
      } else {
        console.log('User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      console.error('Failed to show install prompt:', error);
      return false;
    } finally {
      // Clear the deferred prompt
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  // Dismiss the prompt permanently
  const dismissPrompt = useCallback((permanent: boolean = false) => {
    if (permanent) {
      try {
        localStorage.setItem(STORAGE_KEYS.DISMISSED, 'true');
      } catch (error) {
        console.error('Failed to save dismissed status:', error);
      }
    }
    
    setState(prev => ({
      ...prev,
      shouldShowPrompt: false,
      isDismissed: permanent,
    }));
  }, []);

  // Reset the prompt (for testing)
  const resetPrompt = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.DISMISSED);
      localStorage.removeItem(STORAGE_KEYS.VISIT_COUNT);
      localStorage.removeItem(STORAGE_KEYS.LAST_VISIT);
      
      setState(prev => ({
        ...prev,
        isDismissed: false,
        visitCount: 0,
        shouldShowPrompt: false,
      }));
    } catch (error) {
      console.error('Failed to reset prompt:', error);
    }
  }, []);

  return {
    ...state,
    showInstallPrompt,
    dismissPrompt,
    resetPrompt,
  };
}

export default useInstallPrompt;
