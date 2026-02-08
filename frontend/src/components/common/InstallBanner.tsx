/**
 * InstallBanner Component
 * 
 * Modern card-based install banner with smooth animations and clear value proposition.
 * Integrates with PWAManager for comprehensive installation flow management.
 */

import React, { useState, useEffect } from 'react';
import { XMarkIcon, ArrowDownTrayIcon, DevicePhoneMobileIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { cn } from '../../utils/cn';
import { Button } from '../../design-system/atoms/Button';
import { pwaManager } from '../../services/PWAManager';
import type { InstallationState } from '../../services/PWAManager';

interface InstallBannerProps {
  className?: string;
  position?: 'bottom-left' | 'bottom-right' | 'bottom-center' | 'top-center';
  showOnMobile?: boolean;
  showOnDesktop?: boolean;
  autoShow?: boolean;
}

const InstallBanner: React.FC<InstallBannerProps> = ({
  className,
  position = 'bottom-right',
  showOnMobile = true,
  showOnDesktop = true,
  autoShow = true,
}) => {
  const [installationState, setInstallationState] = useState<InstallationState>({
    canInstall: false,
    isInstalled: false,
    userDismissed: false,
    lastPromptTime: null,
  });
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop'>('desktop');

  // Detect device type
  useEffect(() => {
    const checkDeviceType = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setDeviceType(isMobile ? 'mobile' : 'desktop');
    };

    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);
    return () => window.removeEventListener('resize', checkDeviceType);
  }, []);

  // Subscribe to PWA Manager state changes
  useEffect(() => {
    const unsubscribe = pwaManager.onInstallationStateChange((state) => {
      setInstallationState(state);
    });

    return unsubscribe;
  }, []);

  // Subscribe to banner visibility changes
  useEffect(() => {
    const unsubscribe = pwaManager.onBannerVisibilityChange((visible) => {
      if (visible && shouldShowBanner()) {
        showBanner();
      } else {
        hideBanner();
      }
    });

    return unsubscribe;
  }, []);

  // Auto-show banner when conditions are met
  useEffect(() => {
    if (autoShow && shouldShowBanner()) {
      // Delay showing banner to avoid interrupting initial page load
      const timer = setTimeout(() => {
        pwaManager.showInstallBanner();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [autoShow, installationState]);

  const shouldShowBanner = (): boolean => {
    // Don't show if already installed or user dismissed
    if (installationState.isInstalled || installationState.userDismissed) {
      return false;
    }

    // Don't show if can't install
    if (!installationState.canInstall) {
      return false;
    }

    // Check device-specific visibility settings
    if (deviceType === 'mobile' && !showOnMobile) {
      return false;
    }

    if (deviceType === 'desktop' && !showOnDesktop) {
      return false;
    }

    return true;
  };

  const showBanner = () => {
    setIsVisible(true);
    setIsAnimating(true);
    
    // Remove animation class after animation completes
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const hideBanner = () => {
    setIsAnimating(true);
    
    // Hide banner after slide-out animation
    setTimeout(() => {
      setIsVisible(false);
      setIsAnimating(false);
    }, 300);
  };

  const handleInstallClick = async () => {
    setIsInstalling(true);
    
    try {
      const result = await pwaManager.promptInstallation();
      
      if (result.outcome === 'accepted') {
        // Show success state briefly before hiding
        setTimeout(() => {
          hideBanner();
        }, 1500);
      } else if (result.outcome === 'dismissed') {
        hideBanner();
      }
    } catch (error) {
      console.error('InstallBanner: Error during installation:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismissClick = () => {
    pwaManager.updateInstallationState({
      userDismissed: true,
      lastPromptTime: new Date(),
    });
    hideBanner();
  };

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  // Position styles
  const positionStyles = {
    'bottom-left': 'bottom-4 left-4 md:left-6',
    'bottom-right': 'bottom-4 right-4 md:right-6',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
  };

  // Animation styles
  const animationStyles = cn(
    'transition-all duration-300 ease-out transform-gpu',
    isAnimating && position.includes('bottom') && 'animate-slide-in-up',
    isAnimating && position.includes('top') && 'animate-slide-in-down',
    !isAnimating && 'translate-y-0 opacity-100'
  );

  // Device-specific content
  const getDeviceIcon = () => {
    return deviceType === 'mobile' ? (
      <DevicePhoneMobileIcon className="h-6 w-6 text-primary-600 flex-shrink-0" />
    ) : (
      <ComputerDesktopIcon className="h-6 w-6 text-primary-600 flex-shrink-0" />
    );
  };

  const getInstallMessage = () => {
    if (deviceType === 'mobile') {
      return 'Install Journo for the best mobile experience with offline access and faster loading.';
    }
    return 'Install Journo as a desktop app for quick access and a native app experience.';
  };

  const getBenefits = () => {
    const commonBenefits = ['Offline access', 'Faster loading', 'Push notifications'];
    const mobileBenefits = ['Home screen access', 'Full-screen experience'];
    const desktopBenefits = ['Desktop shortcuts', 'Native app feel'];
    
    return deviceType === 'mobile' 
      ? [...commonBenefits, ...mobileBenefits]
      : [...commonBenefits, ...desktopBenefits];
  };

  return (
    <div
      className={cn(
        'fixed z-banner max-w-sm w-full mx-4',
        positionStyles[position],
        animationStyles,
        className
      )}
      role="dialog"
      aria-labelledby="install-banner-title"
      aria-describedby="install-banner-description"
    >
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        {/* Header */}
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 flex-1">
              {getDeviceIcon()}
              <div className="flex-1 min-w-0">
                <h3 
                  id="install-banner-title"
                  className="text-sm font-semibold text-neutral-900 dark:text-white"
                >
                  Install Journo
                </h3>
                <p 
                  id="install-banner-description"
                  className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed"
                >
                  {getInstallMessage()}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleDismissClick}
              className={cn(
                'flex-shrink-0 ml-2 p-1 rounded-md',
                'text-neutral-400 hover:text-neutral-500 dark:hover:text-neutral-300',
                'hover:bg-neutral-100 dark:hover:bg-neutral-700',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                'transition-colors duration-200'
              )}
              aria-label="Dismiss install banner"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Benefits */}
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-2">
            {getBenefits().slice(0, 3).map((benefit) => (
              <div
                key={benefit}
                className="flex items-center space-x-1 text-xs text-neutral-600 dark:text-neutral-400"
              >
                <CheckCircleIcon className="h-3 w-3 text-success-500 flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 pb-4">
          <div className="flex space-x-2">
            <Button
              variant="primary"
              size="sm"
              fullWidth
              loading={isInstalling}
              onClick={handleInstallClick}
              icon={!isInstalling ? <ArrowDownTrayIcon className="h-4 w-4" /> : undefined}
              className="flex-1"
            >
              {isInstalling ? 'Installing...' : 'Install App'}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismissClick}
              className="px-3 text-neutral-600 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
            >
              Not now
            </Button>
          </div>
        </div>

        {/* Progress indicator for installation */}
        {isInstalling && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-200 dark:bg-neutral-700">
            <div className="h-full bg-primary-600 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
};

export default InstallBanner;