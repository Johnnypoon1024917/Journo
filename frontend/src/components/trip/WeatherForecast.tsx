import { useState, useEffect } from 'react';
import { WeatherData, DailyForecast } from '../../types/trip';
import { weatherService } from '../../services/weatherService';
import { useEnhancedAuthStore } from '../../stores/enhancedAuthStore';

interface WeatherForecastProps {
  tripId: string;
  weatherData: WeatherData | null;
  onWeatherUpdate?: (weatherData: WeatherData) => void;
}

export const WeatherForecast: React.FC<WeatherForecastProps> = ({
  tripId,
  weatherData,
  onWeatherUpdate,
}) => {
  const { accessToken } = useEnhancedAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forecast, setForecast] = useState<WeatherData | null>(weatherData);

  useEffect(() => {
    setForecast(weatherData);
  }, [weatherData]);

  const fetchWeather = async () => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const response = await weatherService.getWeatherForTrip(tripId, accessToken);
      setForecast(response.data);
      if (onWeatherUpdate) {
        onWeatherUpdate(response.data);
      }
    } catch (err) {
      console.error('Error fetching weather:', err);
      setError('Unable to load weather forecast');
    } finally {
      setLoading(false);
    }
  };

  const refreshWeather = async () => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const response = await weatherService.refreshWeather(tripId, accessToken);
      setForecast(response.data);
      if (onWeatherUpdate) {
        onWeatherUpdate(response.data);
      }
    } catch (err) {
      console.error('Error refreshing weather:', err);
      setError('Unable to refresh weather forecast');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch weather if not available
  useEffect(() => {
    if (!forecast && !loading && !error && accessToken) {
      fetchWeather();
    }
  }, [forecast, loading, error, accessToken]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-300">Loading weather...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={fetchWeather}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!forecast || !forecast.forecast || forecast.forecast.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Weather forecast unavailable
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Add a place with location to see the weather forecast
          </p>
        </div>
      </div>
    );
  }

  const isCacheStale = !weatherService.isCacheValid(forecast.cached_at);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Weather Forecast
        </h3>
        <button
          onClick={refreshWeather}
          disabled={loading}
          className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
          title="Refresh weather data"
        >
          {loading ? 'Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      {isCacheStale && (
        <div className="mb-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-sm text-yellow-800 dark:text-yellow-200">
          Weather data may be outdated. Click refresh to update.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {forecast.forecast.map((day: DailyForecast) => (
          <WeatherDay key={day.date} forecast={day} />
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
        Last updated: {new Date(forecast.cached_at).toLocaleString()}
      </div>
    </div>
  );
};

interface WeatherDayProps {
  forecast: DailyForecast;
}

const WeatherDay: React.FC<WeatherDayProps> = ({ forecast }) => {
  const date = new Date(forecast.date);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
  const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div className="text-sm font-medium text-gray-900 dark:text-white">{dayName}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{monthDay}</div>
      
      <img
        src={weatherService.getWeatherIconUrl(forecast.icon)}
        alt={forecast.condition}
        className="w-12 h-12"
      />
      
      <div className="text-xs text-gray-600 dark:text-gray-300 mb-2">
        {forecast.condition}
      </div>
      
      <div className="flex items-center gap-1 text-sm">
        <span className="font-semibold text-gray-900 dark:text-white">
          {forecast.temperature_high}°
        </span>
        <span className="text-gray-500 dark:text-gray-400">
          {forecast.temperature_low}°
        </span>
      </div>
      
      {forecast.precipitation_probability > 0 && (
        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
          💧 {forecast.precipitation_probability}%
        </div>
      )}
    </div>
  );
};
