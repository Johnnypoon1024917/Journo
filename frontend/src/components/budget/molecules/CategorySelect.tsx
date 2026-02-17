import React from 'react';
import { BudgetCategory } from '../../../types/trip';

interface CategorySelectProps {
  value: BudgetCategory | '';
  onChange: (category: BudgetCategory) => void;
  error?: string;
  label?: string;
  required?: boolean;
  className?: string;
}

const CATEGORY_OPTIONS: Array<{ value: BudgetCategory; emoji: string; label: string; color: string }> = [
  { value: 'flights', emoji: '✈️', label: 'Flights', color: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300' },
  { value: 'accommodation', emoji: '🏨', label: 'Accommodation', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
  { value: 'food', emoji: '🍜', label: 'Food', color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300' },
  { value: 'transport', emoji: '🚇', label: 'Transport', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
  { value: 'activities', emoji: '🎭', label: 'Activities', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' },
  { value: 'shopping', emoji: '🛍️', label: 'Shopping', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' },
  { value: 'misc', emoji: '📦', label: 'Miscellaneous', color: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300' },
];

export const CategorySelect: React.FC<CategorySelectProps> = ({
  value,
  onChange,
  error,
  label = 'Category',
  required = false,
  className = '',
}) => {
  const selectedCategory = CATEGORY_OPTIONS.find(cat => cat.value === value);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value as BudgetCategory;
    if (newValue) {
      onChange(newValue);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {selectedCategory && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <span className="text-2xl">{selectedCategory.emoji}</span>
          </div>
        )}
        <select
          value={value}
          onChange={handleChange}
          className={`w-full rounded-xl border-2 ${
            error
              ? 'border-red-300 dark:border-red-700 focus:border-red-400 dark:focus:border-red-600 focus:ring-red-200 dark:focus:ring-red-800'
              : value
              ? 'border-green-300 dark:border-green-700 focus:border-green-400 dark:focus:border-green-600 focus:ring-green-200 dark:focus:ring-green-800'
              : 'border-gray-200 dark:border-gray-700 focus:border-pink-300 dark:focus:border-pink-600 focus:ring-pink-200 dark:focus:ring-pink-800'
          } bg-white dark:bg-gray-800 ${
            selectedCategory ? 'pl-14' : 'pl-4'
          } pr-10 py-3 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 transition-all duration-200 appearance-none cursor-pointer`}
          aria-label={label}
          aria-invalid={!!error}
          aria-describedby={error ? 'category-error' : undefined}
          aria-required={required}
        >
          <option value="">Select a category...</option>
          {CATEGORY_OPTIONS.map((category) => (
            <option key={category.value} value={category.value}>
              {category.emoji} {category.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <p id="category-error" className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
      {!error && value && (
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full ${selectedCategory?.color} text-sm font-medium`}>
            {selectedCategory?.emoji} {selectedCategory?.label}
          </span>
        </div>
      )}
    </div>
  );
};
