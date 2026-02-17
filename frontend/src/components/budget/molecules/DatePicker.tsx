import React from 'react';

interface DatePickerProps {
  value: string; // ISO date string
  onChange: (date: string) => void;
  error?: string;
  label?: string;
  required?: boolean;
  min?: string; // ISO date string
  max?: string; // ISO date string
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  error,
  label = 'Date',
  required = false,
  min,
  max,
  className = '',
}) => {
  // Convert ISO string to YYYY-MM-DD format for input
  const formatDateForInput = (isoString: string): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const formatted = date.toISOString().split('T')[0];
    console.log('DatePicker - formatDateForInput:', { isoString, date, formatted });
    return formatted;
  };

  // Convert YYYY-MM-DD to ISO string
  const formatDateToISO = (dateString: string): string => {
    if (!dateString) return '';
    const isoString = new Date(dateString).toISOString();
    console.log('DatePicker - formatDateToISO:', { dateString, isoString });
    return isoString;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue) {
      onChange(formatDateToISO(newValue));
    }
  };

  const formatDisplayDate = (isoString: string): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const inputValue = formatDateForInput(value);
  const isValid = !error && value;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <input
          type="date"
          value={inputValue}
          onChange={handleChange}
          min={min ? formatDateForInput(min) : undefined}
          max={max ? formatDateForInput(max) : undefined}
          className={`w-full rounded-xl border-2 ${
            error
              ? 'border-red-300 dark:border-red-700 focus:border-red-400 dark:focus:border-red-600 focus:ring-red-200 dark:focus:ring-red-800'
              : isValid
              ? 'border-green-300 dark:border-green-700 focus:border-green-400 dark:focus:border-green-600 focus:ring-green-200 dark:focus:ring-green-800'
              : 'border-gray-200 dark:border-gray-700 focus:border-pink-300 dark:focus:border-pink-600 focus:ring-pink-200 dark:focus:ring-pink-800'
          } bg-white dark:bg-gray-800 pl-12 pr-4 py-3 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 transition-all duration-200 cursor-pointer`}
          aria-label={label}
          aria-invalid={!!error}
          aria-describedby={error ? 'date-error' : undefined}
          aria-required={required}
        />
        {isValid && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>
      {error && (
        <p id="date-error" className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
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
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatDisplayDate(value)}
        </p>
      )}
    </div>
  );
};
