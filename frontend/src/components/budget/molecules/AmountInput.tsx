import React, { useState, useEffect } from 'react';

interface AmountInputProps {
  value: number;
  currency: string;
  onChange: (value: number) => void;
  onBlur?: () => void;
  error?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export const AmountInput: React.FC<AmountInputProps> = ({
  value,
  currency,
  onChange,
  onBlur,
  error,
  label = 'Amount',
  placeholder = '0.00',
  required = false,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState(value > 0 ? value.toString() : '');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setInputValue(value > 0 ? value.toString() : '');
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Allow empty input
    if (newValue === '') {
      setInputValue('');
      onChange(0);
      return;
    }

    // Allow decimal point and numbers only
    if (!/^\d*\.?\d{0,2}$/.test(newValue)) {
      return;
    }

    setInputValue(newValue);

    // Parse and validate
    const parsed = parseFloat(newValue);
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    // Format the value on blur
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed) && parsed > 0) {
      setInputValue(parsed.toFixed(2));
      onChange(parsed);
    } else if (inputValue === '' || parsed === 0) {
      setInputValue('');
      onChange(0);
    }
    
    onBlur?.();
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const isValid = !error && parseFloat(inputValue) > 0;
  const isEmpty = inputValue === '' || parseFloat(inputValue) === 0;

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
          <span className="text-gray-500 dark:text-gray-400 font-medium">
            {currency}
          </span>
        </div>
        <input
          type="text"
          inputMode="decimal"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={`w-full rounded-xl border-2 ${
            error
              ? 'border-red-300 dark:border-red-700 focus:border-red-400 dark:focus:border-red-600 focus:ring-red-200 dark:focus:ring-red-800'
              : isValid
              ? 'border-green-300 dark:border-green-700 focus:border-green-400 dark:focus:border-green-600 focus:ring-green-200 dark:focus:ring-green-800'
              : 'border-gray-200 dark:border-gray-700 focus:border-pink-300 dark:focus:border-pink-600 focus:ring-pink-200 dark:focus:ring-pink-800'
          } bg-white dark:bg-gray-800 pl-16 pr-12 py-3 text-gray-900 dark:text-white text-lg font-semibold focus:outline-none focus:ring-2 transition-all duration-200`}
          aria-label={label}
          aria-invalid={!!error}
          aria-describedby={error ? 'amount-error' : undefined}
          aria-required={required}
        />
        {!isEmpty && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-4">
            {error ? (
              <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            ) : isValid ? (
              <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : null}
          </div>
        )}
      </div>
      {error && (
        <p id="amount-error" className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
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
    </div>
  );
};
