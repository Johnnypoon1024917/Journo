/**
 * Accessible Map Controls
 * 
 * Keyboard-accessible controls for map interactions
 * Provides alternative to mouse-based map navigation
 */

import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';

interface AccessibleMapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPanUp: () => void;
  onPanDown: () => void;
  onPanLeft: () => void;
  onPanRight: () => void;
  onResetView: () => void;
  currentZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  className?: string;
}

export function AccessibleMapControls({
  onZoomIn,
  onZoomOut,
  onPanUp,
  onPanDown,
  onPanLeft,
  onPanRight,
  onResetView,
  currentZoom = 10,
  minZoom = 1,
  maxZoom = 20,
  className,
}: AccessibleMapControlsProps) {
  const [announcement, setAnnouncement] = useState('');

  const announce = (message: string) => {
    setAnnouncement(message);
    setTimeout(() => setAnnouncement(''), 1000);
  };

  const handleZoomIn = () => {
    if (currentZoom < maxZoom) {
      onZoomIn();
      announce(`Zoomed in to level ${currentZoom + 1}`);
    } else {
      announce('Maximum zoom level reached');
    }
  };

  const handleZoomOut = () => {
    if (currentZoom > minZoom) {
      onZoomOut();
      announce(`Zoomed out to level ${currentZoom - 1}`);
    } else {
      announce('Minimum zoom level reached');
    }
  };

  const handlePan = (direction: string, action: () => void) => {
    action();
    announce(`Panned ${direction}`);
  };

  return (
    <div
      className={cn('accessible-map-controls', className)}
      role="group"
      aria-label="Map controls"
    >
      {/* Screen reader announcement */}
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {/* Zoom controls */}
      <div className="flex flex-col gap-2 mb-4">
        <button
          onClick={handleZoomIn}
          disabled={currentZoom >= maxZoom}
          className={cn(
            'px-4 py-2 rounded-lg',
            'bg-white dark:bg-neutral-800',
            'border border-neutral-300 dark:border-neutral-600',
            'hover:bg-neutral-50 dark:hover:bg-neutral-700',
            'focus:outline-none focus:ring-2 focus:ring-primary-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors duration-200'
          )}
          aria-label={`Zoom in (current zoom: ${currentZoom})`}
          aria-keyshortcuts="+"
        >
          <span aria-hidden="true">+</span>
          <span className="sr-only">Zoom in</span>
        </button>

        <button
          onClick={handleZoomOut}
          disabled={currentZoom <= minZoom}
          className={cn(
            'px-4 py-2 rounded-lg',
            'bg-white dark:bg-neutral-800',
            'border border-neutral-300 dark:border-neutral-600',
            'hover:bg-neutral-50 dark:hover:bg-neutral-700',
            'focus:outline-none focus:ring-2 focus:ring-primary-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors duration-200'
          )}
          aria-label={`Zoom out (current zoom: ${currentZoom})`}
          aria-keyshortcuts="-"
        >
          <span aria-hidden="true">−</span>
          <span className="sr-only">Zoom out</span>
        </button>
      </div>

      {/* Pan controls */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div />
        <button
          onClick={() => handlePan('up', onPanUp)}
          className={cn(
            'px-4 py-2 rounded-lg',
            'bg-white dark:bg-neutral-800',
            'border border-neutral-300 dark:border-neutral-600',
            'hover:bg-neutral-50 dark:hover:bg-neutral-700',
            'focus:outline-none focus:ring-2 focus:ring-primary-500',
            'transition-colors duration-200'
          )}
          aria-label="Pan map up"
          aria-keyshortcuts="ArrowUp"
        >
          <span aria-hidden="true">↑</span>
          <span className="sr-only">Pan up</span>
        </button>
        <div />

        <button
          onClick={() => handlePan('left', onPanLeft)}
          className={cn(
            'px-4 py-2 rounded-lg',
            'bg-white dark:bg-neutral-800',
            'border border-neutral-300 dark:border-neutral-600',
            'hover:bg-neutral-50 dark:hover:bg-neutral-700',
            'focus:outline-none focus:ring-2 focus:ring-primary-500',
            'transition-colors duration-200'
          )}
          aria-label="Pan map left"
          aria-keyshortcuts="ArrowLeft"
        >
          <span aria-hidden="true">←</span>
          <span className="sr-only">Pan left</span>
        </button>

        <button
          onClick={onResetView}
          className={cn(
            'px-4 py-2 rounded-lg',
            'bg-primary-600 text-white',
            'hover:bg-primary-700',
            'focus:outline-none focus:ring-2 focus:ring-primary-500',
            'transition-colors duration-200'
          )}
          aria-label="Reset map view to default"
          aria-keyshortcuts="Home"
        >
          <span aria-hidden="true">⌂</span>
          <span className="sr-only">Reset view</span>
        </button>

        <button
          onClick={() => handlePan('right', onPanRight)}
          className={cn(
            'px-4 py-2 rounded-lg',
            'bg-white dark:bg-neutral-800',
            'border border-neutral-300 dark:border-neutral-600',
            'hover:bg-neutral-50 dark:hover:bg-neutral-700',
            'focus:outline-none focus:ring-2 focus:ring-primary-500',
            'transition-colors duration-200'
          )}
          aria-label="Pan map right"
          aria-keyshortcuts="ArrowRight"
        >
          <span aria-hidden="true">→</span>
          <span className="sr-only">Pan right</span>
        </button>

        <div />
        <button
          onClick={() => handlePan('down', onPanDown)}
          className={cn(
            'px-4 py-2 rounded-lg',
            'bg-white dark:bg-neutral-800',
            'border border-neutral-300 dark:border-neutral-600',
            'hover:bg-neutral-50 dark:hover:bg-neutral-700',
            'focus:outline-none focus:ring-2 focus:ring-primary-500',
            'transition-colors duration-200'
          )}
          aria-label="Pan map down"
          aria-keyshortcuts="ArrowDown"
        >
          <span aria-hidden="true">↓</span>
          <span className="sr-only">Pan down</span>
        </button>
        <div />
      </div>

      {/* Instructions */}
      <div className="text-sm text-neutral-600 dark:text-neutral-400">
        <p className="mb-1">Keyboard shortcuts:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Arrow keys: Pan map</li>
          <li>+/- keys: Zoom in/out</li>
          <li>Home: Reset view</li>
        </ul>
      </div>
    </div>
  );
}
