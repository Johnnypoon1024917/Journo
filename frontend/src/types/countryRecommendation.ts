/**
 * Country Recommendation Types
 * 
 * Type definitions for the country recommendations feature.
 * These types align with the backend database schema and API responses.
 */

/**
 * Main country recommendation interface
 * Represents a country with travel metadata including optimal months and weather info
 */
export interface CountryRecommendation {
  id: string;
  country_name: string;
  best_months: number[];
  temp_range: string;
  avoid_months: number[];
  region: Region;
  description: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Weather preference type for filtering countries
 */
export type WeatherPreference = 'Warm' | 'Cold' | 'Any';

/**
 * Geographic region classification
 */
export type Region = 
  | 'Asia' 
  | 'Europe' 
  | 'Americas' 
  | 'Africa' 
  | 'Oceania' 
  | 'Middle East';

/**
 * Filters for querying country recommendations
 */
export interface RecommendationFilters {
  month?: number;
  weatherPreference?: WeatherPreference;
  region?: Region;
  useGeolocation?: boolean;
}

/**
 * API response structure for country recommendations
 */
export interface RecommendationResponse {
  countries: CountryRecommendation[];
  total: number;
  filters: RecommendationFilters;
}
