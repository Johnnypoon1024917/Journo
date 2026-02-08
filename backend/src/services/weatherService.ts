import axios from 'axios';
import { pool } from '../config/database.js';

export interface DailyForecast {
  date: string;
  temperature_high: number;
  temperature_low: number;
  condition: string;
  precipitation_probability: number;
  icon: string;
  weather_classification?: WeatherClassification;
}

export interface WeatherData {
  forecast: DailyForecast[];
  cached_at: string;
  travel_period_summary?: TravelPeriodSummary;
}

export interface WeatherClassification {
  primary: 'rainy' | 'sunny' | 'cold' | 'hot';
  secondary?: string[];
  suitability_score: {
    indoor: number;    // 0-1 score for indoor activities
    outdoor: number;   // 0-1 score for outdoor activities
    flexible: number;  // 0-1 score for flexible activities
  };
}

export interface TravelPeriodSummary {
  start_date: string;
  end_date: string;
  dominant_weather: WeatherClassification;
  daily_classifications: WeatherClassification[];
  daily_forecasts: any[]; // Add this missing property
  recommendations: {
    best_outdoor_days: string[];
    indoor_activity_days: string[];
    flexible_days: string[];
  };
}

interface OpenWeatherResponse {
  list: Array<{
    dt: number;
    main: {
      temp_max: number;
      temp_min: number;
    };
    weather: Array<{
      main: string;
      icon: string;
    }>;
    pop: number;
    dt_txt: string;
  }>;
}

export class WeatherService {
  private apiKey: string;
  private baseUrl = 'https://api.openweathermap.org/data/2.5';

  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OPENWEATHER_API_KEY not configured. Weather features will be unavailable.');
    } else {
      console.log('✅ OpenWeather API key loaded:', this.apiKey.substring(0, 8) + '...');
    }
  }

  /**
   * Fetch weather forecast for specific travel period
   * @param lat Latitude
   * @param lng Longitude
   * @param startDate Start date of travel (YYYY-MM-DD)
   * @param endDate End date of travel (YYYY-MM-DD)
   * @returns Weather data with travel period analysis
   */
  async getTravelPeriodForecast(
    lat: number, 
    lng: number, 
    startDate: string, 
    endDate: string
  ): Promise<WeatherData> {
    try {
      const weatherData = await this.getForecast(lat, lng);
      
      // Filter forecast to travel period
      const travelForecast = weatherData.forecast.filter(day => {
        return day.date >= startDate && day.date <= endDate;
      });

      // Add weather classifications
      const classifiedForecast = travelForecast.map(day => ({
        ...day,
        weather_classification: this.classifyWeatherConditions(day)
      }));

      // Generate travel period summary
      const travelPeriodSummary = this.generateTravelPeriodSummary(
        classifiedForecast, 
        startDate, 
        endDate
      );

      return {
        forecast: classifiedForecast,
        cached_at: weatherData.cached_at,
        travel_period_summary: travelPeriodSummary
      };
    } catch (error) {
      console.error('Error fetching travel period forecast:', error);
      
      // Return fallback weather data
      return {
        forecast: [],
        cached_at: new Date().toISOString(),
        travel_period_summary: {
          start_date: startDate,
          end_date: endDate,
          dominant_weather: {
            primary: 'sunny',
            suitability_score: {
              indoor: 0.5,
              outdoor: 0.7,
              flexible: 0.8
            }
          },
          daily_classifications: [], // Add missing property
          recommendations: {
            best_outdoor_days: [],
            indoor_activity_days: [],
            flexible_days: []
          },
          daily_forecasts: []
        }
      };
    }
  }

  /**
   * Classify weather conditions for activity suitability
   * @param forecast Daily forecast data
   * @returns Weather classification with suitability scores
   */
  private classifyWeatherConditions(forecast: DailyForecast): WeatherClassification {
    const { temperature_high, temperature_low, condition, precipitation_probability } = forecast;
    const avgTemp = (temperature_high + temperature_low) / 2;

    let primary: 'rainy' | 'sunny' | 'cold' | 'hot';
    const secondary: string[] = [];

    // Primary classification logic
    if (precipitation_probability >= 60) {
      primary = 'rainy';
    } else if (avgTemp <= 5) {
      primary = 'cold';
    } else if (avgTemp >= 30) {
      primary = 'hot';
    } else {
      primary = 'sunny';
    }

    // Secondary classifications
    if (precipitation_probability >= 30 && precipitation_probability < 60) {
      secondary.push('partly_rainy');
    }
    if (avgTemp <= 10 && primary !== 'cold') {
      secondary.push('cool');
    }
    if (avgTemp >= 25 && primary !== 'hot') {
      secondary.push('warm');
    }
    if (condition.toLowerCase().includes('cloud')) {
      secondary.push('cloudy');
    }
    if (condition.toLowerCase().includes('wind')) {
      secondary.push('windy');
    }

    // Calculate suitability scores
    const suitability_score = this.calculateSuitabilityScores(primary, avgTemp, precipitation_probability);

    return {
      primary,
      secondary: secondary.length > 0 ? secondary : undefined,
      suitability_score
    };
  }

  /**
   * Calculate activity suitability scores based on weather conditions
   */
  private calculateSuitabilityScores(
    primary: 'rainy' | 'sunny' | 'cold' | 'hot',
    avgTemp: number,
    precipitationProb: number
  ): { indoor: number; outdoor: number; flexible: number } {
    let indoor = 0.5;
    let outdoor = 0.5;
    let flexible = 0.7;

    switch (primary) {
      case 'rainy':
        indoor = 0.9;
        outdoor = 0.2;
        flexible = 0.6;
        break;
      case 'sunny':
        indoor = 0.4;
        outdoor = 0.9;
        flexible = 0.8;
        break;
      case 'cold':
        indoor = 0.8;
        outdoor = 0.3;
        flexible = 0.5;
        break;
      case 'hot':
        indoor = 0.7;
        outdoor = 0.4;
        flexible = 0.6;
        break;
    }

    // Adjust based on precipitation probability
    if (precipitationProb > 30) {
      outdoor *= (1 - precipitationProb / 100);
      indoor += (precipitationProb / 100) * 0.3;
    }

    // Adjust based on temperature extremes
    if (avgTemp < 0 || avgTemp > 35) {
      outdoor *= 0.5;
      indoor += 0.2;
    }

    // Normalize scores to 0-1 range
    return {
      indoor: Math.min(1, Math.max(0, indoor)),
      outdoor: Math.min(1, Math.max(0, outdoor)),
      flexible: Math.min(1, Math.max(0, flexible))
    };
  }

  /**
   * Generate travel period summary with recommendations
   */
  private generateTravelPeriodSummary(
    forecast: (DailyForecast & { weather_classification: WeatherClassification })[],
    startDate: string,
    endDate: string
  ): TravelPeriodSummary {
    // Handle empty forecast
    if (!forecast || forecast.length === 0) {
      return {
        start_date: startDate,
        end_date: endDate,
        dominant_weather: {
          primary: 'sunny',
          suitability_score: {
            indoor: 0.5,
            outdoor: 0.5,
            flexible: 0.8
          }
        },
        daily_classifications: [], // Add missing property
        recommendations: {
          best_outdoor_days: [],
          indoor_activity_days: [],
          flexible_days: []
        },
        daily_forecasts: []
      };
    }

    const classifications = forecast.map(f => f.weather_classification);
    
    // Find dominant weather pattern
    const weatherCounts = classifications.reduce((acc, classification) => {
      acc[classification.primary] = (acc[classification.primary] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const weatherEntries = Object.entries(weatherCounts);
    const dominantWeatherType = weatherEntries.length > 0 
      ? weatherEntries.sort(([,a], [,b]) => b - a)[0][0] as 'rainy' | 'sunny' | 'cold' | 'hot'
      : 'sunny';

    // Calculate average suitability scores for dominant weather
    const avgSuitability = classifications.reduce((acc, classification) => {
      acc.indoor += classification.suitability_score.indoor;
      acc.outdoor += classification.suitability_score.outdoor;
      acc.flexible += classification.suitability_score.flexible;
      return acc;
    }, { indoor: 0, outdoor: 0, flexible: 0 });

    const count = classifications.length;
    const dominant_weather: WeatherClassification = {
      primary: dominantWeatherType,
      suitability_score: {
        indoor: avgSuitability.indoor / count,
        outdoor: avgSuitability.outdoor / count,
        flexible: avgSuitability.flexible / count
      }
    };

    // Generate day-specific recommendations
    const best_outdoor_days: string[] = [];
    const indoor_activity_days: string[] = [];
    const flexible_days: string[] = [];

    forecast.forEach(day => {
      const { outdoor, indoor, flexible } = day.weather_classification.suitability_score;
      
      if (outdoor >= 0.7) {
        best_outdoor_days.push(day.date);
      } else if (indoor >= 0.7) {
        indoor_activity_days.push(day.date);
      } else if (flexible >= 0.6) {
        flexible_days.push(day.date);
      }
    });

    return {
      start_date: startDate,
      end_date: endDate,
      dominant_weather,
      daily_classifications: classifications,
      daily_forecasts: forecast, // Add missing property
      recommendations: {
        best_outdoor_days,
        indoor_activity_days,
        flexible_days
      }
    };
  }
  async getForecast(lat: number, lng: number): Promise<WeatherData> {
    if (!this.apiKey) {
      throw new Error('Weather API key not configured');
    }

    try {
      const response = await axios.get<OpenWeatherResponse>(`${this.baseUrl}/forecast`, {
        params: {
          lat,
          lon: lng,
          appid: this.apiKey,
          units: 'metric', // Use Celsius
          cnt: 40, // Get 5 days of 3-hour forecasts (40 data points)
        },
        timeout: 5000, // 5 second timeout
      });

      const forecast = this.parseForecast(response.data);

      return {
        forecast,
        cached_at: new Date().toISOString(),
      };
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 401) {
          throw new Error('Invalid weather API key');
        } else if (error.response.status === 404) {
          throw new Error('Location not found');
        } else if (error.response.status === 429) {
          throw new Error('Rate limit exceeded');
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Weather API request timeout');
      }
      throw new Error('Failed to fetch weather data');
    }
  }

  /**
   * Parse OpenWeather API response into daily forecasts
   * Groups 3-hour forecasts by day and calculates daily min/max
   */
  private parseForecast(data: OpenWeatherResponse): DailyForecast[] {
    const dailyForecasts = new Map<string, any[]>();

    // Group forecasts by date
    data.list.forEach((item) => {
      const date = item.dt_txt.split(' ')[0]; // Extract YYYY-MM-DD
      if (!dailyForecasts.has(date)) {
        dailyForecasts.set(date, []);
      }
      dailyForecasts.get(date)!.push(item);
    });

    // Calculate daily aggregates
    const forecasts: DailyForecast[] = [];
    dailyForecasts.forEach((items, date) => {
      forecasts.push({
        date,
        temperature_high: Math.round(Math.max(...items.map((i) => i.main.temp_max))),
        temperature_low: Math.round(Math.min(...items.map((i) => i.main.temp_min))),
        condition: items[0].weather[0].main,
        icon: items[0].weather[0].icon,
        precipitation_probability: Math.round(Math.max(...items.map((i) => i.pop || 0)) * 100),
      });
    });

    // Return up to 7 days
    return forecasts.slice(0, 7);
  }

  /**
   * Geocode a location name to coordinates
   * @param locationName City name or address
   * @returns Coordinates {lat, lng}
   */
  async geocodeLocation(locationName: string): Promise<{ lat: number; lng: number }> {
    if (!this.apiKey) {
      throw new Error('Weather API key not configured');
    }

    console.log(`🌍 Attempting to geocode location: "${locationName}"`);

    try {
      const response = await axios.get<{
        coord: {
          lat: number;
          lon: number;
        };
      }>(`${this.baseUrl}/weather`, {
        params: {
          q: locationName,
          appid: this.apiKey,
        },
        timeout: 5000,
      });

      const coordinates = {
        lat: response.data.coord.lat,
        lng: response.data.coord.lon,
      };

      console.log(`✅ Successfully geocoded "${locationName}" to coordinates:`, coordinates);

      return coordinates;
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 401) {
          console.error(`❌ Geocoding failed for "${locationName}": Invalid weather API key`);
          throw new Error('Invalid weather API key');
        } else if (error.response.status === 404) {
          console.warn(`⚠️ Geocoding failed for "${locationName}": Location not found`);
          throw new Error(`Location "${locationName}" not found`);
        } else if (error.response.status === 429) {
          console.error(`❌ Geocoding failed for "${locationName}": Rate limit exceeded`);
          throw new Error('Rate limit exceeded');
        }
      } else if (error.code === 'ECONNABORTED') {
        console.error(`❌ Geocoding failed for "${locationName}": Request timeout`);
        throw new Error('Geocoding request timeout');
      }
      console.error(`❌ Geocoding failed for "${locationName}":`, error.message);
      throw new Error(`Failed to geocode location "${locationName}"`);
    }
  }

  /**
   * Get coordinates for a trip using multi-tier resolution strategy
   * @param tripId Trip ID to query places from
   * @param destination Destination name to geocode
   * @returns Coordinates with source indicator
   */
  async getCoordinatesForTrip(
    tripId: string,
    destination: string
  ): Promise<{ lat: number; lng: number; source: 'geocoded' | 'place' }> {
    console.log(`📍 Resolving coordinates for trip ${tripId} with destination "${destination}"`);

    // Strategy 1: Try geocoding the destination name
    try {
      const coords = await this.geocodeLocation(destination);
      console.log(`✅ Coordinates resolved via geocoding for trip ${tripId}`);
      return {
        ...coords,
        source: 'geocoded',
      };
    } catch (error: any) {
      console.warn(
        `⚠️ Geocoding failed for trip ${tripId}, attempting fallback to place coordinates:`,
        error.message
      );
    }

    // Strategy 2: Fallback to place coordinates from database
    try {
      console.log(`🔍 Querying database for place coordinates for trip ${tripId}`);
      const result = await pool.query(
        `SELECT p.lat, p.lng 
         FROM places p
         JOIN trip_days td ON p.trip_day_id = td.id
         WHERE td.trip_id = $1 AND p.lat IS NOT NULL AND p.lng IS NOT NULL
         ORDER BY td.day_number, p.created_at
         LIMIT 1`,
        [tripId]
      );

      if (result.rows.length > 0) {
        const coords = {
          lat: result.rows[0].lat,
          lng: result.rows[0].lng,
        };
        console.log(`✅ Coordinates resolved via place fallback for trip ${tripId}:`, coords);
        return {
          ...coords,
          source: 'place',
        };
      }

      console.error(`❌ No place coordinates found for trip ${tripId}`);
      throw new Error('Unable to determine location coordinates');
    } catch (error: any) {
      if (error.message === 'Unable to determine location coordinates') {
        throw error;
      }
      console.error(`❌ Database query failed for trip ${tripId}:`, error.message);
      throw new Error('Failed to query place coordinates');
    }
  }

  /**
   * Cache weather data in trip record with 6-hour refresh interval
   * @param tripId Trip ID to update
   * @param weatherData Weather data to cache
   */
  async cacheWeatherDataForTrip(tripId: string, weatherData: WeatherData): Promise<void> {
    try {
      await pool.query(
        `UPDATE trips 
         SET weather_data = $1, updated_at = NOW() 
         WHERE id = $2`,
        [JSON.stringify(weatherData), tripId]
      );
      console.log(`✅ Weather data cached for trip ${tripId}`);
    } catch (error: any) {
      console.error(`❌ Failed to cache weather data for trip ${tripId}:`, error.message);
      throw new Error('Failed to cache weather data');
    }
  }

  /**
   * Get cached weather data from trip record
   * @param tripId Trip ID to query
   * @returns Cached weather data or null if not found/expired
   */
  async getCachedWeatherDataForTrip(tripId: string): Promise<WeatherData | null> {
    try {
      const result = await pool.query(
        `SELECT weather_data FROM trips WHERE id = $1`,
        [tripId]
      );

      if (result.rows.length === 0 || !result.rows[0].weather_data) {
        return null;
      }

      const weatherData: WeatherData = result.rows[0].weather_data;
      
      // Check if cache is still valid (6 hours)
      if (this.isCacheValid(weatherData.cached_at)) {
        console.log(`✅ Using cached weather data for trip ${tripId}`);
        return weatherData;
      } else {
        console.log(`⏰ Cached weather data expired for trip ${tripId}`);
        return null;
      }
    } catch (error: any) {
      console.error(`❌ Failed to get cached weather data for trip ${tripId}:`, error.message);
      return null;
    }
  }

  /**
   * Get weather forecast for trip with caching
   * @param tripId Trip ID
   * @param destination Destination name
   * @param startDate Travel start date (YYYY-MM-DD)
   * @param endDate Travel end date (YYYY-MM-DD)
   * @returns Weather data for travel period
   */
  async getWeatherForTrip(
    tripId: string,
    destination: string,
    startDate: string,
    endDate: string
  ): Promise<WeatherData> {
    // Try to get cached data first
    const cachedData = await this.getCachedWeatherDataForTrip(tripId);
    if (cachedData) {
      return cachedData;
    }

    // Get coordinates for the trip
    const coordinates = await this.getCoordinatesForTrip(tripId, destination);
    
    // Fetch fresh weather data
    const weatherData = await this.getTravelPeriodForecast(
      coordinates.lat,
      coordinates.lng,
      startDate,
      endDate
    );

    // Cache the data
    await this.cacheWeatherDataForTrip(tripId, weatherData);

    return weatherData;
  }

  /**
   * Add weather suitability scoring for places
   * @param places Array of places to score
   * @param weatherClassification Weather classification for the day
   * @returns Places with weather suitability scores
   */
  addWeatherSuitabilityScoring<T extends { placeType?: string; name?: string }>(
    places: T[],
    weatherClassification: WeatherClassification
  ): (T & { weatherSuitability: number })[] {
    return places.map(place => {
      const suitability = this.calculatePlaceWeatherSuitability(place, weatherClassification);
      return {
        ...place,
        weatherSuitability: suitability
      };
    });
  }

  /**
   * Calculate weather suitability score for a specific place
   * @param place Place object with type information
   * @param weatherClassification Weather conditions
   * @returns Suitability score (0-1)
   */
  private calculatePlaceWeatherSuitability(
    place: { placeType?: string; name?: string },
    weatherClassification: WeatherClassification
  ): number {
    const placeType = place.placeType?.toLowerCase() || '';
    const placeName = place.name?.toLowerCase() || '';

    // Define place categories and their weather preferences
    const indoorPlaces = [
      'museum', 'gallery', 'shopping_mall', 'market', 'restaurant', 'cafe', 
      'theater', 'cinema', 'library', 'aquarium', 'spa', 'gym', 'hotel'
    ];

    const outdoorPlaces = [
      'park', 'beach', 'hiking', 'garden', 'zoo', 'stadium', 'playground',
      'viewpoint', 'monument', 'bridge', 'lake', 'river', 'mountain'
    ];

    const flexiblePlaces = [
      'attraction', 'tourist_attraction', 'point_of_interest', 'establishment',
      'store', 'church', 'temple', 'university', 'hospital'
    ];

    // Determine place category
    let category: 'indoor' | 'outdoor' | 'flexible' = 'flexible';
    
    if (indoorPlaces.some(type => placeType.includes(type) || placeName.includes(type))) {
      category = 'indoor';
    } else if (outdoorPlaces.some(type => placeType.includes(type) || placeName.includes(type))) {
      category = 'outdoor';
    }

    // Additional keyword-based classification
    if (placeName.includes('indoor') || placeName.includes('mall') || placeName.includes('center')) {
      category = 'indoor';
    } else if (placeName.includes('outdoor') || placeName.includes('park') || placeName.includes('beach')) {
      category = 'outdoor';
    }

    // Return the appropriate suitability score
    return weatherClassification.suitability_score[category];
  }

  /**
   * Check if cached weather data is still valid (less than 6 hours old)
   */
  isCacheValid(cachedAt: string): boolean {
    const cacheTime = new Date(cachedAt).getTime();
    const now = Date.now();
    const sixHoursInMs = 6 * 60 * 60 * 1000;
    return now - cacheTime < sixHoursInMs;
  }
}

export const weatherService = new WeatherService();
