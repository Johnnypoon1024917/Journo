import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, MapPinIcon, SunIcon } from '@heroicons/react/24/outline';
import { useDestinationSuggestions } from '../../features/ai/useDestinationSuggestions';
import { useEnhancedAuthStore } from '../../stores/enhancedAuthStore';
import { useNavigate } from 'react-router-dom';

interface DestinationCarouselProps {
  className?: string;
}

export function DestinationCarousel({ className = '' }: DestinationCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const { user } = useEnhancedAuthStore();
  const navigate = useNavigate();
  
  const {
    suggestions,
    loading,
    error,
    trackInteraction,
    createQuickTrip,
    refresh,
    isPersonalized
  } = useDestinationSuggestions();

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? suggestions.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === suggestions.length - 1 ? 0 : prev + 1));
  };

  const handleSuggestionClick = async (suggestion: any) => {
    // Track click interaction
    await trackInteraction(suggestion.id, 'click');
  };

  const handleQuickPlan = async (suggestion: any, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const result = await createQuickTrip(suggestion);
      // TODO: Show success toast
      navigate(`/trip/${result.tripId}`);
    } catch (error) {
      console.error('Error creating quick trip:', error);
      // TODO: Show error toast
    }
  };

  const handleWhyNow = (suggestion: any, event: React.MouseEvent) => {
    event.stopPropagation();
    // TODO: Show modal with detailed why_now information
    alert(suggestion.why_now || 'Perfect time to visit!');
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || suggestions.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Discover Your Next Adventure
        </h2>
        <div className="text-center py-8">
          <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {/* @ts-ignore - error type mismatch */}
            {error || 'No destination suggestions available'}
          </p>
          {error && (
            <button
              onClick={refresh}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  const currentSuggestion = suggestions[currentIndex];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Discover Your Next Adventure
          </h2>
          {isPersonalized && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
              Personalized
            </span>
          )}
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {isPersonalized 
            ? 'Curated based on your travel preferences and history'
            : 'Handpicked destinations perfect for this time of year'
          }
        </p>
      </div>

      {/* Carousel */}
      <div className="relative">
        {/* Main Image and Content */}
        <div 
          className="relative h-64 cursor-pointer overflow-hidden"
          onClick={() => handleSuggestionClick(currentSuggestion)}
        >
          {/* Background Image or Gradient */}
          {currentSuggestion.image_url ? (
            <img 
              src={currentSuggestion.image_url} 
              alt={currentSuggestion.destination_name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"></div>
          )}
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          
          {/* Content */}
          <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
            <div className="mb-4">
              <h3 className="text-2xl font-bold mb-2">
                {currentSuggestion.destination_name}
              </h3>
              <div className="flex items-center space-x-4 text-sm mb-3">
                <div className="flex items-center">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  {currentSuggestion.country}
                </div>
                {currentSuggestion.temperature_avg && (
                  <div className="flex items-center">
                    <SunIcon className="h-4 w-4 mr-1" />
                    {currentSuggestion.temperature_avg}°C
                  </div>
                )}
                {currentSuggestion.weather_condition && (
                  <span className="px-2 py-1 bg-white bg-opacity-20 rounded text-xs">
                    {currentSuggestion.weather_condition}
                  </span>
                )}
              </div>
              {currentSuggestion.why_now && (
                <p className="text-sm opacity-90 line-clamp-2">
                  {currentSuggestion.why_now}
                </p>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={(e) => handleQuickPlan(currentSuggestion, e)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Quick Plan
              </button>
              {currentSuggestion.why_now && (
                <button
                  onClick={(e) => handleWhyNow(currentSuggestion, e)}
                  className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Why Now?
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {suggestions.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-colors"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Dots Indicator */}
      {suggestions.length > 1 && (
        <div className="flex justify-center space-x-2 p-4">
          {suggestions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex
                  ? 'bg-blue-600'
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}