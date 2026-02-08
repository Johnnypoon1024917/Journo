import { Request, Response } from 'express';
import { weatherService } from '../services/weatherService.js';
import { WeatherBasedPlaceFilteringService } from '../services/weatherBasedPlaceFilteringService.js';
import { pool } from '../config/database.js';

export class WeatherController {
  /**
   * Private helper method to resolve coordinates for a trip
   * Uses the weatherService.getCoordinatesForTrip method
   * @throws Error with descriptive message if coordinates cannot be resolved
   */
  private static async resolveCoordinates(
    tripId: string,
    destination: string
  ): Promise<{ lat: number; lng: number; source: 'geocoded' | 'place' }> {
    try {
      const result = await weatherService.getCoordinatesForTrip(tripId, destination);
      return result;
    } catch (error: any) {
      // Re-throw with descriptive error for controller to handle
      throw new Error(error.message || 'Unable to determine location coordinates');
    }
  }

  /**
   * Fetch weather forecast for a trip
   * Checks cache first, fetches from API if stale or missing
   */
  static async getWeatherForTrip(req: Request, res: Response) {
    try {
      const { tripId } = req.params;
      const userId = req.user?.userId;

      // Get trip details
      const tripResult = await pool.query(
        `SELECT id, destination, start_date, end_date, weather_data, owner_id, is_public
         FROM trips 
         WHERE id = $1 AND (owner_id = $2 OR is_public = true)`,
        [tripId, userId]
      );

      if (tripResult.rows.length === 0) {
        return res.status(404).json({ error: 'Trip not found' });
      }

      const trip = tripResult.rows[0];

      // Check if we need destination coordinates
      if (!trip.destination) {
        return res.status(400).json({ 
          error: 'Trip destination not set',
          suggestion: 'Please set a destination for your trip to view weather forecasts.'
        });
      }

      // Check if cached weather data is valid
      if (trip.weather_data && weatherService.isCacheValid(trip.weather_data.cached_at)) {
        return res.json({
          success: true,
          data: trip.weather_data,
          cached: true,
        });
      }

      // Need to fetch fresh weather data - resolve coordinates using helper
      let lat: number;
      let lng: number;

      try {
        const coords = await WeatherController.resolveCoordinates(tripId, trip.destination);
        lat = coords.lat;
        lng = coords.lng;
        console.log(`Coordinates resolved via ${coords.source} for trip ${tripId}:`, { lat, lng });
      } catch (coordError: any) {
        return res.status(400).json({ 
          error: 'Unable to determine location for weather forecast',
          details: coordError.message,
          suggestion: 'Please add a place with location coordinates to your trip.'
        });
      }

      // Fetch weather data
      const weatherData = await weatherService.getForecast(lat, lng);

      // Update trip with new weather data
      await pool.query(
        `UPDATE trips 
         SET weather_data = $1, updated_at = NOW()
         WHERE id = $2`,
        [JSON.stringify(weatherData), tripId]
      );

      res.json({
        success: true,
        data: weatherData,
        cached: false,
      });
    } catch (error) {
      console.error('Error fetching weather:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('API key') || error.message.includes('not configured')) {
          return res.status(503).json({ 
            error: 'Weather service unavailable',
            details: 'Weather API key not configured or invalid.',
            suggestion: 'Please contact support or check your API key configuration.'
          });
        }
        if (error.message.includes('timeout')) {
          return res.status(500).json({ 
            error: 'Weather API request timeout',
            details: error.message,
            suggestion: 'Please try again in a moment.'
          });
        }
        if (error.message.includes('Rate limit exceeded')) {
          return res.status(429).json({ 
            error: 'Rate limit exceeded',
            details: 'Too many requests to the weather API.',
            suggestion: 'Please wait a moment before trying again.'
          });
        }
        return res.status(500).json({ 
          error: 'Failed to fetch weather data',
          details: error.message,
          suggestion: 'Please try again later.'
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to fetch weather data',
        details: 'An unexpected error occurred.',
        suggestion: 'Please try again later.'
      });
    }
  }

  /**
   * Refresh weather data for a trip (force fetch from API)
   */
  static async refreshWeather(req: Request, res: Response) {
    try {
      const { tripId } = req.params;
      const userId = req.user?.userId;

      // Get trip details and verify ownership
      const tripResult = await pool.query(
        `SELECT id, destination, owner_id
         FROM trips 
         WHERE id = $1 AND owner_id = $2`,
        [tripId, userId]
      );

      if (tripResult.rows.length === 0) {
        return res.status(404).json({ error: 'Trip not found or unauthorized' });
      }

      const trip = tripResult.rows[0];

      if (!trip.destination) {
        return res.status(400).json({ 
          error: 'Trip destination not set',
          suggestion: 'Please set a destination for your trip to view weather forecasts.'
        });
      }

      // Resolve coordinates using helper method
      let lat: number;
      let lng: number;

      try {
        const coords = await WeatherController.resolveCoordinates(tripId, trip.destination);
        lat = coords.lat;
        lng = coords.lng;
        console.log(`Coordinates resolved via ${coords.source} for trip ${tripId}:`, { lat, lng });
      } catch (coordError: any) {
        return res.status(400).json({ 
          error: 'Unable to determine location for weather forecast',
          details: coordError.message,
          suggestion: 'Please add a place with location coordinates to your trip.'
        });
      }

      // Fetch fresh weather data
      const weatherData = await weatherService.getForecast(lat, lng);

      // Update trip with new weather data
      await pool.query(
        `UPDATE trips 
         SET weather_data = $1, updated_at = NOW()
         WHERE id = $2`,
        [JSON.stringify(weatherData), tripId]
      );

      res.json({
        success: true,
        data: weatherData,
        message: 'Weather data refreshed successfully',
      });
    } catch (error) {
      console.error('Error refreshing weather:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('API key') || error.message.includes('not configured')) {
          return res.status(503).json({ 
            error: 'Weather service unavailable',
            details: 'Weather API key not configured or invalid.',
            suggestion: 'Please contact support or check your API key configuration.'
          });
        }
        if (error.message.includes('timeout')) {
          return res.status(500).json({ 
            error: 'Weather API request timeout',
            details: error.message,
            suggestion: 'Please try again in a moment.'
          });
        }
        if (error.message.includes('Rate limit exceeded')) {
          return res.status(429).json({ 
            error: 'Rate limit exceeded',
            details: 'Too many requests to the weather API.',
            suggestion: 'Please wait a moment before trying again.'
          });
        }
        return res.status(500).json({ 
          error: 'Failed to refresh weather data',
          details: error.message,
          suggestion: 'Please try again later.'
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to refresh weather data',
        details: 'An unexpected error occurred.',
        suggestion: 'Please try again later.'
      });
    }
  }

  /**
   * Get weather-based place recommendations for a destination
   */
  static async getWeatherBasedRecommendations(req: Request, res: Response) {
    try {
      const { destination, startDate, endDate } = req.query;

      if (!destination || !startDate || !endDate) {
        return res.status(400).json({
          error: 'Missing required parameters',
          required: ['destination', 'startDate', 'endDate']
        });
      }

      // Get coordinates for destination
      const coordinates = await weatherService.geocodeLocation(destination as string);
      
      // Get weather forecast for travel period
      const weatherData = await weatherService.getTravelPeriodForecast(
        coordinates.lat,
        coordinates.lng,
        startDate as string,
        endDate as string
      );

      // Get weather-based recommendations
      const recommendations = weatherData.travel_period_summary?.daily_classifications.map(
        (classification, index) => ({
          day: index + 1,
          date: weatherData.forecast[index]?.date,
          weather: classification,
          recommendations: WeatherBasedPlaceFilteringService.getWeatherBasedRecommendations(classification)
        })
      ) || [];

      // Generate packing list
      const packingItems = WeatherBasedPlaceFilteringService.generateWeatherPackingItems(
        weatherData.travel_period_summary?.daily_classifications || []
      );

      res.json({
        success: true,
        data: {
          destination,
          travel_period: {
            start_date: startDate,
            end_date: endDate
          },
          weather_summary: weatherData.travel_period_summary,
          daily_recommendations: recommendations,
          suggested_packing_items: packingItems
        }
      });

    } catch (error) {
      console.error('Error getting weather-based recommendations:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({
            error: 'Location not found',
            details: error.message,
            suggestion: 'Please check the destination name and try again.'
          });
        }
        if (error.message.includes('API key')) {
          return res.status(503).json({
            error: 'Weather service unavailable',
            details: 'Weather API key not configured or invalid.'
          });
        }
      }

      res.status(500).json({
        error: 'Failed to get weather-based recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
