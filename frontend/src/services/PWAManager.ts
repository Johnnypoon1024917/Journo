/**
 * PWAManager - Enhanced PWA Management Service
 * Implements comprehensive PWA functionality with state management and user choice tracking
 */

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface InstallationState {
  canInstall: boolean;
  isInstalled: boolean;
  userDismissed: boolean;
  lastPromptTime: Date | null;
}

export interface InstallationResult {
  outcome: 'accepted' | 'dismissed' | 'unavailable';
  platform?: string;
  timestamp: Date;
}

export interface PWAManagerInterface {
  // Event handling
  captureInstallPrompt(event: BeforeInstallPromptEvent): void;
  showInstallBanner(): void;
  hideInstallBanner(): void;
  
  // Installation flow
  promptInstallation(): Promise<InstallationResult>;
  handleInstallationResult(result: InstallationResult): void;
  
  // State management
  getInstallationState(): InstallationState;
  updateInstallationState(state: Partial<InstallationState>): void;
  
  // Event listeners
  onInstallationStateChange(callback: (state: InstallationState) => void): () => void;
}

class PWAManager implements PWAManagerInterface {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private installationState: InstallationState;
  private stateChangeListeners: ((state: InstallationState) => void)[] = [];
  private bannerVisibilityListeners: ((visible: boolean) => void)[] = [];
  
  // Storage keys
  private readonly STORAGE_KEYS = {
    USER_DISMISSED: 'pwa-manager-user-dismissed',
    LAST_PROMPT_TIME: 'pwa-manager-last-prompt-time',
    INSTALLATION_STATE: 'pwa-manager-installation-state'
  } as const;

  constructor() {
    this.installationState = this.loadInstallationState();
    this.setupEventListeners();
    this.checkInstallationStatus();
  }

  /**
   * Capture and store the beforeinstallprompt event for later use
   */
  captureInstallPrompt(event: BeforeInstallPromptEvent): void {
    // Prevent the mini-infobar from appearing on mobile
    event.preventDefault();
    
    // Store the event for later use
    this.deferredPrompt = event;
    
    // Update installation state
    this.updateInstallationState({
      canInstall: true,
      lastPromptTime: new Date()
    });
    
    console.log('PWAManager: Install prompt captured and stored');
  }

  /**
   * Show the install banner if conditions are met
   */
  showInstallBanner(): void {
    const state = this.getInstallationState();
    
    // Check if we should show the banner
    if (!state.canInstall || state.isInstalled || state.userDismissed) {
      return;
    }
    
    // Check if enough time has passed since last prompt (respect user experience)
    if (state.lastPromptTime) {
      const timeSinceLastPrompt = Date.now() - state.lastPromptTime.getTime();
      const minTimeBetweenPrompts = 24 * 60 * 60 * 1000; // 24 hours
      
      if (timeSinceLastPrompt < minTimeBetweenPrompts) {
        return;
      }
    }
    
    this.notifyBannerVisibilityListeners(true);
    console.log('PWAManager: Install banner shown');
  }

  /**
   * Hide the install banner
   */
  hideInstallBanner(): void {
    this.notifyBannerVisibilityListeners(false);
    console.log('PWAManager: Install banner hidden');
  }

  /**
   * Prompt the user to install the PWA
   */
  async promptInstallation(): Promise<InstallationResult> {
    if (!this.deferredPrompt) {
      const result: InstallationResult = {
        outcome: 'unavailable',
        timestamp: new Date()
      };
      this.handleInstallationResult(result);
      return result;
    }

    try {
      // Show the install prompt
      await this.deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome, platform } = await this.deferredPrompt.userChoice;
      
      const result: InstallationResult = {
        outcome,
        platform,
        timestamp: new Date()
      };
      
      this.handleInstallationResult(result);
      return result;
    } catch (error) {
      console.error('PWAManager: Error showing install prompt:', error);
      const result: InstallationResult = {
        outcome: 'unavailable',
        timestamp: new Date()
      };
      this.handleInstallationResult(result);
      return result;
    }
  }

  /**
   * Handle the result of an installation attempt
   */
  handleInstallationResult(result: InstallationResult): void {
    console.log('PWAManager: Installation result:', result);
    
    // Clear the deferred prompt
    this.deferredPrompt = null;
    
    // Update state based on result
    if (result.outcome === 'accepted') {
      this.updateInstallationState({
        canInstall: false,
        isInstalled: true,
        userDismissed: false
      });
      this.hideInstallBanner();
    } else if (result.outcome === 'dismissed') {
      this.updateInstallationState({
        canInstall: false,
        userDismissed: true,
        lastPromptTime: result.timestamp
      });
      this.hideInstallBanner();
      
      // Store dismissal in localStorage
      this.persistUserDismissal(result.timestamp);
    }
  }

  /**
   * Get the current installation state
   */
  getInstallationState(): InstallationState {
    return { ...this.installationState };
  }

  /**
   * Update the installation state
   */
  updateInstallationState(updates: Partial<InstallationState>): void {
    const previousState = { ...this.installationState };
    this.installationState = { ...this.installationState, ...updates };
    
    // Persist to localStorage
    this.persistInstallationState();
    
    // Notify listeners if state changed
    if (JSON.stringify(previousState) !== JSON.stringify(this.installationState)) {
      this.notifyStateChangeListeners();
    }
  }

  /**
   * Subscribe to installation state changes
   */
  onInstallationStateChange(callback: (state: InstallationState) => void): () => void {
    this.stateChangeListeners.push(callback);
    
    // Call immediately with current state
    callback(this.getInstallationState());
    
    // Return unsubscribe function
    return () => {
      const index = this.stateChangeListeners.indexOf(callback);
      if (index > -1) {
        this.stateChangeListeners.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to banner visibility changes
   */
  onBannerVisibilityChange(callback: (visible: boolean) => void): () => void {
    this.bannerVisibilityListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.bannerVisibilityListeners.indexOf(callback);
      if (index > -1) {
        this.bannerVisibilityListeners.splice(index, 1);
      }
    };
  }

  /**
   * Check if the app is currently installed
   */
  private checkInstallationStatus(): boolean {
    // Check if running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    // Check for iOS standalone mode
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    
    const isInstalled = isStandalone || isInWebAppiOS;
    
    if (isInstalled !== this.installationState.isInstalled) {
      this.updateInstallationState({ isInstalled });
    }
    
    return isInstalled;
  }

  /**
   * Set up event listeners for PWA events
   */
  private setupEventListeners(): void {
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      this.captureInstallPrompt(e as BeforeInstallPromptEvent);
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('PWAManager: App installed event received');
      this.updateInstallationState({
        isInstalled: true,
        canInstall: false,
        userDismissed: false
      });
      this.hideInstallBanner();
      
      // Clear any stored dismissal
      this.clearUserDismissal();
    });

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', () => {
      this.checkInstallationStatus();
    });
  }

  /**
   * Load installation state from localStorage
   */
  private loadInstallationState(): InstallationState {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.INSTALLATION_STATE);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          canInstall: parsed.canInstall || false,
          isInstalled: parsed.isInstalled || false,
          userDismissed: parsed.userDismissed || false,
          lastPromptTime: parsed.lastPromptTime ? new Date(parsed.lastPromptTime) : null
        };
      }
    } catch (error) {
      console.warn('PWAManager: Failed to load installation state from localStorage:', error);
    }

    // Return default state
    return {
      canInstall: false,
      isInstalled: false,
      userDismissed: false,
      lastPromptTime: null
    };
  }

  /**
   * Persist installation state to localStorage
   */
  private persistInstallationState(): void {
    try {
      const stateToStore = {
        ...this.installationState,
        lastPromptTime: this.installationState.lastPromptTime?.toISOString() || null
      };
      localStorage.setItem(this.STORAGE_KEYS.INSTALLATION_STATE, JSON.stringify(stateToStore));
    } catch (error) {
      console.warn('PWAManager: Failed to persist installation state to localStorage:', error);
    }
  }

  /**
   * Persist user dismissal to localStorage
   */
  private persistUserDismissal(timestamp: Date): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.USER_DISMISSED, 'true');
      localStorage.setItem(this.STORAGE_KEYS.LAST_PROMPT_TIME, timestamp.toISOString());
    } catch (error) {
      console.warn('PWAManager: Failed to persist user dismissal to localStorage:', error);
    }
  }

  /**
   * Clear user dismissal from localStorage
   */
  private clearUserDismissal(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEYS.USER_DISMISSED);
      localStorage.removeItem(this.STORAGE_KEYS.LAST_PROMPT_TIME);
    } catch (error) {
      console.warn('PWAManager: Failed to clear user dismissal from localStorage:', error);
    }
  }

  /**
   * Notify state change listeners
   */
  private notifyStateChangeListeners(): void {
    const currentState = this.getInstallationState();
    this.stateChangeListeners.forEach(callback => {
      try {
        callback(currentState);
      } catch (error) {
        console.error('PWAManager: Error in state change listener:', error);
      }
    });
  }

  /**
   * Notify banner visibility listeners
   */
  private notifyBannerVisibilityListeners(visible: boolean): void {
    this.bannerVisibilityListeners.forEach(callback => {
      try {
        callback(visible);
      } catch (error) {
        console.error('PWAManager: Error in banner visibility listener:', error);
      }
    });
  }
}

// Export singleton instance
export const pwaManager = new PWAManager();

// Export class for testing
export { PWAManager };