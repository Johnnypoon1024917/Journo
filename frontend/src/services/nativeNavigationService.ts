import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

/**
 * Native Navigation Service
 * 
 * Provides iOS-specific navigation and status bar controls.
 * Implements Requirements 6.1, 10.9
 */

export type StatusBarStyle = 'light' | 'dark';

class NativeNavigationService {
  private isNativePlatform: boolean;

  constructor() {
    this.isNativePlatform = Capacitor.isNativePlatform();
  }

  /**
   * Set status bar style (light or dark)
   * Light style = dark text on light background
   * Dark style = light text on dark background
   */
  async setStatusBarStyle(style: StatusBarStyle): Promise<void> {
    if (!this.isNativePlatform) {
      console.debug('Status bar style not available on web platform');
      return;
    }

    try {
      const capacitorStyle = style === 'light' ? Style.Light : Style.Dark;
      await StatusBar.setStyle({ style: capacitorStyle });
    } catch (error) {
      console.error('Error setting status bar style:', error);
      throw error;
    }
  }

  /**
   * Show the status bar
   */
  async showStatusBar(): Promise<void> {
    if (!this.isNativePlatform) {
      console.debug('Status bar control not available on web platform');
      return;
    }

    try {
      await StatusBar.show();
    } catch (error) {
      console.error('Error showing status bar:', error);
      throw error;
    }
  }

  /**
   * Hide the status bar
   */
  async hideStatusBar(): Promise<void> {
    if (!this.isNativePlatform) {
      console.debug('Status bar control not available on web platform');
      return;
    }

    try {
      await StatusBar.hide();
    } catch (error) {
      console.error('Error hiding status bar:', error);
      throw error;
    }
  }

  /**
   * Set status bar background color
   * @param color - Hex color string (e.g., '#FFFFFF')
   */
  async setStatusBarBackgroundColor(color: string): Promise<void> {
    if (!this.isNativePlatform) {
      console.debug('Status bar background color not available on web platform');
      return;
    }

    try {
      await StatusBar.setBackgroundColor({ color });
    } catch (error) {
      console.error('Error setting status bar background color:', error);
      throw error;
    }
  }

  /**
   * Set navigation bar color (Android only, no-op on iOS)
   * Included for cross-platform compatibility
   */
  async setNavigationBarColor(color: string): Promise<void> {
    if (!this.isNativePlatform) {
      console.debug('Navigation bar color not available on web platform');
      return;
    }

    // iOS doesn't have a navigation bar like Android
    // This is a no-op on iOS but included for API consistency
    if (Capacitor.getPlatform() === 'ios') {
      console.debug('Navigation bar color not applicable on iOS');
      return;
    }

    try {
      // This would work on Android if we add Android support later
      console.debug('Navigation bar color:', color);
    } catch (error) {
      console.error('Error setting navigation bar color:', error);
      throw error;
    }
  }

  /**
   * Get status bar info (height, visibility, etc.)
   */
  async getStatusBarInfo(): Promise<{
    visible: boolean;
    style: string;
    color?: string;
    overlays?: boolean;
  }> {
    if (!this.isNativePlatform) {
      return {
        visible: true,
        style: 'default'
      };
    }

    try {
      const info = await StatusBar.getInfo();
      return {
        visible: info.visible,
        style: info.style,
        color: info.color,
        overlays: info.overlays
      };
    } catch (error) {
      console.error('Error getting status bar info:', error);
      throw error;
    }
  }

  /**
   * Set status bar to overlay content (iOS only)
   * When true, content extends behind the status bar
   */
  async setStatusBarOverlay(overlay: boolean): Promise<void> {
    if (!this.isNativePlatform) {
      console.debug('Status bar overlay not available on web platform');
      return;
    }

    try {
      await StatusBar.setOverlaysWebView({ overlay });
    } catch (error) {
      console.error('Error setting status bar overlay:', error);
      throw error;
    }
  }

  /**
   * Configure status bar for light theme
   * Dark text on light background
   */
  async configureLightTheme(): Promise<void> {
    await this.setStatusBarStyle('light');
    await this.setStatusBarBackgroundColor('#FFFFFF');
  }

  /**
   * Configure status bar for dark theme
   * Light text on dark background
   */
  async configureDarkTheme(): Promise<void> {
    await this.setStatusBarStyle('dark');
    await this.setStatusBarBackgroundColor('#000000');
  }

  /**
   * Check if running on native platform
   */
  isNative(): boolean {
    return this.isNativePlatform;
  }

  /**
   * Get current platform
   */
  getPlatform(): string {
    return Capacitor.getPlatform();
  }
}

// Export singleton instance
export const nativeNavigationService = new NativeNavigationService();
