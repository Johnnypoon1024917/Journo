/**
 * Divider Atom Component
 * 
 * Visual separator component with various orientations and styles.
 * Supports text labels and different visual treatments.
 */

import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';
import type { AtomProps } from '../types';

interface DividerProps extends AtomProps {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
  label?: string;
  labelPosition?: 'left' | 'center' | 'right';
}

const Divider = forwardRef<HTMLDivElement, DividerProps>(
  (
    {
      orientation = 'horizontal',
      variant = 'solid',
      label,
      labelPosition = 'center',
      className,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles = cn(
      'border-neutral-200 dark:border-neutral-700',
      {
        'border-solid': variant === 'solid',
        'border-dashed': variant === 'dashed',
        'border-dotted': variant === 'dotted',
      }
    );

    // Orientation styles
    const orientationStyles = {
      horizontal: 'w-full border-t',
      vertical: 'h-full border-l',
    };

    // If there's a label, render with text
    if (label && orientation === 'horizontal') {
      const labelPositionStyles = {
        left: 'justify-start',
        center: 'justify-center',
        right: 'justify-end',
      };

      return (
        <div
          ref={ref}
          className={cn('relative flex items-center w-full', className)}
          data-testid={testId}
          {...props}
        >
          <div className={cn('flex-1', baseStyles, orientationStyles.horizontal)} />
          <div className={cn('flex px-3', labelPositionStyles[labelPosition])}>
            <span className="text-sm text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-900 px-2">
              {label}
            </span>
          </div>
          <div className={cn('flex-1', baseStyles, orientationStyles.horizontal)} />
        </div>
      );
    }

    // Simple divider without label
    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          orientationStyles[orientation],
          className
        )}
        role="separator"
        aria-orientation={orientation}
        data-testid={testId}
        {...props}
      />
    );
  }
);

Divider.displayName = 'Divider';

export { Divider };