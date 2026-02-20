/**
 * ActionCard Component
 * 
 * Modern glassmorphic action card with gradient icons, hover animations,
 * and better spacing for the BubbleQuest home page.
 */

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface ActionCardProps {
  /** Card title */
  title: string;
  /** Card description */
  description: string;
  /** Icon element (emoji or React component) */
  icon: ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Optional gradient colors for icon background */
  iconGradient?: {
    from: string;
    to: string;
  };
  /** Animation delay for stagger effect */
  delay?: number;
  /** Additional CSS classes */
  className?: string;
}

export function ActionCard({
  title,
  description,
  icon,
  onClick,
  iconGradient = {
    from: 'from-bubblequest-primary-400',
    to: 'to-bubblequest-secondary-400',
  },
  delay = 0,
  className,
}: ActionCardProps) {
  return (
    <motion.div
      onClick={onClick}
      className={cn(
        // Base styles - glassmorphic design
        'group relative cursor-pointer',
        'bg-white/70 dark:bg-bubblequest-neutral-800/70',
        'backdrop-blur-xl backdrop-saturate-150',
        
        // Border and shadow
        'border-2 border-white/40 dark:border-bubblequest-neutral-700/40',
        'shadow-lg shadow-bubblequest-primary-100/50 dark:shadow-bubblequest-neutral-900/50',
        
        // Rounded corners with more breathing room
        'rounded-2xl md:rounded-3xl',
        
        // Padding - responsive with less on mobile
        'p-5 md:p-8',
        
        // Hover effects
        'hover:border-bubblequest-primary-300/60 dark:hover:border-bubblequest-primary-600/60',
        'hover:shadow-2xl hover:shadow-bubblequest-primary-200/60 dark:hover:shadow-bubblequest-primary-900/60',
        
        // Transitions
        'transition-all duration-300 ease-out',
        
        // Touch-friendly
        'tap-highlight-transparent',
        
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5,
        delay,
        ease: [0.4, 0, 0.2, 1]
      }}
      whileHover={{ 
        scale: 1.05,
        y: -8,
        transition: { duration: 0.2 }
      }}
      whileTap={{ 
        scale: 0.98,
        transition: { duration: 0.1 }
      }}
    >
      {/* Icon container with gradient background */}
      <motion.div
        className={cn(
          'inline-flex items-center justify-center',
          'w-14 h-14 md:w-16 md:h-16 mb-4 md:mb-5',
          'rounded-xl md:rounded-2xl',
          'bg-gradient-to-br',
          iconGradient.from,
          iconGradient.to,
          'shadow-lg',
          'group-hover:shadow-xl',
          'transition-shadow duration-300'
        )}
        whileHover={{
          y: -4,
          transition: {
            type: 'spring',
            stiffness: 400,
            damping: 10
          }
        }}
      >
        <span className="text-2xl md:text-3xl filter drop-shadow-sm">
          {icon}
        </span>
      </motion.div>
      
      {/* Content */}
      <div className="space-y-2 md:space-y-3">
        <h3 className={cn(
          'text-lg md:text-xl font-bold',
          'text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100',
          'group-hover:text-bubblequest-primary-600 dark:group-hover:text-bubblequest-primary-400',
          'transition-colors duration-300'
        )}>
          {title}
        </h3>
        
        <p className={cn(
          'text-sm md:text-base leading-relaxed',
          'text-bubblequest-neutral-600 dark:text-bubblequest-neutral-300'
        )}>
          {description}
        </p>
      </div>
      
      {/* Hover arrow indicator */}
      <motion.div
        className={cn(
          'absolute bottom-4 right-4 md:bottom-5 md:right-5',
          'text-bubblequest-primary-500 dark:text-bubblequest-primary-400',
          'opacity-0 group-hover:opacity-100',
          'transition-opacity duration-300'
        )}
        initial={{ x: -10 }}
        whileHover={{ x: 0 }}
      >
        <svg 
          className="w-5 h-5 md:w-6 md:h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M13 7l5 5m0 0l-5 5m5-5H6" 
          />
        </svg>
      </motion.div>
    </motion.div>
  );
}
