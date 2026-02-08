import React, { useState, useEffect, useRef } from 'react';
import { LocationSearch, PlaceDetails } from './LocationSearch';
import { LocationScrapingService, ScrapedLocation } from '../../services/locationScrapingService';



interface PlaceSearchWithSuggestionsProps {
  value: string;
  onChange: (value: string, placeDetails?: PlaceDetails) => void;
  onPlaceSelect?: (placeDetails: PlaceDetails) => void;
  onSuggestionSelect?: (suggestion: ScrapedLocation) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  showSuggestions?: boolean;
}

export const PlaceSearchWithSuggestions: React.FC<PlaceSearchWithSuggestionsProps> = ({
  value,
  onChange,
  onPlaceSelect,
  onSuggestionSelect,
  placeholder = 'Search for a location',
  label,
  error,
  showSuggestions = true,
}) => {
  const [suggestions, setSuggestions] = useState<ScrapedLocation[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestionDropdown, setShowSuggestionDropdown] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const debounceRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search for suggestions
  useEffect(() => {
    if (!showSuggestions || !value || value.length < 2) {
      setSuggestions([]);
      setShowSuggestionDropdown(false);
      return;
    }

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new debounce
    debounceRef.current = setTimeout(async () => {
      try {
        setIsLoadingSuggestions(true);
        const results = await LocationScrapingService.searchLocations(value.trim());
        setSuggestions(results);
        setShowSuggestionDropdown(true);
        setSelectedSuggestionIndex(-1);
      } catch (error) {
        console.error('Error fetching location suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, showSuggestions]);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestionDropdown(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSuggestionClick = async (suggestion: ScrapedLocation) => {
    // Track the selection
    if (suggestion.id) {
      try {
        await LocationScrapingService.trackLocationSelection(value, suggestion.id);
      } catch (error) {
        console.error('Error tracking suggestion selection:', error);
      }
    }

    // Create PlaceDetails from suggestion
    const placeDetails: PlaceDetails = {
      address: suggestion.location_name,
      lat: suggestion.lat || 0,
      lng: suggestion.lng || 0,
      name: suggestion.location_name
    };

    // Update the input value
    onChange(suggestion.location_name, placeDetails);

    // Call callbacks
    if (onPlaceSelect) {
      onPlaceSelect(placeDetails);
    }
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }

    // Close dropdown
    setShowSuggestionDropdown(false);
    setSelectedSuggestionIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestionDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestionDropdown(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  const formatVisitorCount = (count?: number): string => {
    if (!count) return '';
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M visitors`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K visitors`;
    }
    return `${count} visitors`;
  };

  const formatRating = (rating?: number): string => {
    if (!rating) return '';
    return `★ ${rating.toFixed(1)}`;
  };

  const getSourceIcon = (source: string): string => {
    switch (source) {
      case 'tripadvisor':
        return '🏛️';
      case 'alva':
        return '📊';
      default:
        return '📍';
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <LocationSearch
        value={value}
        onChange={onChange}
        onPlaceSelect={onPlaceSelect}
        placeholder={placeholder}
        label={label}
        error={error}
      />
      
      {/* Custom keyboard handler */}
      <div
        className="absolute inset-0 pointer-events-none"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      />

      {/* Suggestions Dropdown */}
      {showSuggestions && showSuggestionDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {isLoadingSuggestions && (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span>Searching locations...</span>
              </div>
            </div>
          )}

          {!isLoadingSuggestions && suggestions.length === 0 && (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No suggestions found
            </div>
          )}

          {!isLoadingSuggestions && suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.source}-${suggestion.location_name}-${index}`}
              className={`
                p-4 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0
                hover:bg-gray-50 dark:hover:bg-gray-700
                ${selectedSuggestionIndex === index ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
              `}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setSelectedSuggestionIndex(index)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getSourceIcon(suggestion.source)}</span>
                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                      {suggestion.location_name}
                    </h4>
                  </div>
                  
                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    {suggestion.rating && (
                      <span className="flex items-center space-x-1">
                        <span>{formatRating(suggestion.rating)}</span>
                      </span>
                    )}
                    {suggestion.visitor_count && (
                      <span>{formatVisitorCount(suggestion.visitor_count)}</span>
                    )}
                    <span className="capitalize text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {suggestion.source}
                    </span>
                  </div>

                  {suggestion.tips && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {suggestion.tips}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {!isLoadingSuggestions && suggestions.length > 0 && (
            <div className="p-2 text-xs text-gray-500 dark:text-gray-400 text-center border-t border-gray-100 dark:border-gray-700">
              Use ↑↓ to navigate, Enter to select, Esc to close
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlaceSearchWithSuggestions;