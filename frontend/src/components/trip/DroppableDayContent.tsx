import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface DroppableDayContentProps {
  dayId: string;
  children: React.ReactNode;
  isEmpty?: boolean;
}

export const DroppableDayContent: React.FC<DroppableDayContentProps> = ({
  dayId,
  children,
  isEmpty = false,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${dayId}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`droppable-day-content ${isOver ? 'is-over' : ''} ${isEmpty ? 'is-empty' : ''}`}
    >
      {isEmpty ? (
        <div className="empty-drop-zone">
          <p className="empty-hint">Drag places here or click to add</p>
        </div>
      ) : (
        children
      )}

      <style>{`
        .droppable-day-content {
          min-height: 120px;
          width: 100%;
          flex: 1;
          transition: background-color 0.2s;
        }

        .droppable-day-content.is-over {
          background-color: rgba(59, 130, 246, 0.05);
        }

        .dark .droppable-day-content.is-over {
          background-color: rgba(59, 130, 246, 0.1);
        }

        .droppable-day-content.is-empty {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .droppable-day-content.is-empty.is-over {
          background-color: rgba(59, 130, 246, 0.1);
          border: 2px dashed #3b82f6;
          border-radius: 8px;
          margin: 8px 12px;
        }

        .empty-drop-zone {
          text-align: center;
          padding: 32px 20px;
        }

        .empty-icon {
          font-size: 32px;
          display: block;
          margin-bottom: 8px;
          opacity: 0.5;
        }

        .empty-hint {
          font-size: 13px;
          color: #9ca3af;
          margin: 0;
        }

        .dark .empty-hint {
          color: #6b7280;
        }

        .droppable-day-content.is-over .empty-hint {
          color: #3b82f6;
          font-weight: 500;
        }

        .droppable-day-content.is-over .empty-icon {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};
