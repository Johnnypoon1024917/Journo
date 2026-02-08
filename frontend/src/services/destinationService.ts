import api from './api';
import { getAuthToken } from '../utils/auth';
import { DestinationSuggestion, SuggestionInteractionType, PersonalizedSuggestions } from '../types/destination';

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

// Service error types
export enum DestinationServiceErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class DestinationServiceError extends Error {
  constructor(
    message: string,
    public type: DestinationServiceErrorType,
    public originalError?: any,
    public canRetry: boolean = true
  ) {
    super(message);
    this.name = 'DestinationServiceError';
  }
}

export class DestinationService {
  private static cache = new Map<string, { data: DestinationSuggestion[]; timestamp: number }>();
  private static CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  
  // Retry configuration
  private static retryConfig: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffMultiplier: 2
  };

  /**
   * Retry a function with exponential backoff
   * Implements Requirements 3.1: Exponential backoff retry mechanism
   */
  private static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    operationName: string = 'operation'
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on authentication errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw new DestinationServiceError(
            'Authentication required',
            DestinationServiceErrorType.AUTHENTICATION_ERROR,
            error,
            false
          );
        }
        
        // If this was the last attempt, throw the error
        if (attempt === this.retryConfig.maxRetries) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt),
          this.retryConfig.maxDelay
        );
        
        console.log(`${operationName} failed (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}), retrying in ${delay}ms...`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // All retries failed, classify and throw error
    throw this.classifyError(lastError);
  }

  /**
   * Classify errors into specific types for better handling
   */
  private static classifyError(error: any): DestinationServiceError {
    // Network errors
    if (!error.response && (error.message?.includes('network') || error.message?.includes('fetch'))) {
      return new DestinationServiceError(
        'Network connection failed. Please check your internet connection.',
        DestinationServiceErrorType.NETWORK_ERROR,
        error,
        true
      );
    }
    
    // Service unavailable
    if (error.response?.status === 503 || error.response?.status === 502) {
      return new DestinationServiceError(
        'Destination service is temporarily unavailable. Please try again later.',
        DestinationServiceErrorType.SERVICE_UNAVAILABLE,
        error,
        true
      );
    }
    
    // Authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      return new DestinationServiceError(
        'Authentication required to access destination suggestions.',
        DestinationServiceErrorType.AUTHENTICATION_ERROR,
        error,
        false
      );
    }
    
    // Unknown errors
    return new DestinationServiceError(
      error.message || 'An unexpected error occurred while fetching destination suggestions.',
      DestinationServiceErrorType.UNKNOWN_ERROR,
      error,
      true
    );
  }

  /**
   * Get cached suggestions if available
   * Implements Requirements 3.3: Cache fallback for offline/unreachable scenarios
   */
  private static getCachedSuggestions(cacheKey: string): DestinationSuggestion[] | null {
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log(`Using cached suggestions for ${cacheKey} (age: ${Date.now() - cached.timestamp}ms)`);
      return cached.data;
    }
    return null;
  }

  /**
   * Check if cache exists for a given key
   */
  static hasCachedSuggestions(month?: number): boolean {
    const cacheKey = month ? `suggestions_${month}` : 'suggestions_carousel';
    return this.cache.has(cacheKey);
  }

  // Get suggestions for current month
  static async getSuggestionsForCurrentMonth(): Promise<DestinationSuggestion[]> {
    const currentMonth = new Date().getMonth() + 1;
    return this.getSuggestionsForMonth(currentMonth);
  }

  // Get suggestions for specific month
  static async getSuggestionsForMonth(month: number): Promise<DestinationSuggestion[]> {
    const cacheKey = `suggestions_${month}`;
    
    // Check cache first (fresh cache only)
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Use retry mechanism for fetching suggestions
      const suggestions = await this.retryWithBackoff(async () => {
        const token = getAuthToken();
        const response = await api.get(`/destinations/suggestions/month/${month}`, { token: token || undefined });
        return (response as any).suggestions;
      }, `getSuggestionsForMonth(${month})`);

      // Cache the results
      this.cache.set(cacheKey, {
        data: suggestions,
        timestamp: Date.now()
      });

      return suggestions;
    } catch (error) {
      console.error('Error fetching destination suggestions:', error);
      
      // Fallback to cached data if available, even if expired
      // Implements Requirements 3.3: Cache fallback for offline/unreachable scenarios
      const cachedSuggestions = this.getCachedSuggestions(cacheKey);
      if (cachedSuggestions) {
        console.log('Using expired cache as fallback');
        return cachedSuggestions;
      }
      
      // Re-throw the classified error
      throw error;
    }
  }

  // Track user interaction with suggestion
  static async trackInteraction(
    suggestionId: string, 
    interactionType: SuggestionInteractionType
  ): Promise<void> {
    try {
      const token = getAuthToken();
      await api.post(`/destinations/suggestions/${suggestionId}/interactions`, {
        interaction_type: interactionType
      }, { token: token || undefined });

      // Clear cache to ensure fresh data on next fetch
      this.clearCache();
    } catch (error) {
      console.error('Error tracking suggestion interaction:', error);
      // Don't throw error for analytics - it shouldn't break user experience
    }
  }

  // Clear cache
  static clearCache(): void {
    this.cache.clear();
  }

  // Get personalized suggestions (requires authentication)
  static async getPersonalizedSuggestions(): Promise<PersonalizedSuggestions> {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const suggestions = await this.getSuggestionsForMonth(currentMonth);
      
      // For now, return suggestions as-is since personalization happens on backend
      return {
        suggestions,
        user_preferences: {
          // These would be populated by backend analysis
          preferred_climate: undefined,
          preferred_activities: [],
          past_destinations: []
        }
      };
    } catch (error) {
      console.error('Error fetching personalized suggestions:', error);
      throw error;
    }
  }

  // Get suggestions for multiple months (for carousel)
  static async getSuggestionsForCarousel(): Promise<DestinationSuggestion[]> {
    const cacheKey = 'suggestions_carousel';
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const currentMonth = new Date().getMonth() + 1;
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      
      // Get suggestions for current and next month with retry
      const [currentSuggestions, nextSuggestions] = await Promise.all([
        this.getSuggestionsForMonth(currentMonth),
        this.getSuggestionsForMonth(nextMonth)
      ]);

      // Combine and deduplicate
      const allSuggestions = [...currentSuggestions, ...nextSuggestions];
      const uniqueSuggestions = allSuggestions.filter((suggestion, index, self) => 
        index === self.findIndex(s => s.id === suggestion.id)
      );

      // Return top 8 suggestions
      const carouselSuggestions = uniqueSuggestions.slice(0, 8);
      
      // Cache the carousel results
      this.cache.set(cacheKey, {
        data: carouselSuggestions,
        timestamp: Date.now()
      });

      return carouselSuggestions;
    } catch (error) {
      console.error('Error fetching carousel suggestions:', error);
      
      // Fallback to cached data if available
      const cachedSuggestions = this.getCachedSuggestions(cacheKey);
      if (cachedSuggestions) {
        console.log('Using expired carousel cache as fallback');
        return cachedSuggestions;
      }
      
      throw error;
    }
  }

  // Create quick trip from suggestion
  static async createQuickTrip(suggestion: DestinationSuggestion): Promise<{ tripId: string }> {
    try {
      // Track the quick plan interaction
      await this.trackInteraction(suggestion.id, 'quick_plan');

      // Calculate trip dates (7 days starting from next week)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7); // Start next week
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6); // 7 days total

      // Create trip with pre-filled data
      const tripData = {
        title: `Trip to ${suggestion.destination_name}`,
        destination: suggestion.destination_name,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        theme: this.getThemeFromActivityType(suggestion.activity_type),
        currency_code: this.getCurrencyFromCountry(suggestion.country)
      };

      const token = getAuthToken();
      const response = await api.post('/trips', tripData, { token: token || undefined });
      
      // Handle different possible response structures
      let tripId: string;
      const responseData = response as any;
      if (responseData.data?.trip?.id) {
        tripId = responseData.data.trip.id;
      } else if (responseData.data?.id) {
        tripId = responseData.data.id;
      } else if (responseData.trip?.id) {
        tripId = responseData.trip.id;
      } else {
        console.error('Unexpected response structure:', response);
        throw new Error('Failed to get trip ID from response');
      }

      // Auto-generate packing list based on suggestion data
      await this.generatePackingListForTrip(tripId, suggestion);

      return { tripId };
    } catch (error) {
      console.error('Error creating quick trip:', error);
      throw error;
    }
  }

  // Generate packing list based on destination suggestion
  private static async generatePackingListForTrip(
    tripId: string, 
    _suggestion: DestinationSuggestion
  ): Promise<void> {
    try {
      // Apply packing suggestions using the existing endpoint
      // The backend will automatically generate suggestions based on trip details
      const token = getAuthToken();
      const response = await api.post(`/trips/${tripId}/packing/suggestions/apply`, {}, { token: token || undefined });
      
      console.log('Auto-generated packing list for quick trip:', (response as any).data);
    } catch (error) {
      console.error('Error generating packing list for quick trip:', error);
      // Don't throw error - packing list generation failure shouldn't break trip creation
    }
  }



  // Helper to determine theme from activity type
  private static getThemeFromActivityType(activityType: string | null): string {
    if (!activityType) return 'default';
    
    if (activityType.includes('adventure')) return 'adventure';
    if (activityType.includes('romantic')) return 'romantic';
    if (activityType.includes('food')) return 'foodie';
    if (activityType.includes('beach') || activityType.includes('luxury')) return 'chill';
    
    return 'default';
  }

  // Helper to determine currency from country
  private static getCurrencyFromCountry(country: string): string {
    const currencyMap: { [key: string]: string } = {
      'UAE': 'AED',
      'Japan': 'JPY',
      'France': 'EUR',
      'Maldives': 'MVR',
      'Morocco': 'MAD',
      'Turkey': 'TRY',
      'Greece': 'EUR',
      'Croatia': 'EUR',
      'Nepal': 'NPR',
      'Norway': 'NOK',
      'Portugal': 'EUR'
    };

    return currencyMap[country] || 'USD';
  }
}