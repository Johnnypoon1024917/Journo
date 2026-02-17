import React from 'react';

interface BurnRateIndicatorProps {
  burnRate: number;
  plannedRate: number;
  currency: string;
  className?: string;
}

export const BurnRateIndicator: React.FC<BurnRateIndicatorProps> = ({
  burnRate,
  plannedRate,
  currency,
  className = '',
}) => {
  const percentage = plannedRate > 0 ? (burnRate / plannedRate) * 100 : 0;
  const isOverBudget = burnRate > plannedRate * 1.2; // 20% over threshold
  const isWarning = burnRate > plannedRate && !isOverBudget;

  const getStatusColor = () => {
    if (isOverBudget) return 'text-red-600 dark:text-red-400';
    if (isWarning) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getStatusBg = () => {
    if (isOverBudget) return 'bg-red-100 dark:bg-red-900/30';
    if (isWarning) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-green-100 dark:bg-green-900/30';
  };

  const getStatusIcon = () => {
    if (isOverBudget) {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    if (isWarning) {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  return (
    <div className={`rounded-2xl ${getStatusBg()} p-2 sm:p-4 ${className}`}>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={getStatusColor()}>{getStatusIcon()}</div>
        <div className="flex-1">
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Burn Rate</div>
          <div className={`text-base sm:text-xl font-bold ${getStatusColor()}`}>
            {currency}{burnRate.toFixed(2)}/day
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Planned: {currency}{plannedRate.toFixed(2)}/day
            {percentage > 0 && ` (${percentage.toFixed(0)}%)`}
          </div>
        </div>
      </div>
    </div>
  );
};
