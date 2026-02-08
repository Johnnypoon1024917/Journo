import React from 'react';
import { Place, PlaceType } from '../../types/trip';
import { InlineTimeEditor } from './InlineTimeEditor';

interface PlaceCardProps {
  place: Place;
  index: number;
  isSelected?: boolean;
  isDragging?: boolean;
  hasTimeConflict?: boolean;
  conflictMessage?: string;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onRetry?: () => void;
  onTimeChange?: (placeId: string, startTime: string, endTime: string) => void;
  dragHandleProps?: any;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({
  place,
  index,
  isSelected = false,
  isDragging = false,
  hasTimeConflict = false,
  conflictMessage,
  onSelect,
  onEdit,
  onDelete,
  onRetry,
  onTimeChange,
  dragHandleProps,
}) => {
  const [isEditingTime, setIsEditingTime] = React.useState(false);
  const getPlaceIcon = (type: PlaceType | null): string => {
    switch (type) {
      case 'attraction':
        return '🎯';
      case 'food':
        return '🍽️';
      case 'hotel':
        return '🏨';
      case 'transport':
        return '🚗';
      case 'other':
      default:
        // Don't show generic pin icon since address section already has one
        return '';
    }
  };

  const formatTime = (time: string | null): string => {
    if (!time) return '--:--';
    return time;
  };

  const formatCost = (cost: number | null, currency: string | null): string => {
    if (!cost) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cost);
  };

  const calculateDuration = (): string | null => {
    if (!place.time_start || !place.time_end) return null;
    
    const [startHour, startMin] = place.time_start.split(':').map(Number);
    const [endHour, endMin] = place.time_end.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const durationMinutes = endMinutes - startMinutes;
    
    if (durationMinutes <= 0) return null;
    
    if (durationMinutes < 60) {
      return `${durationMinutes}m`;
    }
    
    const hours = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const hasError = !!place.sync_error;
  const isSyncing = place.is_syncing;
  const duration = calculateDuration();

  return (
    <div
      className={`place-card ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${hasError ? 'error' : ''} ${hasTimeConflict ? 'time-conflict' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-label={`${place.name} at ${formatTime(place.time_start)}`}
      onMouseDown={(e) => {
        // Prevent text selection when clicking
        if (e.detail > 1) {
          e.preventDefault();
        }
      }}
    >
      {/* Loading overlay */}
      {isSyncing && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
        </div>
      )}

      {/* Error overlay */}
      {hasError && (
        <div className="error-overlay">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <span className="error-text">Sync failed</span>
            {onRetry && (
              <button
                className="error-retry-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRetry();
                }}
                aria-label="Retry sync"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      <div className="place-card-content">
        {/* Drag handle */}
        <div
          className="drag-handle"
          {...dragHandleProps}
          aria-label="Drag to reorder"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="4" cy="4" r="1.5" fill="currentColor" />
            <circle cx="12" cy="4" r="1.5" fill="currentColor" />
            <circle cx="4" cy="8" r="1.5" fill="currentColor" />
            <circle cx="12" cy="8" r="1.5" fill="currentColor" />
            <circle cx="4" cy="12" r="1.5" fill="currentColor" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          </svg>
        </div>

        {/* Place number */}
        <div className="place-number">
          <span className="place-number-text">{index + 1}</span>
        </div>

        {/* Place info */}
        <div className="place-info">
          <div className="place-header">
            <span className="place-icon">{getPlaceIcon(place.place_type)}</span>
            <h4 className="place-name">{place.name}</h4>
          </div>
          
          <div className="place-details">
            {isEditingTime && onTimeChange ? (
              <div className="place-time-editor" onClick={(e) => e.stopPropagation()}>
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
              <div 
                className="place-time"
                onClick={(e) => {
                  if (onTimeChange) {
                    e.stopPropagation();
                    setIsEditingTime(true);
                  }
                }}
                style={{ cursor: onTimeChange ? 'pointer' : 'default' }}
              >
                <span className="time-value">
                  {place.calculated_arrival_time || formatTime(place.time_start)}
                </span>
                {duration && (
                  <span className="duration-badge">
                    <span className="duration-icon">⏱️</span>
                    {duration}
                  </span>
                )}
                {onTimeChange && (
                  <span className="time-edit-icon" title="Click to edit time">✏️</span>
                )}
              </div>
            )}
            
            {place.cost && (
              <div className="place-cost">
                <span className="cost-icon">💰</span>
                <span className="cost-value">{formatCost(place.cost, place.cost_currency)}</span>
              </div>
            )}

            {place.address && (
              <div className="place-address-inline">
                <span className="address-icon">📍</span>
              </div>
            )}
          </div>

          {/* Time conflict warning */}
          {hasTimeConflict && conflictMessage && (
            <div className="time-conflict-warning">
              <span className="conflict-icon">⚠️</span>
              <span className="conflict-text">{conflictMessage}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="place-actions">
          {onEdit && (
            <button
              className="action-button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              aria-label="Edit place"
              title="Edit"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.333 2.00004C11.5081 1.82494 11.716 1.68605 11.9447 1.59129C12.1735 1.49653 12.4187 1.44775 12.6663 1.44775C12.914 1.44775 13.1592 1.49653 13.3879 1.59129C13.6167 1.68605 13.8246 1.82494 13.9997 2.00004C14.1748 2.17513 14.3137 2.383 14.4084 2.61178C14.5032 2.84055 14.552 3.08575 14.552 3.33337C14.552 3.58099 14.5032 3.82619 14.4084 4.05497C14.3137 4.28374 14.1748 4.49161 13.9997 4.66671L5.33301 13.3334L1.33301 14.6667L2.66634 10.6667L11.333 2.00004Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          
          {onDelete && (
            <button
              className="action-button delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              aria-label="Delete place"
              title="Delete"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 4H3.33333H14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5.33301 4.00004V2.66671C5.33301 2.31309 5.47348 1.97395 5.72353 1.7239C5.97358 1.47385 6.31272 1.33337 6.66634 1.33337H9.33301C9.68663 1.33337 10.0258 1.47385 10.2758 1.7239C10.5259 1.97395 10.6663 2.31309 10.6663 2.66671V4.00004M12.6663 4.00004V13.3334C12.6663 13.687 12.5259 14.0261 12.2758 14.2762C12.0258 14.5262 11.6866 14.6667 11.333 14.6667H4.66634C4.31272 14.6667 3.97358 14.5262 3.72353 14.2762C3.47348 14.0261 3.33301 13.687 3.33301 13.3334V4.00004H12.6663Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Place image */}
      {place.image_url && (
        <div className="place-image">
          <img src={place.image_url} alt={place.name} />
        </div>
      )}

      <style>{`
        .place-card {
          position: relative;
          background: white;
          border: 2px solid #d1d5db;
          border-radius: 12px;
          margin: 6px 8px;
          overflow: hidden;
          cursor: pointer;
          transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          will-change: transform, box-shadow, border-color;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }

        .dark .place-card {
          background: #1f2937;
          border-color: #4b5563;
        }

        .place-card:hover {
          border-color: #2563eb;
          box-shadow: 0 8px 25px rgba(37, 99, 235, 0.15);
          transform: translateY(-3px) scale(1.01);
        }

        .place-card:active {
          transform: translateY(-1px) scale(0.99);
          transition: all 100ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Enhanced mobile touch feedback */
        @media (hover: none) and (pointer: coarse) {
          .place-card:active {
            background: rgba(59, 130, 246, 0.05);
            border-color: #3b82f6;
            transform: scale(0.98);
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
          }
        }

        .place-card:focus-visible {
          outline: 3px solid #3b82f6;
          outline-offset: 2px;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
        }

        .place-card.selected {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }

        .place-card.dragging {
          opacity: 0.6;
          transform: scale(0.98) rotate(2deg);
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          cursor: grabbing;
        }

        .place-card.error {
          border-color: #dc2626;
          border-width: 3px;
        }

        .dark .place-card.error {
          border-color: #ef4444;
        }

        .place-card.time-conflict {
          border-color: #d97706;
          border-width: 3px;
          background: #fef3c7;
        }

        .dark .place-card.time-conflict {
          background: #78350f;
          border-color: #f59e0b;
        }

        .loading-overlay,
        .error-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          backdrop-filter: blur(2px);
        }

        .loading-overlay {
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

        .error-overlay {
          animation: errorPulse 300ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes errorPulse {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          50% {
            transform: scale(1.02);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .error-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .error-icon {
          font-size: 20px;
        }

        .error-text {
          font-size: 13px;
          font-weight: 500;
          color: #ef4444;
        }

        .error-retry-button {
          padding: 6px 12px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .error-retry-button:hover {
          background: #b91c1c;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
        }

        .error-retry-button:active {
          transform: translateY(0);
        }

        .error-retry-button:focus-visible {
          outline: 3px solid #3b82f6;
          outline-offset: 2px;
        }

        .place-card-content {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 10px;
        }

        .drag-handle {
          flex-shrink: 0;
          width: 32px;
          height: 100%;
          min-height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          cursor: grab;
          touch-action: none;
          padding: 8px 4px;
          margin: -10px 0 -10px -10px;
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .drag-handle svg {
          pointer-events: none;
        }

        .drag-handle:hover {
          color: #3b82f6;
          transform: scale(1.1);
        }

        .drag-handle:active {
          cursor: grabbing;
          transform: scale(0.95);
        }

        .place-number {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #3b82f6;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .place-number-text {
          font-size: 14px;
          font-weight: 700;
          color: white;
        }

        .place-info {
          flex: 1;
          min-width: 0;
        }

        .place-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 2px;
        }

        .place-icon {
          font-size: 16px;
          line-height: 1;
        }

        .place-icon:empty {
          display: none;
        }

        .place-name {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }

        .dark .place-name {
          color: #f9fafb;
        }

        .place-details {
          display: flex;
          flex-wrap: nowrap;
          gap: 8px;
          align-items: center;
        }

        .place-time {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          white-space: nowrap;
          flex-wrap: wrap;
          position: relative;
          padding: 4px 6px;
          border-radius: 4px;
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .place-time:hover {
          background: #f3f4f6;
        }

        .dark .place-time:hover {
          background: #374151;
        }

        .place-time-editor {
          width: 100%;
          margin: 8px 0;
        }

        .time-edit-icon {
          font-size: 10px;
          opacity: 0;
          transition: opacity 150ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .place-time:hover .time-edit-icon {
          opacity: 0.6;
        }

        .place-cost {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 11px;
          white-space: nowrap;
          margin-left: auto;
        }

        .time-label {
          display: none;
        }

        .dark .time-label {
          color: #9ca3af;
        }

        .time-value {
          color: #1f2937;
          font-weight: 600;
          font-size: 11px;
        }

        .dark .time-value {
          color: #f9fafb;
        }

        .duration-badge {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          padding: 2px 6px;
          background: #dbeafe;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          color: #1e40af;
        }

        .dark .duration-badge {
          background: #1e3a8a;
          color: #bfdbfe;
        }

        .duration-icon {
          font-size: 9px;
        }

        .cost-icon {
          font-size: 11px;
        }

        .cost-value {
          color: #1f2937;
          font-weight: 600;
          font-size: 11px;
        }

        .dark .cost-value {
          color: #f9fafb;
        }

        .place-address-inline {
          display: flex;
          align-items: center;
        }

        .address-icon {
          font-size: 12px;
          flex-shrink: 0;
        }

        .time-conflict-warning {
          display: flex;
          align-items: flex-start;
          gap: 4px;
          padding: 6px 8px;
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 4px;
          margin-top: 6px;
        }

        .dark .time-conflict-warning {
          background: #78350f;
          border-color: #f59e0b;
        }

        .conflict-icon {
          font-size: 12px;
          flex-shrink: 0;
        }

        .conflict-text {
          font-size: 11px;
          color: #78350f;
          line-height: 1.4;
        }

        .dark .conflict-text {
          color: #fef3c7;
        }

        .place-actions {
          flex-shrink: 0;
          display: flex;
          gap: 4px;
          align-self: center;
        }

        .action-button {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          border: none;
          border-radius: 6px;
          color: #6b7280;
          cursor: pointer;
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
          padding: 8px;
        }

        .dark .action-button {
          background: #374151;
          color: #9ca3af;
        }

        .action-button:hover {
          background: #d1d5db;
          color: #1f2937;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .dark .action-button:hover {
          background: #4b5563;
          color: #f9fafb;
        }

        .action-button:active {
          transform: translateY(0);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .action-button:focus-visible {
          outline: 3px solid #3b82f6;
          outline-offset: 2px;
        }

        .action-button.delete:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        .dark .action-button.delete:hover {
          background: #7f1d1d;
          color: #fecaca;
        }

        .place-image {
          width: 100%;
          height: 120px;
          overflow: hidden;
        }

        .place-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .place-card {
            margin: 4px 6px;
          }

          .place-card-content {
            padding: 8px;
            gap: 6px;
          }

          .place-name {
            font-size: 13px;
          }

          .place-details {
            gap: 6px;
          }

          .place-number {
            width: 28px;
            height: 28px;
          }

          .place-number-text {
            font-size: 13px;
          }

          .action-button {
            width: 28px;
            height: 28px;
            padding: 6px;
          }

          .drag-handle {
            width: 16px;
            height: 16px;
          }
        }
      `}</style>
    </div>
  );
};
