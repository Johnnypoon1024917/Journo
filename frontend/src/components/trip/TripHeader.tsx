import React from 'react';

interface TripHeaderProps {
  tripTitle: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  onBack?: () => void;
  onSettings?: () => void;
  onToggleSidebar?: () => void;
  onShare?: () => void;
}

export const TripHeader: React.FC<TripHeaderProps> = ({
  tripTitle,
  destination,
  startDate,
  endDate,
  onBack,
  onSettings,
  onToggleSidebar,
  onShare,
}) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="trip-header">
      <div className="header-left">
        {onBack && (
          <button onClick={onBack} className="header-button" aria-label="Go back">
            ←
          </button>
        )}
        {onToggleSidebar && (
          <button onClick={onToggleSidebar} className="header-button" aria-label="Toggle sidebar">
            ☰
          </button>
        )}
        <div className="trip-info">
          <h1 className="trip-title">{tripTitle}</h1>
          {(destination || (startDate && endDate)) && (
            <div className="trip-meta">
              {destination && <span className="destination">{destination}</span>}
              {startDate && endDate && (
                <span className="dates">
                  {formatDate(startDate)} - {formatDate(endDate)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="header-right">
        {onShare && (
          <button onClick={onShare} className="header-button" aria-label="Share trip">
            📤
          </button>
        )}
        {onSettings && (
          <button onClick={onSettings} className="header-button" aria-label="Settings">
            ⚙️
          </button>
        )}
      </div>

      <style>{`
        .trip-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: #4a1d5f;
          color: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-button {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 20px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .header-button:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .trip-info {
          min-width: 0;
          flex: 1;
        }

        .trip-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .trip-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;
          opacity: 0.9;
          margin-top: 2px;
        }

        .destination::before {
          content: '📍 ';
        }

        .dates::before {
          content: '📅 ';
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .trip-header {
            padding: 10px 12px;
          }

          .trip-title {
            font-size: 16px;
          }

          .trip-meta {
            font-size: 11px;
            gap: 8px;
          }

          .header-button {
            width: 36px;
            height: 36px;
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  );
};
