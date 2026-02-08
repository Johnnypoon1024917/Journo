import React, { useState } from 'react';

interface TransportModeSelectorProps {
  currentMode: string | null;
  travelTime: number | null; // in seconds
  onModeChange: (mode: string) => void;
}

const TRANSPORT_MODES = [
  { value: 'driving', icon: '🚗', label: 'Drive' },
  { value: 'transit', icon: '🚇', label: 'Transit' },
  { value: 'walking', icon: '🚶', label: 'Walk' },
  { value: 'flight', icon: '✈️', label: 'Flight' },
];

export const TransportModeSelector: React.FC<TransportModeSelectorProps> = ({
  currentMode,
  travelTime,
  onModeChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatTravelTime = (seconds: number | null): string => {
    if (!seconds || seconds === 0) return 'Calculating...';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getCurrentMode = () => {
    return TRANSPORT_MODES.find(m => m.value === currentMode) || TRANSPORT_MODES[0];
  };

  const mode = getCurrentMode();

  return (
    <div className="transport-mode-selector">
      <button
        className="transport-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Change transport mode"
      >
        <span className="transport-icon">{mode.icon}</span>
        <span className="transport-text">
          {formatTravelTime(travelTime)}
        </span>
      </button>

      {isOpen && (
        <>
          <div className="transport-overlay" onClick={() => setIsOpen(false)} />
          <div className="transport-dropdown">
            {TRANSPORT_MODES.map((transportMode) => (
              <button
                key={transportMode.value}
                className={`transport-option ${currentMode === transportMode.value ? 'active' : ''}`}
                onClick={() => {
                  onModeChange(transportMode.value);
                  setIsOpen(false);
                }}
              >
                <span className="transport-option-icon">{transportMode.icon}</span>
                <span className="transport-option-label">{transportMode.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <style>{`
        .transport-mode-selector {
          position: relative;
          display: inline-block;
        }

        .transport-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #f9f9f9;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 13px;
          color: #666;
        }

        .transport-button:hover {
          background: #fff;
          border-color: #e91e63;
          box-shadow: 0 2px 8px rgba(233, 30, 99, 0.15);
        }

        .transport-icon {
          font-size: 18px;
        }

        .transport-text {
          font-weight: 500;
        }

        .transport-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 999;
        }

        .transport-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          padding: 4px;
          z-index: 1000;
          min-width: 150px;
          animation: dropdownFadeIn 0.2s ease;
        }

        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .transport-option {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 10px 12px;
          background: transparent;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .transport-option:hover {
          background: #f5f5f5;
        }

        .transport-option.active {
          background: #fff5f8;
          color: #e91e63;
        }

        .transport-option-icon {
          font-size: 20px;
        }

        .transport-option-label {
          font-size: 14px;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};
