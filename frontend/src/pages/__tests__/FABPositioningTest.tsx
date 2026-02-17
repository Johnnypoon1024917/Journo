/**
 * FAB Positioning Visual Test Page
 * 
 * This page demonstrates the FAB positioning system with all FAB types.
 * Use this page to visually verify FAB positioning on different screen sizes.
 * 
 * To test:
 * 1. Add route to router: /test/fab-positioning
 * 2. View on desktop (> 768px)
 * 3. View on mobile (< 768px)
 * 4. Verify FABs don't overlap
 * 5. Verify FABs are above bottom nav on mobile
 */

import React, { useState } from 'react';
import { Bell, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useFABPosition, getFABStyle } from '../../hooks/useFABPosition';
import { BottomNavigation } from '../../components/bubblequest/BottomNavigation';

export const FABPositioningTest: React.FC = () => {
  const [showBottomNav, setShowBottomNav] = useState(true);
  const [showAllFABs, setShowAllFABs] = useState(true);

  // FAB positions
  const notificationFAB = useFABPosition({ type: 'notification', index: 0, hasBottomNav: showBottomNav });
  const primaryFAB = useFABPosition({ type: 'primary', index: 1, hasBottomNav: showBottomNav });
  const secondaryFAB = useFABPosition({ type: 'secondary', index: 2, hasBottomNav: showBottomNav });
  const recycleFAB = useFABPosition({ type: 'recycle', index: 3, hasBottomNav: showBottomNav });

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">FAB Positioning Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Controls</h2>
          
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={showBottomNav}
                onChange={(e) => setShowBottomNav(e.target.checked)}
                className="w-5 h-5"
              />
              <span>Show Bottom Navigation (Mobile)</span>
            </label>
            
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={showAllFABs}
                onChange={(e) => setShowAllFABs(e.target.checked)}
                className="w-5 h-5"
              />
              <span>Show All FABs</span>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">FAB Information</h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold">Notification FAB</h3>
              <p className="text-sm text-gray-600">Type: notification, Index: 0, Z-Index: 9998</p>
              <p className="text-sm text-gray-600">Position: {notificationFAB.bottom} from bottom</p>
            </div>
            
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold">Primary Action FAB</h3>
              <p className="text-sm text-gray-600">Type: primary, Index: 1, Z-Index: 50</p>
              <p className="text-sm text-gray-600">Position: {primaryFAB.bottom} from bottom</p>
            </div>
            
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-semibold">Secondary Action FAB</h3>
              <p className="text-sm text-gray-600">Type: secondary, Index: 2, Z-Index: 45</p>
              <p className="text-sm text-gray-600">Position: {secondaryFAB.bottom} from bottom</p>
            </div>
            
            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-semibold">Recycle Bin FAB</h3>
              <p className="text-sm text-gray-600">Type: recycle, Index: 3, Z-Index: 60</p>
              <p className="text-sm text-gray-600">Position: {recycleFAB.bottom} from bottom</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Resize your browser window to test mobile (< 768px) and desktop views</li>
            <li>Toggle bottom navigation to see FAB position changes</li>
            <li>Verify FABs don't overlap with each other</li>
            <li>Verify FABs are above bottom navigation on mobile</li>
            <li>Check z-index by hovering (notification should be on top)</li>
          </ol>
        </div>

        {/* Filler content to enable scrolling */}
        <div className="mt-6 space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-2">Content Block {i + 1}</h3>
              <p className="text-gray-600">
                This is filler content to demonstrate scrolling behavior with fixed FABs.
                The FABs should remain visible and properly positioned while scrolling.
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* FABs */}
      {showAllFABs && (
        <>
          {/* Notification FAB */}
          <button
            style={getFABStyle(notificationFAB)}
            className="w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
            aria-label="Notifications"
          >
            <Bell className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              3
            </span>
          </button>

          {/* Primary Action FAB */}
          <button
            style={getFABStyle(primaryFAB)}
            className="w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
            aria-label="Add Activity"
          >
            <Plus className="w-6 h-6" />
          </button>

          {/* Secondary Action FAB */}
          <button
            style={getFABStyle(secondaryFAB)}
            className="w-14 h-14 bg-purple-500 hover:bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
            aria-label="Add Sticker"
          >
            <Sparkles className="w-6 h-6" />
          </button>

          {/* Recycle Bin FAB */}
          <button
            style={getFABStyle(recycleFAB)}
            className="w-14 h-14 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
            aria-label="Delete"
          >
            <Trash2 className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Bottom Navigation */}
      {showBottomNav && (
        <BottomNavigation activeTab="schedule" />
      )}
    </div>
  );
};

export default FABPositioningTest;
