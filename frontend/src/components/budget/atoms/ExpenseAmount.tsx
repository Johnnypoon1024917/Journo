import React from 'react';
import { getCurrencySymbol } from '../../../constants/currencies';

interface ExpenseAmountProps {
  amount: number;
  currency: string;
  homeCurrency?: string;
  homeAmount?: number;
  size?: 'sm' | 'md' | 'lg';
  showBothCurrencies?: boolean;
  className?: string;
}

export const ExpenseAmount: React.FC<ExpenseAmountProps> = ({
  amount,
  currency,
  homeCurrency,
  homeAmount,
  size = 'md',
  showBothCurrencies = true,
  className = '',
}) => {
  const currencySymbol = getCurrencySymbol(currency);
  const homeCurrencySymbol = homeCurrency ? getCurrencySymbol(homeCurrency) : null;
  const showDualCurrency = showBothCurrencies && homeCurrency && currency !== homeCurrency && homeAmount !== undefined;

  const sizeStyles = {
    sm: {
      primary: 'text-base font-semibold',
      secondary: 'text-xs',
    },
    md: {
      primary: 'text-xl font-bold',
      secondary: 'text-sm',
    },
    lg: {
      primary: 'text-2xl font-bold',
      secondary: 'text-base',
    },
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div className={`${sizeStyles[size].primary} text-gray-900 dark:text-white`}>
        {currencySymbol}{amount.toFixed(2)}
      </div>
      {showDualCurrency && homeCurrencySymbol && (
        <div className={`${sizeStyles[size].secondary} text-gray-500 dark:text-gray-400`}>
          ≈ {homeCurrencySymbol}{homeAmount.toFixed(2)}
        </div>
      )}
    </div>
  );
};
