/**
 * AnimationSelector Component
 * 
 * Allows users to select particle animation effects (none, snow, sakura).
 * Provides visual previews of each animation type.
 * 
 * Features:
 * - Options for none, snow, sakura
 * - Preview of each animation type
 * - Visual cards with icons
 * - Selected state highlighting
 * - Touch-optimized
 * 
 * Requirements: 6.5
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useBubbleQuestThemeStore, type AnimationType } from '@/stores/bubbleQuestThemeStore';
import { cn } from '@/utils/cn';
import { Card } from './Card';

export interface AnimationSelectorProps {
  className?: string;
}

interface AnimationOption {
  type: AnimationType;
  label: string;
  description: string;
  icon: React.ReactNode;
  preview: string;
}

export const AnimationSelector: React.FC<AnimationSelectorProps> = ({
  className,
}) => {
  const { animations, setAnimations } = useBubbleQuestThemeStore();

  const animationOptions: AnimationOption[] = [
    {
      type: 'none',
      label: 'None',
      description: 'No particle effects',
      preview: 'Clean and minimal',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
      ),
    },
    {
      type: 'snow',
      label: 'Snow',
      description: 'Gentle snowfall',
      preview: 'Perfect for winter trips',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 2v20m0-20l-4 4m4-4l4 4m-4 16l-4-4m4 4l4-4m-10-8h16m-16 0l4-4m-4 4l4 4m12-4l-4-4m4 4l-4 4"
          />
        </svg>
      ),
    },
    {
      type: 'sakura',
      label: 'Sakura',
      description: 'Cherry blossom petals',
      preview: 'Beautiful for spring trips',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C10.9 2 10 2.9 10 4C10 4.7 10.4 5.4 11 5.7C11 7.2 10.2 8.6 9 9.4C7.8 8.6 7 7.2 7 5.7C7.6 5.4 8 4.7 8 4C8 2.9 7.1 2 6 2C4.9 2 4 2.9 4 4C4 4.9 4.6 5.7 5.4 5.9C5.8 8.1 7.2 10 9.2 11C7.2 12 5.8 13.9 5.4 16.1C4.6 16.3 4 17.1 4 18C4 19.1 4.9 20 6 20C7.1 20 8 19.1 8 18C8 17.3 7.6 16.6 7 16.3C7 14.8 7.8 13.4 9 12.6C10.2 13.4 11 14.8 11 16.3C10.4 16.6 10 17.3 10 18C10 19.1 10.9 20 12 20C13.1 20 14 19.1 14 18C14 17.3 13.6 16.6 13 16.3C13 14.8 13.8 13.4 15 12.6C16.2 13.4 17 14.8 17 16.3C16.4 16.6 16 17.3 16 18C16 19.1 16.9 20 18 20C19.1 20 20 19.1 20 18C20 17.1 19.4 16.3 18.6 16.1C18.2 13.9 16.8 12 14.8 11C16.8 10 18.2 8.1 18.6 5.9C19.4 5.7 20 4.9 20 4C20 2.9 19.1 2 18 2C16.9 2 16 2.9 16 4C16 4.7 16.4 5.4 17 5.7C17 7.2 16.2 8.6 15 9.4C13.8 8.6 13 7.2 13 5.7C13.6 5.4 14 4.7 14 4C14 2.9 13.1 2 12 2Z" />
        </svg>
      ),
    },
  ];

  const handleSelect = (type: AnimationType) => {
    setAnimations(type);
  };

  return (
    <Card className={cn('p-6', className)}>
      <h3 className="text-lg font-semibold text-bubblequest-neutral-800 dark:text-bubblequest-neutral-100 mb-4">
        Particle Animations
      </h3>
      
      <p className="text-sm text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400 mb-6">
        Add magical particle effects to your travel planning experience
      </p>

      {/* Animation Options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {animationOptions.map((option) => {
          const isSelected = animations === option.type;
          
          return (
            <motion.button
              key={option.type}
              onClick={() => handleSelect(option.type)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'relative p-4 rounded-xl border-2 transition-all',
                'min-h-[120px] flex flex-col items-center justify-center gap-3',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-bubblequest-primary-500',
                isSelected
                  ? 'border-bubblequest-primary-500 bg-bubblequest-primary-50 dark:bg-bubblequest-primary-900/20'
                  : 'border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700 bg-white dark:bg-bubblequest-neutral-800 hover:border-bubblequest-neutral-300 dark:hover:border-bubblequest-neutral-600'
              )}
              aria-label={`Select ${option.label} animation`}
              aria-pressed={isSelected}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2"
                >
                  <div className="w-6 h-6 rounded-full bg-bubblequest-primary-500 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
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
                </motion.div>
              )}

              {/* Icon */}
              <div
                className={cn(
                  'transition-colors',
                  isSelected
                    ? 'text-bubblequest-primary-600 dark:text-bubblequest-primary-400'
                    : 'text-bubblequest-neutral-400 dark:text-bubblequest-neutral-500'
                )}
              >
                {option.icon}
              </div>

              {/* Label */}
              <div className="text-center">
                <h4
                  className={cn(
                    'font-semibold mb-1 transition-colors',
                    isSelected
                      ? 'text-bubblequest-primary-700 dark:text-bubblequest-primary-300'
                      : 'text-bubblequest-neutral-800 dark:text-bubblequest-neutral-200'
                  )}
                >
                  {option.label}
                </h4>
                <p
                  className={cn(
                    'text-xs transition-colors',
                    isSelected
                      ? 'text-bubblequest-primary-600 dark:text-bubblequest-primary-400'
                      : 'text-bubblequest-neutral-500 dark:text-bubblequest-neutral-400'
                  )}
                >
                  {option.description}
                </p>
              </div>

              {/* Preview Text */}
              <p className="text-xs text-bubblequest-neutral-400 dark:text-bubblequest-neutral-500 italic">
                {option.preview}
              </p>
            </motion.button>
          );
        })}
      </div>

      {/* Current Selection Info */}
      <motion.div
        key={animations}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 p-4 rounded-lg bg-bubblequest-neutral-50 dark:bg-bubblequest-neutral-800 border border-bubblequest-neutral-200 dark:border-bubblequest-neutral-700"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg
              className="w-5 h-5 text-bubblequest-primary-500"
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
          </div>
          <div className="flex-1">
            <p className="text-sm text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300">
              {animations === 'none' && (
                <>
                  <span className="font-medium">No animations selected.</span> The app will have a clean, minimal appearance without particle effects.
                </>
              )}
              {animations === 'snow' && (
                <>
                  <span className="font-medium">Snow animation active.</span> Gentle snowflakes will fall across the screen, perfect for winter travel planning.
                </>
              )}
              {animations === 'sakura' && (
                <>
                  <span className="font-medium">Sakura animation active.</span> Cherry blossom petals will drift across the screen, creating a beautiful spring atmosphere.
                </>
              )}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Performance Note */}
      {animations !== 'none' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
        >
          <div className="flex items-start gap-2">
            <svg
              className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Animations are optimized for 60fps performance. They won't block interactions or affect app responsiveness.
            </p>
          </div>
        </motion.div>
      )}
    </Card>
  );
};
