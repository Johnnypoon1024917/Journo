/**
 * BubbleQuest DayCard Component - Redesigned
 * 
 * Matches the design with:
 * - Date header with large number
 * - Day title with cute cat mascot and stickers
 * - Route summary
 * - Hotel section
 * - Activity cards with time and location
 * - Floating add button
 */

import React, { useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { format } from 'date-fns';
import { TripDayWithPlaces, Place } from '@/types/trip';
import {
  MapPinIcon,
  SparklesIcon,
  EllipsisVerticalIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { StickerDisplay } from './StickerDisplay';

export interface DayCardProps {
  day: TripDayWithPlaces;
  tripId: string;
  onActivityClick?: (activity: Place) => void;
  onActivityReorder?: (activityId: string, newIndex: number) => void;
  onActivityToggle?: (activityId: string, isChecked: boolean) => void;
  onAddActivity?: () => void;
  enableStickers?: boolean;
  className?: string;
}

export const DayCardNew: React.FC<DayCardProps> = ({
  day,
  tripId,
  onActivityClick,
  onActivityReorder,
  onActivityToggle,
  onAddActivity,
  enableStickers = true,
  className = '',
}) => {
  const [activities, setActivities] = useState(day.places || []);

  // Parse date
  const dayDate = day.date ? new Date(day.date) : null;
  const dayOfWeek = dayDate ? format(dayDate, 'EEE') : '';
  const dayNumber = dayDate ? format(dayDate, 'd') : '';
  const monthName = dayDate ? format(dayDate, 'MMM') : '';

  // Extract day number from title (e.g., "Day 1 大阪" -> 1)
  // @ts-ignore - title property may not exist on all TripDayWithPlaces
  const dayNum = day.title?.match(/Day (\d+)/)?.[1] || '1';
  
  // Get hotel (first place with type 'hotel' or 'accommodation')
  // @ts-ignore - accommodation type check
  const hotel = activities.find(p => 
    // @ts-ignore
    p.place_type === 'hotel' || 
    // @ts-ignore
    p.place_type === 'accommodation' ||
    p.name?.toLowerCase().includes('hotel')
  );

  // Get non-hotel activities
  const regularActivities = activities.filter(p => p.id !== hotel?.id);

  // Generate route summary (first 3 activities)
  const routeSummary = regularActivities
    .slice(0, 3)
    .map(a => a.name)
    .join('→');

  const handleReorder = (newOrder: Place[]) => {
    setActivities(newOrder);
    
    // Notify parent of reorder
    newOrder.forEach((activity, index) => {
      if (activity.display_order !== index) {
        onActivityReorder?.(activity.id, index);
      }
    });
  };

  return (
    <motion.div
      className={`relative bg-cream rounded-3xl p-6 shadow-soft ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Date Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-baseline gap-3">
          <span className="text-coral-500 text-sm font-medium">{dayOfWeek}</span>
          <span className="text-coral-500 text-6xl font-bold leading-none">{dayNumber}</span>
          <span className="text-gray-400 text-lg">{monthName}</span>
        </div>
        
        {/* Options Menu */}
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <EllipsisVerticalIcon className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Day Title with Stickers */}
      <div className="relative mb-4">
        <div className="flex items-center justify-between">
          {/* @ts-ignore - title property may not exist */}
          <h2 className="text-2xl font-bold text-gray-800">{day.title || `Day ${dayNum}`}</h2>
          
          {/* Cute Cat Mascot with Stickers */}
          <div className="relative">
            <div className="text-6xl">
              🐱🍜
            </div>
            {/* Decorative stickers around cat */}
            <div className="absolute -top-2 -left-4 text-2xl">📖</div>
            <div className="absolute -top-4 right-0 text-2xl">🎌</div>
            <div className="absolute -bottom-2 -left-2 text-xl">🎵</div>
            <div className="absolute -bottom-2 right-2 text-2xl">📚</div>
          </div>
        </div>

        {/* Sticker Display Layer */}
        {enableStickers && (
          <div className="absolute inset-0 pointer-events-none">
            <StickerDisplay
              elementId={day.id}
              elementType="day"
              tripId={tripId}
              editable={true}
              className="pointer-events-auto"
            />
          </div>
        )}
      </div>

      {/* Route Summary */}
      {routeSummary && (
        <div className="flex items-center gap-2 mb-6 text-gray-600">
          <CheckCircleIconSolid className="w-5 h-5 text-green-500" />
          <span className="text-sm">{routeSummary}</span>
        </div>
      )}

      {/* Hotel Section */}
      {hotel && (
        <div className="mb-6 pb-6 border-b border-dashed border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-coral-100 rounded-xl flex items-center justify-center">
              <span className="text-xl">🏨</span>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-800 border-b-2 border-dotted border-gray-300 inline-block">
                {hotel.name}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Activity Schedule Section */}
      <div className="mb-4">
        <h3 className="text-gray-500 text-sm font-medium mb-4">活動安排</h3>
        
        <Reorder.Group
          axis="y"
          values={regularActivities}
          onReorder={handleReorder}
          className="space-y-3"
        >
          {regularActivities.map((activity) => (
            <Reorder.Item
              key={activity.id}
              value={activity}
              className="cursor-grab active:cursor-grabbing"
            >
              <motion.div
                className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center gap-3">
                  {/* Drag Handle */}
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <Bars3Icon className="w-4 h-4 text-gray-400" />
                  </button>

                  {/* Time */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-coral-100 rounded-full flex items-center justify-center">
                      <span className="text-coral-500 text-xs font-medium">
                        {activity.time_start ? format(new Date(`2000-01-01T${activity.time_start}`), 'HH:mm') : '12:45'}
                      </span>
                    </div>
                  </div>

                  {/* Location Icon & Name */}
                  <div className="flex-1 flex items-center gap-2">
                    <MapPinIcon className="w-5 h-5 text-coral-500" />
                    <span className="font-medium text-gray-800">{activity.name}</span>
                  </div>

                  {/* Checkbox */}
                  <button
                    onClick={() => onActivityToggle?.(activity.id, !activity.is_completed)}
                    className="flex-shrink-0"
                  >
                    {activity.is_completed ? (
                      <CheckCircleIconSolid className="w-6 h-6 text-green-500" />
                    ) : (
                      <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                    )}
                  </button>

                  {/* Options */}
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <EllipsisVerticalIcon className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </motion.div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>

      {/* Floating Add Button */}
      <motion.button
        onClick={onAddActivity}
        className="absolute bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-full shadow-lg flex items-center justify-center transition-all text-white"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <SparklesIcon className="w-6 h-6" />
      </motion.button>
    </motion.div>
  );
};

export default DayCardNew;
