import React, { useState, useEffect, useRef, useCallback } from 'react';

interface InlineTimeEditorProps {
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  onTimeChange: (start: string, end: string) => void;
  snapInterval?: number; // Default: 15 minutes
  enableHaptic?: boolean;
  minTime?: string; // Minimum allowed start time (HH:MM)
  maxTime?: string; // Maximum allowed end time (HH:MM)
  className?: string;
}

export const InlineTimeEditor: React.FC<InlineTimeEditorProps> = ({
  startTime,
  endTime,
  onTimeChange,
  snapInterval = 15,
  enableHaptic = true,
  minTime = '00:00',
  maxTime = '23:59',
  className = '',
}) => {
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  const [localStartTime, setLocalStartTime] = useState(startTime);
  const [localEndTime, setLocalEndTime] = useState(endTime);
  const trackRef = useRef<HTMLDivElement>(null);
  const lastHapticTimeRef = useRef<number>(0);

  // Update local state when props change
  useEffect(() => {
    setLocalStartTime(startTime);
    setLocalEndTime(endTime);
  }, [startTime, endTime]);

  // Convert HH:MM to minutes since midnight
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Convert minutes since midnight to HH:MM
  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60) % 24;
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  // Snap to nearest interval
  const snapToInterval = (minutes: number): number => {
    return Math.round(minutes / snapInterval) * snapInterval;
  };

  // Trigger haptic feedback (mobile only)
  const triggerHaptic = useCallback(() => {
    if (!enableHaptic) return;

    const now = Date.now();
    // Throttle haptic feedback to avoid excessive vibration
    if (now - lastHapticTimeRef.current < 100) return;
    lastHapticTimeRef.current = now;

    // Use Vibration API if available
    if ('vibrate' in navigator) {
      navigator.vibrate(10); // Short 10ms vibration
    }

    // Use Haptic Feedback API if available (iOS)
    if ('HapticFeedback' in window && typeof (window as any).HapticFeedback === 'object') {
      try {
        (window as any).HapticFeedback.impact({ style: 'light' });
      } catch (e) {
        // Silently fail if haptic feedback is not available
      }
    }
  }, [enableHaptic]);

  // Calculate position percentage from minutes
  const getPositionPercent = (minutes: number): number => {
    const minMinutes = timeToMinutes(minTime);
    const maxMinutes = timeToMinutes(maxTime);
    const range = maxMinutes - minMinutes;
    return ((minutes - minMinutes) / range) * 100;
  };

  // Calculate minutes from position percentage
  const getMinutesFromPercent = (percent: number): number => {
    const minMinutes = timeToMinutes(minTime);
    const maxMinutes = timeToMinutes(maxTime);
    const range = maxMinutes - minMinutes;
    return minMinutes + (percent / 100) * range;
  };

  // Handle mouse/touch move
  const handleMove = useCallback(
    (clientX: number, isStart: boolean) => {
      if (!trackRef.current) return;

      const rect = trackRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      const minutes = getMinutesFromPercent(percent);
      const snappedMinutes = snapToInterval(minutes);
      const newTime = minutesToTime(snappedMinutes);

      const startMinutes = timeToMinutes(isStart ? newTime : localStartTime);
      const endMinutes = timeToMinutes(isStart ? localEndTime : newTime);

      // Ensure start is before end (minimum 15 minutes apart)
      if (isStart) {
        if (startMinutes >= endMinutes - snapInterval) {
          return; // Don't allow start to pass end
        }
        if (localStartTime !== newTime) {
          triggerHaptic();
          setLocalStartTime(newTime);
        }
      } else {
        if (endMinutes <= startMinutes + snapInterval) {
          return; // Don't allow end to pass start
        }
        if (localEndTime !== newTime) {
          triggerHaptic();
          setLocalEndTime(newTime);
        }
      }
    },
    [localStartTime, localEndTime, snapInterval, triggerHaptic]
  );

  // Mouse event handlers
  const handleMouseDown = (isStart: boolean) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (isStart) {
      setIsDraggingStart(true);
    } else {
      setIsDraggingEnd(true);
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDraggingStart) {
        handleMove(e.clientX, true);
      } else if (isDraggingEnd) {
        handleMove(e.clientX, false);
      }
    },
    [isDraggingStart, isDraggingEnd, handleMove]
  );

  const handleMouseUp = useCallback(() => {
    if (isDraggingStart || isDraggingEnd) {
      // Commit changes
      onTimeChange(localStartTime, localEndTime);
      setIsDraggingStart(false);
      setIsDraggingEnd(false);
    }
  }, [isDraggingStart, isDraggingEnd, localStartTime, localEndTime, onTimeChange]);

  // Touch event handlers
  const handleTouchStart = (isStart: boolean) => (e: React.TouchEvent) => {
    e.preventDefault();
    if (isStart) {
      setIsDraggingStart(true);
    } else {
      setIsDraggingEnd(true);
    }
  };

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        if (isDraggingStart) {
          handleMove(touch.clientX, true);
        } else if (isDraggingEnd) {
          handleMove(touch.clientX, false);
        }
      }
    },
    [isDraggingStart, isDraggingEnd, handleMove]
  );

  const handleTouchEnd = useCallback(() => {
    if (isDraggingStart || isDraggingEnd) {
      // Commit changes
      onTimeChange(localStartTime, localEndTime);
      setIsDraggingStart(false);
      setIsDraggingEnd(false);
    }
  }, [isDraggingStart, isDraggingEnd, localStartTime, localEndTime, onTimeChange]);

  // Add/remove event listeners
  useEffect(() => {
    if (isDraggingStart || isDraggingEnd) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDraggingStart, isDraggingEnd, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Calculate positions
  const startMinutes = timeToMinutes(localStartTime);
  const endMinutes = timeToMinutes(localEndTime);
  const startPercent = getPositionPercent(startMinutes);
  const endPercent = getPositionPercent(endMinutes);

  // Calculate duration
  const durationMinutes = endMinutes - startMinutes;
  const durationHours = Math.floor(durationMinutes / 60);
  const durationMins = durationMinutes % 60;
  const durationText =
    durationHours > 0
      ? `${durationHours}h ${durationMins > 0 ? `${durationMins}m` : ''}`
      : `${durationMins}m`;

  return (
    <div className={`inline-time-editor ${className}`}>
      <div className="time-editor-header">
        <div className="time-display start">
          <span className="time-label">Start</span>
          <span className="time-value">{localStartTime}</span>
        </div>
        <div className="duration-display">
          <span className="duration-icon">⏱️</span>
          <span className="duration-value">{durationText.trim()}</span>
        </div>
        <div className="time-display end">
          <span className="time-label">End</span>
          <span className="time-value">{localEndTime}</span>
        </div>
      </div>

      <div className="time-slider-container">
        <div className="time-slider-track" ref={trackRef}>
          {/* Time range indicator */}
          <div
            className="time-range-indicator"
            style={{
              left: `${startPercent}%`,
              width: `${endPercent - startPercent}%`,
            }}
          />

          {/* Snap interval markers */}
          <div className="snap-markers">
            {Array.from({ length: Math.floor((timeToMinutes(maxTime) - timeToMinutes(minTime)) / snapInterval) + 1 }).map((_, i) => {
              const minutes = timeToMinutes(minTime) + i * snapInterval;
              const percent = getPositionPercent(minutes);
              const isHour = minutes % 60 === 0;
              return (
                <div
                  key={i}
                  className={`snap-marker ${isHour ? 'hour' : ''}`}
                  style={{ left: `${percent}%` }}
                >
                  {isHour && (
                    <span className="hour-label">{Math.floor(minutes / 60)}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Start thumb */}
          <div
            className={`time-thumb start ${isDraggingStart ? 'dragging' : ''}`}
            style={{ left: `${startPercent}%` }}
            onMouseDown={handleMouseDown(true)}
            onTouchStart={handleTouchStart(true)}
            role="slider"
            aria-label="Start time"
            aria-valuemin={timeToMinutes(minTime)}
            aria-valuemax={timeToMinutes(maxTime)}
            aria-valuenow={startMinutes}
            aria-valuetext={localStartTime}
            tabIndex={0}
          >
            <div className="thumb-handle" />
          </div>

          {/* End thumb */}
          <div
            className={`time-thumb end ${isDraggingEnd ? 'dragging' : ''}`}
            style={{ left: `${endPercent}%` }}
            onMouseDown={handleMouseDown(false)}
            onTouchStart={handleTouchStart(false)}
            role="slider"
            aria-label="End time"
            aria-valuemin={timeToMinutes(minTime)}
            aria-valuemax={timeToMinutes(maxTime)}
            aria-valuenow={endMinutes}
            aria-valuetext={localEndTime}
            tabIndex={0}
          >
            <div className="thumb-handle" />
          </div>
        </div>
      </div>

      <style>{`
        .inline-time-editor {
          padding: 16px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }

        .dark .inline-time-editor {
          background: #1f2937;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .time-editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          gap: 12px;
        }

        .time-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .time-label {
          font-size: 11px;
          font-weight: 500;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .dark .time-label {
          color: #9ca3af;
        }

        .time-value {
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
          font-variant-numeric: tabular-nums;
        }

        .dark .time-value {
          color: #f9fafb;
        }

        .time-display.start .time-value {
          color: #3b82f6;
        }

        .dark .time-display.start .time-value {
          color: #60a5fa;
        }

        .time-display.end .time-value {
          color: #8b5cf6;
        }

        .dark .time-display.end .time-value {
          color: #a78bfa;
        }

        .duration-display {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #f3f4f6;
          border-radius: 8px;
        }

        .dark .duration-display {
          background: #374151;
        }

        .duration-icon {
          font-size: 14px;
        }

        .duration-value {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          font-variant-numeric: tabular-nums;
        }

        .dark .duration-value {
          color: #f9fafb;
        }

        .time-slider-container {
          position: relative;
          padding: 24px 0;
        }

        .time-slider-track {
          position: relative;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          cursor: pointer;
        }

        .dark .time-slider-track {
          background: #4b5563;
        }

        .time-range-indicator {
          position: absolute;
          top: 0;
          height: 100%;
          background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
          border-radius: 4px;
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
        }

        .snap-markers {
          position: absolute;
          top: -12px;
          left: 0;
          right: 0;
          height: 32px;
          pointer-events: none;
        }

        .snap-marker {
          position: absolute;
          width: 1px;
          height: 6px;
          background: #d1d5db;
          transform: translateX(-50%);
        }

        .dark .snap-marker {
          background: #6b7280;
        }

        .snap-marker.hour {
          height: 10px;
          background: #9ca3af;
        }

        .dark .snap-marker.hour {
          background: #9ca3af;
        }

        .hour-label {
          position: absolute;
          top: -18px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 10px;
          font-weight: 500;
          color: #6b7280;
          white-space: nowrap;
        }

        .dark .hour-label {
          color: #9ca3af;
        }

        .time-thumb {
          position: absolute;
          top: 50%;
          width: 32px;
          height: 32px;
          transform: translate(-50%, -50%);
          cursor: grab;
          touch-action: none;
          z-index: 2;
          transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .time-thumb:hover {
          transform: translate(-50%, -50%) scale(1.1);
        }

        .time-thumb:active,
        .time-thumb.dragging {
          cursor: grabbing;
          transform: translate(-50%, -50%) scale(1.2);
          z-index: 3;
        }

        .time-thumb:focus-visible {
          outline: 3px solid #3b82f6;
          outline-offset: 2px;
          border-radius: 50%;
        }

        .thumb-handle {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: white;
          border: 3px solid #3b82f6;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .dark .thumb-handle {
          background: #1f2937;
          border-color: #60a5fa;
        }

        .time-thumb.end .thumb-handle {
          border-color: #8b5cf6;
        }

        .dark .time-thumb.end .thumb-handle {
          border-color: #a78bfa;
        }

        .time-thumb.dragging .thumb-handle {
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
        }

        .time-thumb.end.dragging .thumb-handle {
          box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .inline-time-editor {
            padding: 12px;
          }

          .time-editor-header {
            margin-bottom: 16px;
          }

          .time-value {
            font-size: 16px;
          }

          .duration-display {
            padding: 6px 12px;
          }

          .duration-value {
            font-size: 13px;
          }

          .time-thumb {
            width: 40px;
            height: 40px;
          }

          .time-slider-track {
            height: 10px;
          }
        }

        /* Animations */
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        .time-thumb.dragging .thumb-handle {
          animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};
