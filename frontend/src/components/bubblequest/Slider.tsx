/**
 * BubbleQuest Slider Component
 * 
 * A range slider input with BubbleQuest styling and animations.
 * 
 * Features:
 * - Touch-optimized with 44px minimum target size
 * - BubbleQuest styling with rounded track and thumb
 * - Value display
 * - Label and helper text support
 * - Min/max/step support
 * - Disabled state
 * 
 * Requirements: 1.3, 1.4
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  helperText?: string;
  showValue?: boolean;
  valueFormatter?: (value: number) => string;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  helperText,
  showValue = true,
  valueFormatter,
  className,
  id,
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue,
  disabled,
  onChange,
  ...props
}) => {
  const sliderId = id || `slider-${Math.random().toString(36).substr(2, 9)}`;
  const [internalValue, setInternalValue] = useState<number>(
    Number(value || defaultValue || min)
  );
  
  const currentValue = value !== undefined ? Number(value) : internalValue;
  const percentage = ((currentValue - Number(min)) / (Number(max) - Number(min))) * 100;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setInternalValue(newValue);
    onChange?.(e);
  };
  
  const formatValue = (val: number) => {
    if (valueFormatter) {
      return valueFormatter(val);
    }
    return val.toString();
  };
  
  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-3">
          {label && (
            <label
              htmlFor={sliderId}
              className="text-sm font-medium text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300"
            >
              {label}
            </label>
          )}
          {showValue && (
            <motion.span
              key={currentValue}
              initial={{ scale: 1.2, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-sm font-semibold text-bubblequest-primary-600 dark:text-bubblequest-primary-400"
            >
              {formatValue(currentValue)}
            </motion.span>
          )}
        </div>
      )}
      
      <div className="relative min-h-[44px] flex items-center">
        {/* Track background */}
        <div className="absolute w-full h-2 rounded-full bg-bubblequest-neutral-200 dark:bg-bubblequest-neutral-700">
          {/* Filled track */}
          <motion.div
            className="absolute h-full rounded-full bg-gradient-to-r from-bubblequest-primary-500 to-bubblequest-primary-400"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
        
        {/* Slider input */}
        <input
          type="range"
          id={sliderId}
          min={min}
          max={max}
          step={step}
          value={currentValue}
          disabled={disabled}
          onChange={handleChange}
          className={cn(
            'relative w-full h-2 appearance-none bg-transparent cursor-pointer',
            'focus:outline-none',
            // Thumb styling
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:w-5',
            '[&::-webkit-slider-thumb]:h-5',
            '[&::-webkit-slider-thumb]:rounded-full',
            '[&::-webkit-slider-thumb]:bg-white',
            '[&::-webkit-slider-thumb]:border-2',
            '[&::-webkit-slider-thumb]:border-bubblequest-primary-500',
            '[&::-webkit-slider-thumb]:shadow-md',
            '[&::-webkit-slider-thumb]:cursor-pointer',
            '[&::-webkit-slider-thumb]:transition-all',
            '[&::-webkit-slider-thumb]:hover:scale-110',
            '[&::-webkit-slider-thumb]:active:scale-95',
            // Firefox thumb styling
            '[&::-moz-range-thumb]:w-5',
            '[&::-moz-range-thumb]:h-5',
            '[&::-moz-range-thumb]:rounded-full',
            '[&::-moz-range-thumb]:bg-white',
            '[&::-moz-range-thumb]:border-2',
            '[&::-moz-range-thumb]:border-bubblequest-primary-500',
            '[&::-moz-range-thumb]:shadow-md',
            '[&::-moz-range-thumb]:cursor-pointer',
            '[&::-moz-range-thumb]:transition-all',
            // Focus ring
            'focus-visible:ring-2 focus-visible:ring-bubblequest-primary-500/20 focus-visible:ring-offset-2',
            // Disabled state
            disabled && 'opacity-50 cursor-not-allowed [&::-webkit-slider-thumb]:cursor-not-allowed [&::-moz-range-thumb]:cursor-not-allowed'
          )}
          {...props}
        />
      </div>
      
      {helperText && (
        <p className="mt-2 text-sm text-bubblequest-neutral-500 dark:text-bubblequest-neutral-400">
          {helperText}
        </p>
      )}
    </div>
  );
};
