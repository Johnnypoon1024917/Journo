import React, { useState, useEffect, useCallback } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface TripPlannerLayoutProps {
  timelinePanel: React.ReactNode;
  mapPanel: React.ReactNode;
  tripId: string;
}

type LayoutPreference = {
  timelineWidth: number;
  activePanel: 'timeline' | 'map';
};

const STORAGE_KEY = 'trip-planner-layout';
const MIN_PANEL_WIDTH = 300;
const DEFAULT_TIMELINE_WIDTH = 400;

export const TripPlannerLayout: React.FC<TripPlannerLayoutProps> = ({
  timelinePanel,
  mapPanel,
  tripId,
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
  
  // Load saved layout preference
  const [timelineWidth, setTimelineWidth] = useState<number>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}-${tripId}`);
    if (saved) {
      const parsed = JSON.parse(saved) as LayoutPreference;
      return parsed.timelineWidth || DEFAULT_TIMELINE_WIDTH;
    }
    return DEFAULT_TIMELINE_WIDTH;
  });

  const [activePanel, setActivePanel] = useState<'timeline' | 'map'>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}-${tripId}`);
    if (saved) {
      const parsed = JSON.parse(saved) as LayoutPreference;
      return parsed.activePanel || 'timeline';
    }
    return 'timeline';
  });

  const [isDragging, setIsDragging] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Save layout preference
  useEffect(() => {
    const preference: LayoutPreference = {
      timelineWidth,
      activePanel,
    };
    localStorage.setItem(`${STORAGE_KEY}-${tripId}`, JSON.stringify(preference));
  }, [timelineWidth, activePanel, tripId]);

  // Handle resize drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newWidth = e.clientX;
      if (newWidth >= MIN_PANEL_WIDTH && newWidth <= window.innerWidth - MIN_PANEL_WIDTH) {
        setTimelineWidth(newWidth);
      }
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle mobile swipe navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX === null) return;

      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;

      // Swipe threshold: 50px
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          // Swiped left - show map
          setActivePanel('map');
        } else {
          // Swiped right - show timeline
          setActivePanel('timeline');
        }
      }

      setTouchStartX(null);
    },
    [touchStartX]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '1') {
          e.preventDefault();
          setActivePanel('timeline');
        } else if (e.key === '2') {
          e.preventDefault();
          setActivePanel('map');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Mobile layout
  if (isMobile) {
    return (
      <div 
        className="trip-planner-layout-mobile"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Mobile navigation tabs */}
        <div className="mobile-tabs">
          <button
            className={`mobile-tab ${activePanel === 'timeline' ? 'active' : ''}`}
            onClick={() => setActivePanel('timeline')}
            aria-label="Show timeline"
          >
            <span className="tab-icon">📋</span>
            <span className="tab-label">Timeline</span>
          </button>
          <button
            className={`mobile-tab ${activePanel === 'map' ? 'active' : ''}`}
            onClick={() => setActivePanel('map')}
            aria-label="Show map"
          >
            <span className="tab-icon">🗺️</span>
            <span className="tab-label">Map</span>
          </button>
        </div>

        {/* Panel content */}
        <div className="mobile-panel-container">
          <div 
            className={`mobile-panel ${activePanel === 'timeline' ? 'active' : ''}`}
            role="tabpanel"
            aria-label="Timeline panel"
          >
            {timelinePanel}
          </div>
          <div 
            className={`mobile-panel ${activePanel === 'map' ? 'active' : ''}`}
            role="tabpanel"
            aria-label="Map panel"
          >
            {mapPanel}
          </div>
        </div>

        <style>{`
          .trip-planner-layout-mobile {
            display: flex;
            flex-direction: column;
            height: 100vh;
            overflow: hidden;
            background: #f9fafb;
          }

          .mobile-tabs {
            display: flex;
            background: white;
            border-bottom: 1px solid #e5e7eb;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            z-index: 10;
            position: relative;
          }

          .mobile-tabs::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: ${activePanel === 'timeline' ? '0' : '50%'};
            width: 50%;
            height: 3px;
            background: linear-gradient(90deg, #3b82f6, #1d4ed8);
            border-radius: 2px 2px 0 0;
            transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 -2px 8px rgba(59, 130, 246, 0.3);
          }

          .mobile-tab {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            padding: 16px 12px;
            background: none;
            border: none;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            color: #6b7280;
            position: relative;
            min-height: 64px;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          }

          .mobile-tab:active {
            transform: scale(0.95);
            background: rgba(59, 130, 246, 0.05);
          }

          .mobile-tab.active {
            color: #3b82f6;
            transform: translateY(-1px);
          }

          .mobile-tab.active .tab-icon {
            transform: scale(1.1);
            filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3));
          }

          .tab-icon {
            font-size: 22px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
          }

          .tab-label {
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 0.5px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .mobile-panel-container {
            flex: 1;
            position: relative;
            overflow: hidden;
          }

          .mobile-panel {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            opacity: 0;
            pointer-events: none;
            transform: translateX(${activePanel === 'timeline' ? '0' : '100%'});
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            will-change: transform, opacity;
          }

          .mobile-panel.active {
            opacity: 1;
            pointer-events: auto;
            transform: translateX(0);
          }

          /* Swipe indicator */
          .mobile-panel-container::before {
            content: '';
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: 40px;
            height: 4px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 2px;
            z-index: 5;
            opacity: 0.6;
            animation: swipeHint 3s ease-in-out infinite;
          }

          @keyframes swipeHint {
            0%, 100% { opacity: 0.3; transform: translateX(-50%) scaleX(1); }
            50% { opacity: 0.6; transform: translateX(-50%) scaleX(1.2); }
          }

          /* Enhanced touch feedback */
          @media (hover: none) and (pointer: coarse) {
            .mobile-tab {
              padding: 18px 12px;
            }
            
            .mobile-tab:active {
              background: rgba(59, 130, 246, 0.1);
              transform: scale(0.98);
            }
          }

          /* Accessibility improvements */
          @media (prefers-reduced-motion: reduce) {
            .mobile-tabs::after,
            .mobile-tab,
            .tab-icon,
            .tab-label,
            .mobile-panel {
              transition: none;
            }
            
            .mobile-panel-container::before {
              animation: none;
            }
          }

          /* High contrast mode */
          @media (prefers-contrast: high) {
            .mobile-tabs {
              border-bottom: 2px solid #000;
            }
            
            .mobile-tab.active {
              color: #000;
              background: rgba(0, 0, 0, 0.1);
            }
            
            .mobile-tabs::after {
              background: #000;
            }
          }
        `}</style>
      </div>
    );
  }

  // Desktop/Tablet layout
  return (
    <div className="trip-planner-layout">
      {/* Timeline panel */}
      <div 
        className="timeline-panel"
        style={{ width: isTablet ? '50%' : `${timelineWidth}px` }}
        role="region"
        aria-label="Timeline panel"
      >
        {timelinePanel}
      </div>

      {/* Resize handle (desktop only) */}
      {!isTablet && (
        <div
          className={`resize-handle ${isDragging ? 'dragging' : ''}`}
          onMouseDown={handleMouseDown}
          role="separator"
          aria-label="Resize panels"
          aria-orientation="vertical"
        >
          <div className="resize-handle-line" />
        </div>
      )}

      {/* Map panel */}
      <div 
        className="map-panel"
        role="region"
        aria-label="Map panel"
      >
        {mapPanel}
      </div>

      <style>{`
        .trip-planner-layout {
          display: flex;
          height: 100vh;
          overflow: hidden;
          background: #f9fafb;
          position: relative;
        }

        .timeline-panel {
          flex-shrink: 0;
          overflow-y: auto;
          overflow-x: hidden;
          background: white;
          border-right: 1px solid #e5e7eb;
          box-shadow: 2px 0 8px rgba(0, 0, 0, 0.04);
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          z-index: 2;
        }

        .timeline-panel::-webkit-scrollbar {
          width: 6px;
        }

        .timeline-panel::-webkit-scrollbar-track {
          background: #f1f5f9;
        }

        .timeline-panel::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        .timeline-panel::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        .resize-handle {
          width: 8px;
          flex-shrink: 0;
          cursor: col-resize;
          background: #f3f4f6;
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          user-select: none;
          z-index: 3;
          border-left: 1px solid #e5e7eb;
          border-right: 1px solid #e5e7eb;
        }

        .resize-handle:hover {
          background: #e5e7eb;
          width: 12px;
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.2);
        }

        .resize-handle.dragging {
          background: #dbeafe;
          width: 12px;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
        }

        .resize-handle-line {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 2px;
          height: 40px;
          background: #9ca3af;
          border-radius: 1px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .resize-handle:hover .resize-handle-line {
          background: #6b7280;
          height: 60px;
          width: 3px;
        }

        .resize-handle.dragging .resize-handle-line {
          background: #3b82f6;
          height: 80px;
          width: 4px;
          box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
        }

        .map-panel {
          flex: 1;
          overflow: hidden;
          position: relative;
          background: white;
          border-radius: 8px 0 0 0;
          box-shadow: -2px 0 8px rgba(0, 0, 0, 0.04);
          z-index: 1;
        }

        /* Tablet specific styles */
        @media (min-width: 769px) and (max-width: 1024px) {
          .resize-handle {
            display: none;
          }
          
          .timeline-panel {
            width: 50% !important;
            border-right: 2px solid #e5e7eb;
          }
          
          .map-panel {
            border-radius: 0;
          }
        }

        /* Desktop enhancements */
        @media (min-width: 1025px) {
          .trip-planner-layout::before {
            content: '';
            position: absolute;
            top: 0;
            left: ${timelineWidth - 1}px;
            width: 2px;
            height: 100%;
            background: linear-gradient(180deg, transparent, #3b82f6, transparent);
            opacity: ${isDragging ? '1' : '0'};
            transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 4;
            pointer-events: none;
          }
        }

        /* High DPI displays */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
          .timeline-panel {
            border-right: 0.5px solid #e5e7eb;
          }
          
          .resize-handle {
            border-left: 0.5px solid #e5e7eb;
            border-right: 0.5px solid #e5e7eb;
          }
        }

        /* Focus management for accessibility */
        .resize-handle:focus-visible {
          outline: 3px solid #3b82f6;
          outline-offset: 2px;
          background: #dbeafe;
        }

        /* Reduced motion preferences */
        @media (prefers-reduced-motion: reduce) {
          .timeline-panel,
          .resize-handle,
          .resize-handle-line,
          .trip-planner-layout::before {
            transition: none;
          }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .trip-planner-layout {
            background: #111827;
          }
          
          .timeline-panel {
            background: #1f2937;
            border-right: 1px solid #374151;
            box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
          }
          
          .timeline-panel::-webkit-scrollbar-track {
            background: #374151;
          }
          
          .timeline-panel::-webkit-scrollbar-thumb {
            background: #4b5563;
          }
          
          .timeline-panel::-webkit-scrollbar-thumb:hover {
            background: #6b7280;
          }
          
          .resize-handle {
            background: #374151;
            border-left: 1px solid #4b5563;
            border-right: 1px solid #4b5563;
          }
          
          .resize-handle:hover {
            background: #4b5563;
          }
          
          .resize-handle.dragging {
            background: #1e3a8a;
          }
          
          .resize-handle-line {
            background: #6b7280;
          }
          
          .resize-handle:hover .resize-handle-line {
            background: #9ca3af;
          }
          
          .map-panel {
            background: #1f2937;
            box-shadow: -2px 0 8px rgba(0, 0, 0, 0.3);
          }
        }
      `}</style>
    </div>
  );
};
