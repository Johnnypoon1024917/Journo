import React from 'react';

interface TripTitleProps {
  title: string;
  className?: string;
}

export const TripTitle: React.FC<TripTitleProps> = ({ title, className = '' }) => {
  return (
    <h1 
      className={`text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate ${className}`}
      title={title}
    >
      {title}
    </h1>
  );
};
