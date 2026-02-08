import React from 'react';

interface DragDropDemoProps {
  onClose: () => void;
}

export const DragDropDemo: React.FC<DragDropDemoProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">🎉 Enhanced Drag & Drop</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">✨ What's New</h3>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Smooth, fluid drag animations with spring physics
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Clear visual feedback for drop zones
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Enhanced mobile touch support with haptic feedback
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Cross-day dragging with visual indicators
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Auto-scroll when dragging near edges
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <h3 className="text-lg font-semibold text-green-900 mb-3">🎯 How to Use</h3>
            <div className="space-y-3 text-green-800">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white text-sm font-bold rounded-full flex items-center justify-center">1</span>
                <div>
                  <p className="font-medium">Grab the drag handle</p>
                  <p className="text-sm text-green-600">Look for the 6-dot icon on the left side of each place card</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white text-sm font-bold rounded-full flex items-center justify-center">2</span>
                <div>
                  <p className="font-medium">Drag to reorder</p>
                  <p className="text-sm text-green-600">Drag up/down within the same day or to other days</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white text-sm font-bold rounded-full flex items-center justify-center">3</span>
                <div>
                  <p className="font-medium">Drop in the right spot</p>
                  <p className="text-sm text-green-600">Blue highlights show where your place will land</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-900 mb-3">📱 Mobile Features</h3>
            <ul className="space-y-2 text-purple-800">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Haptic feedback when you start and finish dragging
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Optimized touch targets for easier grabbing
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Smart delay to prevent accidental drags while scrolling
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
            <h3 className="text-lg font-semibold text-orange-900 mb-3">⚡ Performance</h3>
            <ul className="space-y-2 text-orange-800">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                Optimistic updates for instant feedback
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                Reduced motion support for accessibility
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                Smooth 60fps animations on all devices
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors"
          >
            Got it! Let's try it out 🚀
          </button>
        </div>
      </div>
    </div>
  );
};

export default DragDropDemo;