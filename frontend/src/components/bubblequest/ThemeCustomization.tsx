/**
 * ThemeCustomization Component
 * 
 * Allows users to customize the app's theme color with preset options
 * and a custom color picker. Changes are applied immediately with live preview.
 * 
 * Features:
 * - 6 preset color circles (Pink, Orange, Blue, Teal, Purple, Yellow)
 * - Custom color picker with live preview
 * - Apply theme changes immediately
 * - Selected color highlighting
 * - Touch-optimized with 44px minimum targets
 * 
 * Requirements: 6.1, 6.2, 6.6
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HexColorPicker } from 'react-colorful';
import { useBubbleQuestThemeStore, bubbleQuestThemePresets } from '@/stores/bubbleQuestThemeStore';
import { cn } from '@/utils/cn';
import { Card } from './Card';

export interface ThemeCustomizationProps {
  className?: string;
}

export const ThemeCustomization: React.FC<ThemeCustomizationProps> = ({
  className,
}) => {
  const { primaryColor, setPrimaryColor } = useBubbleQuestThemeStore();
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customColor, setCustomColor] = useState(primaryColor || '#FF69B4');

  // Ensure primaryColor has a default value
  const currentColor = primaryColor || '#FF69B4';

  const handlePresetClick = (color: string) => {
    setPrimaryColor(color);
    setShowCustomPicker(false);
  };

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
    setPrimaryColor(color);
  };

  const isPresetSelected = bubbleQuestThemePresets.some(
    preset => preset.value?.toLowerCase() === currentColor.toLowerCase()
  );

  return (
    <Card className={cn('p-6', className)}>
      <h3 className="text-lg font-semibold text-bubblequest-neutral-800 dark:text-bubblequest-neutral-100 mb-4">
        Theme Color
      </h3>
      
      <p className="text-sm text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400 mb-6">
        Choose a preset color or create your own custom theme
      </p>

      {/* Preset Colors */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-3">
          Preset Colors
        </label>
        <div className="grid grid-cols-6 gap-3">
          {bubbleQuestThemePresets.map((preset) => {
            const isSelected = preset.value?.toLowerCase() === currentColor.toLowerCase();
            
            return (
              <motion.button
                key={preset.name}
                onClick={() => handlePresetClick(preset.value)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'relative w-full aspect-square rounded-full',
                  'min-h-[44px] min-w-[44px]',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                  'transition-all duration-200',
                  isSelected && 'ring-2 ring-offset-2 ring-bubblequest-neutral-400 dark:ring-bubblequest-neutral-500'
                )}
                style={{ backgroundColor: preset.value }}
                aria-label={`Select ${preset.name} theme`}
                aria-pressed={isSelected}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
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
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
        
        {/* Color names */}
        <div className="grid grid-cols-6 gap-3 mt-2">
          {bubbleQuestThemePresets.map((preset) => (
            <div
              key={`${preset.name}-label`}
              className="text-center text-xs text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400"
            >
              {preset.name}
            </div>
          ))}
        </div>
      </div>

      {/* Custom Color Picker */}
      <div>
        <label className="block text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 mb-3">
          Custom Color
        </label>
        
        <div className="flex items-start gap-4">
          {/* Custom color button */}
          <motion.button
            onClick={() => setShowCustomPicker(!showCustomPicker)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'relative w-16 h-16 rounded-xl border-2',
              'min-h-[44px] min-w-[44px]',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              'transition-all duration-200',
              'bg-gradient-to-br',
              showCustomPicker || !isPresetSelected
                ? 'ring-2 ring-offset-2 ring-bubblequest-neutral-400 dark:ring-bubblequest-neutral-500'
                : 'border-bubblequest-neutral-300 dark:border-bubblequest-neutral-600'
            )}
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`
            }}
            aria-label="Custom color picker"
            aria-expanded={showCustomPicker}
          >
            {(!isPresetSelected || showCustomPicker) && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <svg
                  className="w-8 h-8 text-white drop-shadow-md"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
              </motion.div>
            )}
          </motion.button>

          {/* Color picker panel */}
          {showCustomPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1"
            >
              <HexColorPicker
                color={customColor}
                onChange={handleCustomColorChange}
                className="w-full"
              />
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                      setCustomColor(value);
                      if (value.length === 7) {
                        setPrimaryColor(value);
                      }
                    }
                  }}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg',
                    'border border-bubblequest-neutral-300 dark:border-bubblequest-neutral-600',
                    'bg-white dark:bg-bubblequest-neutral-800',
                    'text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100',
                    'text-sm font-mono',
                    'focus:outline-none focus:ring-2 focus:ring-bubblequest-primary-500/20'
                  )}
                  placeholder="var(--bubblequest-primary-500)"
                />
                <div
                  className="w-10 h-10 rounded-lg border-2 border-bubblequest-neutral-300 dark:border-bubblequest-neutral-600"
                  style={{ backgroundColor: customColor }}
                  aria-label="Color preview"
                />
              </div>
            </motion.div>
          )}
        </div>

        {!showCustomPicker && (
          <p className="mt-2 text-xs text-bubblequest-neutral-500 dark:text-bubblequest-neutral-400">
            Click the color square to open the custom color picker
          </p>
        )}
      </div>

      {/* Live Preview Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 p-4 rounded-lg bg-bubblequest-primary-50 dark:bg-bubblequest-primary-900/20 border border-bubblequest-primary-200 dark:border-bubblequest-primary-800"
      >
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full animate-pulse"
            style={{ backgroundColor: primaryColor }}
          />
          <p className="text-sm text-bubblequest-primary-700 dark:text-bubblequest-primary-300">
            Theme changes are applied immediately
          </p>
        </div>
      </motion.div>
    </Card>
  );
};
