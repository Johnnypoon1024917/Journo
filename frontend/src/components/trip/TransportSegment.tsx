import React from 'react';

export type TransportMode = 'driving' | 'walking' | 'transit' | 'flight';

interface TransportSegmentProps {
  mode: TransportMode;
  duration?: number; // in minutes
  distance?: number; // in meters
  durationSeconds?: number | null; // in seconds
  distanceMeters?: number | null; // in meters
  durationText?: string | null;
  distanceText?: string | null;
  isCalculating?: boolean;
  hasError?: boolean;
  errorMessage?: string | null;
  onModeChange?: (mode: TransportMode) => void;
  onRetry?: () => void | Promise<void>;
}

export const TransportSegment: React.FC<TransportSegmentProps> = ({
  mode,
  duration,
  distance,
  durationSeconds,
  distanceMeters,
  durationText,
  distanceText,
  isCalculating = false,
  hasError = false,
  errorMessage,
  onModeChange,
  onRetry,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);
  const getModeIcon = (transportMode: TransportMode): string => {
    switch (transportMode) {
      case 'driving':
        return '🚗';
      case 'walking':
        return '🚶';
      case 'transit':
        return '🚇';
      case 'flight':
        return '✈️';
    }
  };

  const formatDuration = (seconds?: number | null): string => {
    if (!seconds || seconds === 0) return '--';
    const minutes = Math.floor(seconds / 60);
    if (minutes === 0) return '< 1 min';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDistance = (meters?: number | null): string => {
    if (!meters || meters === 0) return '--';
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  // Use provided text or calculate from values
  // Priority: durationText > durationSeconds > duration (in minutes)
  const displayDuration = durationText || formatDuration(durationSeconds || (duration ? duration * 60 : null));
  const displayDistance = distanceText || formatDistance(distanceMeters || distance);
  
  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('TransportSegment:', {
      mode,
      durationSeconds,
      distanceMeters,
      durationText,
      distanceText,
      displayDuration,
      displayDistance,
    });
  }

  return (
    <div className={`transport-segment ${isCalculating ? 'transport-calculating' : ''}`}>
      <div className="transport-line" />
      
      <div className="transport-content">
        <div className="transport-icon">{getModeIcon(mode)}</div>
        
        <div className="transport-info">
          {isCalculating ? (
            <span className="transport-text calculating">Calculating route...</span>
          ) : hasError ? (
            <span className="transport-text error">
              {errorMessage || 'Route calculation failed'}
              {onRetry && (
                <button
                  className="transport-retry-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRetry();
                  }}
                  aria-label="Retry route calculation"
                >
                  Retry
                </button>
              )}
            </span>
          ) : (
            <>
              <span className="transport-text">
                {displayDuration} • {displayDistance}
              </span>
            </>
          )}
        </div>

        {onModeChange && !isCalculating && (
          <div className="transport-mode-dropdown" ref={dropdownRef}>
            <button
              className="transport-mode-trigger"
              onClick={(e) => {
                e.stopPropagation();
                setIsDropdownOpen(!isDropdownOpen);
              }}
              aria-label="Change transport mode"
              aria-expanded={isDropdownOpen}
            >
              {getModeIcon(mode)}
              <span className="dropdown-arrow">{isDropdownOpen ? '▲' : '▼'}</span>
            </button>
            
            {isDropdownOpen && (
              <div className="transport-mode-menu">
                {(['driving', 'walking', 'transit', 'flight'] as TransportMode[]).map((m) => (
                  <button
                    key={m}
                    className={`transport-mode-option ${mode === m ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onModeChange(m);
                      setIsDropdownOpen(false);
                    }}
                    aria-label={`Change to ${m}`}
                  >
                    <span className="mode-icon">{getModeIcon(m)}</span>
                    <span className="mode-label">{m.charAt(0).toUpperCase() + m.slice(1)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .transport-segment {
          position: relative;
          padding: 10px 16px;
          margin: 4px 8px;
        }

        .transport-line {
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(
            to bottom,
            #d1d5db 0%,
            #9ca3af 50%,
            #d1d5db 100%
          );
          transform: translateX(-50%);
        }

        .dark .transport-line {
          background: linear-gradient(
            to bottom,
            #4b5563 0%,
            #6b7280 50%,
            #4b5563 100%
          );
        }

        .transport-content {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f9fafb;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          padding: 8px 12px;
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .dark .transport-content {
          background: #111827;
          border-color: #374151;
        }

        .transport-content:hover {
          border-color: #3b82f6;
          background: white;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.12);
        }

        .dark .transport-content:hover {
          background: #1f2937;
        }

        .transport-calculating {
          animation: transportPulse 1.5s ease-in-out infinite;
        }

        @keyframes transportPulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }

        .transport-icon {
          font-size: 16px;
          line-height: 1;
          flex-shrink: 0;
        }

        .transport-info {
          flex: 1;
          min-width: 0;
        }

        .transport-text {
          font-size: 13px;
          color: #374151;
          font-weight: 600;
        }

        .dark .transport-text {
          color: #d1d5db;
        }

        .transport-text.calculating {
          font-style: italic;
        }

        .transport-text.error {
          color: #ef4444;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .dark .transport-text.error {
          color: #f87171;
        }

        .transport-retry-button {
          padding: 2px 8px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .transport-retry-button:hover {
          background: #dc2626;
          transform: translateY(-1px);
        }

        .transport-retry-button:active {
          transform: translateY(0);
        }

        .transport-mode-dropdown {
          position: relative;
          flex-shrink: 0;
        }

        .transport-mode-trigger {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 10px;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .dark .transport-mode-trigger {
          background: #374151;
          border-color: #4b5563;
        }

        .transport-mode-trigger:hover {
          background: #e5e7eb;
          border-color: #3b82f6;
        }

        .dark .transport-mode-trigger:hover {
          background: #4b5563;
        }

        .dropdown-arrow {
          font-size: 8px;
          color: #6b7280;
          transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .dark .dropdown-arrow {
          color: #9ca3af;
        }

        .transport-mode-menu {
          position: absolute;
          top: calc(100% + 4px);
          right: 0;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          padding: 4px;
          min-width: 140px;
          z-index: 50;
          animation: dropdownSlideIn 200ms cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: top right;
        }

        .dark .transport-mode-menu {
          background: #1f2937;
          border-color: #374151;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        @keyframes dropdownSlideIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .transport-mode-option {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 8px 12px;
          background: transparent;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
          text-align: left;
        }

        .transport-mode-option:hover {
          background: #f3f4f6;
        }

        .dark .transport-mode-option:hover {
          background: #374151;
        }

        .transport-mode-option.active {
          background: #eff6ff;
          color: #3b82f6;
        }

        .dark .transport-mode-option.active {
          background: #1e3a8a;
          color: #93c5fd;
        }

        .mode-icon {
          font-size: 16px;
          flex-shrink: 0;
        }

        .mode-label {
          font-weight: 500;
          color: #374151;
        }

        .dark .mode-label {
          color: #d1d5db;
        }

        .transport-mode-option.active .mode-label {
          color: #3b82f6;
          font-weight: 600;
        }

        .dark .transport-mode-option.active .mode-label {
          color: #93c5fd;
        }

        .transport-mode-option:focus-visible {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .transport-segment {
            padding: 6px 12px;
          }

          .transport-content {
            padding: 5px 8px;
          }

          .transport-icon {
            font-size: 14px;
          }

          .transport-text {
            font-size: 11px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .transport-calculating {
            animation: none;
          }
          
          .transport-mode-button:hover {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
};
