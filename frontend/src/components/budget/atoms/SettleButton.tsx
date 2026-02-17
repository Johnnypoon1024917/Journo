/**
 * SettleButton Atom Component
 * 
 * Button for settling group expenses with visual feedback
 * 
 * Requirements: 6.9
 */

import React from 'react';

interface SettleButtonProps {
  onClick: () => void;
  disabled?: boolean;
  hasUnsettledExpenses: boolean;
  className?: string;
}

export const SettleButton: React.FC<SettleButtonProps> = ({
  onClick,
  disabled = false,
  hasUnsettledExpenses,
  className = '',
}) => {
  if (!hasUnsettledExpenses) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <div className="inline-flex items-center gap-2 text-green-600 dark:text-green-400">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-semibold">All expenses settled!</span>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-4 px-6 rounded-xl font-semibold text-white 
        bg-gradient-to-r from-pink-500 to-purple-500 
        hover:from-pink-600 hover:to-purple-600 
        disabled:from-gray-300 disabled:to-gray-400 
        disabled:cursor-not-allowed
        transition-all duration-200 
        shadow-md hover:shadow-lg
        transform hover:scale-[1.02] active:scale-[0.98]
        ${className}`}
      aria-label="Settle all expenses"
    >
      <span className="flex items-center justify-center gap-2">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {disabled ? 'Settling...' : 'Settle All Expenses'}
      </span>
    </button>
  );
};
