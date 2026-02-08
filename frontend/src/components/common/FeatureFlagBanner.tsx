import { useState } from 'react';
import { useFeatureFlagStore } from '../../stores/featureFlagStore';

interface FeatureFlagBannerProps {
  flagName: string;
  description: string;
}

export function FeatureFlagBanner({ flagName, description }: FeatureFlagBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const { abTestGroup } = useFeatureFlagStore();

  if (isDismissed) {
    return null;
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <span className="font-semibold">{flagName}</span> — {description}
                {abTestGroup && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100">
                    A/B Test: {abTestGroup}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/settings"
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
            >
              Settings
            </a>
            <button
              onClick={() => setIsDismissed(true)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              aria-label="Dismiss banner"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
