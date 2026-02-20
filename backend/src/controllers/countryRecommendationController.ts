import { Request, Response } from 'express';
import { CountryRecommendationService } from '../services/countryRecommendationService.js';
import { WeatherPreference, CountryQueryFilters } from '../types/index.js';

/**
 * Controller for country recommendation endpoints
 * Implements requirements 3.2, 3.3, 3.4, 3.5
 */
export class CountryRecommendationController {
  /**
   * Get country recommendations with optional filters
   * GET /countries/recommendations?month=5&weather=warm&region=Asia
   * 
   * Requirement 3.2: Accept query parameters for month and weather preference
   * Requirement 3.3: Return matching countries with all metadata fields
   * Requirement 3.4: Return appropriate error responses with status codes
   * Requirement 3.5: Return results in JSON format
   */
  static async getRecommendations(req: Request, res: Response): Promise<Response> {
    try {
      // Extract and parse query parameters
      const { month, weather, region, limit, offset } = req.query;

      // Build filters object
      const filters: CountryQueryFilters = {};

      if (month !== undefined) {
        const monthNum = Number(month);
        if (isNaN(monthNum)) {
          return res.status(400).json({
            success: false,
            error: 'Month must be a valid number'
          });
        }
        filters.month = monthNum;
      }

      if (weather !== undefined) {
        // Normalize weather preference to match type
        const weatherStr = String(weather);
        const normalizedWeather = weatherStr.charAt(0).toUpperCase() + weatherStr.slice(1).toLowerCase();
        
        if (!['Warm', 'Cold', 'Any'].includes(normalizedWeather)) {
          return res.status(400).json({
            success: false,
            error: 'Weather preference must be "warm", "cold", or "any"'
          });
        }
        filters.weather = normalizedWeather as WeatherPreference;
      }

      if (region !== undefined) {
        filters.region = String(region) as any;
      }

      if (limit !== undefined) {
        const limitNum = Number(limit);
        if (isNaN(limitNum) || limitNum < 1) {
          return res.status(400).json({
            success: false,
            error: 'Limit must be a positive number'
          });
        }
        filters.limit = limitNum;
      }

      if (offset !== undefined) {
        const offsetNum = Number(offset);
        if (isNaN(offsetNum) || offsetNum < 0) {
          return res.status(400).json({
            success: false,
            error: 'Offset must be a non-negative number'
          });
        }
        filters.offset = offsetNum;
      }

      // Validate filters
      const validation = CountryRecommendationService.validateFilters(filters);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.errors.join(', ')
        });
      }

      // Query countries with filters
      const countries = await CountryRecommendationService.queryCountries(filters);

      // Return successful response
      return res.status(200).json({
        success: true,
        data: {
          countries,
          total: countries.length,
          filters
        }
      });
    } catch (error) {
      console.error('Error in getRecommendations:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch country recommendations'
      });
    }
  }

  /**
   * Get country recommendations for a specific month
   * GET /countries/recommendations/:month?weather=warm
   * 
   * Requirement 3.2: Accept query parameters for month and weather preference
   * Requirement 3.3: Return matching countries with all metadata fields
   * Requirement 3.4: Return appropriate error responses with status codes
   * Requirement 3.5: Return results in JSON format
   */
  static async getRecommendationsByMonth(req: Request, res: Response): Promise<Response> {
    try {
      // Extract month from path parameter
      const { month } = req.params;
      const monthNum = Number(month);

      // Validate month parameter
      if (isNaN(monthNum)) {
        return res.status(400).json({
          success: false,
          error: 'Month must be a valid number'
        });
      }

      if (monthNum < 1 || monthNum > 12) {
        return res.status(400).json({
          success: false,
          error: 'Month must be between 1 and 12'
        });
      }

      // Extract optional weather query parameter
      const { weather } = req.query;
      const filters: CountryQueryFilters = { month: monthNum };

      if (weather !== undefined) {
        // Normalize weather preference to match type
        const weatherStr = String(weather);
        const normalizedWeather = weatherStr.charAt(0).toUpperCase() + weatherStr.slice(1).toLowerCase();
        
        if (!['Warm', 'Cold', 'Any'].includes(normalizedWeather)) {
          return res.status(400).json({
            success: false,
            error: 'Weather preference must be "warm", "cold", or "any"'
          });
        }
        filters.weather = normalizedWeather as WeatherPreference;
      }

      // Query countries for the specific month
      const countries = await CountryRecommendationService.queryCountries(filters);

      // Return successful response
      return res.status(200).json({
        success: true,
        data: {
          countries,
          month: monthNum,
          total: countries.length
        }
      });
    } catch (error) {
      console.error('Error in getRecommendationsByMonth:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch country recommendations for the specified month'
      });
    }
  }
}
