/**
 * ActivityItem Component Demo
 * 
 * Demonstrates the ActivityItem component with various configurations.
 */

import React, { useState } from 'react';
import { ActivityItem } from './ActivityItem';
import { Place } from '@/types/trip';

// Mock activities with different configurations
const createMockActivity = (overrides: Partial<Place>): Place => ({
  id: Math.random().toString(),
  trip_day_id: 'demo-day',
  name: 'Activity',
  address: null,
  lat: null,
  lng: null,
  time_start: null,
  time_end: null,
  notes: null,
  image_url: null,
  place_type: null,
  sticker: null,
  cost: null,
  cost_currency: null,
  budget_category: null,
  transport_mode: null,
  travel_time_seconds: null,
  travel_distance_meters: null,
  travel_time_text: null,
  travel_distance_text: null,
  display_order: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  calculated_arrival_time: null,
  is_syncing: false,
  sync_error: null,
  ...overrides,
});

const demoActivities = [
  createMockActivity({
    id: '1',
    name: 'Tokyo Tower',
    address: '4 Chome-2-8 Shibakoen, Minato City, Tokyo',
    lat: 35.6586,
    lng: 139.7454,
    time_start: '10:00',
    notes: 'Great views of the city! Don\'t forget to visit the observation deck.',
    place_type: 'attraction',
  }),
  createMockActivity({
    id: '2',
    name: 'Sushi Restaurant',
    address: 'Tsukiji Fish Market, Tokyo',
    lat: 35.6654,
    lng: 139.7707,
    time_start: '12:30',
    notes: 'Try the omakase set!',
    place_type: 'food',
    travel_time_text: '15 mins',
    travel_distance_text: '1.2 km',
  }),
  createMockActivity({
    id: '3',
    name: 'Senso-ji Temple',
    address: '2 Chome-3-1 Asakusa, Taito City, Tokyo',
    lat: 35.7148,
    lng: 139.7967,
    time_start: '15:00',
    place_type: 'attraction',
  }),
  createMockActivity({
    id: '4',
    name: 'Shopping at Shibuya',
    address: 'Shibuya, Tokyo',
    place_type: 'other',
    notes: 'Visit the famous crossing and explore the shops',
  }),
  createMockActivity({
    id: '5',
    name: 'Hotel Check-in',
    address: 'Shinjuku, Tokyo',
    lat: 35.6938,
    lng: 139.7034,
    time_start: '18:00',
    place_type: 'hotel',
  }),
];

export const ActivityItemDemo: React.FC = () => {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const handleToggle = (activityId: string, completed: boolean) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (completed) {
        next.add(activityId);
      } else {
        next.delete(activityId);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-kawaii-cream-50 dark:bg-kawaii-neutral-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-kawaii-neutral-900 dark:text-kawaii-neutral-100 mb-2">
            ActivityItem Component Demo
          </h1>
          <p className="text-kawaii-neutral-600 dark:text-kawaii-neutral-400">
            Demonstrates the ActivityItem component with various configurations
          </p>
        </div>

        {/* Basic Example */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-kawaii-neutral-900 dark:text-kawaii-neutral-100">
            Basic Activities
          </h2>
          <div className="space-y-2">
            {demoActivities.map((activity) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                completed={completedIds.has(activity.id)}
                onCompletionToggle={(completed) => handleToggle(activity.id, completed)}
                onClick={() => console.log('Activity clicked:', activity.name)}
              />
            ))}
          </div>
        </section>

        {/* With Drag Handles */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-kawaii-neutral-900 dark:text-kawaii-neutral-100">
            With Drag Handles
          </h2>
          <p className="text-sm text-kawaii-neutral-600 dark:text-kawaii-neutral-400">
            Activities with drag handles for reordering (drag functionality not implemented in demo)
          </p>
          <div className="space-y-2">
            {demoActivities.slice(0, 3).map((activity) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                showDragHandle={true}
                onCompletionToggle={(completed) => handleToggle(activity.id, completed)}
              />
            ))}
          </div>
        </section>

        {/* Different Place Types */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-kawaii-neutral-900 dark:text-kawaii-neutral-100">
            Different Place Types
          </h2>
          <div className="space-y-2">
            <ActivityItem
              activity={createMockActivity({
                name: 'Museum Visit',
                place_type: 'attraction',
                time_start: '10:00',
              })}
            />
            <ActivityItem
              activity={createMockActivity({
                name: 'Lunch at Ramen Shop',
                place_type: 'food',
                time_start: '12:00',
              })}
            />
            <ActivityItem
              activity={createMockActivity({
                name: 'Hotel Check-in',
                place_type: 'hotel',
                time_start: '15:00',
              })}
            />
            <ActivityItem
              activity={createMockActivity({
                name: 'Taxi to Airport',
                place_type: 'transport',
                time_start: '18:00',
              })}
            />
            <ActivityItem
              activity={createMockActivity({
                name: 'Free Time',
                place_type: 'other',
              })}
            />
          </div>
        </section>

        {/* Completed State */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-kawaii-neutral-900 dark:text-kawaii-neutral-100">
            Completed Activities
          </h2>
          <div className="space-y-2">
            <ActivityItem
              activity={demoActivities[0]}
              completed={true}
              onCompletionToggle={() => {}}
            />
            <ActivityItem
              activity={demoActivities[1]}
              completed={true}
              onCompletionToggle={() => {}}
            />
          </div>
        </section>

        {/* Without Location */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-kawaii-neutral-900 dark:text-kawaii-neutral-100">
            Without Location Data
          </h2>
          <div className="space-y-2">
            <ActivityItem
              activity={createMockActivity({
                name: 'Morning Yoga',
                time_start: '07:00',
                notes: 'Bring yoga mat',
                place_type: 'other',
              })}
            />
            <ActivityItem
              activity={createMockActivity({
                name: 'Team Meeting',
                time_start: '14:00',
                notes: 'Discuss itinerary changes',
                place_type: 'other',
              })}
            />
          </div>
        </section>

        {/* With Travel Time */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-kawaii-neutral-900 dark:text-kawaii-neutral-100">
            With Travel Time Information
          </h2>
          <div className="space-y-2">
            <ActivityItem
              activity={createMockActivity({
                name: 'Kyoto Station',
                address: 'Kyoto Station, Kyoto',
                time_start: '09:00',
                place_type: 'transport',
                travel_time_text: '2 hours 30 mins',
                travel_distance_text: '450 km',
              })}
            />
            <ActivityItem
              activity={createMockActivity({
                name: 'Fushimi Inari Shrine',
                address: 'Fushimi Ward, Kyoto',
                time_start: '12:00',
                place_type: 'attraction',
                travel_time_text: '20 mins',
                travel_distance_text: '5.2 km',
              })}
            />
          </div>
        </section>

        {/* Interactive Example */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-kawaii-neutral-900 dark:text-kawaii-neutral-100">
            Interactive Example
          </h2>
          <p className="text-sm text-kawaii-neutral-600 dark:text-kawaii-neutral-400">
            Click activities to log to console, toggle checkboxes to mark complete, click locations to open Google Maps
          </p>
          <div className="space-y-2">
            {demoActivities.map((activity) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                completed={completedIds.has(activity.id)}
                onCompletionToggle={(completed) => {
                  handleToggle(activity.id, completed);
                  console.log(`${activity.name} marked as ${completed ? 'complete' : 'incomplete'}`);
                }}
                onClick={() => {
                  console.log('Activity clicked:', activity.name);
                  alert(`Clicked: ${activity.name}`);
                }}
                showDragHandle={true}
              />
            ))}
          </div>
        </section>

        {/* Usage Instructions */}
        <section className="bg-white dark:bg-kawaii-neutral-800 rounded-lg p-6 space-y-4">
          <h2 className="text-2xl font-semibold text-kawaii-neutral-900 dark:text-kawaii-neutral-100">
            Usage Instructions
          </h2>
          <div className="space-y-2 text-sm text-kawaii-neutral-600 dark:text-kawaii-neutral-400">
            <p>
              <strong>Click Activity:</strong> Click anywhere on the activity card to trigger the onClick handler
            </p>
            <p>
              <strong>Toggle Completion:</strong> Click the checkbox icon to mark activities as complete/incomplete
            </p>
            <p>
              <strong>Open Google Maps:</strong> Click the location link (with pin icon) to open the location in Google Maps
            </p>
            <p>
              <strong>Drag Handle:</strong> When showDragHandle is true, a drag handle appears for reordering (requires drag-and-drop implementation)
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ActivityItemDemo;
