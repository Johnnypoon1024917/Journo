import React from 'react';
import { BudgetStatus } from '../../../types/expense';

interface BudgetProgressRingProps {
  totalBudget: number;
  spent: number;
  remaining: number;
  currency: string;
  percentageSpent: number;
  status: BudgetStatus;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showAnimation?: boolean;
  className?: string;
}

const STATUS_COLORS: Record<BudgetStatus, { ring: string; text: string; bg: string }> = {
  safe: {
    ring: '#90EE90',
    text: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
  },
  warning: {
    ring: '#FFD700',
    text: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
  },
  danger: {
    ring: '#FF6B6B',
    text: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
  },
  over: {
    ring: '#DC143C',
    text: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-100 dark:bg-red-900/30',
  },
};

const SIZE_CONFIG = {
  xs: { size: 100, strokeWidth: 6, fontSize: 'text-base', subFontSize: 'text-xs' },
  sm: { size: 120, strokeWidth: 8, fontSize: 'text-lg', subFontSize: 'text-xs' },
  md: { size: 180, strokeWidth: 12, fontSize: 'text-2xl', subFontSize: 'text-sm' },
  lg: { size: 240, strokeWidth: 16, fontSize: 'text-4xl', subFontSize: 'text-base' },
};

export const BudgetProgressRing: React.FC<BudgetProgressRingProps> = ({
  totalBudget,
  spent,
  remaining,
  currency,
  percentageSpent,
  status,
  size = 'md',
  showAnimation = true,
  className = '',
}) => {
  const config = SIZE_CONFIG[size];
  const { ring: ringColor, text: textColor, bg: bgColor } = STATUS_COLORS[status];

  const radius = (config.size - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percentageSpent, 100) / 100) * circumference;

  const center = config.size / 2;

  return (
    <div className={`flex flex-col items-center gap-2 sm:gap-4 ${className}`}>
      {/* Progress Ring */}
      <div className={`relative rounded-full ${bgColor} p-2 sm:p-4`}>
        <svg
          width={config.size}
          height={config.size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={config.strokeWidth}
            className="dark:stroke-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={config.strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={showAnimation ? 'transition-all duration-1000 ease-out' : ''}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`font-bold ${config.fontSize} ${textColor}`}>
            {percentageSpent.toFixed(0)}%
          </div>
          <div className={`${config.subFontSize} text-gray-500 dark:text-gray-400`}>
            spent
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full">
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">Total</div>
          <div className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
            {currency} {totalBudget.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">Spent</div>
          <div className={`text-xs sm:text-sm font-semibold ${textColor}`}>
            {currency} {spent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">Left</div>
          <div className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
            {currency} {Math.max(0, remaining).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Status message */}
      {status === 'over' && (
        <div className="text-xs text-center text-red-600 dark:text-red-400 font-medium">
          ⚠️ Over budget by {currency} {Math.abs(remaining).toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </div>
      )}
      {status === 'danger' && (
        <div className="text-xs text-center text-red-600 dark:text-red-400 font-medium">
          ⚠️ Approaching budget limit
        </div>
      )}
      {status === 'warning' && (
        <div className="text-xs text-center text-yellow-600 dark:text-yellow-400 font-medium">
          ⚡ Watch your spending
        </div>
      )}
      {status === 'safe' && (
        <div className="text-xs text-center text-green-600 dark:text-green-400 font-medium">
          ✓ On track
        </div>
      )}
    </div>
  );
};
