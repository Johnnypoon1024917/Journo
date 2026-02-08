/**
 * DayCard Component Demo
 * 
 * Demonstrates the DayCard component with sample data.
 */

import React, { useState } from 'react';
import { DayCard } from './DayCard';
import { TripDayWithPlaces, DailyForecast, Place } from '@/types/trip';

const DayCardDemo: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState(0);

  // Sample forecast data
  const sampleForecast: DailyForecast = {
    date: '2024-03-15',
    temperature_high: 22,
    temperature_low: 15,
    condition: 'Partly Cloudy',
    precipitation_probability: 20,
    icon: 'partly-cloudy',
  };

  // Sample places data
  const samplePlaces: Place[] = [
    {
      id: 'hotel-1',
      trip_day_id: 'day-1',
      name: 'Sakura Hotel Tokyo',
      address: '1-1-1 Shibuya, Tokyo, Japan',
      lat: 35.6595,
      lng: 139.7004,
      time_start: null,
      time_end: null,
      notes: 'Check-in after 3 PM',
      image_url: null,
      place_type: 'hotel',
      sticker: null,
      cost: 15000,
      cost_currency: 'JPY',
      budget_category: 'accommodation',
      transport_mode: null,
      travel_time_seconds: null,
      travel_distance_meters: null,
      travel_time_text: null,
      travel_distance_text: null,
      display_order: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      calculated_arrival_time: null,
      is_syncing: false,
      sync_error: null,
    },
    {
      id: 'flight-1',
      trip_day_id: 'day-1',
      name: 'HKG → NRT',
      address: null,
      lat: null,
      lng: null,
      time_start: '08:00',
      time_end: '13:30',
      notes: 'CX520 - Cathay Pacific',
      image_url: null,
      place_type: 'transport',
      sticker: null,
      cost: 45000,
      cost_currency: 'JPY',
      budget_category: 'transport',
      transport_mode: 'flight',
      travel_time_seconds: 19800,
      travel_distance_meters: null,
      travel_time_text: '5h 30m',
      travel_distance_text: null,
      display_order: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      calculated_arrival_time: null,
      is_syncing: false,
      sync_error: null,
    },
    {
      id: 'activity-1',
      trip_day_id: 'day-1',
      name: 'Senso-ji Temple',
      address: '2-3-1 Asakusa, Taito City, Tokyo',
      lat: 35.7148,
      lng: 139.7967,
      time_start: '15:00',
      time_end: '17:00',
      notes: 'Visit the famous temple and shopping street',
      image_url: null,
      place_type: 'attraction',
      sticker: '🏯',
      cost: 0,
      cost_currency: 'JPY',
      budget_category: 'activities',
      transport_mode: null,
      travel_time_seconds: null,
      travel_distance_meters: null,
      travel_time_text: null,
      travel_distance_text: null,
      display_order: 2,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      calculated_arrival_time: null,
      is_syncing: false,
      sync_error: null,
    },
    {
      id: 'activity-2',
      trip_day_id: 'day-1',
      name: 'Ichiran Ramen',
      address: '1-22-7 Jinnan, Shibuya City, Tokyo',
      lat: 35.6617,
      lng: 139.6988,
      time_start: '18:30',
      time_end: '19:30',
      notes: 'Famous tonkotsu ramen restaurant',
      image_url: null,
      place_type: 'food',
      sticker: '🍜',
      cost: 1200,
      cost_currency: 'JPY',
      budget_category: 'food',
      transport_mode: null,
      travel_time_seconds: null,
      travel_distance_meters: null,
      travel_time_text: null,
      travel_distance_text: null,
      display_order: 3,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      calculated_arrival_time: null,
      is_syncing: false,
      sync_error: null,
    },
    {
      id: 'activity-3',
      trip_day_id: 'day-1',
      name: 'Shibuya Crossing',
      address: 'Shibuya Crossing, Tokyo',
      lat: 35.6595,
      lng: 139.7004,
      time_start: '20:00',
      time_end: '21:00',
      notes: 'Experience the famous scramble crossing at night',
      image_url: null,
      place_type: 'attraction',
      sticker: '🌃',
      cost: 0,
      cost_currency: 'JPY',
      budget_category: 'activities',
      transport_mode: null,
      travel_time_seconds: null,
      travel_distance_meters: null,
      travel_time_text: null,
      travel_distance_text: null,
      display_order: 4,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      calculated_arrival_time: null,
      is_syncing: false,
      sync_error: null,
    },
  ];

  // Sample trip day
  const sampleDay: TripDayWithPlaces = {
    id: 'day-1',
    trip_id: 'trip-1',
    day_number: 1,
    date: '2024-03-15',
    created_at: '2024-01-01T00:00:00Z',
    places: samplePlaces,
  };

  // Sample day with no activities
  const emptyDay: TripDayWithPlaces = {
    id: 'day-2',
    trip_id: 'trip-1',
    day_number: 2,
    date: '2024-03-16',
    created_at: '2024-01-01T00:00:00Z',
    places: [],
  };

  const days = [sampleDay, emptyDay];

  const handleActivityClick = (activity: Place) => {
    console.log('Activity clicked:', activity);
    alert(`Clicked: ${activity.name}`);
  };

  const handleActivityReorder = (activityId: string, newIndex: number) => {
    console.log('Activity reordered:', activityId, 'to index', newIndex);
  };

  return (
    <div className="min-h-screen bg-kawaii-cream-50 dark:bg-kawaii-neutral-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-kawaii-primary-600 dark:text-kawaii-primary-400 mb-2">
          DayCard Component Demo
        </h1>
        <p className="text-kawaii-neutral-600 dark:text-kawaii-neutral-400 mb-8">
          Displays all information for a single trip day in an at-a-glance card format.
        </p>

        {/* Day selector */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setSelectedDay(0)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedDay === 0
                ? 'bg-kawaii-primary-500 text-white'
                : 'bg-white dark:bg-kawaii-neutral-800 text-kawaii-neutral-700 dark:text-kawaii-neutral-300'
            }`}
          >
            Day 1 (With Activities)
          </button>
          <button
            onClick={() => setSelectedDay(1)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedDay === 1
                ? 'bg-kawaii-primary-500 text-white'
                : 'bg-white dark:bg-kawaii-neutral-800 text-kawaii-neutral-700 dark:text-kawaii-neutral-300'
            }`}
          >
            Day 2 (Empty)
          </button>
        </div>

        {/* DayCard */}
        <DayCard
          day={days[selectedDay]}
          forecast={selectedDay === 0 ? sampleForecast : undefined}
          onActivityClick={handleActivityClick}
          onActivityReorder={handleActivityReorder}
        />

        {/* Features list */}
        <div className="mt-8 bg-white dark:bg-kawaii-neutral-800 rounded-xl p-6 shadow-md">
          <h2 className="text-xl font-bold text-kawaii-neutral-900 dark:text-kawaii-neutral-100 mb-4">
            Features
          </h2>
          <ul className="space-y-2 text-kawaii-neutral-700 dark:text-kawaii-neutral-300">
            <li>✅ Display date, weather, hotel, flights, and activities</li>
            <li>✅ Cute character illustration with animation</li>
            <li>✅ Expandable sections for hotel, flights, and activities</li>
            <li>✅ Google Maps integration for locations</li>
            <li>✅ Activity time display with icons</li>
            <li>✅ Completion indicators (placeholder)</li>
            <li>✅ Cream background with kawaii styling</li>
            <li>✅ Responsive design</li>
            <li>✅ i18n support</li>
            <li>⏳ Drag-and-drop for activity reordering (to be implemented)</li>
          </ul>
        </div>

        {/* Usage example */}
        <div className="mt-8 bg-white dark:bg-kawaii-neutral-800 rounded-xl p-6 shadow-md">
          <h2 className="text-xl font-bold text-kawaii-neutral-900 dark:text-kawaii-neutral-100 mb-4">
            Usage Example
          </h2>
          <pre className="bg-kawaii-neutral-100 dark:bg-kawaii-neutral-900 p-4 rounded-lg overflow-x-auto text-sm">
            <code>{`import { DayCard } from '@/components/kawaii/DayCard';

<DayCard
  day={tripDay}
  forecast={dailyForecast}
  onActivityClick={(activity) => {
    console.log('Activity clicked:', activity);
  }}
  onActivityReorder={(activityId, newIndex) => {
    console.log('Reorder:', activityId, newIndex);
  }}
/>`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default DayCardDemo;
