import React, { useState, useCallback } from 'react';
import { Place } from '../../types/trip';
import { PlaceCard } from './PlaceCard';
import { InlineTimeEditor } from './InlineTimeEditor';
import { InlineNotesAndCostEditor } from './InlineNotesAndCostEditor';

interface PlaceCardWithInlineEditorProps {
  place: Place;
  index: number;
  allPlacesInDay: Place[];
  isSelected?: boolean;
  isDragging?: boolean;
  hasTimeConflict?: boolean;
  conflictMessage?: string;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onRetry?: () => void;
  onTimeChange?: (placeId: string, startTime: string, endTime: string) => Promise<void>;
  onCascadeTimeUpdate?: (places: Place[], startIndex: number) => Promise<void>;
  onNotesAndCostChange?: (placeId: string, notes: string | null, cost: number | null, costCurrency: string) => Promise<void>;
  dragHandleProps?: any;
}

export const PlaceCardWithInlineEditor: React.FC<PlaceCardWithInlineEditorProps> = ({
  place,
  index,
  allPlacesInDay,
  isSelected = false,
  isDragging = false,
  hasTimeConflict = false,
  conflictMessage,
  onSelect,
  onEdit,
  onDelete,
  onRetry,
  onTimeChange,
  onCascadeTimeUpdate,
  onNotesAndCostChange,
  dragHandleProps,
}) => {
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [isSavingTime, setIsSavingTime] = useState(false);
  const [isEditingNotesAndCost, setIsEditingNotesAndCost] = useState(false);
  const [isSavingNotesAndCost, setIsSavingNotesAndCost] = useState(false);

  // Handle time badge click to open inline editor
  const handleTimeBadgeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (place.time_start && place.time_end) {
      setIsEditingTime(true);
    }
  }, [place.time_start, place.time_end]);

  // Handle time change from inline editor
  const handleTimeChange = useCallback(async (startTime: string, endTime: string) => {
    if (!onTimeChange) return;

    setIsSavingTime(true);
    try {
      // Update the current place's time
      await onTimeChange(place.id, startTime, endTime);

      // Calculate and update subsequent places
      if (onCascadeTimeUpdate) {
        const currentIndex = allPlacesInDay.findIndex(p => p.id === place.id);
        if (currentIndex !== -1 && currentIndex < allPlacesInDay.length - 1) {
          // Update the current place in the array with new times
          const updatedPlaces = [...allPlacesInDay];
          updatedPlaces[currentIndex] = {
            ...updatedPlaces[currentIndex],
            time_start: startTime,
            time_end: endTime,
          };
          
          // Cascade update to subsequent places
          await onCascadeTimeUpdate(updatedPlaces, currentIndex + 1);
        }
      }

      setIsEditingTime(false);
    } catch (error) {
      console.error('Failed to update time:', error);
      // Keep editor open on error so user can retry
    } finally {
      setIsSavingTime(false);
    }
  }, [place.id, allPlacesInDay, onTimeChange, onCascadeTimeUpdate]);

  // Handle close inline editor
  const handleCloseEditor = useCallback(() => {
    if (!isSavingTime) {
      setIsEditingTime(false);
    }
  }, [isSavingTime]);

  // Handle pencil icon click to open notes and cost editor
  const handlePencilClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingNotesAndCost(true);
  }, []);

  // Handle notes and cost change from inline editor
  const handleNotesAndCostChange = useCallback(async (notes: string | null, cost: number | null, costCurrency: string) => {
    if (!onNotesAndCostChange) return;

    setIsSavingNotesAndCost(true);
    try {
      await onNotesAndCostChange(place.id, notes, cost, costCurrency);
    } catch (error) {
      console.error('Failed to update notes and cost:', error);
      // Keep editor open on error so user can retry
    } finally {
      setIsSavingNotesAndCost(false);
    }
  }, [place.id, onNotesAndCostChange]);

  // Handle close notes and cost editor
  const handleCloseNotesAndCostEditor = useCallback(() => {
    if (!isSavingNotesAndCost) {
      setIsEditingNotesAndCost(false);
    }
  }, [isSavingNotesAndCost]);

  // Calculate minimum start time (based on previous place's end time)
  const getMinStartTime = useCallback((): string => {
    const currentIndex = allPlacesInDay.findIndex(p => p.id === place.id);
    if (currentIndex > 0) {
      const previousPlace = allPlacesInDay[currentIndex - 1];
      if (previousPlace.time_end) {
        return previousPlace.time_end;
      }
    }
    return '00:00';
  }, [place.id, allPlacesInDay]);

  return (
    <div className="place-card-with-inline-editor">
      {/* Place Card */}
      <div onClick={onSelect}>
        <PlaceCard
          place={place}
          index={index}
          isSelected={isSelected}
          isDragging={isDragging}
          hasTimeConflict={hasTimeConflict}
          conflictMessage={conflictMessage}
          onEdit={onEdit}
          onDelete={onDelete}
          onRetry={onRetry}
          dragHandleProps={dragHandleProps}
        />
      </div>

      {/* Pencil Icon Overlay - Clickable to open notes and cost editor */}
      {!isEditingNotesAndCost && onNotesAndCostChange && (
        <button
          className="pencil-icon-overlay"
          onClick={handlePencilClick}
          aria-label="Edit notes and cost"
          title="Click to edit notes and cost"
        >
          <span className="pencil-icon">✏️</span>
        </button>
      )}

      {/* Time Badge Overlay - Clickable to open editor */}
      {place.time_start && place.time_end && !isEditingTime && (
        <button
          className="time-badge-overlay"
          onClick={handleTimeBadgeClick}
          aria-label="Edit time"
          title="Click to edit time"
        >
          <span className="time-icon">⏱️</span>
          <span className="time-text">
            {place.time_start} - {place.time_end}
          </span>
          <span className="edit-hint">✏️</span>
        </button>
      )}

      {/* Inline Time Editor */}
      {isEditingTime && place.time_start && place.time_end && (
        <div className="inline-editor-container">
          <div className="inline-editor-backdrop" onClick={handleCloseEditor} />
          <div className="inline-editor-content">
            <div className="inline-editor-header">
              <h4 className="inline-editor-title">Adjust Time</h4>
              <button
                className="inline-editor-close"
                onClick={handleCloseEditor}
                disabled={isSavingTime}
                aria-label="Close editor"
              >
                ✕
              </button>
            </div>
            
            <InlineTimeEditor
              startTime={place.time_start}
              endTime={place.time_end}
              onTimeChange={handleTimeChange}
              snapInterval={15}
              enableHaptic={true}
              minTime={getMinStartTime()}
              maxTime="23:59"
            />

            {isSavingTime && (
              <div className="inline-editor-saving">
                <div className="saving-spinner" />
                <span>Updating times...</span>
              </div>
            )}

            <div className="inline-editor-hint">
              <span className="hint-icon">💡</span>
              <span className="hint-text">
                Drag the sliders to adjust start and end times. Changes will automatically update subsequent activities.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Inline Notes and Cost Editor */}
      {isEditingNotesAndCost && (
        <div className="inline-editor-container">
          <div className="inline-editor-backdrop" onClick={handleCloseNotesAndCostEditor} />
          <div className="inline-editor-content">
            <InlineNotesAndCostEditor
              notes={place.notes}
              cost={place.cost}
              costCurrency={place.cost_currency}
              onSave={handleNotesAndCostChange}
              onClose={handleCloseNotesAndCostEditor}
            />
          </div>
        </div>
      )}

      <style>{`
        .place-card-with-inline-editor {
          position: relative;
        }

        .pencil-icon-overlay {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          border: 2px solid #d1d5db;
          border-radius: 8px;
          cursor: pointer;
          transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 5;
        }

        .dark .pencil-icon-overlay {
          background: #374151;
          border-color: #4b5563;
        }

        .pencil-icon-overlay:hover {
          background: #dbeafe;
          border-color: #3b82f6;
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .dark .pencil-icon-overlay:hover {
          background: #1e3a8a;
          border-color: #60a5fa;
        }

        .pencil-icon-overlay:active {
          transform: scale(0.95);
        }

        .pencil-icon-overlay:focus-visible {
          outline: 3px solid #3b82f6;
          outline-offset: 2px;
        }

        .pencil-icon {
          font-size: 16px;
        }

        .time-badge-overlay {
          position: absolute;
          top: 50%;
          right: 60px;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #dbeafe;
          border: 2px solid #3b82f6;
          border-radius: 8px;
          cursor: pointer;
          transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 5;
        }

        .dark .time-badge-overlay {
          background: #1e3a8a;
          border-color: #60a5fa;
        }

        .time-badge-overlay:hover {
          background: #bfdbfe;
          border-color: #2563eb;
          transform: translateY(-50%) scale(1.05);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .dark .time-badge-overlay:hover {
          background: #1e40af;
          border-color: #3b82f6;
        }

        .time-badge-overlay:active {
          transform: translateY(-50%) scale(0.98);
        }

        .time-badge-overlay:focus-visible {
          outline: 3px solid #3b82f6;
          outline-offset: 2px;
        }

        .time-icon {
          font-size: 14px;
        }

        .time-text {
          font-size: 12px;
          font-weight: 600;
          color: #1e40af;
          font-variant-numeric: tabular-nums;
        }

        .dark .time-text {
          color: #bfdbfe;
        }

        .edit-hint {
          font-size: 12px;
          opacity: 0.7;
          transition: opacity 200ms;
        }

        .time-badge-overlay:hover .edit-hint {
          opacity: 1;
        }

        .inline-editor-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .inline-editor-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          animation: fadeIn 200ms ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .inline-editor-content {
          position: relative;
          width: 100%;
          max-width: 500px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 300ms cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        .dark .inline-editor-content {
          background: #1f2937;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .inline-editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .dark .inline-editor-header {
          border-bottom-color: #374151;
        }

        .inline-editor-title {
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }

        .dark .inline-editor-title {
          color: #f9fafb;
        }

        .inline-editor-close {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          border: none;
          border-radius: 8px;
          color: #6b7280;
          font-size: 18px;
          cursor: pointer;
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .dark .inline-editor-close {
          background: #374151;
          color: #9ca3af;
        }

        .inline-editor-close:hover:not(:disabled) {
          background: #e5e7eb;
          color: #1f2937;
          transform: scale(1.1);
        }

        .dark .inline-editor-close:hover:not(:disabled) {
          background: #4b5563;
          color: #f9fafb;
        }

        .inline-editor-close:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .inline-editor-close:focus-visible {
          outline: 3px solid #3b82f6;
          outline-offset: 2px;
        }

        .inline-editor-saving {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 16px;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
        }

        .dark .inline-editor-saving {
          background: #111827;
          border-top-color: #374151;
          color: #9ca3af;
        }

        .saving-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .inline-editor-hint {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 12px 20px;
          background: #f0f9ff;
          border-top: 1px solid #e0f2fe;
        }

        .dark .inline-editor-hint {
          background: #0c4a6e;
          border-top-color: #075985;
        }

        .hint-icon {
          font-size: 16px;
          flex-shrink: 0;
        }

        .hint-text {
          font-size: 12px;
          line-height: 1.5;
          color: #0369a1;
        }

        .dark .hint-text {
          color: #bae6fd;
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .pencil-icon-overlay {
            top: 8px;
            right: 8px;
            width: 32px;
            height: 32px;
          }

          .pencil-icon {
            font-size: 14px;
          }

          .time-badge-overlay {
            right: 50px;
            padding: 4px 8px;
            gap: 4px;
          }

          .time-text {
            font-size: 11px;
          }

          .inline-editor-container {
            padding: 12px;
          }

          .inline-editor-content {
            max-width: 100%;
          }

          .inline-editor-header {
            padding: 12px 16px;
          }

          .inline-editor-title {
            font-size: 16px;
          }

          .inline-editor-hint {
            padding: 10px 16px;
          }

          .hint-text {
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
};
