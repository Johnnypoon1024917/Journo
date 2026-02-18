/**
 * Accessibility Features Example
 * 
 * Demonstrates how to use all accessibility features in BubbleQuest
 */

import React, { useState } from 'react';
import { AccessibilityProvider, useAccessibilityContext } from '../providers/AccessibilityProvider';
import { SkipLinks } from '../components/accessibility/SkipLinks';
import { AccessibleModal } from '../components/accessibility/AccessibleModal';
import { LiveRegion, useLiveRegion } from '../components/accessibility/LiveRegion';
import { AccessibleMapControls } from '../components/map/AccessibleMapControls';

/**
 * Example: Using the Accessibility Context
 */
function AccessibilityAwareComponent() {
  const {
    prefersReducedMotion,
    shouldAnimate,
    isHighContrast,
    contrastLevel,
    fontSize,
    fontScale,
  } = useAccessibilityContext();

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Accessibility Status</h3>
      <ul className="space-y-1 text-sm">
        <li>Reduced Motion: {prefersReducedMotion ? 'Yes' : 'No'}</li>
        <li>Should Animate: {shouldAnimate ? 'Yes' : 'No'}</li>
        <li>High Contrast: {isHighContrast ? 'Yes' : 'No'}</li>
        <li>Contrast Level: {contrastLevel}</li>
        <li>Font Size: {fontSize}px</li>
        <li>Font Scale: {fontScale}x</li>
      </ul>
    </div>
  );
}

/**
 * Example: Using Skip Links
 */
function SkipLinksExample() {
  return (
    <div>
      <SkipLinks
        links={[
          { id: 'skip-to-main', label: 'Skip to main content', targetId: 'main-content' },
          { id: 'skip-to-nav', label: 'Skip to navigation', targetId: 'main-navigation' },
          { id: 'skip-to-search', label: 'Skip to search', targetId: 'search' },
        ]}
      />

      <nav id="main-navigation" tabIndex={-1}>
        <h2>Navigation</h2>
        {/* Navigation content */}
      </nav>

      <main id="main-content" tabIndex={-1}>
        <h1>Main Content</h1>
        {/* Main content */}
      </main>
    </div>
  );
}

/**
 * Example: Using Accessible Modal
 */
function ModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-primary-600 text-white rounded-lg"
      >
        Open Modal
      </button>

      <AccessibleModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Example Modal"
        description="This is a fully accessible modal dialog"
        closeOnEscape={true}
        closeOnOverlayClick={true}
      >
        <p>Modal content goes here.</p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg"
          >
            Confirm
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </AccessibleModal>
    </div>
  );
}

/**
 * Example: Using Live Regions
 */
function LiveRegionExample() {
  const { message, politeness, announce, clear } = useLiveRegion();

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => announce('This is a polite announcement', 'polite')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Announce (Polite)
        </button>
        <button
          onClick={() => announce('This is an assertive announcement!', 'assertive')}
          className="px-4 py-2 bg-red-600 text-white rounded-lg"
        >
          Announce (Assertive)
        </button>
        <button
          onClick={clear}
          className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg"
        >
          Clear
        </button>
      </div>

      <LiveRegion
        message={message}
        politeness={politeness}
        role="status"
      />

      {message && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm">
            <strong>Current announcement:</strong> {message}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Example: Using Accessible Map Controls
 */
function MapControlsExample() {
  const [zoom, setZoom] = useState(10);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  return (
    <div className="space-y-4">
      <div className="p-4 bg-neutral-100 rounded-lg">
        <p className="text-sm">
          Zoom: {zoom} | Position: ({position.x}, {position.y})
        </p>
      </div>

      <AccessibleMapControls
        onZoomIn={() => setZoom(z => Math.min(20, z + 1))}
        onZoomOut={() => setZoom(z => Math.max(1, z - 1))}
        onPanUp={() => setPosition(p => ({ ...p, y: p.y - 10 }))}
        onPanDown={() => setPosition(p => ({ ...p, y: p.y + 10 }))}
        onPanLeft={() => setPosition(p => ({ ...p, x: p.x - 10 }))}
        onPanRight={() => setPosition(p => ({ ...p, x: p.x + 10 }))}
        onResetView={() => {
          setZoom(10);
          setPosition({ x: 0, y: 0 });
        }}
        currentZoom={zoom}
        minZoom={1}
        maxZoom={20}
      />
    </div>
  );
}

/**
 * Main Example Component
 */
export function AccessibilityExample() {
  return (
    <AccessibilityProvider>
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        <h1 className="text-3xl font-bold">Accessibility Features Example</h1>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Accessibility Context</h2>
          <AccessibilityAwareComponent />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Skip Links</h2>
          <p className="text-sm text-neutral-600 mb-4">
            Press Tab to see skip links (they appear on focus)
          </p>
          <SkipLinksExample />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Accessible Modal</h2>
          <ModalExample />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Live Regions</h2>
          <LiveRegionExample />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Map Controls</h2>
          <MapControlsExample />
        </section>
      </div>
    </AccessibilityProvider>
  );
}
