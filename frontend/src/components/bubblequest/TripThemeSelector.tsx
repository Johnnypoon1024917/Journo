/**
 * TripThemeSelector Component
 * 
 * Allows users to choose theme color, sticker style, and animations for their trip.
 * Provides live preview of selections.
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';
import { bubbleQuestThemePresets } from '@/design-system/bubblequest-tokens';
import type { AnimationType } from '@/stores/bubbleQuestThemeStore';

export interface TripThemeConfig {
  primaryColor: string;
  stickerStyle: 'cute' | 'minimal' | 'colorful' | 'vintage';
  animations: AnimationType;
}

export interface TripThemeSelectorProps {
  initialTheme?: Partial<TripThemeConfig>;
  onChange: (theme: TripThemeConfig) => void;
  className?: string;
}

export const TripThemeSelector: React.FC<TripThemeSelectorProps> = ({
  initialTheme,
  onChange,
  className,
}) => {
  const { t } = useTranslation();

  const [theme, setTheme] = useState<TripThemeConfig>({
    primaryColor: initialTheme?.primaryColor || 'var(--bubblequest-primary-500)',
    stickerStyle: initialTheme?.stickerStyle || 'cute',
    animations: initialTheme?.animations || 'none',
  });

  // Notify parent of changes
  useEffect(() => {
    onChange(theme);
  }, [theme, onChange]);

  const handleColorChange = (color: string) => {
    setTheme((prev) => ({ ...prev, primaryColor: color }));
  };

  const handleStickerStyleChange = (style: TripThemeConfig['stickerStyle']) => {
    setTheme((prev) => ({ ...prev, stickerStyle: style }));
  };

  const handleAnimationChange = (animation: AnimationType) => {
    setTheme((prev) => ({ ...prev, animations: animation }));
  };

  const stickerStyles: Array<{
    id: TripThemeConfig['stickerStyle'];
    name: string;
    description: string;
    preview: string;
  }> = [
    {
      id: 'cute',
      name: t('tripTheme.stickerStyle.cute.name', 'Cute'),
      description: t('tripTheme.stickerStyle.cute.description', 'Adorable BubbleQuest characters'),
      preview: '🐰',
    },
    {
      id: 'minimal',
      name: t('tripTheme.stickerStyle.minimal.name', 'Minimal'),
      description: t('tripTheme.stickerStyle.minimal.description', 'Simple and clean icons'),
      preview: '○',
    },
    {
      id: 'colorful',
      name: t('tripTheme.stickerStyle.colorful.name', 'Colorful'),
      description: t('tripTheme.stickerStyle.colorful.description', 'Vibrant and playful'),
      preview: '🌈',
    },
    {
      id: 'vintage',
      name: t('tripTheme.stickerStyle.vintage.name', 'Vintage'),
      description: t('tripTheme.stickerStyle.vintage.description', 'Retro travel stamps'),
      preview: '✈️',
    },
  ];

  const animationOptions: Array<{
    id: AnimationType;
    name: string;
    description: string;
    preview: string;
  }> = [
    {
      id: 'none',
      name: t('tripTheme.animations.none.name', 'None'),
      description: t('tripTheme.animations.none.description', 'No animations'),
      preview: '—',
    },
    {
      id: 'snow',
      name: t('tripTheme.animations.snow.name', 'Snow'),
      description: t('tripTheme.animations.snow.description', 'Gentle snowfall'),
      preview: '❄️',
    },
    {
      id: 'sakura',
      name: t('tripTheme.animations.sakura.name', 'Sakura'),
      description: t('tripTheme.animations.sakura.description', 'Cherry blossom petals'),
      preview: '🌸',
    },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          {t('tripTheme.title', 'Customize Your Trip')}
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {t('tripTheme.subtitle', 'Make your trip planning experience unique and personal')}
        </p>
      </div>

      {/* Theme Color Selection */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
          {t('tripTheme.colorLabel', 'Theme Color')}
        </label>
        <div className="flex flex-wrap gap-3">
          {bubbleQuestThemePresets.map((preset) => {
            const isSelected = theme.primaryColor === preset.value;

            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleColorChange(preset.value)}
                className={cn(
                  'relative group',
                  'w-14 h-14 rounded-full',
                  'border-4 transition-all duration-300',
                  'hover:scale-110 active:scale-95',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2',
                  isSelected
                    ? 'border-neutral-900 dark:border-white shadow-lg scale-110'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                )}
                style={{ backgroundColor: preset.value }}
                aria-label={preset.name}
                aria-pressed={isSelected}
              >
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white drop-shadow-md"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
                
                {/* Tooltip */}
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sticker Style Selection */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
          {t('tripTheme.stickerStyleLabel', 'Sticker Style')}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stickerStyles.map((style) => {
            const isSelected = theme.stickerStyle === style.id;

            return (
              <button
                key={style.id}
                type="button"
                onClick={() => handleStickerStyleChange(style.id)}
                className={cn(
                  'relative',
                  'flex flex-col items-center',
                  'p-4 rounded-xl',
                  'border-2 transition-all duration-300',
                  'hover:shadow-md hover:-translate-y-0.5',
                  'active:scale-95',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
                  isSelected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                    : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600'
                )}
                aria-pressed={isSelected}
              >
                <div className="text-3xl mb-2">{style.preview}</div>
                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                  {style.name}
                </div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400 text-center">
                  {style.description}
                </div>

                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Animation Selection */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
          {t('tripTheme.animationsLabel', 'Background Animations')}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {animationOptions.map((animation) => {
            const isSelected = theme.animations === animation.id;

            return (
              <button
                key={animation.id}
                type="button"
                onClick={() => handleAnimationChange(animation.id)}
                className={cn(
                  'relative',
                  'flex flex-col items-center',
                  'p-4 rounded-xl',
                  'border-2 transition-all duration-300',
                  'hover:shadow-md hover:-translate-y-0.5',
                  'active:scale-95',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
                  isSelected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                    : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600'
                )}
                aria-pressed={isSelected}
              >
                <div className="text-3xl mb-2">{animation.preview}</div>
                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                  {animation.name}
                </div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400 text-center">
                  {animation.description}
                </div>

                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Preview */}
      <div className="mt-6 p-6 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700">
        <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
          {t('tripTheme.previewLabel', 'Preview')}
        </div>
        <div
          className="p-4 rounded-lg shadow-md transition-colors duration-300"
          style={{ backgroundColor: theme.primaryColor }}
        >
          <div className="text-white font-semibold mb-2">
            {t('tripTheme.previewTitle', 'Your Trip')}
          </div>
          <div className="text-white/90 text-sm">
            {t('tripTheme.previewDescription', 'This is how your trip will look with the selected theme')}
          </div>
        </div>
      </div>
    </div>
  );
};
