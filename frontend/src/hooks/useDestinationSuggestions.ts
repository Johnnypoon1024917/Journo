import { useState, useEffect } from 'react';
import { DestinationSuggestion } from '../types/destination';
import { DestinationService, DestinationServiceError, DestinationServiceErrorType } from '../services/destinationService';
import { useEnhancedAuthStore } from '../stores/enhancedAuthStore';

interface UseDestinationSuggestionsOptions {
  month?: number;
  autoLoad?: boolean;
}

interface DestinationError {
  message: string;
  type: DestinationServiceErrorType;
  canRetry: boolean;
  hasCachedData: boolean;
}

export function useDestinationSuggestions(options: UseDestinationSuggestionsOptions = {}) {
  const { month, autoLoad = true } = options;
  const [suggestions, setSuggestions] = useState<DestinationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<DestinationError | null>(null);
  const [isUsingCache, setIsUsingCache] = useState(false);
  
  const { user } = useEnhancedAuthStore();

  const loadSuggestions = async (targetMonth?: number) => {
    try {
      setLoading(true);
      setError(null);
      setIsUsingCache(false);
      
      let data: DestinationSuggestion[];
      
      if (targetMonth) {
        data = await DestinationService.getSuggestionsForMonth(targetMonth);
      } else {
        data = await DestinationService.getSuggestionsForCarousel();
      }
      
      setSuggestions(data);
    } catch (err: any) {
      console.error('Error loading destination suggestions:', err);
      
      // Check if we have cached data available
      const hasCachedData = DestinationService.hasCachedSuggestions(targetMonth);
      
      // Handle DestinationServiceError with detailed information
      if (err instanceof DestinationServiceError) {
        setError({
          message: err.message,
          type: err.type,
          canRetry: err.canRetry,
          hasCachedData
        });
      } else {
        // Handle unknown errors
        setError({
          message: err.message || 'Failed to load destination suggestions',
          type: DestinationServiceErrorType.UNKNOWN_ERROR,
          canRetry: true,
          hasCachedData
        });
      }
      
      // If we got here with data, it means we're using cached fallback
      if (suggestions.length > 0) {
        setIsUsingCache(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const trackInteraction = async (suggestionId: string, interactionType: 'view' | 'click' | 'quick_plan') => {
    try {
      await DestinationService.trackInteraction(suggestionId, interactionType);
    } catch (error) {
      console.error('Error tracking interaction:', error);
      // Don't throw error for analytics
    }
  };

  const createQuickTrip = async (suggestion: DestinationSuggestion) => {
    if (!user) {
      throw new Error('Authentication required');
    }
    
    return await DestinationService.createQuickTrip(suggestion);
  };

  const refresh = () => {
    loadSuggestions(month);
  };

  const clearError = () => {
    setError(null);
  };

  useEffect(() => {
    if (autoLoad) {
      loadSuggestions(month);
    }
  }, [month, autoLoad]);

  return {
    suggestions,
    loading,
    error,
    isUsingCache,
    loadSuggestions,
    trackInteraction,
    createQuickTrip,
    refresh,
    clearError,
    isPersonalized: !!user
  };
}