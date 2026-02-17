import React from 'react';
import { BudgetCategory } from '../../../types/trip';

interface ExpenseCategoryProps {
  category: BudgetCategory;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const categoryConfig: Record<BudgetCategory, { icon: string; label: string; color: string }> = {
  flights: {
    icon: '✈️',
    label: 'Flights',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  },
  accommodation: {
    icon: '🏨',
    label: 'Accommodation',
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  },
  food: {
    icon: '🍽️',
    label: 'Food',
    color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  },
  transport: {
    icon: '🚗',
    label: 'Transport',
    color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  },
  activities: {
    icon: '🎭',
    label: 'Activities',
    color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
  },
  shopping: {
    icon: '🛍️',
    label: 'Shopping',
    color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  },
  misc: {
    icon: '📦',
    label: 'Misc',
    color: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300',
  },
};

export const ExpenseCategory: React.FC<ExpenseCategoryProps> = ({
  category,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const config = categoryConfig[category];

  const sizeStyles = {
    sm: {
      container: 'px-2 py-1 text-xs gap-1',
      icon: 'text-sm',
    },
    md: {
      container: 'px-3 py-1.5 text-sm gap-1.5',
      icon: 'text-base',
    },
    lg: {
      container: 'px-4 py-2 text-base gap-2',
      icon: 'text-lg',
    },
  };

  return (
    <div
      className={`
        inline-flex items-center rounded-full font-medium
        ${config.color}
        ${sizeStyles[size].container}
        ${className}
      `}
      aria-label={`Category: ${config.label}`}
    >
      <span className={sizeStyles[size].icon} role="img" aria-hidden="true">
        {config.icon}
      </span>
      {showLabel && <span>{config.label}</span>}
    </div>
  );
};

// Export category config for use in other components
export { categoryConfig };
