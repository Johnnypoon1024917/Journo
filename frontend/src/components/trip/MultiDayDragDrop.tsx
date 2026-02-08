import React from 'react';
import {
  DndContext,
  KeyboardSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  MouseSensor,
  DragOverEvent,
  pointerWithin,
} from '@dnd-kit/core';
import { Place } from '../../types/trip';
import { PlaceCard } from './PlaceCard';

interface MultiDayDragDropProps {
  children: React.ReactNode;
  onPlaceMove: (placeId: string, fromDayId: string, toDayId: string, newIndex: number) => void;
  onPlaceReorder?: (dayId: string, placeIds: string[]) => void;
  places: Place[];
}

export const MultiDayDragDrop: React.FC<MultiDayDragDropProps> = ({
  children,
  onPlaceMove,
  onPlaceReorder,
  places,
}) => {
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // Track drag over for visual feedback if needed
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activePlace = places.find((p) => p.id === active.id);
    if (!activePlace) {
      setActiveId(null);
      return;
    }

    // Check if we're dropping on a day container
    const overIdStr = over.id as string;
    
    // If dropping on a day container (starts with 'day-')
    if (overIdStr.startsWith('day-')) {
      const toDayId = overIdStr.replace('day-', '');
      const fromDayId = activePlace.trip_day_id;
      
      // Get places in target day
      const targetDayPlaces = places.filter((p) => p.trip_day_id === toDayId);
      const newIndex = targetDayPlaces.length;
      
      onPlaceMove(activePlace.id, fromDayId, toDayId, newIndex);
    }
    // If dropping on another place
    else {
      const overPlace = places.find((p) => p.id === over.id);
      if (overPlace) {
        const toDayId = overPlace.trip_day_id;
        const fromDayId = activePlace.trip_day_id;
        
        // Get places in target day
        const targetDayPlaces = places
          .filter((p) => p.trip_day_id === toDayId)
          .sort((a, b) => a.display_order - b.display_order);
        
        const overIndex = targetDayPlaces.findIndex((p) => p.id === over.id);
        
        // If moving within the same day, use reorder instead
        if (fromDayId === toDayId) {
          const currentIndex = targetDayPlaces.findIndex((p) => p.id === activePlace.id);
          if (currentIndex !== overIndex && currentIndex !== -1) {
            // Reorder the places array
            const reorderedPlaces = [...targetDayPlaces];
            const [movedPlace] = reorderedPlaces.splice(currentIndex, 1);
            reorderedPlaces.splice(overIndex, 0, movedPlace);
            
            // Call onPlaceReorder if available, otherwise fall back to onPlaceMove
            if (onPlaceReorder) {
              onPlaceReorder(toDayId, reorderedPlaces.map(p => p.id));
            } else {
              onPlaceMove(activePlace.id, fromDayId, toDayId, overIndex);
            }
          }
        } else {
          // Moving to a different day
          onPlaceMove(activePlace.id, fromDayId, toDayId, overIndex);
        }
      }
    }

    setActiveId(null);
    
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 20, 30]);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activePlace = places.find((p) => p.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}

      <DragOverlay
        dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}
      >
        {activePlace ? (
          <div className="drag-overlay">
            <PlaceCard
              place={activePlace}
              index={places.findIndex((p) => p.id === activePlace.id)}
              isDragging={true}
              onSelect={() => {}}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>

      <style>{`
        .drag-overlay {
          opacity: 0.9;
          transform: scale(1.02);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          border-radius: 12px;
          overflow: hidden;
          cursor: grabbing;
        }

        @media (max-width: 768px) {
          .drag-overlay {
            transform: scale(1.05);
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
          }
        }
      `}</style>
    </DndContext>
  );
};
