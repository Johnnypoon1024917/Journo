/**
 * InstallBanner Usage Example
 * 
 * This file demonstrates how to integrate the new InstallBanner component
 * with the PWAManager service in your application.
 */

import { FC } from 'react';
import InstallBanner from './InstallBanner';

// Example 1: Basic usage with default settings
export const BasicInstallBanner: FC = () => {
  return <InstallBanner />;
};

// Example 2: Customized banner with specific positioning
export const CustomizedInstallBanner = () => {
  return (
    <InstallBanner
      position="bottom-center"
      showOnMobile={true}
      showOnDesktop={true}
      autoShow={true}
      className="custom-install-banner"
    />
  );
};

// Example 3: Mobile-only banner
export const MobileOnlyInstallBanner = () => {
  return (
    <InstallBanner
      position="bottom-left"
      showOnMobile={true}
      showOnDesktop={false}
      autoShow={true}
    />
  );
};

// Example 4: Desktop-only banner
export const DesktopOnlyInstallBanner = () => {
  return (
    <InstallBanner
      position="bottom-right"
      showOnMobile={false}
      showOnDesktop={true}
      autoShow={true}
    />
  );
};

// Example 5: Manual control banner (no auto-show)
export const ManualControlInstallBanner = () => {
  return (
    <InstallBanner
      position="top-center"
      autoShow={false}
    />
  );
};

/**
 * Integration in App.tsx:
 * 
 * Replace the existing PWAInstallPrompt with the new InstallBanner:
 * 
 * // Remove this line:
 * // <PWAInstallPrompt />
 * 
 * // Add this line:
 * // <InstallBanner />
 * 
 * The new InstallBanner will automatically:
 * - Connect to the PWAManager service
 * - Handle installation state management
 * - Show/hide based on user preferences and installation status
 * - Provide smooth animations and modern UI
 * - Support both mobile and desktop devices
 * - Persist user choices across sessions
 */

/**
 * PWAManager Service Usage:
 * 
 * The PWAManager service is automatically initialized and provides:
 * 
 * import { pwaManager } from '../../services/PWAManager';
 * 
 * // Check installation state
 * const state = pwaManager.getInstallationState();
 * 
 * // Listen to state changes
 * const unsubscribe = pwaManager.onInstallationStateChange((state) => {
 *   console.log('Installation state changed:', state);
 * });
 * 
 * // Manually trigger installation
 * const result = await pwaManager.promptInstallation();
 * 
 * // Show/hide banner programmatically
 * pwaManager.showInstallBanner();
 * pwaManager.hideInstallBanner();
 * 
 * // Update installation state
 * pwaManager.updateInstallationState({
 *   userDismissed: true,
 *   lastPromptTime: new Date()
 * });
 */

export default {
  BasicInstallBanner,
  CustomizedInstallBanner,
  MobileOnlyInstallBanner,
  DesktopOnlyInstallBanner,
  ManualControlInstallBanner,
};