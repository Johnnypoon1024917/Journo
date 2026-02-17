import React, { useState } from 'react';
import { useAriaAnnouncer } from '@/providers/AriaAnnouncerProvider';
import { Button } from '@/design-system/atoms/Button';
import { Spinner } from '@/design-system/atoms/Spinner';

/**
 * AriaLiveRegionDemo
 * 
 * Demonstrates ARIA live regions for state changes:
 * - Loading states
 * - Error messages
 * - Success confirmations
 * 
 * This component validates Requirements 9.6:
 * - State changes are announced to screen readers via ARIA live regions
 */
export const AriaLiveRegionDemo: React.FC = () => {
  const { announceLoading, announceError, announceSuccess, announceInfo } = useAriaAnnouncer();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const simulateLoading = () => {
    setStatus('loading');
    setIsLoading(true);
    announceLoading('Loading data, please wait...');

    setTimeout(() => {
      setIsLoading(false);
      setStatus('success');
      announceSuccess('Data loaded successfully!');
      
      setTimeout(() => setStatus('idle'), 3000);
    }, 2000);
  };

  const simulateError = () => {
    setStatus('loading');
    setIsLoading(true);
    announceLoading('Attempting to load data...');

    setTimeout(() => {
      setIsLoading(false);
      setStatus('error');
      announceError('Failed to load data. Please try again.');
      
      setTimeout(() => setStatus('idle'), 3000);
    }, 2000);
  };

  const simulateSuccess = () => {
    setStatus('loading');
    setIsLoading(true);
    announceLoading('Saving changes...');

    setTimeout(() => {
      setIsLoading(false);
      setStatus('success');
      announceSuccess('Changes saved successfully!');
      
      setTimeout(() => setStatus('idle'), 3000);
    }, 1500);
  };

  const simulateInfo = () => {
    announceInfo('This is an informational message');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          ARIA Live Region Demo
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          This demo shows how state changes are announced to screen readers.
          Enable a screen reader (VoiceOver, NVDA, JAWS) to hear the announcements.
        </p>

        {/* Status Display */}
        <div className="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center gap-3">
            {isLoading && <Spinner size="sm" />}
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                Current Status: {status}
              </p>
              {status === 'loading' && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Screen reader announces: "Loading..."
                </p>
              )}
              {status === 'success' && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  Screen reader announces: "Success!"
                </p>
              )}
              {status === 'error' && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  Screen reader announces: "Error occurred"
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={simulateLoading}
            disabled={isLoading}
            fullWidth
            variant="primary"
          >
            Simulate Loading → Success
          </Button>

          <Button
            onClick={simulateError}
            disabled={isLoading}
            fullWidth
            variant="secondary"
          >
            Simulate Loading → Error
          </Button>

          <Button
            onClick={simulateSuccess}
            disabled={isLoading}
            fullWidth
            variant="primary"
          >
            Simulate Save Success
          </Button>

          <Button
            onClick={simulateInfo}
            disabled={isLoading}
            fullWidth
            variant="secondary"
          >
            Announce Info Message
          </Button>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
            Testing Instructions:
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
            <li>• Enable VoiceOver (macOS): Cmd + F5</li>
            <li>• Enable NVDA (Windows): Download from nvaccess.org</li>
            <li>• Enable JAWS (Windows): Commercial screen reader</li>
            <li>• Click the buttons to trigger state changes</li>
            <li>• Listen for announcements from the screen reader</li>
          </ul>
        </div>
      </div>

      {/* Technical Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Implementation Details
        </h3>
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
              Loading States
            </h4>
            <p>
              Uses <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">aria-live="polite"</code> to announce
              loading without interrupting the user.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
              Error Messages
            </h4>
            <p>
              Uses <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">aria-live="assertive"</code> to
              immediately announce errors, interrupting other announcements.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
              Success Confirmations
            </h4>
            <p>
              Uses <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">aria-live="polite"</code> to announce
              success messages without interrupting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
