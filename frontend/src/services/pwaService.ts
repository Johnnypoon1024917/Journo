/**
 * PWA Service - Manages Progressive Web App functionality
 */

export interface PWAInstallEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

class PWAService {
  private deferredPrompt: PWAInstallEvent | null = null;
  private installPromptListeners: ((canInstall: boolean) => void)[] = [];
  private updateListeners: ((updateAvailable: boolean) => void)[] = [];

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      const event = e as PWAInstallEvent;
      // Prevent the mini-infobar from appearing on mobile
      event.preventDefault();
      // Stash the event so it can be triggered later
      this.deferredPrompt = event;
      this.notifyInstallPromptListeners(true);
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.notifyInstallPromptListeners(false);
    });
  }

  /**
   * Check if the app can be installed
   */
  canInstall(): boolean {
    return this.deferredPrompt !== null && !this.isInstalled();
  }

  /**
   * Check if the app is already installed
   */
  isInstalled(): boolean {
    // Check if running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    // Check for iOS standalone mode
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    
    return isStandalone || isInWebAppiOS;
  }

  /**
   * Trigger the install prompt
   */
  async install(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    if (!this.deferredPrompt) {
      return 'unavailable';
    }

    try {
      // Show the install prompt
      await this.deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await this.deferredPrompt.userChoice;

      // Clear the deferredPrompt
      this.deferredPrompt = null;
      this.notifyInstallPromptListeners(false);

      return outcome;
    } catch (error) {
      console.error('Error showing install prompt:', error);
      return 'unavailable';
    }
  }

  /**
   * Get device type for install messaging
   */
  getDeviceType(): 'ios' | 'android' | 'desktop' {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/iphone|ipad|ipod/.test(userAgent)) {
      return 'ios';
    } else if (/android/.test(userAgent)) {
      return 'android';
    } else {
      return 'desktop';
    }
  }

  /**
   * Get install instructions for iOS devices
   */
  getIOSInstallInstructions(): string[] {
    return [
      'Tap the Share button in Safari',
      'Scroll down and tap "Add to Home Screen"',
      'Tap "Add" to install Journo'
    ];
  }

  /**
   * Subscribe to install prompt availability changes
   */
  onInstallPromptChange(callback: (canInstall: boolean) => void): () => void {
    this.installPromptListeners.push(callback);
    
    // Call immediately with current state
    callback(this.canInstall());
    
    // Return unsubscribe function
    return () => {
      const index = this.installPromptListeners.indexOf(callback);
      if (index > -1) {
        this.installPromptListeners.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to update availability changes
   */
  onUpdateAvailable(callback: (updateAvailable: boolean) => void): () => void {
    this.updateListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.updateListeners.indexOf(callback);
      if (index > -1) {
        this.updateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Check if user has dismissed install prompt before
   */
  hasUserDismissedInstall(): boolean {
    return localStorage.getItem('pwa-install-dismissed') === 'true';
  }

  /**
   * Mark install prompt as dismissed
   */
  markInstallDismissed(): void {
    localStorage.setItem('pwa-install-dismissed', 'true');
  }

  /**
   * Clear install dismissal (for testing or reset)
   */
  clearInstallDismissal(): void {
    localStorage.removeItem('pwa-install-dismissed');
  }

  private notifyInstallPromptListeners(canInstall: boolean) {
    this.installPromptListeners.forEach(callback => callback(canInstall));
  }
}

// Export singleton instance
export const pwaService = new PWAService();