import { apiRequest } from './api';
import { WeatherData } from '../types/trip';

export interface WeatherResponse {
  success: boolean;
  data: WeatherData;
  cached?: boolean;
  message?: string;
}

export const weatherService = {
  /**
   * Get weather forecast for a trip
   * Returns cached data if available and valid, otherwise fetches fresh data
   */
  async getWeatherForTrip(tripId: string, token: string): Promise<WeatherResponse> {
    return apiRequest<WeatherResponse>(`/weather/trips/${tripId}`, {
      method: 'GET',
      token,
    });
  },

  /**
   * Force refresh weather data for a trip
   * Always fetches fresh data from the weather API
   */
  async refreshWeather(tripId: string, token: string): Promise<WeatherResponse> {
    return apiRequest<WeatherResponse>(`/weather/trips/${tripId}/refresh`, {
      method: 'POST',
      token,
    });
  },

  /**
   * Check if cached weather data is still valid (less than 6 hours old)
   */
  isCacheValid(cachedAt: string): boolean {
    const cacheTime = new Date(cachedAt).getTime();
    const now = Date.now();
    const sixHoursInMs = 6 * 60 * 60 * 1000;
    return now - cacheTime < sixHoursInMs;
  },

  /**
   * Get weather icon URL from OpenWeather icon code
   */
  getWeatherIconUrl(iconCode: string): string {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  },

  /**
   * Get weather condition emoji based on condition string
   */
  getWeatherEmoji(condition: string): string {
    const conditionMap: Record<string, string> = {
      Clear: '☀️',
      Clouds: '☁️',
      Rain: '🌧️',
      Drizzle: '🌦️',
      Thunderstorm: '⛈️',
      Snow: '❄️',
      Mist: '🌫️',
      Fog: '🌫️',
      Haze: '🌫️',
    };
    return conditionMap[condition] || '🌤️';
  },
};
