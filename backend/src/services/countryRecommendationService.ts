import { pool } from '../config/database.js';
import { 
  CountryRecommendation, 
  WeatherPreference, 
  CountryRegion as Region,
  CountryQueryFilters as QueryFilters
} from '../types/index.js';

// Re-export types for convenience
export type { CountryRecommendation, WeatherPreference, Region, QueryFilters };

/**
 * Service for handling country recommendation queries and filtering
 * Implements requirements 7.3, 7.4, 6.2, 6.3, 6.4, 8.2
 */
export class CountryRecommendationService {
  /**
   * Query countries from database with optional filters
   * Requirement 7.3: Query-based matching logic
   */
  static async queryCountries(filters: QueryFilters = {}): Promise<CountryRecommendation[]> {
    try {
      const { month, weather, region, limit = 100, offset = 0 } = filters;
      
      let query = 'SELECT * FROM countries WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      // Filter by month if provided
      if (month !== undefined) {
        // Check if month is in best_months AND not in avoid_months
        query += ` AND $${paramIndex} = ANY(best_months)`;
        params.push(month);
        paramIndex++;
        
        query += ` AND (avoid_months IS NULL OR NOT ($${paramIndex} = ANY(avoid_months)))`;
        params.push(month);
        paramIndex++;
      }

      // Filter by region if provided
      if (region) {
        query += ` AND region = $${paramIndex}`;
        params.push(region);
        paramIndex++;
      }

      // Add ordering and pagination
      query += ` ORDER BY country_name ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      
      // Apply weather filtering on the results
      let countries = result.rows;
      if (weather && weather !== 'Any') {
        countries = this.filterByWeather(countries, weather);
      }

      return countries;
    } catch (error) {
      console.error('Error querying countries:', error);
      throw new Error('Failed to query countries from database');
    }
  }

  /**
   * Filter countries by month
   * Requirement 6.2: Filter countries by matching selected month against best_months array
   * Requirement 7.4: Exclude countries where month is in avoid_months array
   */
  static filterByMonth(countries: CountryRecommendation[], month: number): CountryRecommendation[] {
    if (month < 1 || month > 12) {
      throw new Error('Month must be between 1 and 12');
    }

    return countries.filter(country => {
      // Month must be in best_months
      const isInBestMonths = country.best_months.includes(month);
      
      // Month must NOT be in avoid_months
      const isInAvoidMonths = country.avoid_months && country.avoid_months.includes(month);
      
      return isInBestMonths && !isInAvoidMonths;
    });
  }

  /**
   * Filter countries by weather preference with temperature classification
   * Requirement 6.3: Filter for warm temperature ranges when preference is "Warm"
   * Requirement 6.4: Filter for cold temperature ranges when preference is "Cold"
   */
  static filterByWeather(
    countries: CountryRecommendation[], 
    preference: WeatherPreference
  ): CountryRecommendation[] {
    if (preference === 'Any') {
      return countries;
    }

    return countries.filter(country => {
      const classification = this.classifyWeather(country.temp_range);
      
      if (preference === 'Warm') {
        return classification === 'Warm';
      } else if (preference === 'Cold') {
        return classification === 'Cold';
      }
      
      return true;
    });
  }

  /**
   * Classify weather based on temperature range
   * Returns 'Warm', 'Cold', or 'Moderate'
   */
  private static classifyWeather(temp_range: string): 'Warm' | 'Cold' | 'Moderate' {
    const lower = temp_range.toLowerCase();
    
    // Check for explicit warm/hot keywords
    if (lower.includes('warm') || lower.includes('hot')) {
      return 'Warm';
    }
    
    // Check for explicit cold/cool keywords
    if (lower.includes('cold') || lower.includes('cool')) {
      return 'Cold';
    }
    
    // Parse numeric range (e.g., "20-30°C" or "10-25°C")
    const match = temp_range.match(/(-?\d+)-(-?\d+)/);
    if (match) {
      const min = parseInt(match[1]);
      const max = parseInt(match[2]);
      const avg = (min + max) / 2;
      
      if (avg > 20) return 'Warm';
      if (avg < 15) return 'Cold';
    }
    
    return 'Moderate';
  }

  /**
   * Prioritize countries by region proximity
   * Requirement 8.2: Prioritize countries in nearby regions when user location is available
   */
  static prioritizeByRegion(
    countries: CountryRecommendation[], 
    userRegion: Region
  ): CountryRecommendation[] {
    // Create a copy to avoid mutating the original array
    const sortedCountries = [...countries];
    
    // Sort with user's region first, then alphabetically
    sortedCountries.sort((a, b) => {
      const aIsUserRegion = a.region === userRegion;
      const bIsUserRegion = b.region === userRegion;
      
      // Prioritize user's region
      if (aIsUserRegion && !bIsUserRegion) return -1;
      if (!aIsUserRegion && bIsUserRegion) return 1;
      
      // Within same priority level, sort alphabetically
      return a.country_name.localeCompare(b.country_name);
    });
    
    return sortedCountries;
  }

  /**
   * Check if a month should be avoided for a country
   * Helper method for validation
   */
  static isMonthAvoidable(country: CountryRecommendation, month: number): boolean {
    return country.avoid_months ? country.avoid_months.includes(month) : false;
  }

  /**
   * Validate query filters
   * Ensures month is in valid range and weather preference is valid
   */
  static validateFilters(filters: QueryFilters): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (filters.month !== undefined) {
      if (filters.month < 1 || filters.month > 12) {
        errors.push('Month must be between 1 and 12');
      }
    }
    
    if (filters.weather !== undefined) {
      const validWeatherPreferences: WeatherPreference[] = ['Warm', 'Cold', 'Any'];
      if (!validWeatherPreferences.includes(filters.weather)) {
        errors.push('Weather preference must be "Warm", "Cold", or "Any"');
      }
    }
    
    if (filters.region !== undefined) {
      const validRegions: Region[] = ['Asia', 'Europe', 'Americas', 'Africa', 'Oceania', 'Middle East'];
      if (!validRegions.includes(filters.region)) {
        errors.push('Invalid region specified');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
