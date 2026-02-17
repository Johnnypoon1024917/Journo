import React from 'react';

interface CurrencySelectorProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  label?: string;
  className?: string;
}

const COMMON_CURRENCIES = [
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'KRW', symbol: '₩', name: 'Korean Won' },
  { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
];

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  selectedCurrency,
  onCurrencyChange,
  label = 'Currency',
  className = '',
}) => {
  const selectedCurrencyInfo = COMMON_CURRENCIES.find(c => c.code === selectedCurrency);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={selectedCurrency}
          onChange={(e) => onCurrencyChange(e.target.value)}
          className="w-full appearance-none rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 sm:px-4 py-2 sm:py-3 pr-10 text-sm sm:text-base text-gray-900 dark:text-white focus:border-pink-300 dark:focus:border-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-800 transition-all duration-200 cursor-pointer hover:border-pink-200 dark:hover:border-pink-700"
          aria-label={label}
        >
          {COMMON_CURRENCIES.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.symbol} {currency.code} - {currency.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
      {selectedCurrencyInfo && (
        <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
          Selected: {selectedCurrencyInfo.symbol} {selectedCurrencyInfo.name}
        </div>
      )}
    </div>
  );
};
