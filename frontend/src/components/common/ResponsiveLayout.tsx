import React from 'react';
import { useResponsive } from '../../hooks/useResponsive';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'mobile' | 'tablet' | 'desktop' | 'wide' | 'ultra' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  safeArea?: boolean;
  'data-testid'?: string;
}

/**
 * Responsive layout container that adapts to different screen sizes
 * Provides consistent spacing and max-width constraints
 */
export function ResponsiveLayout({ 
  children, 
  className = '', 
  maxWidth = 'wide',
  padding = 'md',
  safeArea = true,
  'data-testid': testId,
}: ResponsiveLayoutProps) {
  const { isMobileLayout, isTabletLayout } = useResponsive();

  // Determine container classes based on screen size
  const getContainerClasses = () => {
    const classes = ['mx-auto', 'w-full'];

    // Max width
    switch (maxWidth) {
      case 'mobile':
        classes.push('max-w-mobile');
        break;
      case 'tablet':
        classes.push('max-w-tablet');
        break;
      case 'desktop':
        classes.push('max-w-desktop');
        break;
      case 'wide':
        classes.push('max-w-wide');
        break;
      case 'ultra':
        classes.push('max-w-ultra');
        break;
      case 'full':
        classes.push('max-w-full');
        break;
    }

    // Responsive padding
    if (padding !== 'none') {
      if (isMobileLayout) {
        switch (padding) {
          case 'sm':
            classes.push('px-3');
            break;
          case 'md':
            classes.push('px-4');
            break;
          case 'lg':
            classes.push('px-5');
            break;
          case 'xl':
            classes.push('px-6');
            break;
        }
      } else if (isTabletLayout) {
        switch (padding) {
          case 'sm':
            classes.push('px-4');
            break;
          case 'md':
            classes.push('px-6');
            break;
          case 'lg':
            classes.push('px-8');
            break;
          case 'xl':
            classes.push('px-10');
            break;
        }
      } else {
        switch (padding) {
          case 'sm':
            classes.push('px-6');
            break;
          case 'md':
            classes.push('px-8');
            break;
          case 'lg':
            classes.push('px-12');
            break;
          case 'xl':
            classes.push('px-16');
            break;
        }
      }
    }

    // Safe area support
    if (safeArea) {
      classes.push('pt-safe', 'pb-safe', 'pl-safe', 'pr-safe');
    }

    return classes.join(' ');
  };

  return (
    <div className={`${getContainerClasses()} ${className}`} data-testid={testId}>
      {children}
    </div>
  );
}

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    wide?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  minItemWidth?: string;
  'data-testid'?: string;
}

/**
 * Responsive grid component that adapts column count based on screen size
 */
export function ResponsiveGrid({ 
  children, 
  className = '',
  columns = { mobile: 1, tablet: 2, desktop: 3, wide: 4 },
  gap = 'md',
  minItemWidth,
  'data-testid': testId,
}: ResponsiveGridProps) {
  const getGridClasses = () => {
    const classes = ['grid'];

    // Gap
    switch (gap) {
      case 'sm':
        classes.push('gap-2', 'sm:gap-3', 'lg:gap-4');
        break;
      case 'md':
        classes.push('gap-3', 'sm:gap-4', 'lg:gap-6');
        break;
      case 'lg':
        classes.push('gap-4', 'sm:gap-6', 'lg:gap-8');
        break;
      case 'xl':
        classes.push('gap-6', 'sm:gap-8', 'lg:gap-10');
        break;
    }

    // Columns based on screen size or min width
    if (minItemWidth) {
      classes.push(`grid-cols-[repeat(auto-fit,minmax(${minItemWidth},1fr))]`);
    } else {
      // Mobile
      classes.push(`grid-cols-${columns.mobile || 1}`);
      
      // Tablet
      if (columns.tablet) {
        classes.push(`sm:grid-cols-${columns.tablet}`);
      }
      
      // Desktop
      if (columns.desktop) {
        classes.push(`lg:grid-cols-${columns.desktop}`);
      }
      
      // Wide screens
      if (columns.wide) {
        classes.push(`2xl:grid-cols-${columns.wide}`);
      }
    }

    return classes.join(' ');
  };

  return (
    <div className={`${getGridClasses()} ${className}`} data-testid={testId}>
      {children}
    </div>
  );
}

interface ResponsiveStackProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'vertical' | 'horizontal' | 'responsive';
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  'data-testid'?: string;
}

/**
 * Responsive stack component for flexible layouts
 */
export function ResponsiveStack({ 
  children, 
  className = '',
  direction = 'vertical',
  gap = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  'data-testid': testId,
}: ResponsiveStackProps) {
  const { isMobileLayout } = useResponsive();

  const getStackClasses = () => {
    const classes = ['flex'];

    // Direction
    if (direction === 'vertical' || (direction === 'responsive' && isMobileLayout)) {
      classes.push('flex-col');
    } else if (direction === 'horizontal' || (direction === 'responsive' && !isMobileLayout)) {
      classes.push('flex-row');
    }

    // Responsive direction
    if (direction === 'responsive') {
      classes.push('flex-col', 'md:flex-row');
    }

    // Gap
    switch (gap) {
      case 'sm':
        classes.push('gap-2');
        break;
      case 'md':
        classes.push('gap-4');
        break;
      case 'lg':
        classes.push('gap-6');
        break;
      case 'xl':
        classes.push('gap-8');
        break;
    }

    // Alignment
    switch (align) {
      case 'start':
        classes.push('items-start');
        break;
      case 'center':
        classes.push('items-center');
        break;
      case 'end':
        classes.push('items-end');
        break;
      case 'stretch':
        classes.push('items-stretch');
        break;
    }

    // Justification
    switch (justify) {
      case 'start':
        classes.push('justify-start');
        break;
      case 'center':
        classes.push('justify-center');
        break;
      case 'end':
        classes.push('justify-end');
        break;
      case 'between':
        classes.push('justify-between');
        break;
      case 'around':
        classes.push('justify-around');
        break;
      case 'evenly':
        classes.push('justify-evenly');
        break;
    }

    // Wrap
    if (wrap) {
      classes.push('flex-wrap');
    }

    return classes.join(' ');
  };

  return (
    <div className={`${getStackClasses()} ${className}`} data-testid={testId}>
      {children}
    </div>
  );
}

interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  border?: boolean;
  rounded?: 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  'data-testid'?: string;
}

/**
 * Responsive card component with touch-friendly interactions
 */
export function ResponsiveCard({ 
  children, 
  className = '',
  padding = 'md',
  shadow = 'md',
  border = true,
  rounded = 'lg',
  hover = false,
  'data-testid': testId,
}: ResponsiveCardProps) {
  const { isMobileLayout, isTouch } = useResponsive();

  const getCardClasses = () => {
    const classes = ['bg-white', 'dark:bg-gray-800'];

    // Padding (responsive)
    switch (padding) {
      case 'sm':
        classes.push(isMobileLayout ? 'p-3' : 'p-4');
        break;
      case 'md':
        classes.push(isMobileLayout ? 'p-4' : 'p-6');
        break;
      case 'lg':
        classes.push(isMobileLayout ? 'p-5' : 'p-8');
        break;
      case 'xl':
        classes.push(isMobileLayout ? 'p-6' : 'p-10');
        break;
    }

    // Shadow
    if (shadow !== 'none') {
      classes.push(`shadow-${shadow}`);
    }

    // Border
    if (border) {
      classes.push('border', 'border-gray-200', 'dark:border-gray-700');
    }

    // Rounded corners
    switch (rounded) {
      case 'sm':
        classes.push('rounded-sm');
        break;
      case 'md':
        classes.push('rounded-md');
        break;
      case 'lg':
        classes.push('rounded-lg');
        break;
      case 'xl':
        classes.push('rounded-xl');
        break;
    }

    // Hover effects (only on non-touch devices)
    if (hover && !isTouch) {
      classes.push('hover:shadow-lg', 'transition-shadow', 'duration-200');
    }

    // Touch optimization
    if (isTouch) {
      classes.push('touch-manipulation');
    }

    return classes.join(' ');
  };

  return (
    <div className={`${getCardClasses()} ${className}`} data-testid={testId}>
      {children}
    </div>
  );
}