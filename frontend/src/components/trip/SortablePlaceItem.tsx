import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { Place } from '../../types/trip';
import RichTextDisplay from '../common/RichTextDisplay';
import { InlineTimeEditor } from './InlineTimeEditor';

interface SortablePlaceItemProps {
  place: Place;
  index: number;
  onEdit: (place: Place) => void;
  onDelete: () => void;
  onTimeChange?: (placeId: string, startTime: string, endTime: string) => void;
  disabled: boolean;
}

export default function SortablePlaceItem({ place, index, onEdit, onDelete, onTimeChange, disabled }: SortablePlaceItemProps) {
  const [isEditingTime, setIsEditingTime] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: place.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms ease',
    opacity: isDragging ? 0.5 : 1,
  };

  const getPlaceTypeIcon = (type: string | null) => {
    switch (type) {
      case 'attraction':
        return '🎭';
      case 'food':
        return '🍽️';
      case 'hotel':
        return '🏨';
      case 'transport':
        return '🚗';
      default:
        return '📍';
    }
  };

  const formatTime = (time: string | null) => {
    if (!time) return '';
    return time.substring(0, 5); // HH:MM
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md ${
        isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Place Image */}
        {place.image_url && (
          <div className="flex-shrink-0">
            <img
              src={place.image_url}
              alt={place.name}
              className="w-20 h-20 object-cover rounded-lg"
            />
          </div>
        )}

        <div className="flex items-start space-x-3 flex-1">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="flex-shrink-0 cursor-move text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 pt-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>
          <div className="flex-shrink-0 text-2xl">
            {place.sticker || getPlaceTypeIcon(place.place_type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                #{index + 1}
              </span>
              <h5 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {place.name}
              </h5>
            </div>
            {place.address && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                📍 {place.address}
              </p>
            )}
            {(place.time_start || place.time_end) && (
              isEditingTime && onTimeChange ? (
                <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                  <InlineTimeEditor
                    startTime={place.time_start || '09:00'}
                    endTime={place.time_end || '10:00'}
                    onTimeChange={(start: string, end: string) => {
                      onTimeChange(place.id, start, end);
                      setIsEditingTime(false);
                    }}
                  />
                </div>
              ) : (
                <p 
                  className="text-xs text-gray-600 dark:text-gray-400 mt-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-1 py-0.5 inline-block transition-colors"
                  onClick={(e) => {
                    if (onTimeChange) {
                      e.stopPropagation();
                      setIsEditingTime(true);
                    }
                  }}
                  title={onTimeChange ? "Click to edit time" : undefined}
                >
                  🕐 {formatTime(place.time_start)} {place.time_end && `- ${formatTime(place.time_end)}`}
                  {onTimeChange && <span className="ml-1 opacity-50">✏️</span>}
                </p>
              )
            )}
            {place.cost && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                💰 {place.cost_currency} {place.cost.toFixed(2)}
                {place.budget_category && ` (${place.budget_category})`}
              </p>
            )}
            {place.travel_time_text && place.transport_mode !== 'flight' && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                🚗 {place.travel_time_text} ({place.travel_distance_text})
                {place.transport_mode && ` via ${place.transport_mode}`}
              </p>
            )}
            {place.transport_mode === 'flight' && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                ✈️ Flight
              </p>
            )}
            {place.notes && place.notes !== '<p></p>' && (
              <div className="mt-2 text-xs">
                <RichTextDisplay content={place.notes} showChecklistCount={true} />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-1 ml-2">
          <button
            onClick={() => onEdit(place)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
            title="Edit place"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            disabled={disabled}
            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
            title="Delete place"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
