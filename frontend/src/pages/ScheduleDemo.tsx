/**
 * Schedule Demo Page
 * 
 * Demonstrates all schedule components with mock data for testing.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CountdownTimer,
  DateSelector,
  WeatherWidget,
  DayCard,
  ActivityCard,
  HotelCard,
  RouteDisplay,
  ResponsiveLayout,
} from '@/components/kawaii';
import type { TripDayWithPlaces, DailyForecast, Place } from '@/types/trip';

export const ScheduleDemo: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date('2026-01-14'));

  // Mock data
  const departureDate = new Date('2026-01-14');
  
  const tripDates = [
    new Date('2026-01-14'),
    new Date('2026-01-15'),
    new Date('2026-01-16'),
    new Date('2026-01-17'),
    new Date('2026-01-18'),
  ];

  const mockForecast: DailyForecast = {
    date: '2026-01-14',
    temp_high: 12,
    temp_low: 4,
    condition: 'Partly Cloudy',
    precipitation_chance: 20,
  };

  const mockActivities: Place[] = [
    {
      id: '1',
      name: 'Osaka Castle',
      address: '1-1 Osakajo, Chuo Ward, Osaka',
      category: 'castle',
      lat: 34.6873,
      lng: 135.5262,
      place_type: 'attraction',
      time_start: '12:45',
      duration: 90,
    },
    {
      id: '2',
      name: 'Dotonbori',
      address: 'Dotonbori, Chuo Ward, Osaka',
      category: 'shopping',
      lat: 34.6686,
      lng: 135.5023,
      place_type: 'attraction',
      time_start: '15:00',
      duration: 120,
    },
  ];

  const mockDay: TripDayWithPlaces = {
    id: 'day-1',
    trip_id: 'trip-1',
    day_number: 1,
    date: '2026-01-14',
    title: 'Osaka',
    notes: null,
    places: mockActivities,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const routeStops = [
    { name: '難波' },
    { name: '梅田' },
    { name: '天満' },
  ];

  return (
    <ResponsiveLayout
      showNavigation={true}
      activeTab="schedule"
      onTabChange={(tab) => console.log('Tab changed:', tab)}
      contentClassName="!p-0"
    >
      {/* Header Section */}
      <div className="bg-gradient-to-br from-kawaii-primary-100 to-kawaii-primary-200 dark:from-kawaii-primary-900/30 dark:to-kawaii-primary-800/30 p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-kawaii-neutral-900 dark:text-kawaii-neutral-100 mb-2">
              Japan Adventure
            </h1>
            <p className="text-lg text-kawaii-neutral-600 dark:text-kawaii-neutral-400 mb-6">
              📍 Osaka, Japan
            </p>
          </motion.div>

          {/* Countdown Timer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <CountdownTimer departureDate={departureDate} className="mb-6" />
          </motion.div>

          {/* Date Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <DateSelector
              dates={tripDates}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          </motion.div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="space-y-6">
          {/* Day Card */}
          <section>
            <h2 className="text-2xl font-bold text-kawaii-neutral-900 dark:text-kawaii-neutral-100 mb-4">
              Day Card
            </h2>
            <DayCard
              day={mockDay}
              tripId="trip-1"
              forecast={mockForecast}
              onActivityClick={(activity) => console.log('Activity clicked:', activity)}
              enableStickers={false}
            />
          </section>

          {/* Individual Components */}
          <section>
            <h2 className="text-2xl font-bold text-kawaii-neutral-900 dark:text-kawaii-neutral-100 mb-4">
              Individual Components
            </h2>
            
            <div className="space-y-4">
              {/* Weather Widget */}
              <div>
                <h3 className="text-lg font-semibold text-kawaii-neutral-800 dark:text-kawaii-neutral-200 mb-2">
                  Weather Widget
                </h3>
                <WeatherWidget forecast={mockForecast} compact />
              </div>

              {/* Route Display */}
              <div>
                <h3 className="text-lg font-semibold text-kawaii-neutral-800 dark:text-kawaii-neutral-200 mb-2">
                  Route Display
                </h3>
                <RouteDisplay stops={routeStops} transportMode="train" travelTime={45} />
              </div>

              {/* Hotel Card */}
              <div>
                <h3 className="text-lg font-semibold text-kawaii-neutral-800 dark:text-kawaii-neutral-200 mb-2">
                  Hotel Card
                </h3>
                <HotelCard
                  name="Hotel IL Cuore Namba"
                  address="1-2-3 Namba, Chuo-ku, Osaka"
                  checkIn="15:00"
                  checkOut="11:00"
                />
              </div>

              {/* Activity Cards */}
              <div>
                <h3 className="text-lg font-semibold text-kawaii-neutral-800 dark:text-kawaii-neutral-200 mb-2">
                  Activity Cards
                </h3>
                <div className="space-y-3">
                  {mockActivities.map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      time={activity.time_start}
                      duration={activity.duration}
                      onClick={() => console.log('Activity clicked:', activity)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </ResponsiveLayout>
  );
};

export default ScheduleDemo;
