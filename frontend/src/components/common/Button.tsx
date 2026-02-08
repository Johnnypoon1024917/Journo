import React from 'react';
import { useResponsive } from '../../hooks/useResponsive';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  children: React.ReactNode;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  disabled,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  ...props
}) => {
  const { isTouch, isMobileLayout } = useResponsive();

  // Base styles with touch optimization
  const baseStyles = [
    'font-medium rounded-lg',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'transition-all duration-150 ease-out',
    'flex items-center justify-center gap-2',
    'touch-manipulation tap-highlight-transparent',
    // Ensure minimum touch target size
    'min-h-touch min-w-touch',
  ].join(' ');
  
  const variantStyles = {
    primary: [
      'bg-primary-600 text-white',
      'hover:bg-primary-700 hover:shadow-md',
      'active:bg-primary-800 active:scale-95',
      'focus-visible:ring-primary-500',
      'dark:bg-primary-500 dark:hover:bg-primary-600',
    ].join(' '),
    secondary: [
      'bg-gray-200 text-gray-900 border border-gray-300',
      'hover:bg-gray-300 hover:shadow-md',
      'active:bg-gray-400 active:scale-95',
      'focus-visible:ring-gray-500',
      'dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600',
      'dark:hover:bg-gray-600',
    ].join(' '),
    danger: [
      'bg-red-600 text-white',
      'hover:bg-red-700 hover:shadow-md',
      'active:bg-red-800 active:scale-95',
      'focus-visible:ring-red-500',
      'dark:bg-red-500 dark:hover:bg-red-600',
    ].join(' '),
    ghost: [
      'bg-transparent text-gray-700',
      'hover:bg-gray-100 hover:shadow-sm',
      'active:bg-gray-200 active:scale-95',
      'focus-visible:ring-gray-500',
      'dark:text-gray-300 dark:hover:bg-gray-800',
    ].join(' '),
  };
  
  // Responsive sizing with touch-friendly targets
  const getSizeStyles = () => {
    const sizes = {
      sm: {
        padding: 'px-3 py-2',
        text: 'text-sm',
        minHeight: 'min-h-touch',
        minWidth: 'min-w-touch',
      },
      md: {
        padding: 'px-4 py-2.5',
        text: 'text-base',
        minHeight: 'min-h-touch',
        minWidth: 'min-w-touch',
      },
      lg: {
        padding: 'px-6 py-3',
        text: 'text-lg',
        minHeight: 'min-h-touch-lg',
        minWidth: 'min-w-touch-lg',
      },
      xl: {
        padding: 'px-8 py-4',
        text: 'text-xl',
        minHeight: 'min-h-touch-xl',
        minWidth: 'min-w-touch-xl',
      },
    };

    const sizeConfig = sizes[size];
    
    // Adjust for touch devices
    if (isTouch && size === 'sm') {
      return `${sizeConfig.padding} ${sizeConfig.text} min-h-touch-lg min-w-touch-lg`;
    }
    
    return `${sizeConfig.padding} ${sizeConfig.text} ${sizeConfig.minHeight} ${sizeConfig.minWidth}`;
  };

  // Full width styles
  const widthStyles = fullWidth ? 'w-full' : '';

  // Disable hover effects on touch devices for better performance
  const hoverStyles = isTouch ? '' : 'hover:-translate-y-0.5';

  const combinedClassName = [
    baseStyles,
    variantStyles[variant],
    getSizeStyles(),
    widthStyles,
    hoverStyles,
    className,
  ].filter(Boolean).join(' ');

  const renderContent = () => {
    if (isLoading) {
      return (
        <>
          <svg 
            className="animate-spin h-4 w-4" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="sr-only">Loading...</span>
          {isMobileLayout ? 'Loading...' : children}
        </>
      );
    }

    if (icon) {
      return (
        <>
          {iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
          <span className={icon ? 'truncate' : ''}>{children}</span>
          {iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
        </>
      );
    }

    return children;
  };

  return (
    <button
      className={combinedClassName}
      disabled={disabled || isLoading}
      aria-disabled={disabled || isLoading}
      {...props}
    >
      {renderContent()}
    </button>
  );
};
