import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  icon,
  variant = 'default',
  className = '',
}) => {
  const variantStyles = {
    default: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    danger: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  };

  const textStyles = {
    default: 'text-gray-900 dark:text-white',
    success: 'text-green-700 dark:text-green-300',
    warning: 'text-yellow-700 dark:text-yellow-300',
    danger: 'text-red-700 dark:text-red-300',
  };

  return (
    <div
      className={`rounded-2xl border-2 ${variantStyles[variant]} p-2 sm:p-4 space-y-1 sm:space-y-2 transition-all duration-200 hover:shadow-md ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{label}</span>
        {icon && <span className="text-gray-500 dark:text-gray-400">{icon}</span>}
      </div>
      <div className={`text-lg sm:text-2xl font-bold ${textStyles[variant]}`}>
        {value}
      </div>
      {subValue && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {subValue}
        </div>
      )}
    </div>
  );
};
