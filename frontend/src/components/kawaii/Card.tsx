/**
 * Kawaii Card Component
 * 
 * A container component with kawaii styling for content grouping.
 * 
 * Features:
 * - Rounded corners with kawaii styling
 * - Support for different padding sizes (sm, md, lg)
 * - Hover and click animations with Framer Motion
 * - Three variants: default, elevated, outlined
 * - Optional hoverable state with lift effect
 * 
 * Requirements: 1.1, 1.4
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

export type CardVariant = 'default' | 'elevated' | 'outlined';
export type CardPadding = 'sm' | 'md' | 'lg';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  className,
  onClick,
  ...props
}) => {
  const baseClasses = cn(
    'rounded-xl',
    'transition-all duration-300',
    'bg-white dark:bg-kawaii-neutral-800'
  );
  
  const variantClasses = {
    default: 'shadow-md',
    elevated: 'shadow-lg hover:shadow-xl',
    outlined: 'border-2 border-[#d5d0c2] dark:border-kawaii-neutral-700 shadow-none',
  };
  
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  
  const hoverableClasses = hoverable ? 'cursor-pointer' : '';
  
  // Framer Motion animation variants
  const cardVariants = {
    initial: { scale: 1, y: 0 },
    hover: hoverable ? { 
      scale: 1.02, 
      y: -4,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 17
      }
    } : {},
    tap: hoverable && onClick ? { 
      scale: 0.98,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 17
      }
    } : {},
  };
  
  return (
    // @ts-ignore - Framer Motion type conflict
    <motion.div
      className={cn(
        baseClasses,
        variantClasses[variant],
        paddingClasses[padding],
        hoverableClasses,
        className
      )}
      // @ts-ignore - Framer Motion variants type conflict
      variants={cardVariants}
      initial="initial"
      whileHover={hoverable ? "hover" : undefined}
      whileTap={hoverable && onClick ? "tap" : undefined}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
};
