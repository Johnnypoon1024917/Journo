import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
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

interface ItineraryViewProps {
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

interface EmptyDayDropZoneProps {
  dayId: string;
}

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
  const [isEditingTime, setIsEditingTime] = React.useState(false);
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

export const ItineraryView: React.FC<ItineraryViewProps> = ({
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
  const [activeId, setActiveId] = useState<string | null>(null);
  
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
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Reduced for more responsive drag
        tolerance: 2,
        delay: 100, // Small delay to prevent accidental drags
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

  const calculateDuration = (start: string, end: string): string => {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const diff = endMinutes - startMinutes;
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    if (hours > 0) return `${hours} hr${minutes > 0 ? ` ${minutes} mins` : ''}`;
    return `${minutes} mins`;
  };



  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    
    // Add haptic feedback on mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate([50]);
    }
    
    // Add visual feedback to body
    document.body.style.cursor = 'grabbing';
    document.body.classList.add('dragging');
    
    // Notify parent component
    onDragStart?.();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    
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
    } else {
      console.log('Drag end - Invalid move:', {
        sourceDayId,
        targetDayId,
        sourceIndex,
        targetIndex: targetIndex,
        overId,
      });
    }
  };



  // Add time to a base time
  const addMinutesToTime = (timeStr: string, minutesToAdd: number): string => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + minutesToAdd;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
  };



  // Get the active place being dragged
  const getActivePlace = (): Place | null => {
    if (!activeId) return null;
    for (const day of days) {
      const place = day.places.find(p => p.id === activeId);
      if (place) return place;
    }
    return null;
  };

  // Render drag overlay (the item that follows cursor)
  const renderDragOverlay = () => {
    const activePlace = getActivePlace();
    if (!activePlace) return null;

    return (
      <div className="drag-overlay-card">
        <div className="poi-information">
          <div className="poi-photo-and-title">
            <div className="poi-photo">
              {activePlace.image_url ? (
                <div
                  className="poi-photo-thumb"
                  style={{ backgroundImage: `url(${activePlace.image_url})` }}
                />
              ) : (
                <div className="poi-photo-thumb poi-photo-placeholder">
                  <span>📍</span>
                </div>
              )}
            </div>
            <div className="poi-info">
              <h3 className="poi-name">{activePlace.name}</h3>
              {activePlace.time_start && activePlace.time_end && (
                <div className="poi-stay-time">
                  <span className="stay-time-text">
                    Stay for <span>{calculateDuration(activePlace.time_start, activePlace.time_end)}</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render overview
  const renderOverview = () => {
    const totalPlaces = days.reduce((sum, day) => sum + day.places.length, 0);
    const totalDistance = days.reduce((sum, day) => {
      return sum + day.places.reduce((daySum, place) => daySum + (place.travel_distance_meters || 0), 0);
    }, 0);

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
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
          {activeId ? renderDragOverlay() : null}
        </DragOverlay>
      </DndContext>
    );
  };

  // Render day itinerary
  const renderDayItinerary = (day: TripDayWithPlaces) => {
    const startTime = day.places[0]?.time_start || '08:00';
    const placeIds = day.places.map(p => p.id);
    
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
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
          {activeId ? renderDragOverlay() : null}
        </DragOverlay>
      </DndContext>
    );
  };

  return (
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

      <div className="itinerary-content">
        {activeTab === 'overview' ? renderOverview() : renderDayItinerary(days.find((d) => d.day_number === activeTab)!)}
      </div>

      <style>{`
        .itinerary-view {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #f5f5f5;
        }

        .itinerary-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          background: white;
          border-bottom: 1px solid #e0e0e0;
        }

        .itinerary-title {
          font-size: 24px;
          font-weight: 600;
          margin: 0;
          color: #1a1a1a;
        }

        .edit-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border: none;
          background: transparent;
          color: #1a1a1a;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          border-radius: 6px;
          transition: background 0.2s;
        }

        .edit-btn:hover {
          background: #f5f5f5;
        }

        .edit-icon {
          font-size: 18px;
        }

        .trip-list-header-day-component {
          display: flex;
          gap: 8px;
          padding: 16px 24px;
          background: #f5f5f5;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .trip-list-header-day-component::-webkit-scrollbar {
          display: none;
        }

        .trip-overview-tab {
          flex-shrink: 0;
          min-width: 120px;
          padding: 16px 24px;
          cursor: pointer;
          transition: all 0.2s;
          background: white;
          font-size: 16px;
          font-weight: 600;
          color: #1a1a1a;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 24px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
        }

        .trip-overview-tab:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
          transform: translateY(-2px);
        }

        .trip-overview-tab.day-cell-current {
          background: white;
          box-shadow: 0 4px 12px rgba(233, 30, 99, 0.2);
          border-bottom: 3px solid #e91e63;
        }

        .day-cell {
          flex-shrink: 0;
          min-width: 120px;
          padding: 16px 24px;
          cursor: pointer;
          transition: all 0.2s;
          background: white;
          border-radius: 24px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
        }

        .day-cell:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
          transform: translateY(-2px);
        }

        .day-cell.day-cell-current {
          background: white;
          box-shadow: 0 4px 12px rgba(233, 30, 99, 0.2);
          border-bottom: 3px solid #e91e63;
        }

        .day-cell-wrap {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .day-cell-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .day-cell-content > span:first-child {
          font-size: 16px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .day-number {
          font-size: 13px;
          color: #666;
        }

        .add-day {
          min-width: 60px;
          background: white;
          border-radius: 24px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
        }

        .add-day:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
          transform: translateY(-2px);
        }

        .add-day a {
          font-size: 24px;
          color: #666;
          text-decoration: none;
          cursor: pointer;
        }

        .add-day:hover a {
          color: #e91e63;
        }

        .itinerary-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .overview-content {
          max-width: 800px;
        }

        .carbon-info {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .carbon-text {
          font-size: 14px;
          color: #666;
          line-height: 1.6;
          margin: 0;
        }

        .day-summary {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 16px;
          border: 1px solid #e0e0e0;
        }

        .day-summary-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .day-summary-title {
          font-size: 18px;
          font-weight: 600;
          color: #e91e63;
          margin: 0 0 4px 0;
        }

        .day-summary-date {
          font-size: 14px;
          color: #666;
          margin: 0;
        }

        .day-summary-timeline {
          position: relative;
          padding-left: 60px;
          min-height: 60px;
        }

        .day-summary-timeline::before {
          content: '';
          position: absolute;
          left: 43px;
          top: 40px;
          bottom: 0;
          width: 2px;
          background: #e0e0e0;
        }

        .empty-day-drop-zone {
          min-height: 120px;
          border: 3px dashed #d1d5db;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          position: relative;
          overflow: hidden;
          margin: 8px 0;
        }

        .empty-day-drop-zone::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(233, 30, 99, 0.2), transparent);
          transition: left 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .empty-day-drop-zone.drag-over {
          border-color: #e91e63;
          background: linear-gradient(135deg, #fef7f0 0%, #fce4ec 100%);
          box-shadow: 0 0 30px rgba(233, 30, 99, 0.4), inset 0 0 25px rgba(233, 30, 99, 0.1);
          transform: scale(1.02);
          animation: borderPulse 1s ease-in-out infinite;
        }

        .empty-day-drop-zone.drag-over::before {
          left: 100%;
        }

        @keyframes borderPulse {
          0%, 100% {
            border-color: #e91e63;
            box-shadow: 0 0 30px rgba(233, 30, 99, 0.4), inset 0 0 25px rgba(233, 30, 99, 0.1);
          }
          50% {
            border-color: #f06292;
            box-shadow: 0 0 40px rgba(240, 98, 146, 0.5), inset 0 0 30px rgba(240, 98, 146, 0.15);
          }
        }

        .empty-day-text {
          color: #999;
          font-size: 14px;
          margin: 0;
          transition: all 0.3s ease;
          position: relative;
          z-index: 1;
        }

        .empty-day-drop-zone.drag-over .empty-day-text {
          color: #e91e63;
          font-weight: 600;
          transform: scale(1.1);
        }

        .timeline-item-overview-container {
          position: relative;
          margin-bottom: 24px;
          transition: all 200ms cubic-bezier(0.2, 0, 0, 1);
        }

        .timeline-item-overview {
          position: relative;
          display: flex;
          align-items: flex-start;
          margin-bottom: 8px;
          transition: all 200ms cubic-bezier(0.2, 0, 0, 1);
        }

        .timeline-item-overview-container:hover {
          transform: translateX(2px);
        }

        .end-drop-zone {
          min-height: 40px;
          width: 100%;
        }

        .timeline-time-overview {
          position: absolute;
          left: -60px;
          top: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .place-card-overview {
          flex: 1;
          background: white;
          border-radius: 12px;
          padding: 14px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          position: relative;
          cursor: grab;
          transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          user-select: none;
          will-change: transform, box-shadow, scale;
          transform-origin: center;
          border: 2px solid transparent;
        }

        .place-card-overview:hover {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          transform: translateY(-3px) scale(1.02);
          border-color: rgba(233, 30, 99, 0.2);
        }

        .place-card-overview:active {
          cursor: grabbing;
          transform: scale(0.98);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        .drop-indicator-overview {
          height: 4px;
          background: linear-gradient(90deg, #e91e63, #f06292);
          border-radius: 2px;
          margin: 8px 0;
          box-shadow: 0 0 12px rgba(233, 30, 99, 0.6);
          animation: pulseGlow 0.8s ease-in-out infinite;
          pointer-events: none;
          position: relative;
        }

        .drop-indicator-overview::before {
          content: '';
          position: absolute;
          top: -2px;
          left: 0;
          right: 0;
          height: 8px;
          background: linear-gradient(90deg, rgba(233, 30, 99, 0.2), rgba(240, 98, 146, 0.2));
          border-radius: 4px;
          animation: pulseGlow 0.8s ease-in-out infinite;
        }

        .travel-segment-overview {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 12px 0 12px 0;
        }

        .travel-segment-overview .travel-time {
          position: absolute;
          left: -60px;
          font-size: 12px;
          font-weight: 600;
          color: #666;
          width: 50px;
          text-align: center;
        }

        .travel-segment-overview .travel-info {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #666;
          font-size: 13px;
          background: #f9f9f9;
          padding: 8px 12px;
          border-radius: 8px;
        }

        .place-card {
          background: white;
          border-radius: 12px;
          padding: 14px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          position: relative;
          cursor: grab;
          transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          user-select: none;
          will-change: transform, box-shadow, scale;
          transform-origin: center;
          border: 2px solid transparent;
        }

        .place-card:hover {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          transform: translateY(-3px) scale(1.02);
          border-color: rgba(233, 30, 99, 0.2);
        }

        .place-card:active {
          cursor: grabbing;
          transform: scale(0.98);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        .poi-information {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .poi-photo-and-title {
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }

        .drag-handle {
          flex-shrink: 0;
          padding: 8px 4px;
          cursor: grab;
          transition: all 0.2s ease;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.6;
          margin-right: 4px;
        }

        .drag-handle:hover {
          opacity: 1;
          background: rgba(233, 30, 99, 0.1);
          transform: scale(1.1);
        }

        .drag-handle:active {
          cursor: grabbing;
          transform: scale(0.95);
          background: rgba(233, 30, 99, 0.2);
        }

        .drag-handle svg {
          transition: all 0.2s ease;
        }

        .drag-handle:hover svg circle {
          fill: #e91e63;
        }

        .poi-photo {
          flex-shrink: 0;
          cursor: grab;
          transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
          position: relative;
          border-radius: 6px;
          overflow: hidden;
        }

        .poi-photo:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .poi-photo:active {
          cursor: grabbing;
          transform: scale(0.95);
        }

        /* Drag Overlay Styles */
        .drag-overlay-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(233, 30, 99, 0.3);
          cursor: grabbing;
          transform: rotate(3deg) scale(1.08);
          min-width: 320px;
          max-width: 420px;
          animation: dragFloat 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          border: 3px solid #e91e63;
          position: relative;
          backdrop-filter: blur(12px);
          z-index: 9999;
          will-change: transform;
        }

        .drag-overlay-card::before {
          content: '';
          position: absolute;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
          background: linear-gradient(45deg, #e91e63, #f06292, #e91e63, #f06292);
          border-radius: 20px;
          z-index: -1;
          opacity: 0.8;
          animation: borderGlow 2s ease-in-out infinite;
          background-size: 300% 300%;
        }

        .drag-overlay-card::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 120%;
          height: 120%;
          background: radial-gradient(circle, rgba(233, 30, 99, 0.1) 0%, transparent 70%);
          transform: translate(-50%, -50%);
          z-index: -2;
          animation: pulseGlow 1.5s ease-in-out infinite;
        }

        @keyframes dragFloat {
          0% {
            transform: rotate(0deg) scale(1);
            opacity: 0.8;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          }
          100% {
            transform: rotate(3deg) scale(1.08);
            opacity: 1;
            box-shadow: 0 30px 80px rgba(0, 0, 0, 0.4);
          }
        }

        @keyframes borderGlow {
          0%, 100% {
            opacity: 0.8;
            background-position: 0% 50%;
          }
          50% {
            opacity: 1;
            background-position: 100% 50%;
          }
        }

        .drag-overlay-card .poi-photo-thumb {
          width: 60px;
          height: 60px;
        }

        .drag-overlay-card .poi-name {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
        }

        .drag-overlay-card .stay-time-text {
          font-size: 13px;
          color: #e91e63;
          font-weight: 600;
        }

        .poi-photo-thumb {
          width: 70px;
          height: 70px;
          border-radius: 6px;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          background-color: #f5f5f5;
        }

        .poi-photo-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          color: #999;
        }

        .poi-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .poi-name {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .poi-stay-time {
          display: inline-block;
        }

        .stay-time-text {
          font-size: 12px;
          color: #e91e63;
          font-weight: 500;
        }

        .stay-time-text span {
          font-weight: 600;
        }

        .poi-description {
          font-size: 12px;
          color: #666;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .poi-address {
          display: block;
          margin-bottom: 2px;
          font-weight: 500;
        }

        .poi-notes {
          display: block;
        }

        .poi-action-buttons {
          margin-top: 6px;
        }

        .instant-confirmation-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: #e91e63;
          color: white;
          border: none;
          border-radius: 16px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .instant-confirmation-btn:hover {
          background: #d81b60;
        }

        .place-actions {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .place-card:hover .place-actions,
        .place-card-overview:hover .place-actions {
          opacity: 1;
        }

        .place-action-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: white;
          color: #666;
          font-size: 16px;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .place-action-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .edit-btn:hover {
          background: #e3f2fd;
        }

        .delete-btn:hover {
          background: #ffebee;
        }

        .drop-indicator {
          height: 4px;
          background: linear-gradient(90deg, #e91e63, #f06292);
          border-radius: 2px;
          margin: 8px 0;
          box-shadow: 0 0 12px rgba(233, 30, 99, 0.6);
          animation: pulseGlow 0.8s ease-in-out infinite;
          pointer-events: none;
          position: relative;
        }

        .drop-indicator::before {
          content: '';
          position: absolute;
          top: -2px;
          left: 0;
          right: 0;
          height: 8px;
          background: linear-gradient(90deg, rgba(233, 30, 99, 0.2), rgba(240, 98, 146, 0.2));
          border-radius: 4px;
          animation: pulseGlow 0.8s ease-in-out infinite;
        }

        @keyframes pulseGlow {
          0%,
          100% {
            opacity: 1;
            transform: scaleY(1);
            box-shadow: 0 0 12px rgba(233, 30, 99, 0.6);
          }
          50% {
            opacity: 0.7;
            transform: scaleY(1.2);
            box-shadow: 0 0 20px rgba(233, 30, 99, 0.8);
          }
        }

        .day-itinerary {
          max-width: 800px;
        }

        .day-header-info {
          background: white;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .day-title {
          font-size: 20px;
          font-weight: 600;
          color: #e91e63;
          margin: 0 0 4px 0;
        }

        .day-date {
          font-size: 13px;
          color: #666;
          margin: 0 0 12px 0;
        }

        .day-start-time {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .start-time-label {
          font-size: 13px;
          color: #666;
        }

        .start-time-value {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .timeline {
          position: relative;
          padding-left: 60px;
        }

        .timeline::before {
          content: '';
          position: absolute;
          left: 43px;
          top: 40px;
          bottom: 0;
          width: 2px;
          background: #e0e0e0;
        }

        .timeline-item {
          position: relative;
          margin-bottom: 24px;
          transition: all 200ms cubic-bezier(0.2, 0, 0, 1);
        }

        .timeline-item:hover {
          transform: translateX(2px);
        }

        .timeline-time {
          position: absolute;
          left: -60px;
          top: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .time-text {
          font-size: 13px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .timeline-dot {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #e91e63;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 2px 6px rgba(233, 30, 99, 0.3);
          position: relative;
          z-index: 1;
        }

        .timeline-item .place-card {
          margin-left: 0;
        }

        .timeline-drop {
          margin-left: 0;
          margin-bottom: 12px;
        }

        .travel-segment {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 12px 0 12px 0;
          padding-left: 0;
        }

        .travel-time {
          position: absolute;
          left: -60px;
          font-size: 12px;
          font-weight: 600;
          color: #666;
          width: 50px;
          text-align: center;
        }

        .travel-info {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #666;
          font-size: 13px;
          background: #f9f9f9;
          padding: 8px 12px;
          border-radius: 8px;
        }

        .travel-icon {
          font-size: 18px;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          margin-top: 24px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px 20px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          min-width: 100px;
          flex: 1;
          max-width: 140px;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }

        .action-btn.primary {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .action-btn.primary:hover {
          background: #2563eb;
          border-color: #2563eb;
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
        }

        .action-btn.primary:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
        }

        .action-btn.secondary {
          background: white;
          border-color: #e5e7eb;
          color: #374151;
        }

        .action-btn.secondary:hover {
          border-color: #3b82f6;
          background: #f8faff;
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .action-btn.secondary:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .action-icon {
          font-size: 24px;
          line-height: 1;
        }

        .action-label {
          font-size: 14px;
          font-weight: 600;
          line-height: 1.2;
        }

        .action-btn.primary .action-label {
          color: white;
        }

        .day-action-buttons-overview {
          display: flex;
          justify-content: center;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;
        }

        .day-action-btn-small {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 14px;
          font-weight: 600;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }

        .day-action-btn-small.primary {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .day-action-btn-small.primary:hover {
          background: #2563eb;
          border-color: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 3px 12px rgba(59, 130, 246, 0.3);
        }

        .day-action-btn-small.primary:active {
          transform: translateY(0);
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.2);
        }

        .action-icon-small {
          font-size: 18px;
          line-height: 1;
        }

        .action-label-small {
          font-size: 13px;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .itinerary-header {
            padding: 16px;
            background: linear-gradient(135deg, #fff 0%, #f8fafc 100%);
          }

          .itinerary-title {
            font-size: 20px;
            font-weight: 700;
          }

          .trip-list-header-day-component {
            padding: 12px 16px;
            gap: 8px;
            background: white;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            border-radius: 0 0 16px 16px;
            margin-bottom: 8px;
          }

          .trip-overview-tab,
          .day-cell {
            min-width: 100px;
            padding: 14px 18px;
            font-size: 14px;
            font-weight: 600;
            border-radius: 20px;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          }

          .trip-overview-tab:active,
          .day-cell:active {
            transform: scale(0.95);
            background: rgba(59, 130, 246, 0.1);
          }

          .itinerary-content {
            padding: 16px;
            background: #f8fafc;
          }

          .timeline {
            padding-left: 50px;
          }

          .timeline::before {
            left: 38px;
            background: linear-gradient(180deg, #e5e7eb, #3b82f6, #e5e7eb);
          }

          .timeline-time {
            left: -50px;
          }

          .travel-time {
            left: -50px;
          }

          .poi-photo-and-title {
            flex-direction: row;
            gap: 12px;
          }

          .poi-photo-thumb {
            width: 80px;
            height: 80px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .action-buttons {
            flex-direction: column;
            gap: 12px;
            padding: 0 8px;
            margin-top: 20px;
          }

          .action-btn {
            width: 100%;
            flex-direction: row;
            justify-content: flex-start;
            padding: 16px 20px;
            border-radius: 12px;
            font-weight: 600;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            min-height: 56px;
            max-width: none;
          }

          .action-btn .action-icon {
            font-size: 20px;
            margin-right: 12px;
          }

          .action-btn .action-label {
            font-size: 16px;
            text-align: left;
          }

          .action-btn:active {
            transform: scale(0.98);
          }

          .day-action-btn-small {
            padding: 14px 18px;
            border-radius: 10px;
            min-height: 48px;
          }

          .day-action-btn-small:active {
            transform: scale(0.98);
          }

          /* Enhanced place cards for mobile */
          .place-card,
          .place-card-overview {
            margin: 8px 0;
            border-radius: 16px;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
            border: 1px solid #e5e7eb;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          }

          .place-card:active,
          .place-card-overview:active {
            transform: scale(0.98);
            box-shadow: 0 4px 16px rgba(59, 130, 246, 0.15);
            border-color: #3b82f6;
          }

          /* Improved drag handles for mobile */
          .poi-photo {
            position: relative;
          }

          /* Better empty states */
          .empty-day-drop-zone {
            min-height: 120px;
            border: 2px dashed #cbd5e1;
            border-radius: 16px;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            margin: 12px 0;
          }

          .empty-day-text {
            font-size: 16px;
            font-weight: 600;
            color: #64748b;
          }

          /* Improved travel segments */
          .travel-segment,
          .travel-segment-overview {
            background: white;
            border-radius: 12px;
            padding: 12px;
            margin: 8px 0;
            box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
          }

          /* Better day summaries */
          .day-summary {
            border-radius: 16px;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
            border: 1px solid #e5e7eb;
            margin-bottom: 20px;
          }

          .day-summary-header {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-radius: 16px 16px 0 0;
            padding: 20px;
            border-bottom: 1px solid #e5e7eb;
          }

          /* Scroll improvements */
          .itinerary-content {
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
          }

          /* Accessibility improvements */
          .timeline-dot {
            width: 36px;
            height: 36px;
            font-size: 16px;
            font-weight: 700;
            box-shadow: 0 3px 8px rgba(233, 30, 99, 0.4);
          }

          .time-text {
            font-size: 14px;
            font-weight: 700;
            color: #1f2937;
          }
        }
      `}</style>
    </div>
  );
};

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
  if (!document.getElementById('itinerary-drag-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'itinerary-drag-styles';
    styleEl.textContent = globalStyles;
    document.head.appendChild(styleEl);
  }
}
