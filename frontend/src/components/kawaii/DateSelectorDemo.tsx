/**
 * DateSelector Demo Component
 * 
 * Demonstrates the DateSelector component with various configurations.
 */

import React, { useState } from 'react';
import { DateSelector } from './DateSelector';
import { Card } from './Card';
import { addDays, format } from 'date-fns';

export const DateSelectorDemo: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Generate a week of dates starting from today
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  // Generate a longer trip (14 days)
  const longTripDates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

  // Generate dates across months
  const crossMonthDates = Array.from({ length: 10 }, (_, i) => 
    addDays(new Date('2024-03-28'), i)
  );

  return (
    <div className="min-h-screen bg-kawaii-cream-50 dark:bg-kawaii-neutral-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-kawaii-neutral-900 dark:text-kawaii-neutral-100 mb-2">
            DateSelector Component Demo
          </h1>
          <p className="text-kawaii-neutral-600 dark:text-kawaii-neutral-400">
            Horizontal scrollable date selector for trip navigation
          </p>
        </div>

        {/* Basic Example */}
        <Card>
          <h2 className="text-xl font-semibold text-kawaii-neutral-900 dark:text-kawaii-neutral-100 mb-4">
            Basic Example (7 Days)
          </h2>
          <DateSelector
            dates={weekDates}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
          <div className="mt-4 p-4 bg-kawaii-primary-50 dark:bg-kawaii-primary-900/20 rounded-lg">
            <p className="text-sm text-kawaii-neutral-700 dark:text-kawaii-neutral-300">
              <strong>Selected Date:</strong> {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
        </Card>

        {/* Long Trip Example */}
        <Card>
          <h2 className="text-xl font-semibold text-kawaii-neutral-900 dark:text-kawaii-neutral-100 mb-4">
            Long Trip (14 Days)
          </h2>
          <p className="text-sm text-kawaii-neutral-600 dark:text-kawaii-neutral-400 mb-4">
            Demonstrates horizontal scrolling with many dates
          </p>
          <DateSelector
            dates={longTripDates}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        </Card>

        {/* Cross-Month Example */}
        <Card>
          <h2 className="text-xl font-semibold text-kawaii-neutral-900 dark:text-kawaii-neutral-100 mb-4">
            Cross-Month Trip
          </h2>
          <p className="text-sm text-kawaii-neutral-600 dark:text-kawaii-neutral-400 mb-4">
            Dates spanning from March to April
          </p>
          <DateSelector
            dates={crossMonthDates}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        </Card>

        {/* Single Date Example */}
        <Card>
          <h2 className="text-xl font-semibold text-kawaii-neutral-900 dark:text-kawaii-neutral-100 mb-4">
            Single Day Trip
          </h2>
          <DateSelector
            dates={[new Date()]}
            selectedDate={new Date()}
            onDateSelect={setSelectedDate}
          />
        </Card>

        {/* With Custom Styling */}
        <Card>
          <h2 className="text-xl font-semibold text-kawaii-neutral-900 dark:text-kawaii-neutral-100 mb-4">
            With Custom Styling
          </h2>
          <DateSelector
            dates={weekDates}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            className="shadow-xl rounded-2xl"
          />
        </Card>

        {/* Features List */}
        <Card>
          <h2 className="text-xl font-semibold text-kawaii-neutral-900 dark:text-kawaii-neutral-100 mb-4">
            Features
          </h2>
          <ul className="space-y-2 text-kawaii-neutral-700 dark:text-kawaii-neutral-300">
            <li className="flex items-start gap-2">
              <span className="text-kawaii-primary-500 mt-1">✓</span>
              <span>Horizontal scrolling with smooth animations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-kawaii-primary-500 mt-1">✓</span>
              <span>Auto-scroll to center selected date</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-kawaii-primary-500 mt-1">✓</span>
              <span>Touch-optimized with 80x80px minimum targets</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-kawaii-primary-500 mt-1">✓</span>
              <span>Gradient fade edges for visual feedback</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-kawaii-primary-500 mt-1">✓</span>
              <span>Keyboard navigation support</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-kawaii-primary-500 mt-1">✓</span>
              <span>Dark mode support</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-kawaii-primary-500 mt-1">✓</span>
              <span>Framer Motion animations</span>
            </li>
          </ul>
        </Card>

        {/* Usage Example */}
        <Card>
          <h2 className="text-xl font-semibold text-kawaii-neutral-900 dark:text-kawaii-neutral-100 mb-4">
            Usage Example
          </h2>
          <pre className="bg-kawaii-neutral-100 dark:bg-kawaii-neutral-800 p-4 rounded-lg overflow-x-auto text-sm">
            <code>{`import { DateSelector } from '@/components/kawaii';
import { useState } from 'react';
import { addDays } from 'date-fns';

function ScheduleScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const tripDates = Array.from({ length: 7 }, (_, i) => 
    addDays(new Date(), i)
  );

  return (
    <DateSelector
      dates={tripDates}
      selectedDate={selectedDate}
      onDateSelect={setSelectedDate}
    />
  );
}`}</code>
          </pre>
        </Card>
      </div>
    </div>
  );
};
