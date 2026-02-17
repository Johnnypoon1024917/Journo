import React from 'react';
import { useFABPosition, getFABStyle } from '../../../hooks/useFABPosition';
import { useLocation } from 'react-router-dom';

interface FloatingAddButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export const FloatingAddButton: React.FC<FloatingAddButtonProps> = ({
  onClick,
  label = 'Add Expense',
  className = '',
}) => {
  const location = useLocation();
  const hasBottomNav = location.pathname.includes('/trips/');
  
  // Budget FAB is primary action at index 1 (same as schedule page)
  const fabPosition = useFABPosition({ type: 'primary', index: 1, hasBottomNav });
  
  return (
    <button
      onClick={onClick}
      style={getFABStyle(fabPosition)}
      className={`
        w-14 h-14 md:w-16 md:h-16
        bg-gradient-to-br from-pink-500 to-pink-600
        text-white rounded-full
        shadow-lg hover:shadow-xl
        transition-all duration-200 ease-out
        hover:scale-110 active:scale-95
        flex items-center justify-center
        touch-manipulation tap-highlight-transparent
        group
        ${className}
      `}
      aria-label={label}
      title={label}
    >
      <svg
        className="w-6 h-6 md:w-7 md:h-7 transition-transform duration-200 group-hover:rotate-90"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M12 4v16m8-8H4"
        />
      </svg>
      
      {/* Ripple effect on click */}
      <span className="absolute inset-0 rounded-full bg-white opacity-0 group-active:opacity-20 transition-opacity duration-150" />
    </button>
  );
};
