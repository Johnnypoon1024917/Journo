import React, { useEffect, useRef, useState } from 'react';

interface LocationSearchProps {
  value: string;
  onChange: (value: string, placeDetails?: PlaceDetails) => void;
  onPlaceSelect?: (placeDetails: PlaceDetails) => void;
  placeholder?: string;
  label?: string;
  error?: string;
}

export interface PlaceDetails {
  address: string;
  lat: number;
  lng: number;
  name?: string;
}

export const LocationSearch: React.FC<LocationSearchProps> = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder = 'Search for a location',
  label,
  error,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [useNewElement, setUseNewElement] = useState(false);

  useEffect(() => {
    // Check if Google Maps is loaded
    if (typeof google !== 'undefined' && google.maps && google.maps.places) {
      setIsLoaded(true);
      // Check if the new PlaceAutocompleteElement is available
      setUseNewElement(!!google.maps.places.PlaceAutocompleteElement);
    } else {
      // Wait for Google Maps to load
      const checkGoogleMaps = setInterval(() => {
        if (typeof google !== 'undefined' && google.maps && google.maps.places) {
          setIsLoaded(true);
          setUseNewElement(!!google.maps.places.PlaceAutocompleteElement);
          clearInterval(checkGoogleMaps);
        }
      }, 100);

      return () => clearInterval(checkGoogleMaps);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    // Use the legacy Autocomplete for now (it still works and is more stable)
    // The warning is just informational - the API will continue to work
    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      fields: ['formatted_address', 'geometry', 'name', 'place_id'],
    });

    // Listen for place selection
    const listener = autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();

      if (place && place.geometry && place.geometry.location) {
        const placeDetails: PlaceDetails = {
          address: place.formatted_address || '',
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          name: place.name,
        };

        onChange(place.formatted_address || '', placeDetails);
        
        if (onPlaceSelect) {
          onPlaceSelect(placeDetails);
        }
      }
    });

    // Add a global click listener to handle autocomplete dropdown clicks
    const handleGlobalClick = (e: Event) => {
      const target = e.target as HTMLElement;
      // Check if the click is on a pac-item (Google Maps autocomplete item)
      if (target && target.closest('.pac-item')) {
        // Prevent the default behavior and let Google Maps handle it
        e.stopPropagation();
      }
    };

    // Add the listener to the document
    document.addEventListener('click', handleGlobalClick, true);

    // Also add mousedown listener to ensure proper selection
    const handleMouseDown = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && target.closest('.pac-item')) {
        // Allow the mousedown event to proceed normally
        e.stopPropagation();
      }
    };

    document.addEventListener('mousedown', handleMouseDown, true);

    return () => {
      if (listener) {
        google.maps.event.removeListener(listener);
      }
      document.removeEventListener('click', handleGlobalClick, true);
      document.removeEventListener('mousedown', handleMouseDown, true);
    };
  }, [isLoaded, onChange, onPlaceSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle Enter key to prevent form submission during autocomplete
    if (e.key === 'Enter') {
      // If there's an active autocomplete dropdown, let it handle the Enter key
      if (document.querySelector('.pac-container:not([style*="display: none"])')) {
        e.preventDefault();
      }
    }
  };

  return (
    <div className="location-search">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={`
            w-full px-3 py-2 pl-10 border rounded-lg min-h-touch
            bg-white text-gray-900
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500
            dark:bg-gray-800 dark:border-gray-600 dark:text-white
            ${error ? 'border-red-600 dark:border-red-500' : 'border-gray-400 dark:border-gray-500'}
          `}
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 8.5C9.38071 8.5 10.5 7.38071 10.5 6C10.5 4.61929 9.38071 3.5 8 3.5C6.61929 3.5 5.5 4.61929 5.5 6C5.5 7.38071 6.61929 8.5 8 8.5Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8 14.5C10 11.5 13 9.41421 13 6.5C13 3.73858 10.7614 1.5 8 1.5C5.23858 1.5 3 3.73858 3 6.5C3 9.41421 6 11.5 8 14.5Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-700 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {!isLoaded && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Loading location search...
        </p>
      )}
      {isLoaded && useNewElement && (
        <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
          ℹ️ Using Google Maps Places API (legacy mode - still fully supported)
        </p>
      )}
      
      <style>{`
        /* Improve Google Maps Autocomplete dropdown behavior */
        .pac-container {
          z-index: 9999 !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
          border: 1px solid #e5e7eb !important;
          margin-top: 4px !important;
        }
        
        .pac-item {
          padding: 12px 16px !important;
          cursor: pointer !important;
          border-bottom: 1px solid #f3f4f6 !important;
          user-select: none !important;
        }
        
        .pac-item:hover {
          background-color: #f9fafb !important;
        }
        
        .pac-item-selected,
        .pac-item:active {
          background-color: #eff6ff !important;
        }
        
        .pac-matched {
          font-weight: 600 !important;
          color: #2563eb !important;
        }
        
        /* Ensure dropdown items are properly clickable */
        .pac-container {
          pointer-events: auto !important;
        }
        
        .pac-item {
          pointer-events: auto !important;
        }
        
        .pac-item span {
          pointer-events: none !important;
        }
      `}</style>
    </div>
  );
};
