/**
 * Settings Components Demo
 * 
 * Demonstrates all Settings screen components in action.
 * This can be used for testing and showcasing the components.
 */

import React from 'react';
import {
  ThemeCustomization,
  FontSizeSlider,
  DarkModeToggle,
  AnimationSelector,
  LanguageSelector,
} from './index';

export const SettingsDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-bubblequest-neutral-50 dark:bg-bubblequest-neutral-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 mb-2">
            Settings Components Demo
          </h1>
          <p className="text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400">
            Customize your app experience with these settings. All changes are applied immediately.
          </p>
        </div>

        {/* Theme Customization */}
        <section>
          <ThemeCustomization />
        </section>

        {/* Font Size */}
        <section>
          <FontSizeSlider />
        </section>

        {/* Dark Mode */}
        <section>
          <DarkModeToggle />
        </section>

        {/* Animations */}
        <section>
          <AnimationSelector />
        </section>

        {/* Language */}
        <section>
          <LanguageSelector />
        </section>

        {/* Demo Content */}
        <section className="mt-12">
          <div className="rounded-xl bg-white dark:bg-bubblequest-neutral-800 shadow-md p-6">
            <h2 className="text-xl font-semibold text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 mb-4">
              Preview Content
            </h2>
            <p className="text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-4">
              This content demonstrates how your settings affect the app's appearance. Try changing
              the theme color, font size, or dark mode to see the changes in real-time.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-bubblequest-primary-50 dark:bg-bubblequest-primary-900/20 border border-bubblequest-primary-200 dark:border-bubblequest-primary-800">
                <h3 className="font-semibold text-bubblequest-primary-700 dark:text-bubblequest-primary-300 mb-2">
                  Primary Color
                </h3>
                <p className="text-sm text-bubblequest-primary-600 dark:text-bubblequest-primary-400">
                  This card uses the primary color you selected.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-bubblequest-neutral-100 dark:bg-bubblequest-neutral-700 border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-600">
                <h3 className="font-semibold text-bubblequest-neutral-800 dark:text-bubblequest-neutral-200 mb-2">
                  Neutral Colors
                </h3>
                <p className="text-sm text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400">
                  This card uses neutral colors that adapt to dark mode.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Info */}
        <section className="mt-8">
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  About This Demo
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  This demo showcases all Settings components. Your preferences are automatically
                  saved to localStorage and will persist across sessions. Try different combinations
                  to find your perfect setup!
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsDemo;
