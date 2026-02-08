import React, { useState } from 'react';
import { TripDayWithPlaces } from '../../types/trip';

interface DayGroupProps {
  day: TripDayWithPlaces;
  isExpanded?: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
  tripStartDate?: string | null;
}

export const DayGroup: React.FC<DayGroupProps> = ({
  day,
  isExpanded = true,
  onToggle,
  children,
  tripStartDate,
}) => {
  const [expanded, setExpanded] = useState(isExpanded);

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setExpanded(!expanded);
    }
  };

  // Calculate day statistics
  const placesCount = day.places.length;
  const totalCost = day.places.reduce((sum, place) => {
    return sum + (place.cost || 0);
  }, 0);
  
  const totalDuration = day.places.reduce((sum, place) => {
    return sum + (place.travel_time_seconds || 0);
  }, 0);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string | null): string => {
    // If day has a specific date, use it
    if (dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
    }
    
    // Otherwise, calculate from trip start date and day number
    if (tripStartDate) {
      const startDate = new Date(tripStartDate);
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + (day.day_number - 1));
      
      return dayDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
    }
    
    // Fallback if no dates available
    return `Day ${day.day_number}`;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isControlled = onToggle !== undefined;
  const isOpen = isControlled ? isExpanded : expanded;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl mb-6 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Day header */}
      <button
        className="w-full px-6 py-5 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-black focus:ring-inset"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-label={`${formatDate(day.date)} - ${placesCount} places`}
      >
        <div className="flex items-center space-x-4">
          {/* Day number circle */}
          <div className="flex-shrink-0 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-bold text-lg">
            {day.day_number}
          </div>
          
          {/* Day info */}
          <div className="text-left">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {formatDate(day.date)}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium">{placesCount} places</span>
              </div>
              
              {totalDuration > 0 && (
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{formatDuration(totalDuration)}</span>
                </div>
              )}
              
              {totalCost > 0 && (
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <span className="font-medium">{formatCurrency(totalCost)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Expand/collapse icon */}
        <div className={`flex-shrink-0 w-6 h-6 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Day content */}
      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
        <div className="border-t border-gray-100">
          {children}
        </div>
      </div>
    </div>
  );
};
