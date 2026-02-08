/**
 * Open-Meteo Weather Service
 * 
 * Free weather API service using Open-Meteo (no API key required)
 * https://open-meteo.com/
 */

import type { DailyForecast } from '@/types/trip';

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weathercode: number[];
    precipitation_probability_max?: number[];
  };
}

interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
}

/**
 * Weather code to condition mapping
 * https://open-meteo.com/en/docs
 */
const getWeatherCondition = (code: number): string => {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly Cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Rain Showers';
  if (code <= 86) return 'Snow Showers';
  if (code <= 99) return 'Thunderstorm';
  return 'Unknown';
};

/**
 * Geocode location name to coordinates
 */
async function geocodeLocation(location: string): Promise<{ lat: number; lng: number } | null> {
  try {
    console.log('Geocoding location:', location);
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
    );
    
    if (!response.ok) {
      console.error('Geocoding failed:', response.statusText);
      return null;
    }
    
    const data = await response.json();
    console.log('Geocoding response:', data);
    
    if (!data.results || data.results.length === 0) {
      console.error('No geocoding results for:', location);
      return null;
    }
    
    const result: GeocodingResult = data.results[0];
    console.log('Geocoded to:', result.name, result.latitude, result.longitude);
    return {
      lat: result.latitude,
      lng: result.longitude,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Fetch weather data from Open-Meteo
 */
async function fetchWeatherData(
  lat: number,
  lng: number,
  startDate: string,
  endDate: string
): Promise<DailyForecast[]> {
  try {
    console.log('fetchWeatherData called:', { lat, lng, startDate, endDate });
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day for accurate comparison
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    console.log('Date comparison:', {
      today: today.toISOString().split('T')[0],
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    });
    
    // Open-Meteo free API only provides forecasts up to 16 days in the future
    const maxForecastDate = new Date(today);
    maxForecastDate.setDate(maxForecastDate.getDate() + 16);
    
    console.log('Max forecast date:', maxForecastDate.toISOString().split('T')[0]);
    
    // If the trip is too far in the future, generate mock weather data
    if (start > maxForecastDate) {
      console.log('Trip start date is beyond forecast range, generating mock data');
      return generateMockWeather(startDate, endDate);
    }
    
    // Adjust dates if they exceed the forecast limit
    const adjustedStart = start < today ? today.toISOString().split('T')[0] : startDate;
    const adjustedEnd = end > maxForecastDate ? maxForecastDate.toISOString().split('T')[0] : endDate;
    
    console.log('Adjusted dates for API call:', { adjustedStart, adjustedEnd });
    
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.append('latitude', lat.toString());
    url.searchParams.append('longitude', lng.toString());
    url.searchParams.append('daily', 'temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max');
    url.searchParams.append('timezone', 'auto');
    url.searchParams.append('start_date', adjustedStart);
    url.searchParams.append('end_date', adjustedEnd);
    
    console.log('Fetching from URL:', url.toString());
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.error('Weather API failed:', response.status, response.statusText);
      // Fallback to mock data
      return generateMockWeather(startDate, endDate);
    }
    
    const data: OpenMeteoResponse = await response.json();
    console.log('Weather API response received:', {
      daysCount: data.daily.time.length,
      firstDate: data.daily.time[0],
      lastDate: data.daily.time[data.daily.time.length - 1],
    });
    
    // Transform to our format
    const forecasts: DailyForecast[] = data.daily.time.map((date, index) => ({
      date,
      temperature_high: Math.round(data.daily.temperature_2m_max[index]),
      temperature_low: Math.round(data.daily.temperature_2m_min[index]),
      condition: getWeatherCondition(data.daily.weathercode[index]),
      precipitation_probability: data.daily.precipitation_probability_max?.[index] || 0,
      icon: getWeatherCondition(data.daily.weathercode[index]).toLowerCase(),
    }));
    
    console.log('Transformed forecasts:', forecasts.length, 'days');
    
    // If we need more days (trip extends beyond forecast), fill with mock data
    if (end > maxForecastDate) {
      const nextDay = new Date(maxForecastDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const mockForecasts = generateMockWeather(
        nextDay.toISOString().split('T')[0],
        endDate
      );
      forecasts.push(...mockForecasts);
      console.log('Added', mockForecasts.length, 'mock forecast days for dates beyond API range');
    }
    
    console.log('Total forecasts returned:', forecasts.length);
    return forecasts;
  } catch (error) {
    console.error('Weather fetch error:', error);
    // Fallback to mock data
    console.log('Falling back to mock data due to error');
    return generateMockWeather(startDate, endDate);
  }
}

/**
 * Generate mock weather data for dates beyond forecast range
 */
function generateMockWeather(startDate: string, endDate: string): DailyForecast[] {
  console.log('Generating mock weather for:', startDate, 'to', endDate);
  const forecasts: DailyForecast[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const weatherConditions = ['Clear', 'Partly Cloudy', 'Cloudy', 'Rain', 'Sunny'];
  
  const current = new Date(start);
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    const randomIndex = Math.floor(Math.random() * weatherConditions.length);
    
    // Generate realistic temperatures (adjust based on season)
    const month = current.getMonth();
    let baseTempHigh = 20;
    let baseTempLow = 10;
    
    // Adjust for seasons (Northern Hemisphere)
    if (month >= 11 || month <= 1) { // Winter
      baseTempHigh = 10;
      baseTempLow = 2;
    } else if (month >= 2 && month <= 4) { // Spring
      baseTempHigh = 18;
      baseTempLow = 8;
    } else if (month >= 5 && month <= 7) { // Summer
      baseTempHigh = 28;
      baseTempLow = 20;
    } else { // Fall
      baseTempHigh = 20;
      baseTempLow = 12;
    }
    
    const tempVariation = Math.floor(Math.random() * 6) - 3;
    
    forecasts.push({
      date: dateStr,
      temperature_high: baseTempHigh + tempVariation,
      temperature_low: baseTempLow + tempVariation,
      condition: weatherConditions[randomIndex],
      precipitation_probability: Math.floor(Math.random() * 40),
      icon: weatherConditions[randomIndex].toLowerCase(),
    });
    
    current.setDate(current.getDate() + 1);
  }
  
  console.log('Generated', forecasts.length, 'mock weather days');
  return forecasts;
}

/**
 * Get weather forecast for a location and date range
 */
export async function getWeatherForecast(
  location: string,
  startDate: Date,
  endDate: Date
): Promise<DailyForecast[]> {
  console.log('getWeatherForecast called for:', location, startDate, endDate);
  
  // Geocode location
  const coords = await geocodeLocation(location);
  if (!coords) {
    console.error('Could not geocode location:', location);
    // Return mock data as fallback
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    return generateMockWeather(start, end);
  }
  
  // Format dates
  const start = startDate.toISOString().split('T')[0];
  const end = endDate.toISOString().split('T')[0];
  
  // Fetch weather
  const forecasts = await fetchWeatherData(coords.lat, coords.lng, start, end);
  
  console.log('getWeatherForecast returning', forecasts.length, 'forecasts');
  return forecasts;
}

/**
 * Get weather for a specific date
 */
export async function getWeatherForDate(
  location: string,
  date: Date
): Promise<DailyForecast | null> {
  const forecasts = await getWeatherForecast(location, date, date);
  return forecasts.length > 0 ? forecasts[0] : null;
}

export const openMeteoWeatherService = {
  getWeatherForecast,
  getWeatherForDate,
  geocodeLocation,
};
