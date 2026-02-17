import React, { useState } from 'react';
import { useReducedMotion } from '../hooks/useAccessibility';

/**
 * Reduce Motion Demo
 * 
 * Demonstrates how animations are disabled when user prefers reduced motion
 * 
 * To test:
 * 1. macOS: System Preferences > Accessibility > Display > Reduce motion
 * 2. iOS: Settings > Accessibility > Motion > Reduce Motion
 * 3. Windows: Settings > Ease of Access > Display > Show animations
 */

export default function ReduceMotionDemo() {
  const { prefersReducedMotion, shouldAnimate, getAnimationDuration, getTransitionDuration } = useReducedMotion();
  const [showModal, setShowModal] = useState(false);
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Reduce Motion Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            This page demonstrates how animations are disabled when the user prefers reduced motion.
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Current Status
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Prefers Reduced Motion:</span>
              <span className={`font-semibold ${prefersReducedMotion ? 'text-green-600' : 'text-blue-600'}`}>
                {prefersReducedMotion ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Should Animate:</span>
              <span className={`font-semibold ${shouldAnimate ? 'text-blue-600' : 'text-gray-600'}`}>
                {shouldAnimate ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Animation Duration (300ms):</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {getAnimationDuration(300)}ms
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Transition Duration (200ms):</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {getTransitionDuration(200)}ms
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            How to Test
          </h3>
          <ul className="space-y-2 text-blue-800 dark:text-blue-200">
            <li><strong>macOS:</strong> System Preferences → Accessibility → Display → Reduce motion</li>
            <li><strong>iOS:</strong> Settings → Accessibility → Motion → Reduce Motion</li>
            <li><strong>Windows:</strong> Settings → Ease of Access → Display → Show animations</li>
            <li><strong>Browser DevTools:</strong> Rendering → Emulate CSS media feature prefers-reduced-motion</li>
          </ul>
        </div>

        {/* Demo Sections */}
        <div className="space-y-8">
          {/* Fade Animation */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Fade Animation
            </h3>
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-lg"
              style={{
                animation: shouldAnimate ? 'fadeIn 1s ease-in-out infinite alternate' : 'none',
              }}
            >
              This box fades in and out when animations are enabled
            </div>
          </div>

          {/* Scale Animation */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Scale Animation
            </h3>
            <button
              onClick={() => setCount(count + 1)}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold"
              style={{
                transition: shouldAnimate ? 'transform 200ms ease, background-color 200ms ease' : 'background-color 1ms',
                transform: shouldAnimate ? 'scale(1)' : 'none',
              }}
              onMouseDown={(e) => {
                if (shouldAnimate) {
                  e.currentTarget.style.transform = 'scale(0.95)';
                }
              }}
              onMouseUp={(e) => {
                if (shouldAnimate) {
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
              onMouseLeave={(e) => {
                if (shouldAnimate) {
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              Click Me (Count: {count})
            </button>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              This button scales down when clicked (if animations are enabled)
            </p>
          </div>

          {/* Spin Animation */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Spin Animation
            </h3>
            <div className="flex items-center space-x-4">
              <div
                className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
                style={{
                  animation: shouldAnimate ? 'spin 1s linear infinite' : 'none',
                }}
              />
              <span className="text-gray-700 dark:text-gray-300">
                Loading spinner {shouldAnimate ? 'spinning' : 'static'}
              </span>
            </div>
          </div>

          {/* Slide Animation */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Slide Animation
            </h3>
            <button
              onClick={() => setShowModal(!showModal)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              {showModal ? 'Hide' : 'Show'} Modal
            </button>
            {showModal && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                onClick={() => setShowModal(false)}
              >
                <div
                  className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md mx-4"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    animation: shouldAnimate ? 'slideInUp 300ms ease-out' : 'none',
                  }}
                >
                  <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Modal Dialog
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 mb-6">
                    This modal {shouldAnimate ? 'slides up' : 'appears instantly'} when opened.
                  </p>
                  <button
                    onClick={() => setShowModal(false)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Hover Effects */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Hover Effects
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-gradient-to-br from-pink-400 to-red-500 text-white p-6 rounded-lg cursor-pointer"
                  style={{
                    transition: shouldAnimate ? 'transform 200ms ease, box-shadow 200ms ease' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (shouldAnimate) {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (shouldAnimate) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <h4 className="font-semibold mb-2">Card {i}</h4>
                  <p className="text-sm opacity-90">
                    Hover to see {shouldAnimate ? 'lift effect' : 'no effect'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Pulse Animation */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Pulse Animation
            </h3>
            <div className="flex items-center space-x-4">
              <div
                className="w-4 h-4 bg-green-500 rounded-full"
                style={{
                  animation: shouldAnimate ? 'pulse 2s ease-in-out infinite' : 'none',
                }}
              />
              <span className="text-gray-700 dark:text-gray-300">
                Status indicator {shouldAnimate ? 'pulsing' : 'static'}
              </span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-8 bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Summary
          </h3>
          <p className="text-gray-700 dark:text-gray-300">
            {prefersReducedMotion ? (
              <>
                ✅ Reduced motion is <strong>enabled</strong>. All non-essential animations are disabled,
                and transitions use minimal durations. Essential state changes remain visible through
                instant transitions.
              </>
            ) : (
              <>
                ℹ️ Reduced motion is <strong>disabled</strong>. All animations are running normally.
                Enable reduced motion in your system settings to see the difference.
              </>
            )}
          </p>
        </div>
      </div>

      {/* Keyframes for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0.3; }
          to { opacity: 1; }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(100px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}
