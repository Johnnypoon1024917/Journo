import React from 'react';
import { BudgetCategory } from '../../../types/trip';

interface CategoryAllocationItemProps {
  category: BudgetCategory;
  percentage: number;
  allocatedAmount: number;
  currency: string;
  onPercentageChange: (category: BudgetCategory, percentage: number) => void;
  className?: string;
}

const CATEGORY_INFO: Record<BudgetCategory, { emoji: string; label: string; color: string }> = {
  flights: { emoji: '✈️', label: 'Flights', color: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300' },
  accommodation: { emoji: '🏨', label: 'Accommodation', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
  food: { emoji: '🍜', label: 'Food', color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300' },
  transport: { emoji: '🚇', label: 'Transport', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
  activities: { emoji: '🎭', label: 'Activities', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' },
  shopping: { emoji: '🛍️', label: 'Shopping', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' },
  misc: { emoji: '📦', label: 'Miscellaneous', color: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300' },
};

export const CategoryAllocationItem: React.FC<CategoryAllocationItemProps> = ({
  category,
  percentage,
  allocatedAmount,
  currency,
  onPercentageChange,
  className = '',
}) => {
  const info = CATEGORY_INFO[category];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPercentage = parseFloat(e.target.value);
    onPercentageChange(category, newPercentage);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      onPercentageChange(category, 0);
      return;
    }
    
    const newPercentage = parseFloat(value);
    if (!isNaN(newPercentage) && newPercentage >= 0 && newPercentage <= 100) {
      onPercentageChange(category, newPercentage);
    }
  };

  return (
    <div className={`rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3 transition-all duration-200 hover:shadow-md ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${info.color} text-xl`}>
            {info.emoji}
          </span>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {info.label}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {currency} {allocatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={percentage.toFixed(1)}
            onChange={handleInputChange}
            min="0"
            max="100"
            step="0.1"
            className="w-16 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-center text-sm font-semibold text-gray-900 dark:text-white focus:border-pink-300 dark:focus:border-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-800"
            aria-label={`${info.label} percentage`}
          />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">%</span>
        </div>
      </div>

      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          value={percentage}
          onChange={handleSliderChange}
          min="0"
          max="100"
          step="0.1"
          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-300 dark:focus:ring-pink-600"
          style={{
            background: `linear-gradient(to right, #FFB6C1 0%, #FFB6C1 ${percentage}%, #E5E7EB ${percentage}%, #E5E7EB 100%)`,
          }}
          aria-label={`${info.label} allocation slider`}
        />
        <style>{`
          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #FFB6C1;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            cursor: pointer;
          }
          input[type="range"]::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #FFB6C1;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            cursor: pointer;
          }
          input[type="range"]::-webkit-slider-thumb:hover {
            background: #FF9FB0;
            transform: scale(1.1);
          }
          input[type="range"]::-moz-range-thumb:hover {
            background: #FF9FB0;
            transform: scale(1.1);
          }
        `}</style>
      </div>

      {/* Progress bar visualization */}
      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-pink-400 to-pink-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
