import React, { useMemo } from 'react';
import { TripDayWithPlaces } from '../../types/trip';

interface TimelinePanelProps {
  days: TripDayWithPlaces[];
  tripId: string;
  onAddPlace: (dayId: string, type?: 'attraction' | 'food' | 'hotel' | 'transport') => void;
  onAddDay: () => void;
  children?: React.ReactNode;
}

export const TimelinePanel: React.FC<TimelinePanelProps> = ({
  days,
  onAddPlace,
  onAddDay,
  children,
}) => {
  // Group days by date
  const groupedDays = useMemo(() => {
    return days.sort((a, b) => a.day_number - b.day_number);
  }, [days]);

  const isEmpty = days.length === 0;

  return (
    <div className="timeline-panel">
      {/* Header */}
      <div className="timeline-header">
        <h2 className="timeline-title">Trip Timeline</h2>
        <button
          className="add-day-button"
          onClick={onAddDay}
          aria-label="Add new day"
        >
          <span className="button-icon">+</span>
          <span className="button-text">Add Day</span>
        </button>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3 className="empty-title">Start Planning Your Trip</h3>
          <p className="empty-description">
            Add your first day to begin building your itinerary
          </p>
          <button
            className="empty-action-button"
            onClick={onAddDay}
          >
            Add First Day
          </button>
        </div>
      )}

      {/* Timeline content */}
      {!isEmpty && (
        <div className="timeline-content">
          {children}
          
          {/* Quick action buttons */}
          <div className="quick-actions">
            <p className="quick-actions-label">Quick Add:</p>
            <div className="quick-actions-buttons">
              <button
                className="quick-action-button"
                onClick={() => onAddPlace(groupedDays[groupedDays.length - 1]?.id, 'attraction')}
                aria-label="Add attraction"
                title="Add attraction"
              >
                <span className="action-icon">🎯</span>
                <span className="action-label">Attraction</span>
              </button>
              <button
                className="quick-action-button"
                onClick={() => onAddPlace(groupedDays[groupedDays.length - 1]?.id, 'food')}
                aria-label="Add restaurant"
                title="Add restaurant"
              >
                <span className="action-icon">🍽️</span>
                <span className="action-label">Food</span>
              </button>
              <button
                className="quick-action-button"
                onClick={() => onAddPlace(groupedDays[groupedDays.length - 1]?.id, 'hotel')}
                aria-label="Add accommodation"
                title="Add accommodation"
              >
                <span className="action-icon">🏨</span>
                <span className="action-label">Hotel</span>
              </button>
              <button
                className="quick-action-button"
                onClick={() => onAddPlace(groupedDays[groupedDays.length - 1]?.id, 'transport')}
                aria-label="Add transport"
                title="Add transport"
              >
                <span className="action-icon">🚗</span>
                <span className="action-label">Transport</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .timeline-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: white;
        }

        .timeline-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid #e5e7eb;
          background: white;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .timeline-title {
          font-size: 20px;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .add-day-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .add-day-button:hover {
          background: #2563eb;
        }

        .add-day-button:active {
          transform: scale(0.98);
        }

        .button-icon {
          font-size: 18px;
          line-height: 1;
        }

        .button-text {
          line-height: 1;
        }

        /* Empty state */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
          flex: 1;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-title {
          font-size: 20px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 8px 0;
        }

        .empty-description {
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 24px 0;
          max-width: 300px;
        }

        .empty-action-button {
          padding: 12px 24px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .empty-action-button:hover {
          background: #2563eb;
        }

        /* Timeline content */
        .timeline-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
        }

        /* Quick actions */
        .quick-actions {
          padding: 16px 20px;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .quick-actions-label {
          font-size: 12px;
          font-weight: 500;
          color: #6b7280;
          margin: 0 0 8px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .quick-actions-buttons {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .quick-action-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px 8px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          min-height: 44px;
        }

        .quick-action-button:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .quick-action-button:active {
          transform: scale(0.98);
        }

        .action-icon {
          font-size: 20px;
          line-height: 1;
        }

        .action-label {
          font-size: 11px;
          font-weight: 500;
          color: #374151;
          line-height: 1;
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .timeline-header {
            padding: 12px 16px;
          }

          .timeline-title {
            font-size: 18px;
          }

          .add-day-button {
            padding: 6px 12px;
            font-size: 13px;
          }

          .quick-actions {
            padding: 12px 16px;
          }

          .quick-actions-buttons {
            grid-template-columns: repeat(4, 1fr);
          }

          .action-label {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
};
