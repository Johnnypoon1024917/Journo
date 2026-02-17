import React from 'react';
import { FilterTab as FilterTabType } from '../../../types/expense';

interface FilterTabProps {
  label: string;
  value: FilterTabType;
  isActive: boolean;
  count?: number;
  onClick: (value: FilterTabType) => void;
  className?: string;
}

export const FilterTab: React.FC<FilterTabProps> = ({
  label,
  value,
  isActive,
  count,
  onClick,
  className = '',
}) => {
  return (
    <button
      onClick={() => onClick(value)}
      className={`
        relative px-4 py-2.5 rounded-full text-sm font-medium
        transition-all duration-200 ease-out
        min-h-touch min-w-touch
        touch-manipulation tap-highlight-transparent
        ${
          isActive
            ? 'bg-pink-500 text-white shadow-md scale-105'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-sm'
        }
        ${className}
      `}
      aria-pressed={isActive}
      aria-label={`Filter by ${label}${count !== undefined ? `, ${count} items` : ''}`}
    >
      <span className="flex items-center gap-2">
        {label}
        {count !== undefined && (
          <span
            className={`
              inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold
              ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }
            `}
          >
            {count}
          </span>
        )}
      </span>
    </button>
  );
};
