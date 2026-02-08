import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../common/Button';
import { Spinner } from '../common/Spinner';
import { ConfirmModal } from '../common/ConfirmModal';
import { Toast } from '../common/Toast';
import { tripService } from '../../services/tripService';
import { useAuth } from '../../hooks/useAuth';
import { useEnhancedAuthStore } from '../../stores/enhancedAuthStore';
import { PlaceCustomizationService } from '../../services/placeCustomizationService';
import { RegenerationMemoryService } from '../../services/regenerationMemoryService';

// Types based on design document
export interface WeatherInfo {
  date: string;
  temperature_high: number;
  temperature_low: number;
  condition: string;
  precipitation_probability: number;
  icon: string;
}

export interface SuggestedPlace {
  id: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  placeType: 'attraction' | 'food' | 'hotel' | 'transport' | 'other';
  description: string;
  estimatedDuration: number; // minutes
  estimatedCost: number;
  rating?: number;
  tips?: string;
  openingHours?: string;
  travelTimeFromPrevious?: number;
  source: 'scraping' | 'google_places' | 'user_input';
}

export interface DailySuggestions {
  dayNumber: number;
  date: string;
  weather?: WeatherInfo;
  places: SuggestedPlace[];
  totalTravelTime: number;
  estimatedCost: number;
}

export interface TravelInformation {
  destination: string;
  startDate: string;
  endDate: string;
  duration: number;
  interests: Array<{
    id: string;
    name: string;
    icon: string;
    weight: number;
  }>;
  budgetLevel: 'low' | 'medium' | 'high';
  travelStyle: 'relaxed' | 'moderate' | 'fast-paced';
  groupSize: number;
  travelerTypes: Array<{
    type: 'solo' | 'couple' | 'family' | 'friends' | 'business';
    ageGroups?: ('child' | 'teen' | 'adult' | 'senior')[];
  }>;
  mustVisitPlaces: string[];
}

interface PlaceSuggestionsPreviewProps {
  suggestions: DailySuggestions[];
  travelInfo: TravelInformation;
  onRegenerateClick: () => void;
  onPlaceRemove: (dayIndex: number, placeIndex: number) => void;
  onPlaceReplace: (dayIndex: number, placeIndex: number) => void;
  isGenerating: boolean;
  onPlaceCountChange?: (dayIndex: number, newCount: number) => void;
  onMoreLikeThis?: (dayIndex: number, placeIndex: number) => void;
  loadingMessage?: string;
  alternativeSuggestions?: { [key: string]: SuggestedPlace[] };
  onShowAlternatives?: (dayIndex: number, placeIndex: number) => void;
  onTripCreated?: (tripId: string) => void;
  onSuggestionsUpdate?: (newSuggestions: DailySuggestions[]) => void;
  sessionId?: string;
}

export function PlaceSuggestionsPreview({
  suggestions,
  travelInfo,
  onRegenerateClick,
  onPlaceRemove,
  onPlaceReplace,
  isGenerating,
  onPlaceCountChange,
  // onMoreLikeThis, // Unused parameter
  loadingMessage,
  alternativeSuggestions,
  onShowAlternatives,
  onTripCreated,
  onSuggestionsUpdate,
  sessionId
}: PlaceSuggestionsPreviewProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { accessToken } = useEnhancedAuthStore();
  
  const [removeConfirmation, setRemoveConfirmation] = useState<{
    dayIndex: number;
    placeIndex: number;
    placeName: string;
  } | null>(null);
  const [showAlternatives, setShowAlternatives] = useState<{
    dayIndex: number;
    placeIndex: number;
  } | null>(null);
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [diverseAlternatives, setDiverseAlternatives] = useState<{ [key: string]: SuggestedPlace[] }>({});
  const [regenerationOptions, setRegenerationOptions] = useState({
    showAdvanced: false,
    diversityLevel: 'medium' as 'low' | 'medium' | 'high',
    preservePreferences: true,
    modifyParameters: false
  });

  // Initialize session memory on component mount
  useEffect(() => {
    if (sessionId && user) {
      RegenerationMemoryService.initializeSession(user.id, travelInfo)
        .catch(error => console.warn('Failed to initialize session memory:', error));
    }
  }, [sessionId, user, travelInfo]);

  // Track user interactions for learning
  useEffect(() => {
    if (sessionId && suggestions.length > 0) {
      // This would be called when user interacts with places
      // For now, we'll track when suggestions change
      const interactions = suggestions.flatMap((day) => 
        day.places.map((place) => ({
          action: 'accepted' as const,
          placeId: place.id,
          timestamp: new Date().toISOString()
        }))
      );

      RegenerationMemoryService.trackSuggestionHistory(sessionId, suggestions, interactions)
        .catch(error => console.warn('Failed to track suggestion history:', error));
    }
  }, [sessionId, suggestions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPlaceTypeIcon = (type: string) => {
    const icons = {
      attraction: '🏛️',
      food: '🍽️',
      hotel: '🏨',
      transport: '🚗',
      other: '📍'
    };
    return icons[type as keyof typeof icons] || '📍';
  };

  const getWeatherIcon = (condition: string) => {
    const icons = {
      sunny: '☀️',
      cloudy: '☁️',
      rainy: '🌧️',
      snowy: '❄️',
      partly_cloudy: '⛅'
    };
    return icons[condition as keyof typeof icons] || '🌤️';
  };

  const handleRemovePlace = async (dayIndex: number, placeIndex: number) => {
    const place = suggestions[dayIndex].places[placeIndex];
    setRemoveConfirmation({
      dayIndex,
      placeIndex,
      placeName: place.name
    });
  };

  const confirmRemovePlace = async () => {
    if (removeConfirmation) {
      setIsCustomizing(true);
      
      try {
        // Use the customization service for intelligent removal
        const result = await PlaceCustomizationService.removePlace(
          removeConfirmation.dayIndex,
          removeConfirmation.placeIndex,
          suggestions,
          true // preserve preferences
        );

        // Update suggestions through callback
        if (onSuggestionsUpdate) {
          onSuggestionsUpdate(result.updatedSuggestions);
        } else {
          // Fallback to original method
          onPlaceRemove(removeConfirmation.dayIndex, removeConfirmation.placeIndex);
        }

        // Track interaction for memory system
        if (sessionId) {
          await RegenerationMemoryService.trackSuggestionHistory(sessionId, suggestions, [{
            action: 'rejected',
            placeId: suggestions[removeConfirmation.dayIndex].places[removeConfirmation.placeIndex].id,
            timestamp: new Date().toISOString()
          }]);
        }

        setToast({
          message: 'Place removed and preferences updated',
          type: 'success'
        });

      } catch (error) {
        console.error('Error removing place:', error);
        setToast({
          message: 'Failed to remove place. Please try again.',
          type: 'error'
        });
      } finally {
        setIsCustomizing(false);
        setRemoveConfirmation(null);
      }
    }
  };

  // Enhanced place replacement with alternatives
  const handleReplacePlace = async (dayIndex: number, placeIndex: number) => {
    setIsCustomizing(true);
    
    try {
      const result = await PlaceCustomizationService.replacePlace(
        dayIndex,
        placeIndex,
        suggestions,
        undefined, // Let service generate alternatives
        travelInfo
      );

      if (onSuggestionsUpdate) {
        onSuggestionsUpdate(result.updatedSuggestions);
      } else {
        onPlaceReplace(dayIndex, placeIndex);
      }

      // Show alternatives if available
      if (result.alternativePlaces && result.alternativePlaces.length > 0) {
        setDiverseAlternatives({
          [`${dayIndex}-${placeIndex}`]: result.alternativePlaces
        });
        setShowAlternatives({ dayIndex, placeIndex });
      }

      setToast({
        message: 'Place replaced with alternative option',
        type: 'success'
      });

    } catch (error) {
      console.error('Error replacing place:', error);
      setToast({
        message: 'Failed to replace place. Please try again.',
        type: 'error'
      });
    } finally {
      setIsCustomizing(false);
    }
  };

  // Enhanced "More like this" functionality
  const handleMoreLikeThis = async (dayIndex: number, placeIndex: number) => {
    if (!sessionId) {
      setToast({
        message: 'Session required for personalized suggestions',
        type: 'error'
      });
      return;
    }

    setIsCustomizing(true);
    
    try {
      const referencePlace = suggestions[dayIndex].places[placeIndex];
      
      const alternatives = await RegenerationMemoryService.generateDiverseAlternatives(
        sessionId,
        referencePlace,
        travelInfo.destination,
        'medium'
      );

      if (alternatives.length > 0) {
        setDiverseAlternatives({
          [`${dayIndex}-${placeIndex}`]: alternatives
        });
        setShowAlternatives({ dayIndex, placeIndex });
        
        setToast({
          message: `Found ${alternatives.length} similar places`,
          type: 'success'
        });
      } else {
        setToast({
          message: 'No similar places found. Try adjusting your preferences.',
          type: 'info'
        });
      }

    } catch (error) {
      console.error('Error finding similar places:', error);
      setToast({
        message: 'Failed to find similar places. Please try again.',
        type: 'error'
      });
    } finally {
      setIsCustomizing(false);
    }
  };

  // Enhanced place count adjustment
  const handlePlaceCountChangeEnhanced = async (dayIndex: number, newCount: number) => {
    if (!onPlaceCountChange) return;

    setIsCustomizing(true);
    
    try {
      const result = await PlaceCustomizationService.adjustPlaceCount(
        dayIndex,
        newCount,
        suggestions,
        travelInfo
      );

      if (onSuggestionsUpdate) {
        onSuggestionsUpdate(result.updatedSuggestions);
      } else {
        onPlaceCountChange(dayIndex, newCount);
      }

      setToast({
        message: `Updated day ${dayIndex + 1} to ${newCount} places`,
        type: 'success'
      });

    } catch (error) {
      console.error('Error adjusting place count:', error);
      setToast({
        message: 'Failed to adjust place count. Please try again.',
        type: 'error'
      });
    } finally {
      setIsCustomizing(false);
    }
  };

  // Enhanced regeneration with memory
  const handleRegenerateWithMemory = async (regenerationType: 'full' | 'partial' | 'modified_parameters' = 'full') => {
    if (!sessionId) {
      // Fallback to original regeneration
      onRegenerateClick();
      return;
    }

    setIsCustomizing(true);
    
    try {
      const result = await RegenerationMemoryService.regenerateWithMemory(sessionId, {
        travelInfo,
        currentSuggestions: suggestions,
        regenerationType,
        preservePreferences: regenerationOptions.preservePreferences,
        diversityLevel: regenerationOptions.diversityLevel
      });

      if (result.success && onSuggestionsUpdate) {
        onSuggestionsUpdate(result.newSuggestions);
        
        setToast({
          message: `Generated ${result.alternativesGenerated} new suggestions with ${Math.round(result.diversityScore * 100)}% diversity`,
          type: 'success'
        });
      } else {
        throw new Error(result.message || 'Regeneration failed');
      }

    } catch (error) {
      console.error('Error regenerating with memory:', error);
      setToast({
        message: 'Smart regeneration failed. Using basic regeneration.',
        type: 'info'
      });
      
      // Fallback to original regeneration
      onRegenerateClick();
    } finally {
      setIsCustomizing(false);
    }
  };

  const handleCreateTrip = async () => {
    if (!user || !accessToken) {
      setToast({
        message: 'Please log in to create a trip',
        type: 'error'
      });
      return;
    }

    if (suggestions.length === 0) {
      setToast({
        message: 'No suggestions available to create a trip',
        type: 'error'
      });
      return;
    }

    setIsCreatingTrip(true);
    
    try {
      const response = await tripService.createTripFromSuggestions(
        travelInfo,
        suggestions,
        accessToken
      );

      if (response.success) {
        setToast({
          message: 'Trip created successfully! Redirecting...',
          type: 'success'
        });

        // Call the callback if provided
        if (onTripCreated) {
          onTripCreated(response.data.tripId);
        }

        // Navigate to the trip detail page after a short delay
        setTimeout(() => {
          navigate(`/trip/${response.data.tripId}`);
        }, 1500);
      } else {
        setToast({
          message: response.message || 'Failed to create trip. Please try again.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error creating trip:', error);
      setToast({
        message: 'Failed to create trip. Please check your connection and try again.',
        type: 'error'
      });
    } finally {
      setIsCreatingTrip(false);
    }
  };

  const totalCost = suggestions.reduce((sum, day) => sum + day.estimatedCost, 0);
  const totalPlaces = suggestions.reduce((sum, day) => sum + day.places.length, 0);
  const totalTravelTime = suggestions.reduce((sum, day) => sum + day.totalTravelTime, 0);

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Spinner size="large" />
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {loadingMessage || 'Generating Your Perfect Itinerary'}
          </h3>
          <p className="text-gray-600">
            {loadingMessage ? 
              `Processing your request for ${travelInfo.destination}...` :
              `Finding the best places in ${travelInfo.destination}...`
            }
          </p>
          <div className="mt-4 text-sm text-gray-500">
            This may take a few moments while we optimize your route and find the perfect places.
          </div>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🗺️</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No suggestions found
        </h3>
        <p className="text-gray-600 mb-6">
          We couldn't find suitable places for your criteria. Try adjusting your preferences or choosing a different destination.
        </p>
        <Button variant="secondary" onClick={onRegenerateClick}>
          Try Different Settings
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Your {travelInfo.duration}-Day {travelInfo.destination} Itinerary
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{totalPlaces}</div>
            <div className="text-sm text-gray-600">Places to Visit</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalCost)}</div>
            <div className="text-sm text-gray-600">Estimated Cost</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">{formatDuration(totalTravelTime)}</div>
            <div className="text-sm text-gray-600">Total Travel Time</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600">{travelInfo.travelStyle}</div>
            <div className="text-sm text-gray-600">Travel Style</div>
          </div>
        </div>
      </div>

      {/* Daily Suggestions */}
      <div className="space-y-6">
        {suggestions.map((day, dayIndex) => (
          <div key={day.dayNumber} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Day Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    Day {day.dayNumber} - {formatDate(day.date)}
                  </h4>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                    <span>{day.places.length} places</span>
                    <span>{formatDuration(day.totalTravelTime)} travel</span>
                    <span>{formatCurrency(day.estimatedCost)} estimated</span>
                  </div>
                </div>
                
                {day.weather && (
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-xl">{getWeatherIcon(day.weather.condition)}</span>
                    <div className="text-right">
                      <div className="font-medium">
                        {day.weather.temperature_high}°/{day.weather.temperature_low}°
                      </div>
                      <div className="text-gray-500 capitalize">
                        {day.weather.condition}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Place Count Adjustment */}
              {onPlaceCountChange && (
                <div className="mt-3 flex items-center space-x-3">
                  <span className="text-sm text-gray-600">Places per day:</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePlaceCountChangeEnhanced(dayIndex, Math.max(1, day.places.length - 1))}
                      className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                      disabled={day.places.length <= 1 || isCustomizing}
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium">{day.places.length}</span>
                    <button
                      onClick={() => handlePlaceCountChangeEnhanced(dayIndex, day.places.length + 1)}
                      className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                      disabled={day.places.length >= 10 || isCustomizing}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Places List */}
            <div className="divide-y divide-gray-100">
              {day.places.map((place, placeIndex) => (
                <div key={place.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">{getPlaceTypeIcon(place.placeType)}</span>
                        <div>
                          <h5 className="font-semibold text-gray-900">{place.name}</h5>
                          <p className="text-sm text-gray-600">{place.address}</p>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-3 text-sm leading-relaxed">
                        {place.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <span>⏱️</span>
                          <span>{formatDuration(place.estimatedDuration)}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <span>💰</span>
                          <span>{formatCurrency(place.estimatedCost)}</span>
                        </div>

                        {place.rating && (
                          <div className="flex items-center space-x-1">
                            <span>⭐</span>
                            <span>{place.rating.toFixed(1)}</span>
                          </div>
                        )}

                        {place.travelTimeFromPrevious && place.travelTimeFromPrevious > 0 && (
                          <div className="flex items-center space-x-1">
                            <span>🚶</span>
                            <span>{formatDuration(place.travelTimeFromPrevious)} from previous</span>
                          </div>
                        )}

                        <div className="flex items-center space-x-1">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          <span className="capitalize">{place.source.replace('_', ' ')}</span>
                        </div>
                      </div>

                      {place.tips && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <span className="text-yellow-600 mt-0.5">💡</span>
                            <p className="text-sm text-yellow-800">{place.tips}</p>
                          </div>
                        </div>
                      )}

                      {place.openingHours && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Hours:</span> {place.openingHours}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2 ml-4">
                      <button
                        onClick={() => handleRemovePlace(dayIndex, placeIndex)}
                        className="px-3 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors"
                        disabled={isCustomizing}
                      >
                        Remove
                      </button>
                      
                      <button
                        onClick={() => handleReplacePlace(dayIndex, placeIndex)}
                        className="px-3 py-1 text-xs text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                        disabled={isCustomizing}
                      >
                        Replace
                      </button>

                      {onShowAlternatives && (
                        <button
                          onClick={() => {
                            setShowAlternatives({ dayIndex, placeIndex });
                            onShowAlternatives(dayIndex, placeIndex);
                          }}
                          className="px-3 py-1 text-xs text-purple-600 border border-purple-200 rounded hover:bg-purple-50 transition-colors"
                          disabled={isCustomizing}
                        >
                          Alternatives
                        </button>
                      )}

                      <button
                        onClick={() => handleMoreLikeThis(dayIndex, placeIndex)}
                        className="px-3 py-1 text-xs text-green-600 border border-green-200 rounded hover:bg-green-50 transition-colors"
                        disabled={isCustomizing}
                      >
                        More like this
                      </button>
                    </div>
                  </div>

                  {/* Alternative Suggestions */}
                  {showAlternatives?.dayIndex === dayIndex && 
                   showAlternatives?.placeIndex === placeIndex && 
                   (alternativeSuggestions?.[`${dayIndex}-${placeIndex}`] || diverseAlternatives?.[`${dayIndex}-${placeIndex}`]) && (
                    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h6 className="font-medium text-gray-900">Alternative Options</h6>
                        <button
                          onClick={() => setShowAlternatives(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          ×
                        </button>
                      </div>
                      <div className="space-y-3">
                        {(diverseAlternatives[`${dayIndex}-${placeIndex}`] || alternativeSuggestions?.[`${dayIndex}-${placeIndex}`] || []).map((altPlace) => (
                          <div key={altPlace.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-lg">{getPlaceTypeIcon(altPlace.placeType)}</span>
                                <span className="font-medium text-sm">{altPlace.name}</span>
                                {altPlace.source === 'google_places' && (
                                  <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                                    Smart Match
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mb-2">{altPlace.description}</p>
                              <div className="flex items-center space-x-3 text-xs text-gray-500">
                                <span>⏱️ {formatDuration(altPlace.estimatedDuration)}</span>
                                <span>💰 {formatCurrency(altPlace.estimatedCost)}</span>
                                {altPlace.rating && <span>⭐ {altPlace.rating.toFixed(1)}</span>}
                              </div>
                            </div>
                            <button
                              onClick={async () => {
                                setIsCustomizing(true);
                                try {
                                  const result = await PlaceCustomizationService.replacePlace(
                                    dayIndex,
                                    placeIndex,
                                    suggestions,
                                    altPlace,
                                    travelInfo
                                  );
                                  
                                  if (onSuggestionsUpdate) {
                                    onSuggestionsUpdate(result.updatedSuggestions);
                                  } else {
                                    onPlaceReplace(dayIndex, placeIndex);
                                  }
                                  
                                  setShowAlternatives(null);
                                  setToast({
                                    message: 'Place replaced successfully',
                                    type: 'success'
                                  });
                                } catch (error) {
                                  setToast({
                                    message: 'Failed to replace place',
                                    type: 'error'
                                  });
                                } finally {
                                  setIsCustomizing(false);
                                }
                              }}
                              className="ml-3 px-3 py-1 text-xs text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                              disabled={isCustomizing}
                            >
                              {isCustomizing ? 'Replacing...' : 'Use This'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="space-y-4 pt-6 border-t border-gray-200">
        {/* Regeneration Options */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Customization Options</h4>
            <button
              onClick={() => setRegenerationOptions(prev => ({ ...prev, showAdvanced: !prev.showAdvanced }))}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {regenerationOptions.showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
            </button>
          </div>
          
          {regenerationOptions.showAdvanced && (
            <div className="mb-4 p-3 bg-white rounded border space-y-3">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={regenerationOptions.preservePreferences}
                    onChange={(e) => setRegenerationOptions(prev => ({ ...prev, preservePreferences: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Remember my preferences</span>
                </label>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Diversity:</span>
                  <select
                    value={regenerationOptions.diversityLevel}
                    onChange={(e) => setRegenerationOptions(prev => ({ ...prev, diversityLevel: e.target.value as any }))}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="low">Similar</option>
                    <option value="medium">Balanced</option>
                    <option value="high">Very Different</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              variant="secondary"
              onClick={() => handleRegenerateWithMemory('full')}
              disabled={isGenerating || isCustomizing}
              className="flex items-center justify-center space-x-2"
            >
              {isCustomizing ? <Spinner size="small" /> : <span>🔄</span>}
              <span>Smart Regenerate</span>
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => handleRegenerateWithMemory('partial')}
              disabled={isGenerating || isCustomizing}
              className="flex items-center justify-center space-x-2"
            >
              {isCustomizing ? <Spinner size="small" /> : <span>🎯</span>}
              <span>Refine Current</span>
            </Button>
            
            <Button
              variant="secondary"
              onClick={onRegenerateClick}
              disabled={isGenerating || isCustomizing}
              className="flex items-center justify-center space-x-2"
            >
              <span>🆕</span>
              <span>Fresh Start</span>
            </Button>
          </div>
          
          <div className="mt-3 text-sm text-gray-600 space-y-1">
            <p>• <strong>Smart Regenerate:</strong> Learns from your preferences and avoids rejected places</p>
            <p>• <strong>Refine Current:</strong> Keeps good places and improves others</p>
            <p>• <strong>Fresh Start:</strong> Completely new suggestions without memory</p>
          </div>
        </div>

        {/* Trip Generation */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="primary"
            onClick={handleCreateTrip}
            disabled={isGenerating || isCreatingTrip || suggestions.length === 0}
            className="flex-1 flex items-center justify-center space-x-2"
          >
            {isCreatingTrip ? (
              <>
                <Spinner size="small" />
                <span>Creating Trip...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>Generate Trip</span>
              </>
            )}
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="text-center text-sm text-gray-600">
          Ready to create your {travelInfo.duration}-day trip to {travelInfo.destination}?
          <br />
          You can always customize places, times, and details after creation.
        </div>
      </div>

      {/* Remove Confirmation Modal */}
      <ConfirmModal
        isOpen={!!removeConfirmation}
        onClose={() => setRemoveConfirmation(null)}
        onConfirm={confirmRemovePlace}
        title="Remove Place"
        message={`Are you sure you want to remove "${removeConfirmation?.placeName}" from your itinerary?`}
        confirmText="Remove"
        cancelText="Keep"
        variant="danger"
      />

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}