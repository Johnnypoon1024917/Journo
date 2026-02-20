/**
 * InstallPrompt Component
 * Subtle, non-intrusive prompt to add app to home screen
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Smartphone } from 'lucide-react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import { Button as BubbleQuestButton } from '../bubblequest/Button';
import { cn } from '@/utils/cn';

interface InstallPromptProps {
  className?: string;
}

export function InstallPrompt({ className }: InstallPromptProps) {
  const { shouldShowPrompt, showInstallPrompt, dismissPrompt, isInstalled } = useInstallPrompt();

  // Don't render if already installed or shouldn't show
  if (isInstalled || !shouldShowPrompt) {
    return null;
  }

  const handleInstall = async () => {
    const accepted = await showInstallPrompt();
    if (!accepted) {
      // User dismissed the native prompt, hide our prompt temporarily
      dismissPrompt(false);
    }
  };

  const handleDismiss = () => {
    dismissPrompt(false);
  };

  const handleDontShowAgain = () => {
    dismissPrompt(true);
  };

  return (
    <AnimatePresence>
      {shouldShowPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn(
            'fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md z-50',
            className
          )}
        >
          <div className="bg-white dark:bg-bubblequest-neutral-800 rounded-2xl shadow-2xl border border-bubblequest-primary-100 dark:border-bubblequest-neutral-700 overflow-hidden">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-2 rounded-full hover:bg-bubblequest-neutral-100 dark:hover:bg-bubblequest-neutral-700 transition-colors"
              aria-label="Close install prompt"
            >
              <X className="w-4 h-4 text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400" />
            </button>

            <div className="p-6">
              {/* Icon and Title */}
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-bubblequest-primary-400 to-bubblequest-secondary-400 rounded-xl flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-display font-bold text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 mb-1">
                    Install Journo
                  </h3>
                  <p className="text-sm text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400 leading-relaxed">
                    Add to your home screen for quick access and offline features ✨
                  </p>
                </div>
              </div>

              {/* Benefits */}
              <div className="mb-5 space-y-2">
                <div className="flex items-center gap-2 text-sm text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300">
                  <span className="text-bubblequest-primary-500">✓</span>
                  <span>Access your trips offline</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300">
                  <span className="text-bubblequest-primary-500">✓</span>
                  <span>Faster loading times</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300">
                  <span className="text-bubblequest-primary-500">✓</span>
                  <span>Native app experience</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <BubbleQuestButton
                  onClick={handleInstall}
                  size="md"
                  className="w-full"
                >
                  <Download className="w-4 h-4" />
                  <span>Install App</span>
                </BubbleQuestButton>
                
                <button
                  onClick={handleDontShowAgain}
                  className="text-sm text-bubblequest-neutral-500 dark:text-bubblequest-neutral-400 hover:text-bubblequest-neutral-700 dark:hover:text-bubblequest-neutral-300 transition-colors"
                >
                  Don't show again
                </button>
              </div>
            </div>

            {/* Decorative gradient bar */}
            <div className="h-1 bg-gradient-to-r from-bubblequest-primary-400 via-bubblequest-secondary-400 to-bubblequest-primary-400"></div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default InstallPrompt;
