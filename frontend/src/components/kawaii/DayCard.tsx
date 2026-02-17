/**
 * Kawaii DayCard Component - Redesigned
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
  EllipsisVerticalIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { StickerCanvas } from '../stickers/organisms/StickerCanvas';

export interface DayCardProps {
  day: TripDayWithPlaces;
  tripId: string;
  onActivityClick?: (activity: Place) => void;
  onActivityReorder?: (activityId: string, newIndex: number) => void;
  onActivityToggle?: (activityId: string, isChecked: boolean) => void;
  enableStickers?: boolean;
  className?: string;
}

export const DayCard: React.FC<DayCardProps> = ({
  day,
  tripId,
  onActivityClick,
  onActivityReorder,
  onActivityToggle,
  enableStickers = true,
  className = '',
}) => {
  const [activities, setActivities] = useState(day.places || []);
  const [isDragging, setIsDragging] = useState(false);

  // Update activities when day prop changes, but only if not dragging
  React.useEffect(() => {
    if (!isDragging) {
      setActivities(day.places || []);
    }
  }, [day.places, isDragging]);
  
  // Prevent body scroll during drag
  React.useEffect(() => {
    if (isDragging) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDragging]);

  // Parse date
  const dayDate = day.date ? new Date(day.date) : null;
  const dayOfWeek = dayDate ? format(dayDate, 'EEE') : '';
  const dayNumber = dayDate ? format(dayDate, 'd') : '';
  const monthName = dayDate ? format(dayDate, 'MMM') : '';

  // Extract day number from day_number field
  const dayNum = day.day_number || 1;
  
  // Get hotel (first place with type 'hotel')
  const hotel = activities.find(p => 
    p.place_type === 'hotel' ||
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
    // Update local state immediately for smooth UI
    setActivities(newOrder);
    
    // Find the activity that actually moved
    const movedActivity = newOrder.find((activity, index) => {
      const oldIndex = activities.findIndex(a => a.id === activity.id);
      return oldIndex !== index;
    });
    
    if (movedActivity) {
      const newIndex = newOrder.findIndex(a => a.id === movedActivity.id);
      // Only notify parent once for the moved activity
      onActivityReorder?.(movedActivity.id, newIndex);
    }
  };

  return (
    <motion.div
      className={`relative bg-cream rounded-3xl p-6 shadow-md ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Date Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-baseline gap-3">
          <span className="text-kawaii-500 text-sm font-medium">{dayOfWeek}</span>
          <span className="text-kawaii-500 text-6xl font-bold leading-none">{dayNumber}</span>
          <span className="text-gray-400 text-lg">{monthName}</span>
        </div>
        
        {/* Options Menu */}
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <EllipsisVerticalIcon className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Day Title with Stickers */}
      <div className="relative mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Day {dayNum}</h2>

        {/* Sticker Display Layer - Above content but below modals */}
        {enableStickers && (
          <StickerCanvas
            key={day.id}
            elementId={day.id}
            elementType="day"
            tripId={tripId}
            editable={true}
            hasValues={true}
            className="absolute inset-0"
          />
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
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🏨 Hotel clicked:', hotel);
            onActivityClick?.(hotel);
          }}
          className="w-full mb-6 pb-6 border-b border-dashed border-gray-200 text-left hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-kawaii-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🏨</span>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-800 border-b-2 border-dotted border-gray-300 inline-block">
                {hotel.name}
              </h3>
            </div>
          </div>
        </button>
      )}

      {/* Activity Schedule Section */}
      <div className="bg-cream rounded-2xl p-4 shadow-md">
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
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => setIsDragging(false)}
            >
              <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  {/* Drag Handle */}
                  <div className="p-1 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing touch-none">
                    <Bars3Icon className="w-4 h-4 text-gray-400" />
                  </div>

                  {/* Time */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 flex items-center justify-center">
                      <span className="text-kawaii-500 text-xs font-medium">
                        {activity.time_start ? format(new Date(`2000-01-01T${activity.time_start}`), 'HH:mm') : '12:45'}
                      </span>
                    </div>
                  </div>

                  {/* Location Icon & Name - Clickable */}
                  <button
                    onClick={() => onActivityClick?.(activity)}
                    className="flex-1 flex items-center gap-2 text-left hover:opacity-70 transition-opacity"
                  >
                    <MapPinIcon className="w-5 h-5 text-kawaii-500" />
                    <span className="font-medium text-gray-800">{activity.name}</span>
                  </button>

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
                  <button 
                    onClick={() => onActivityClick?.(activity)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <EllipsisVerticalIcon className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>
    </motion.div>
  );
};

export default DayCard;
