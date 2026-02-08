import React, { useState, useCallback, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  DragOverEvent,
  useDroppable,
  MouseSensor,
  TouchSensor,
  CollisionDetection,
  pointerWithin,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TripDayWithPlaces, Place } from '../../types/trip';
import { TransportModeSelector } from './TransportModeSelector';
import { InlineTimeEditor } from './InlineTimeEditor';
import './EnhancedItineraryView.css';

interface EnhancedItineraryViewProps {
  days: TripDayWithPlaces[];
  tripStartDate: string | null;
  activeTab?: 'overview' | number;
  onTabChange?: (tab: 'overview' | number) => void;
  onPlaceSelect?: (placeId: string) => void;
  onPlaceEdit?: (placeId: string) => void;
  onPlaceDelete?: (placeId: string) => void;
  onAddPlace?: (dayId: string, type?: string) => void;
  onAddDay?: () => void;
  onPlaceMove?: (placeId: string, fromDayId: string, toDayId: string, newIndex: number) => void;
  onTransportModeChange?: (placeId: string, mode: string) => void;
  onTimeChange?: (placeId: string, startTime: string, endTime: string) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

interface DragState {
  activeId: string | null;
  activePlace: Place | null;
  overId: string | null;
  dragOffset: { x: number; y: number } | null;
}

interface EmptyDayDropZoneProps {
  dayId: string;
}
interface DroppableDayProps {
  dayId: string;
  children: React.ReactNode;
  isEmpty?: boolean;
  isOver?: boolean;
  canDrop?: boolean;
  dayNumber: number;
}

interface SortablePlaceItemProps {
  place: Place;
  dayId: string;
  index: number;
  arrivalTime: string;
  onPlaceSelect?: (placeId: string) => void;
  onPlaceEdit?: (placeId: string) => void;
  onPlaceDelete?: (placeId: string) => void;
  onTimeChange?: (placeId: string, startTime: string, endTime: string) => void;
  calculateDuration: (start: string, end: string) => string;
  isDragging?: boolean;
  isOver?: boolean;
}

// Enhanced collision detection for better cross-day dragging
const customCollisionDetection: CollisionDetection = (args) => {
  // First, let's see if there are any collisions with the pointer
  const pointerCollisions = pointerWithin(args);
  
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }

  // If no pointer collisions, fall back to closest center
  return closestCenter(args);
};

const EmptyDayDropZone: React.FC<EmptyDayDropZoneProps> = ({ dayId }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `empty-day-${dayId}`,
    data: { dayId, isEmpty: true },
  });

  return (
    <div
      ref={setNodeRef}
      className={`empty-day-drop-zone ${isOver ? 'drag-over' : ''}`}
    >
      <p className="empty-day-text">Drop places here</p>
    </div>
  );
};
const DroppableDay: React.FC<DroppableDayProps> = ({ 
  dayId, 
  children, 
  isEmpty = false, 
  isOver = false, 
  canDrop = false,
  dayNumber
}) => {
  const { setNodeRef, isOver: dropIsOver } = useDroppable({
    id: `day-${dayId}`,
    data: { dayId, type: 'day', dayNumber },
  });

  const showDropIndicator = (dropIsOver || isOver) && canDrop;

  return (
    <div
      ref={setNodeRef}
      className={`
        droppable-day-container relative
        ${showDropIndicator ? 'drop-active' : ''}
        ${isEmpty ? 'is-empty' : ''}
        transition-all duration-300 ease-out
        ${showDropIndicator ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-400 rounded-xl shadow-lg' : ''}
        ${isEmpty && showDropIndicator ? 'min-h-40 flex items-center justify-center' : ''}
        ${showDropIndicator ? 'transform scale-[1.02]' : ''}
      `}
    >
      {isEmpty && showDropIndicator ? (
        <div className="text-center py-12 animate-pulse">
          <div className="text-blue-500 text-3xl mb-3 animate-bounce">📍</div>
          <p className="text-blue-700 font-semibold text-lg">Drop places here</p>
          <p className="text-blue-500 text-sm mt-1">or click to add a new place</p>
        </div>
      ) : (
        <div className="relative">
          {children}
          {showDropIndicator && !isEmpty && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100/60 to-indigo-100/60 border-2 border-dashed border-blue-400 rounded-xl pointer-events-none backdrop-blur-sm" />
          )}
        </div>
      )}
    </div>
  );
};
const SortablePlaceItem: React.FC<SortablePlaceItemProps> = ({
  place,
  index,
  arrivalTime,
  onPlaceSelect,
  onPlaceEdit,
  onPlaceDelete,
  onTimeChange,
  calculateDuration,
}) => {
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: sortableIsDragging,
  } = useSortable({ 
    id: place.id,
    data: { place, index, type: 'place' }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: sortableIsDragging ? 'none' : (transition || 'transform 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'),
    opacity: sortableIsDragging ? 0.8 : 1,
    zIndex: sortableIsDragging ? 1000 : 1,
    scale: sortableIsDragging ? '1.05' : (isHovered ? '1.01' : '1'),
    boxShadow: sortableIsDragging 
      ? '0 25px 50px rgba(0, 0, 0, 0.25), 0 10px 20px rgba(0, 0, 0, 0.15)' 
      : isHovered
        ? '0 8px 25px rgba(0, 0, 0, 0.12), 0 4px 10px rgba(0, 0, 0, 0.08)'
        : '0 2px 8px rgba(0, 0, 0, 0.06)',
    borderRadius: '16px',
    background: sortableIsDragging ? '#ffffff' : 'transparent',
    willChange: 'transform, box-shadow, scale',
  };
  return (
    <div className="timeline-item-overview-container">
      <div className="timeline-item-overview">
        <div className="timeline-time-overview">
          <span className="time-text">{arrivalTime}</span>
          <div className="timeline-dot">{index + 1}</div>
        </div>
        
        <div
          ref={setNodeRef}
          style={style}
          className="place-card-overview"
          onClick={() => onPlaceSelect?.(place.id)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="poi-information">
            <div className="poi-photo-and-title">
              <div className="drag-handle" {...attributes} {...listeners}>
                <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
                  <circle cx="2" cy="2" r="2" fill="#9CA3AF"/>
                  <circle cx="10" cy="2" r="2" fill="#9CA3AF"/>
                  <circle cx="2" cy="10" r="2" fill="#9CA3AF"/>
                  <circle cx="10" cy="10" r="2" fill="#9CA3AF"/>
                  <circle cx="2" cy="18" r="2" fill="#9CA3AF"/>
                  <circle cx="10" cy="18" r="2" fill="#9CA3AF"/>
                </svg>
              </div>
              <div className="poi-photo">
                {place.image_url ? (
                  <div
                    className="poi-photo-thumb"
                    style={{ backgroundImage: `url(${place.image_url})` }}
                  />
                ) : (
                  <div className="poi-photo-thumb poi-photo-placeholder">
                    <span>📍</span>
                  </div>
                )}
              </div>
              <div className="poi-info">
                <h3 className="poi-name">{place.name}</h3>
                {place.time_start && place.time_end && (
                  isEditingTime && onTimeChange ? (
                    <div className="poi-time-editor" onClick={(e) => e.stopPropagation()}>
                      <InlineTimeEditor
                        startTime={place.time_start}
                        endTime={place.time_end}
                        onTimeChange={(start: string, end: string) => {
                          onTimeChange(place.id, start, end);
                          setIsEditingTime(false);
                        }}
                      />
                    </div>
                  ) : (
                    <div 
                      className="poi-stay-time"
                      onClick={(e) => {
                        if (onTimeChange) {
                          e.stopPropagation();
                          setIsEditingTime(true);
                        }
                      }}
                      style={{ cursor: onTimeChange ? 'pointer' : 'default' }}
                    >
                      <span className="stay-time-text">
                        Stay for <span>{calculateDuration(place.time_start, place.time_end)}</span>
                        {onTimeChange && <span className="time-edit-icon" style={{ marginLeft: '4px', opacity: 0.5 }}>✏️</span>}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
            {(place.notes || place.address) && (
              <div className="poi-description">
                {place.address && <span className="poi-address">{place.address}</span>}
                {place.notes && <span className="poi-notes">{place.notes}</span>}
              </div>
            )}
          </div>
          
          <div className="place-actions">
            <button
              className="place-action-btn edit-btn"
              onClick={(e) => {
                e.stopPropagation();
                onPlaceEdit?.(place.id);
              }}
              title="Edit place"
            >
              ✏️
            </button>
            <button
              className="place-action-btn delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Are you sure you want to delete this place?')) {
                  onPlaceDelete?.(place.id);
                }
              }}
              title="Delete place"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
const SortableDayPlaceItem: React.FC<SortablePlaceItemProps> = ({
  place,
  index,
  arrivalTime,
  onPlaceSelect,
  onPlaceEdit,
  onPlaceDelete,
  calculateDuration,
}) => {
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
    transition: isDragging ? 'none' : (transition || 'transform 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'),
    opacity: isDragging ? 0.9 : 1,
    zIndex: isDragging ? 1000 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    scale: isDragging ? '1.02' : '1',
    boxShadow: isDragging ? '0 20px 60px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(233, 30, 99, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
    borderRadius: '12px',
    willChange: 'transform, box-shadow, scale',
  };

  return (
    <div className="timeline-item">
      <div className="timeline-time">
        <span className="time-text">{arrivalTime}</span>
        <div className="timeline-dot">{index + 1}</div>
      </div>

      <div
        ref={setNodeRef}
        style={style}
        className="place-card"
        onClick={() => onPlaceSelect?.(place.id)}
      >
        <div className="poi-information">
          <div className="poi-photo-and-title">
            <div className="drag-handle" {...attributes} {...listeners}>
              <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
                <circle cx="2" cy="2" r="2" fill="#9CA3AF"/>
                <circle cx="10" cy="2" r="2" fill="#9CA3AF"/>
                <circle cx="2" cy="10" r="2" fill="#9CA3AF"/>
                <circle cx="10" cy="10" r="2" fill="#9CA3AF"/>
                <circle cx="2" cy="18" r="2" fill="#9CA3AF"/>
                <circle cx="10" cy="18" r="2" fill="#9CA3AF"/>
              </svg>
            </div>
            <div className="poi-photo">
              {place.image_url ? (
                <div
                  className="poi-photo-thumb"
                  style={{ backgroundImage: `url(${place.image_url})` }}
                />
              ) : (
                <div className="poi-photo-thumb poi-photo-placeholder">
                  <span>📍</span>
                </div>
              )}
            </div>
            <div className="poi-info">
              <h3 className="poi-name">{place.name}</h3>
              {place.time_start && place.time_end && (
                <div className="poi-stay-time">
                  <span className="stay-time-text">
                    Stay for <span>{calculateDuration(place.time_start, place.time_end)}</span>
                  </span>
                </div>
              )}
            </div>
          </div>
          {(place.notes || place.address) && (
            <div className="poi-description">
              {place.address && <span className="poi-address">{place.address}</span>}
              {place.notes && <span className="poi-notes">{place.notes}</span>}
            </div>
          )}
        </div>
        
        <div className="place-actions">
          <button
            className="place-action-btn edit-btn"
            onClick={(e) => {
              e.stopPropagation();
              onPlaceEdit?.(place.id);
            }}
            title="Edit place"
          >
            ✏️
          </button>
          <button
            className="place-action-btn delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Are you sure you want to delete this place?')) {
                onPlaceDelete?.(place.id);
              }
            }}
            title="Delete place"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
};
const PlaceDragOverlay: React.FC<{ place: Place }> = ({ place }) => {
  return (
    <div className="drag-overlay-card">
      <div className="poi-information">
        <div className="poi-photo-and-title">
          <div className="poi-photo">
            {place.image_url ? (
              <div
                className="poi-photo-thumb"
                style={{ backgroundImage: `url(${place.image_url})` }}
              />
            ) : (
              <div className="poi-photo-thumb poi-photo-placeholder">
                <span>📍</span>
              </div>
            )}
          </div>
          <div className="poi-info">
            <h3 className="poi-name">{place.name}</h3>
            {place.time_start && place.time_end && (
              <div className="poi-stay-time">
                <span className="stay-time-text">
                  Stay for <span>{place.time_start} - {place.time_end}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export const EnhancedItineraryView: React.FC<EnhancedItineraryViewProps> = ({
  days,
  tripStartDate,
  activeTab: controlledActiveTab,
  onTabChange,
  onPlaceSelect,
  onPlaceEdit,
  onPlaceDelete,
  onAddPlace,
  onAddDay,
  onPlaceMove,
  onTransportModeChange,
  onTimeChange,
  onDragStart,
  onDragEnd,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<'overview' | number>('overview');
  const [dragState, setDragState] = useState<DragState>({
    activeId: null,
    activePlace: null,
    overId: null,
    dragOffset: null,
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Use controlled or uncontrolled tab state
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;
  const setActiveTab = (tab: 'overview' | number) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  // Format date helpers
  const formatDate = (dayNumber: number): string => {
    if (!tripStartDate) return `Day ${dayNumber}`;
    const startDate = new Date(tripStartDate);
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + (dayNumber - 1));
    return dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatFullDate = (dayNumber: number): string => {
    if (!tripStartDate) return `Day ${dayNumber}`;
    const startDate = new Date(tripStartDate);
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + (dayNumber - 1));
    return dayDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateDuration = useCallback((start: string, end: string): string => {
    if (!start || !end) return '';
    
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const duration = endMinutes - startMinutes;
    
    if (duration <= 0) return '';
    
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    if (hours === 0) return `${minutes} mins`;
    if (minutes === 0) return `${hours} hr`;
    return `${hours} hr ${minutes} mins`;
  }, []);
  // Add time to a base time
  const addMinutesToTime = (timeStr: string, minutesToAdd: number): string => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + minutesToAdd;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
  };

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activePlace = days
      .flatMap(day => day.places)
      .find(place => place.id === active.id);

    if (activePlace) {
      setDragState({
        activeId: active.id as string,
        activePlace,
        overId: null,
        dragOffset: null,
      });

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      // Add visual feedback to body
      document.body.style.cursor = 'grabbing';
      document.body.classList.add('dragging');

      onDragStart?.();
    }
  }, [days, onDragStart]);
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    setDragState(prev => ({
      ...prev,
      overId: over?.id as string || null,
    }));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    setDragState({
      activeId: null,
      activePlace: null,
      overId: null,
      dragOffset: null,
    });
    
    // Remove visual feedback from body
    document.body.style.cursor = '';
    document.body.classList.remove('dragging');
    
    // Notify parent component
    onDragEnd?.();

    if (!over || !onPlaceMove) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    // Add haptic feedback on successful drop
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 10, 30]);
    }

    // Create indexed lookups for better performance
    const dayIndex = new Map<string, number>();
    const placeToDay = new Map<string, string>();
    const placeIndex = new Map<string, number>();

    days.forEach((day, dayIdx) => {
      dayIndex.set(day.id, dayIdx);
      day.places.forEach((place, placeIdx) => {
        placeToDay.set(place.id, day.id);
        placeIndex.set(place.id, placeIdx);
      });
    });
    // Find source day and index using indexed lookups
    const sourceDayId = placeToDay.get(activeId);
    const sourceIndex = placeIndex.get(activeId);

    if (!sourceDayId || sourceIndex === undefined) return;

    // Check if dropping on empty day
    if (overId.startsWith('empty-day-')) {
      const targetDayId = overId.replace('empty-day-', '');
      console.log('Drag end - Moving to empty day:', {
        placeId: activeId,
        from: { dayId: sourceDayId, index: sourceIndex },
        to: { dayId: targetDayId, index: 0 },
      });
      
      onPlaceMove(activeId, sourceDayId, targetDayId, 0);
      return;
    }

    // Handle dropping on a day
    if (overId.startsWith('day-')) {
      const toDayId = overId.replace('day-', '');
      const fromDayId = sourceDayId;
      
      if (toDayId !== fromDayId) {
        // Moving to a different day - add to end
        const targetDay = days.find(d => d.id === toDayId);
        const newIndex = targetDay?.places.length || 0;
        onPlaceMove(activeId, fromDayId, toDayId, newIndex);
      }
      return;
    }

    // Find target day and index using indexed lookups
    const targetDayId = placeToDay.get(overId);
    const targetIndex = placeIndex.get(overId);

    if (targetDayId && targetIndex !== undefined) {
      console.log('Drag end - Moving place:', {
        placeId: activeId,
        from: { dayId: sourceDayId, index: sourceIndex },
        to: { dayId: targetDayId, index: targetIndex },
      });
      
      onPlaceMove(activeId, sourceDayId, targetDayId, targetIndex);
    }
  }, [dragState.activePlace, days, onPlaceMove, onDragEnd]);
  // Get the active place being dragged
  const getActivePlace = (): Place | null => {
    if (!dragState.activeId) return null;
    for (const day of days) {
      const place = day.places.find(p => p.id === dragState.activeId);
      if (place) return place;
    }
    return null;
  };

  // Render drag overlay (the item that follows cursor)
  const renderDragOverlay = () => {
    const activePlace = getActivePlace();
    if (!activePlace) return null;

    return (
      <PlaceDragOverlay 
        place={activePlace} 
      />
    );
  };

  // Render overview
  const renderOverview = () => {
    const totalPlaces = days.reduce((sum, day) => sum + day.places.length, 0);
    const totalDistance = days.reduce((sum, day) => {
      return sum + day.places.reduce((daySum, place) => daySum + (place.travel_distance_meters || 0), 0);
    }, 0);

    return (
      <div className="overview-content">
        <div className="carbon-info">
          <p className="carbon-text">
            The total carbon emissions for this trip are approximately 0.35 kg, covering {totalPlaces} attractions
            and traveling a total of {(totalDistance / 1000).toFixed(2)} kilometers.
          </p>
        </div>

        {days.map((day) => {
          const startTime = day.places[0]?.time_start || '08:00';
          const placeIds = day.places.map(p => p.id);
          const isEmpty = day.places.length === 0;
          const isOver = dragState.overId === `day-${day.id}`;
          const canDrop = dragState.activePlace !== null;
          
          return (
            <div key={day.id} className="day-summary">
              <div className="day-summary-header">
                <div>
                  <h3 className="day-summary-title">Day {day.day_number}</h3>
                  <p className="day-summary-date">{formatFullDate(day.day_number)}</p>
                </div>
                {day.places.length > 0 && (
                  <div className="day-start-time">
                    <span className="start-time-label">Start Time:</span>
                    <span className="start-time-value">{startTime}</span>
                  </div>
                )}
              </div>
              <SortableContext items={placeIds} strategy={verticalListSortingStrategy}>
                <DroppableDay
                  dayId={day.id}
                  isEmpty={isEmpty}
                  isOver={isOver}
                  canDrop={canDrop}
                  dayNumber={day.day_number}
                >
                  <div className="day-summary-timeline">
                    {day.places.length === 0 ? (
                      <EmptyDayDropZone dayId={day.id} />
                    ) : (
                      day.places.map((place, index) => {
                        // Calculate times
                        let arrivalTime = startTime;
                        if (index > 0) {
                          const prevPlace = day.places[index - 1];
                          const prevEndTime = prevPlace.time_end || addMinutesToTime(prevPlace.time_start || startTime, 60);
                          const travelMinutes = Math.floor((place.travel_time_seconds || 0) / 60);
                          arrivalTime = addMinutesToTime(prevEndTime, travelMinutes);
                        }
                        
                        const stayDuration = place.time_start && place.time_end 
                          ? Math.floor((new Date(`2000-01-01T${place.time_end}`).getTime() - new Date(`2000-01-01T${place.time_start}`).getTime()) / 60000)
                          : 60;
                        const departureTime = addMinutesToTime(arrivalTime, stayDuration);
                        
                        return (
                          <React.Fragment key={place.id}>
                            <SortablePlaceItem
                              place={place}
                              dayId={day.id}
                              index={index}
                              arrivalTime={arrivalTime}
                              onPlaceSelect={onPlaceSelect}
                              onPlaceEdit={onPlaceEdit}
                              onPlaceDelete={onPlaceDelete}
                              onTimeChange={onTimeChange}
                              calculateDuration={calculateDuration}
                            />
                            
                            {/* Travel segment */}
                            {index < day.places.length - 1 && (
                              <div className="travel-segment-overview">
                                <div className="travel-time">{departureTime}</div>
                                <TransportModeSelector
                                  currentMode={day.places[index + 1].transport_mode}
                                  travelTime={day.places[index + 1].travel_time_seconds}
                                  onModeChange={(mode) => onTransportModeChange?.(day.places[index + 1].id, mode)}
                                />
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </div>
                </DroppableDay>
              </SortableContext>
              {/* Add Place buttons for each day in overview */}
              <div className="day-action-buttons-overview">
                <button 
                  className="day-action-btn-small primary" 
                  onClick={() => onAddPlace?.(day.id, 'attraction')}
                  title="Add place to this day"
                >
                  <span className="action-icon-small">📍</span>
                  <span className="action-label-small">Add Place</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render day itinerary
  const renderDayItinerary = (day: TripDayWithPlaces) => {
    const startTime = day.places[0]?.time_start || '08:00';
    const placeIds = day.places.map(p => p.id);
    
    return (
      <div className="day-itinerary">
        <div className="day-header-info">
          <h2 className="day-title">Day {day.day_number}</h2>
          <p className="day-date">{formatFullDate(day.day_number)}</p>
          {day.places.length > 0 && (
            <div className="day-start-time">
              <span className="start-time-label">Start Time:</span>
              <span className="start-time-value">{startTime}</span>
            </div>
          )}
        </div>

        <SortableContext items={placeIds} strategy={verticalListSortingStrategy}>
          <div className="timeline">
            {day.places.length === 0 ? (
              <EmptyDayDropZone dayId={day.id} />
            ) : (
              day.places.map((place, index) => {
                // Calculate arrival time for this place
                let arrivalTime = startTime;
                if (index > 0) {
                  const prevPlace = day.places[index - 1];
                  const prevEndTime = prevPlace.time_end || addMinutesToTime(prevPlace.time_start || startTime, 60);
                  const travelMinutes = Math.floor((place.travel_time_seconds || 0) / 60);
                  arrivalTime = addMinutesToTime(prevEndTime, travelMinutes);
                }
                // Calculate departure time
                const stayDuration = place.time_start && place.time_end 
                  ? Math.floor((new Date(`2000-01-01T${place.time_end}`).getTime() - new Date(`2000-01-01T${place.time_start}`).getTime()) / 60000)
                  : 60;
                const departureTime = addMinutesToTime(arrivalTime, stayDuration);
                
                return (
                  <React.Fragment key={place.id}>
                    <SortableDayPlaceItem
                      place={place}
                      dayId={day.id}
                      index={index}
                      arrivalTime={arrivalTime}
                      onPlaceSelect={onPlaceSelect}
                      onPlaceEdit={onPlaceEdit}
                      onPlaceDelete={onPlaceDelete}
                      calculateDuration={calculateDuration}
                    />
                    
                    {/* Travel segment */}
                    {index < day.places.length - 1 && (
                      <div className="travel-segment">
                        <div className="travel-time">{departureTime}</div>
                        <TransportModeSelector
                          currentMode={day.places[index + 1].transport_mode}
                          travelTime={day.places[index + 1].travel_time_seconds}
                          onModeChange={(mode) => onTransportModeChange?.(day.places[index + 1].id, mode)}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </div>
        </SortableContext>

        <div className="action-buttons">
          <button 
            className="action-btn primary" 
            onClick={() => onAddPlace?.(day.id, 'attraction')}
          >
            <span className="action-icon">📍</span>
            <span className="action-label">Add Place</span>
          </button>
          <button 
            className="action-btn secondary" 
            onClick={() => onAddPlace?.(day.id, 'hotel')}
          >
            <span className="action-icon">🏨</span>
            <span className="action-label">Hotel</span>
          </button>
          <button 
            className="action-btn secondary" 
            onClick={() => onAddPlace?.(day.id, 'food')}
          >
            <span className="action-icon">🎫</span>
            <span className="action-label">Tours</span>
          </button>
        </div>
      </div>
    );
  };
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="itinerary-view">
        <div className="itinerary-header">
          <h1 className="itinerary-title">Itineraries</h1>
          <button className="edit-btn">
            <span className="edit-icon">✏️</span>
            Edit
          </button>
        </div>

        <div className="trip-list-header-day-component">
          <div
            className={`trip-overview-tab ${activeTab === 'overview' ? 'day-cell-current' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </div>
          {days.map((day) => (
            <div
              key={day.id}
              role="button"
              tabIndex={0}
              aria-disabled="false"
              aria-roledescription="sortable"
              className={`day-cell ${activeTab === day.day_number ? 'day-cell-current' : ''}`}
              style={{ opacity: 1 }}
              onClick={() => setActiveTab(day.day_number)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setActiveTab(day.day_number);
                }
              }}
            >
              <div className="day-cell-wrap">
                <div className="day-cell-content">
                  <span>{formatDate(day.day_number)}</span>
                  <span className="day-number">Day {day.day_number}</span>
                </div>
              </div>
            </div>
          ))}
          <div className="day-cell add-day" onClick={() => onAddDay?.()} style={{ cursor: 'pointer' }}>
            <div className="day-cell-wrap">
              <a>+</a>
            </div>
          </div>
        </div>

        <div ref={scrollContainerRef} className="itinerary-content">
          {activeTab === 'overview' ? renderOverview() : renderDayItinerary(days.find((d) => d.day_number === activeTab)!)}
        </div>
      </div>

      <DragOverlay 
        dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
        style={{
          cursor: 'grabbing',
          transform: 'rotate(2deg)',
        }}
      >
        {dragState.activeId ? renderDragOverlay() : null}
      </DragOverlay>
    </DndContext>
  );
};
export default EnhancedItineraryView;

// Add global dragging styles
if (typeof document !== 'undefined') {
  const globalStyles = `
    body.dragging {
      cursor: grabbing !important;
      user-select: none;
    }
    
    body.dragging * {
      cursor: grabbing !important;
    }
    
    .dragging .place-card,
    .dragging .place-card-overview {
      pointer-events: none;
    }
    
    .dragging .empty-day-drop-zone {
      border-style: solid;
      border-width: 3px;
      animation: readyToDrop 1s ease-in-out infinite;
    }
    
    @keyframes readyToDrop {
      0%, 100% {
        border-color: #d1d5db;
        background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
      }
      50% {
        border-color: #e91e63;
        background: linear-gradient(135deg, #fef7f0 0%, #fce4ec 100%);
      }
    }
  `;
  
  // Check if styles already exist
  if (!document.getElementById('enhanced-itinerary-drag-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'enhanced-itinerary-drag-styles';
    styleEl.textContent = globalStyles;
    document.head.appendChild(styleEl);
  }
}