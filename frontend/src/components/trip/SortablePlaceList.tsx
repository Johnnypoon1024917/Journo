import React from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Place } from '../../types/trip';
import { PlaceCard } from './PlaceCard';

interface SortablePlaceListProps {
  places: Place[];
  onReorder?: (places: Place[]) => void;
  onPlaceSelect?: (placeId: string) => void;
  onPlaceEdit?: (placeId: string) => void;
  onPlaceDelete?: (placeId: string) => void;
  onPlaceRetry?: (placeId: string) => void;
  selectedPlaceId?: string | null;
  renderBeforePlace?: (place: Place, index: number) => React.ReactNode;
}

interface SortablePlaceItemProps {
  place: Place;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRetry?: () => void;
  renderBefore?: React.ReactNode;
}

const SortablePlaceItem: React.FC<SortablePlaceItemProps> = ({
  place,
  index,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onRetry,
  renderBefore,
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
    transition,
  };

  return (
    <>
      {renderBefore}
      <div ref={setNodeRef} style={style}>
        <PlaceCard
          place={place}
          index={index}
          isSelected={isSelected}
          isDragging={isDragging}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
          onRetry={onRetry}
          dragHandleProps={{ ...attributes, ...listeners }}
        />
      </div>
    </>
  );
};

export const SortablePlaceList: React.FC<SortablePlaceListProps> = ({
  places,
  onPlaceSelect,
  onPlaceEdit,
  onPlaceDelete,
  onPlaceRetry,
  selectedPlaceId,
  renderBeforePlace,
}) => {
  // Note: We use the parent MultiDayDragDrop's DndContext for cross-day moves
  // This component only provides the SortableContext for within-day reordering
  
  return (
    <SortableContext items={places.map((p) => p.id)} strategy={verticalListSortingStrategy}>
      <div className="sortable-place-list">
        {places.map((place, index) => (
          <SortablePlaceItem
            key={place.id}
            place={place}
            index={index}
            isSelected={place.id === selectedPlaceId}
            onSelect={() => onPlaceSelect?.(place.id)}
            onEdit={() => onPlaceEdit?.(place.id)}
            onDelete={() => onPlaceDelete?.(place.id)}
            onRetry={() => onPlaceRetry?.(place.id)}
            renderBefore={renderBeforePlace?.(place, index)}
          />
        ))}
      </div>

      <style>{`
        .sortable-place-list {
          display: flex;
          flex-direction: column;
        }

        /* Touch action for better mobile performance */
        .sortable-place-list {
          touch-action: pan-y;
        }
      `}</style>
    </SortableContext>
  );
};
