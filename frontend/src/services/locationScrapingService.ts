import api from './api';
import { getAuthToken } from '../utils/auth';

export interface ScrapedLocation {
  id?: string;
  location_name: string;
  source: string;
  visitor_count?: number;
  rating?: number;
  tips?: string;
  lat?: number;
  lng?: number;
}

export interface SearchAnalytics {
  query_text: string;
  search_count: number;
  avg_results: number;
  selections: number;
  selection_rate: number;
  last_searched: string;
  first_searched: string;
}

export interface SearchTrend {
  query_text: string;
  search_count: number;
  search_date: string;
}

export interface CacheStatistics {
  total_cached_locations: number;
  fresh_cache_count: number;
  stale_cache_count: number;
  avg_visitor_count: number;
  avg_rating: number;
  unique_sources: number;
}

export class LocationScrapingService {
  // Search for locations with scraping
  static async searchLocations(query: string): Promise<ScrapedLocation[]> {
    try {
      const token = getAuthToken() || undefined;
      const response = await api.post<{
        success: boolean;
        query: string;
        results: ScrapedLocation[];
        count: number;
        cached: boolean;
      }>('/scrape/locations', { query }, { token });

      return response.results || [];
    } catch (error) {
      console.error('Error searching locations:', error);
      throw error;
    }
  }

  // Track when a user selects a scraped location
  static async trackLocationSelection(query: string, locationId: string): Promise<void> {
    try {
      const token = getAuthToken() || undefined;
      await api.post('/scrape/track-selection', {
        query,
        locationId
      }, { token });
    } catch (error) {
      console.error('Error tracking location selection:', error);
      // Don't throw error for tracking - it's not critical
    }
  }

  // Get search analytics (admin only)
  static async getSearchAnalytics(limit: number = 100): Promise<SearchAnalytics[]> {
    try {
      const token = getAuthToken() || undefined;
      const response = await api.get<{
        success: boolean;
        analytics: SearchAnalytics[];
        count: number;
      }>(`/scrape/analytics?limit=${limit}`, { token });

      return response.analytics || [];
    } catch (error) {
      console.error('Error getting search analytics:', error);
      throw error;
    }
  }

  // Get search trends (admin only)
  static async getSearchTrends(days: number = 7): Promise<SearchTrend[]> {
    try {
      const token = getAuthToken() || undefined;
      const response = await api.get<{
        success: boolean;
        trends: SearchTrend[];
        days: number;
        count: number;
      }>(`/scrape/trends?days=${days}`, { token });

      return response.trends || [];
    } catch (error) {
      console.error('Error getting search trends:', error);
      throw error;
    }
  }

  // Get cache statistics (admin only)
  static async getCacheStatistics(): Promise<CacheStatistics> {
    try {
      const token = getAuthToken() || undefined;
      const response = await api.get<{
        success: boolean;
        statistics: CacheStatistics;
      }>('/scrape/cache-stats', { token });

      return response.statistics || {};
    } catch (error) {
      console.error('Error getting cache statistics:', error);
      throw error;
    }
  }
}

export default LocationScrapingService;