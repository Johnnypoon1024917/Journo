/**
 * WeatherWidget Demo Component
 * 
 * Demonstrates the WeatherWidget component with various configurations.
 */

import React, { useState } from 'react';
import { WeatherWidget } from './WeatherWidget';
import { Card } from './Card';
import { Button } from './Button';
import { DailyForecast } from '@/types/trip';

const weatherConditions = [
  'Clear',
  'Clouds',
  'Rain',
  'Snow',
  'Thunderstorm',
  'Mist',
  'Fog',
  'Drizzle',
];

const sampleForecasts: DailyForecast[] = [
  {
    date: '2024-03-15',
    temperature_high: 22,
    temperature_low: 15,
    condition: 'Clear',
    precipitation_probability: 10,
    icon: '01d',
  },
  {
    date: '2024-03-16',
    temperature_high: 18,
    temperature_low: 12,
    condition: 'Clouds',
    precipitation_probability: 30,
    icon: '03d',
  },
  {
    date: '2024-03-17',
    temperature_high: 16,
    temperature_low: 10,
    condition: 'Rain',
    precipitation_probability: 80,
    icon: '10d',
  },
  {
    date: '2024-03-18',
    temperature_high: 5,
    temperature_low: -2,
    condition: 'Snow',
    precipitation_probability: 90,
    icon: '13d',
  },
  {
    date: '2024-03-19',
    temperature_high: 20,
    temperature_low: 14,
    condition: 'Thunderstorm',
    precipitation_probability: 70,
    icon: '11d',
  },
];

export const WeatherWidgetDemo: React.FC = () => {
  const [selectedForecast, setSelectedForecast] = useState<DailyForecast>(sampleForecasts[0]);
  const [compact, setCompact] = useState(false);

  const randomizeForecast = () => {
    const randomCondition = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    const randomTemp = Math.floor(Math.random() * 40) - 10; // -10 to 30
    const randomPrecip = Math.floor(Math.random() * 100);
    
    setSelectedForecast({
      date: new Date().toISOString().split('T')[0],
      temperature_high: randomTemp + 5,
      temperature_low: randomTemp,
      condition: randomCondition,
      precipitation_probability: randomPrecip,
      icon: '01d',
    });
  };

  return (
    <div className="p-8 space-y-8 bg-bubblequest-neutral-50 dark:bg-bubblequest-neutral-900 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 mb-2">
          WeatherWidget Component Demo
        </h1>
        <p className="text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400 mb-8">
          Displays weather information in a compact, bubblequest-styled card
        </p>

        {/* Controls */}
        <Card className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Controls</h2>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => setCompact(!compact)}>
              Toggle Layout: {compact ? 'Compact' : 'Full'}
            </Button>
            <Button onClick={randomizeForecast} variant="secondary">
              Randomize Weather
            </Button>
          </div>
        </Card>

        {/* Current Configuration */}
        <Card className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Layout</h3>
              <p className="text-sm text-bubblequest-neutral-600 dark:text-bubblequest-neutral-400">
                {compact ? 'Compact (horizontal)' : 'Full (vertical)'}
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Weather Data</h3>
              <pre className="text-xs bg-bubblequest-neutral-100 dark:bg-bubblequest-neutral-800 p-2 rounded overflow-auto">
                {JSON.stringify(selectedForecast, null, 2)}
              </pre>
            </div>
          </div>
        </Card>

        {/* Live Preview */}
        <Card className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Live Preview</h2>
          <div className="max-w-md mx-auto">
            <WeatherWidget forecast={selectedForecast} compact={compact} />
          </div>
        </Card>

        {/* Sample Forecasts */}
        <Card className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Sample Forecasts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sampleForecasts.map((forecast, index) => (
              <div key={index}>
                <h3 className="text-sm font-medium mb-2 text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300">
                  {forecast.condition} - {forecast.date}
                </h3>
                <WeatherWidget forecast={forecast} compact={compact} />
              </div>
            ))}
          </div>
        </Card>

        {/* Without Data */}
        <Card className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Without Forecast Data (Placeholder)</h2>
          <div className="max-w-md mx-auto">
            <WeatherWidget compact={compact} />
          </div>
        </Card>

        {/* All Weather Conditions */}
        <Card className="mb-8">
          <h2 className="text-xl font-semibold mb-4">All Weather Conditions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {weatherConditions.map((condition) => (
              <div key={condition}>
                <h3 className="text-sm font-medium mb-2 text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300">
                  {condition}
                </h3>
                <WeatherWidget
                  forecast={{
                    date: '2024-03-15',
                    temperature_high: 20,
                    temperature_low: 15,
                    condition,
                    precipitation_probability: 50,
                    icon: '01d',
                  }}
                  compact={compact}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Temperature Extremes */}
        <Card className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Temperature Extremes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-2 text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300">
                Very Hot
              </h3>
              <WeatherWidget
                forecast={{
                  date: '2024-03-15',
                  temperature_high: 45,
                  temperature_low: 38,
                  condition: 'Clear',
                  precipitation_probability: 0,
                  icon: '01d',
                }}
                compact={compact}
              />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2 text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300">
                Moderate
              </h3>
              <WeatherWidget
                forecast={{
                  date: '2024-03-15',
                  temperature_high: 20,
                  temperature_low: 15,
                  condition: 'Clouds',
                  precipitation_probability: 30,
                  icon: '03d',
                }}
                compact={compact}
              />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2 text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300">
                Very Cold
              </h3>
              <WeatherWidget
                forecast={{
                  date: '2024-03-15',
                  temperature_high: -30,
                  temperature_low: -40,
                  condition: 'Snow',
                  precipitation_probability: 90,
                  icon: '13d',
                }}
                compact={compact}
              />
            </div>
          </div>
        </Card>

        {/* Precipitation Probabilities */}
        <Card className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Precipitation Probabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[0, 25, 50, 100].map((precip) => (
              <div key={precip}>
                <h3 className="text-sm font-medium mb-2 text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300">
                  {precip}% Chance
                </h3>
                <WeatherWidget
                  forecast={{
                    date: '2024-03-15',
                    temperature_high: 20,
                    temperature_low: 15,
                    condition: 'Rain',
                    precipitation_probability: precip,
                    icon: '10d',
                  }}
                  compact={compact}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Usage Examples */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Usage Examples</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Basic Usage</h3>
              <pre className="text-xs bg-bubblequest-neutral-100 dark:bg-bubblequest-neutral-800 p-4 rounded overflow-auto">
{`import { WeatherWidget } from '@/components/bubblequest/WeatherWidget';

const forecast = {
  date: '2024-03-15',
  temperature_high: 22,
  temperature_low: 15,
  condition: 'Clear',
  precipitation_probability: 10,
  icon: '01d'
};

<WeatherWidget forecast={forecast} />`}
              </pre>
            </div>
            <div>
              <h3 className="font-medium mb-2">Compact Mode</h3>
              <pre className="text-xs bg-bubblequest-neutral-100 dark:bg-bubblequest-neutral-800 p-4 rounded overflow-auto">
{`<WeatherWidget forecast={forecast} compact />`}
              </pre>
            </div>
            <div>
              <h3 className="font-medium mb-2">Without Data (Placeholder)</h3>
              <pre className="text-xs bg-bubblequest-neutral-100 dark:bg-bubblequest-neutral-800 p-4 rounded overflow-auto">
{`<WeatherWidget />`}
              </pre>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
