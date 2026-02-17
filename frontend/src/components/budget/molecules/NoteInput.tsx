import React, { useState } from 'react';

interface NoteInputProps {
  value: string;
  onChange: (note: string) => void;
  error?: string;
  label?: string;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  className?: string;
}

export const NoteInput: React.FC<NoteInputProps> = ({
  value,
  onChange,
  error,
  label = 'Note',
  placeholder = 'Add a note (optional)',
  maxLength = 200,
  rows = 3,
  className = '',
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const characterCount = value.length;
  const isNearLimit = characterCount > maxLength * 0.8;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor="note-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
          <span className={`text-xs ${
            isNearLimit 
              ? 'text-yellow-600 dark:text-yellow-400 font-medium' 
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            {characterCount}/{maxLength}
          </span>
        </div>
      )}
      <div className="relative">
        <textarea
          id="note-input"
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          className={`w-full rounded-xl border-2 ${
            error
              ? 'border-red-300 dark:border-red-700 focus:border-red-400 dark:focus:border-red-600 focus:ring-red-200 dark:focus:ring-red-800'
              : isFocused || value
              ? 'border-pink-300 dark:border-pink-700 focus:border-pink-400 dark:focus:border-pink-600 focus:ring-pink-200 dark:focus:ring-pink-800'
              : 'border-gray-200 dark:border-gray-700 focus:border-pink-300 dark:focus:border-pink-600 focus:ring-pink-200 dark:focus:ring-pink-800'
          } bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all duration-200 resize-none`}
          aria-invalid={!!error}
          aria-describedby={error ? 'note-error' : undefined}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-3 right-3 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            aria-label="Clear note"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
      {error && (
        <p id="note-error" className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
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
