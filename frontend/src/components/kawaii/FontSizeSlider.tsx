/**
 * FontSizeSlider Component
 * 
 * A slider for adjusting the app's font size with live preview.
 * Range: 12px - 24px, Default: 16px
 * 
 * Features:
 * - Slider ranging from 12px to 24px
 * - Default at 16px
 * - Live preview of font size changes
 * - Visual size indicators
 * - Touch-optimized
 * 
 * Requirements: 6.3
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useKawaiiThemeStore } from '@/stores/kawaiiThemeStore';
import { cn } from '@/utils/cn';
import { Card } from './Card';
import { Slider } from './Slider';

export interface FontSizeSliderProps {
  className?: string;
}

export const FontSizeSlider: React.FC<FontSizeSliderProps> = ({
  className,
}) => {
  const { fontSize, setFontSize } = useKawaiiThemeStore();

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = Number(e.target.value);
    setFontSize(newSize);
  };

  // Size labels for visual reference
  const sizeLabels = [
    { value: 12, label: 'Small', icon: 'A' },
    { value: 16, label: 'Default', icon: 'A' },
    { value: 20, label: 'Large', icon: 'A' },
    { value: 24, label: 'Extra Large', icon: 'A' },
  ];

  return (
    <Card className={cn('p-6', className)}>
      <h3 className="text-lg font-semibold text-kawaii-neutral-800 dark:text-kawaii-neutral-100 mb-4">
        Font Size
      </h3>
      
      <p className="text-sm text-kawaii-neutral-600 dark:text-kawaii-neutral-400 mb-6">
        Adjust the text size for better readability
      </p>

      {/* Font Size Slider */}
      <div className="mb-6">
        <Slider
          label="Text Size"
          min={12}
          max={24}
          step={1}
          value={fontSize}
          onChange={handleFontSizeChange}
          valueFormatter={(value) => `${value}px`}
          showValue={true}
        />
      </div>

      {/* Size Reference Labels */}
      <div className="flex items-end justify-between mb-6 px-1">
        {sizeLabels.map((size) => {
          const isActive = fontSize === size.value;
          
          return (
            <button
              key={size.value}
              onClick={() => setFontSize(size.value)}
              className={cn(
                'flex flex-col items-center gap-1 transition-all',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-kawaii-primary-500/20 rounded-lg p-2',
                isActive && 'text-kawaii-primary-600 dark:text-kawaii-primary-400'
              )}
              aria-label={`Set font size to ${size.label}`}
            >
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                className={cn(
                  'font-bold transition-colors',
                  isActive
                    ? 'text-kawaii-primary-600 dark:text-kawaii-primary-400'
                    : 'text-kawaii-neutral-400 dark:text-kawaii-neutral-500'
                )}
                style={{ fontSize: `${size.value}px` }}
              >
                {size.icon}
              </motion.div>
              <span
                className={cn(
                  'text-xs transition-colors',
                  isActive
                    ? 'text-kawaii-primary-600 dark:text-kawaii-primary-400 font-medium'
                    : 'text-kawaii-neutral-500 dark:text-kawaii-neutral-400'
                )}
              >
                {size.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Live Preview */}
      <motion.div
        key={fontSize}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-lg bg-kawaii-neutral-50 dark:bg-kawaii-neutral-800 border border-kawaii-neutral-200 dark:border-kawaii-neutral-700"
      >
        <p className="text-xs text-kawaii-neutral-500 dark:text-kawaii-neutral-400 mb-2">
          Preview:
        </p>
        <p
          className="text-kawaii-neutral-900 dark:text-kawaii-neutral-100 leading-relaxed"
          style={{ fontSize: `${fontSize}px` }}
        >
          The quick brown fox jumps over the lazy dog. 快速的棕色狐狸跳過懶狗。
        </p>
      </motion.div>

      {/* Reset Button */}
      {fontSize !== 16 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setFontSize(16)}
          className={cn(
            'mt-4 w-full px-4 py-2 rounded-lg',
            'text-sm font-medium',
            'text-kawaii-primary-600 dark:text-kawaii-primary-400',
            'bg-kawaii-primary-50 dark:bg-kawaii-primary-900/20',
            'border border-kawaii-primary-200 dark:border-kawaii-primary-800',
            'hover:bg-kawaii-primary-100 dark:hover:bg-kawaii-primary-900/30',
            'transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-kawaii-primary-500/20'
          )}
        >
          Reset to Default (16px)
        </motion.button>
      )}

      {/* Live Preview Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 p-3 rounded-lg bg-kawaii-primary-50 dark:bg-kawaii-primary-900/20 border border-kawaii-primary-200 dark:border-kawaii-primary-800"
      >
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-kawaii-primary-500 animate-pulse" />
          <p className="text-xs text-kawaii-primary-700 dark:text-kawaii-primary-300">
            Font size changes are applied immediately across the app
          </p>
        </div>
      </motion.div>
    </Card>
  );
};
