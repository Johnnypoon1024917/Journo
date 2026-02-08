// Destination suggestion and location scraping types

export interface DestinationSuggestion {
  id: string;
  destination_name: string;
  country: string;
  image_url: string | null;
  month: number | null; // 1-12
  temperature_avg: number | null;
  weather_condition: string | null;
  why_now: string | null;
  climate_type: string | null;
  activity_type: string | null;
  popularity_score: number;
  created_at: string;
  updated_at: string;
}

export interface CreateDestinationSuggestionDto {
  destination_name: string;
  country: string;
  image_url?: string;
  month?: number;
  temperature_avg?: number;
  weather_condition?: string;
  why_now?: string;
  climate_type?: string;
  activity_type?: string;
  popularity_score?: number;
}

export interface UpdateDestinationSuggestionDto {
  destination_name?: string;
  country?: string;
  image_url?: string;
  month?: number;
  temperature_avg?: number;
  weather_condition?: string;
  why_now?: string;
  climate_type?: string;
  activity_type?: string;
  popularity_score?: number;
}

export interface ScrapedLocation {
  id: string;
  location_name: string;
  source: string;
  visitor_count: number | null;
  rating: number | null;
  tips: string | null;
  lat: number | null;
  lng: number | null;
  cached_at: string;
  created_at: string;
}

export interface CreateScrapedLocationDto {
  location_name: string;
  source: string;
  visitor_count?: number;
  rating?: number;
  tips?: string;
  lat?: number;
  lng?: number;
}

export interface SearchQuery {
  id: string;
  user_id: string | null;
  query_text: string;
  result_count: number;
  selected_result_id: string | null;
  created_at: string;
}

export interface CreateSearchQueryDto {
  query_text: string;
  result_count?: number;
  selected_result_id?: string;
}

export type SuggestionInteractionType = 'view' | 'click' | 'quick_plan';

export interface SuggestionInteraction {
  id: string;
  user_id: string | null;
  suggestion_id: string;
  interaction_type: SuggestionInteractionType;
  created_at: string;
}

export interface CreateSuggestionInteractionDto {
  suggestion_id: string;
  interaction_type: SuggestionInteractionType;
}

export interface PersonalizedSuggestions {
  suggestions: DestinationSuggestion[];
  user_preferences: {
    preferred_climate?: string;
    preferred_activities?: string[];
    past_destinations?: string[];
  };
}
