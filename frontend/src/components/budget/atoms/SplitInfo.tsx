import React from 'react';
import { SplitType } from '../../../types/expense';

interface SplitInfoProps {
  splitType?: SplitType;
  splitWith?: string[];
  paidBy?: string;
  memberNames?: Record<string, string>; // userId -> name mapping
  isSettled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const SplitInfo: React.FC<SplitInfoProps> = ({
  splitType,
  splitWith = [],
  paidBy,
  memberNames = {},
  isSettled = false,
  size = 'md',
  className = '',
}) => {
  // If no split info, don't render anything
  if (!splitType || splitWith.length === 0) {
    return null;
  }

  const paidByName = paidBy ? memberNames[paidBy] || 'Unknown' : 'Unknown';
  const splitCount = splitWith.length;

  const sizeStyles = {
    sm: {
      container: 'text-xs gap-1',
      icon: 'w-3 h-3',
      badge: 'text-[10px] px-1.5 py-0.5',
    },
    md: {
      container: 'text-sm gap-1.5',
      icon: 'w-4 h-4',
      badge: 'text-xs px-2 py-0.5',
    },
  };

  return (
    <div className={`flex items-center flex-wrap ${sizeStyles[size].container} ${className}`}>
      {/* Split icon */}
      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
        <svg
          className={sizeStyles[size].icon}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <span>
          Split {splitType === 'equal' ? 'equally' : 'custom'} with {splitCount}{' '}
          {splitCount === 1 ? 'person' : 'people'}
        </span>
      </div>

      {/* Paid by badge */}
      {paidBy && (
        <span className="text-gray-500 dark:text-gray-400">
          • Paid by{' '}
          <span className="font-medium text-gray-700 dark:text-gray-300">{paidByName}</span>
        </span>
      )}

      {/* Settled badge */}
      {isSettled && (
        <span
          className={`
            inline-flex items-center rounded-full font-medium
            bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300
            ${sizeStyles[size].badge}
          `}
        >
          <svg
            className={`${sizeStyles[size].icon} mr-0.5`}
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Settled
        </span>
      )}

      {!isSettled && splitWith.length > 0 && (
        <span
          className={`
            inline-flex items-center rounded-full font-medium
            bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300
            ${sizeStyles[size].badge}
          `}
        >
          Pending
        </span>
      )}
    </div>
  );
};
