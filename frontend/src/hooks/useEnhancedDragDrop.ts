import { useState, useCallback, useRef, useMemo } from 'react';
import { 
  DragEndEvent, 
  DragStartEvent, 
  DragOverEvent,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Place, TripDayWithPlaces } from '../types/trip';
import { LAYOUT_CONSTANTS } from '@/styles/layout-constants';

interface DragState {
  activeId: string | null;
  activePlace: Place | null;
  overId: string | null;
  dragOffset: { x: number; y: number } | null;
  isDragging: boolean;
}

interface UseEnhancedDragDropProps {
  days: TripDayWithPlaces[];
  onPlaceMove?: (placeId: string, fromDayId: string, toDayId: string, newIndex: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export const useEnhancedDragDrop = ({
  days,
  onPlaceMove,
  onDragStart,
  onDragEnd,
}: UseEnhancedDragDropProps) => {
  const [dragState, setDragState] = useState<DragState>({
    activeId: null,
    activePlace: null,
    overId: null,
    dragOffset: null,
    isDragging: false,
  });

  const dragStartTimeRef = useRef<number>(0);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Optimized sensors for better drag experience
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: LAYOUT_CONSTANTS.DRAG_ACTIVATION_DISTANCE,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: LAYOUT_CONSTANTS.DRAG_ACTIVATION_DELAY,
        tolerance: LAYOUT_CONSTANTS.DRAG_ACTIVATION_DISTANCE,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Auto-scroll during drag
  const handleAutoScroll = useCallback((clientY: number) => {
    const scrollContainer = document.querySelector('.enhanced-itinerary-overview, .enhanced-itinerary-day');
    if (!scrollContainer) return;

    const rect = scrollContainer.getBoundingClientRect();
    const scrollThreshold = 100;
    const scrollSpeed = 5;

    if (clientY < rect.top + scrollThreshold) {
      // Scroll up
      scrollContainer.scrollBy(0, -scrollSpeed);
    } else if (clientY > rect.bottom - scrollThreshold) {
      // Scroll down
      scrollContainer.scrollBy(0, scrollSpeed);
    }
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activePlace = days
      .flatMap(day => day.places)
      .find(place => place.id === active.id);

    if (activePlace) {
      dragStartTimeRef.current = Date.now();
      
      setDragState({
        activeId: active.id as string,
        activePlace,
        overId: null,
        dragOffset: null,
        isDragging: true,
      });

      // Haptic feedback for mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      // Add drag class to body for global styles
      document.body.classList.add('is-dragging');

      onDragStart?.();
    }
  }, [days, onDragStart]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over, delta } = event;
    
    setDragState(prev => ({
      ...prev,
      overId: over?.id as string || null,
      dragOffset: delta ? { x: delta.x, y: delta.y } : null,
    }));

    // Auto-scroll if dragging near edges
    if (event.activatorEvent && 'clientY' in event.activatorEvent) {
      handleAutoScroll(event.activatorEvent.clientY as number);
    }
  }, [handleAutoScroll]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { over } = event;
    const dragDuration = Date.now() - dragStartTimeRef.current;

    // Clear auto-scroll
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }

    // Remove drag class from body
    document.body.classList.remove('is-dragging');

    if (!over || !dragState.activePlace) {
      setDragState({
        activeId: null,
        activePlace: null,
        overId: null,
        dragOffset: null,
        isDragging: false,
      });
      onDragEnd?.();
      return;
    }

    const activePlace = dragState.activePlace;
    const overId = over.id as string;

    // Handle dropping on a day
    if (overId.startsWith('day-')) {
      const toDayId = overId.replace('day-', '');
      const fromDayId = activePlace.trip_day_id;
      
      if (toDayId !== fromDayId) {
        // Moving to a different day - add to end
        const targetDay = days.find(d => d.id === toDayId);
        const newIndex = targetDay?.places.length || 0;
        onPlaceMove?.(activePlace.id, fromDayId, toDayId, newIndex);
      }
    } else {
      // Handle dropping on another place (reordering)
      const targetPlace = days
        .flatMap(day => day.places)
        .find(place => place.id === overId);

      if (targetPlace && targetPlace.id !== activePlace.id) {
        const fromDayId = activePlace.trip_day_id;
        const toDayId = targetPlace.trip_day_id;
        
        if (fromDayId === toDayId) {
          // Same day reordering
          const day = days.find(d => d.id === fromDayId);
          if (day) {
            const oldIndex = day.places.findIndex(p => p.id === activePlace.id);
            const newIndex = day.places.findIndex(p => p.id === targetPlace.id);
            
            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
              onPlaceMove?.(activePlace.id, fromDayId, toDayId, newIndex);
            }
          }
        } else {
          // Cross-day move
          const targetDay = days.find(d => d.id === toDayId);
          if (targetDay) {
            const newIndex = targetDay.places.findIndex(p => p.id === targetPlace.id);
            onPlaceMove?.(activePlace.id, fromDayId, toDayId, newIndex);
          }
        }
      }
    }

    // Success haptic feedback
    if ('vibrate' in navigator) {
      if (dragDuration > 500) {
        // Long drag - stronger feedback
        navigator.vibrate([100, 50, 100]);
      } else {
        // Quick drag - light feedback
        navigator.vibrate(75);
      }
    }

    setDragState({
      activeId: null,
      activePlace: null,
      overId: null,
      dragOffset: null,
      isDragging: false,
    });

    onDragEnd?.();
  }, [dragState.activePlace, days, onPlaceMove, onDragEnd]);

  const isDraggedOver = useCallback((id: string) => {
    return dragState.overId === id && dragState.isDragging;
  }, [dragState.overId, dragState.isDragging]);

  const isDraggedItem = useCallback((id: string) => {
    return dragState.activeId === id && dragState.isDragging;
  }, [dragState.activeId, dragState.isDragging]);

  const canDropOnDay = useCallback((dayId: string) => {
    if (!dragState.activePlace) return false;
    
    // Can always drop on different days
    if (dragState.activePlace.trip_day_id !== dayId) return true;
    
    // Can drop on same day if it's empty (for reordering)
    const day = days.find(d => d.id === dayId);
    return day ? day.places.length <= 1 : false;
  }, [dragState.activePlace, days]);

  return {
    dragState,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    isDraggedOver,
    isDraggedItem,
    canDropOnDay,
  };
};

export default useEnhancedDragDrop;