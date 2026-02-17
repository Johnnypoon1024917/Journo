import React, { useState, useEffect } from 'react';
import { StickerCanvas } from '../organisms/StickerCanvas';
import { StickerModal } from '../../kawaii/StickerModal';
import { useStickerStore } from '../../../stores/stickerStore';

/**
 * StickerCanvasDemo
 * 
 * Demo component showcasing the sticker value control and drag-to-trash features.
 * 
 * Features demonstrated:
 * - Place stickers on different elements
 * - Long-press to edit values
 * - Drag to reposition
 * - Drag to trash to delete
 * - Undo deletion
 * 
 * Note: This demo works in standalone mode without requiring backend API calls.
 * It uses local state to demonstrate the UI/UX features.
 */
export const StickerCanvasDemo: React.FC = () => {
  const [showStickerModal, setShowStickerModal] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string>('demo-element-1');
  const [demoMode, setDemoMode] = useState(true);
  const { attachSticker } = useStickerStore();

  // Use demo UUIDs that look real but won't hit the backend
  const demoTripId = '00000000-0000-0000-0000-000000000001';
  const demoElement1 = '00000000-0000-0000-0000-000000000002';
  const demoElement2 = '00000000-0000-0000-0000-000000000003';

  // Add some demo stickers on mount for immediate visual feedback
  useEffect(() => {
    // Add demo stickers directly to the store without API calls
    const demoStickers = [
      {
        id: 'demo-placement-1',
        stickerId: '🎯',
        elementId: demoElement1,
        elementType: 'activity' as const,
        position: { x: 150, y: 100 },
        rotation: 5,
        scale: 1,
        value: 165,
        created_at: new Date().toISOString(),
      },
      {
        id: 'demo-placement-2',
        stickerId: '⭐',
        elementId: demoElement2,
        elementType: 'activity' as const,
        position: { x: 200, y: 120 },
        rotation: -8,
        scale: 1.2,
        created_at: new Date().toISOString(),
      },
    ];

    // Add to store
    useStickerStore.setState((state) => ({
      placements: [...state.placements, ...demoStickers],
    }));

    // Also add some demo stickers to the sticker list for the picker
    const demoStickerList = [
      { id: '🎯', image: '🎯', category: 'activities' as const, tags: ['target'], aiGenerated: false, created_at: new Date().toISOString() },
      { id: '⭐', image: '⭐', category: 'emotions' as const, tags: ['star'], aiGenerated: false, created_at: new Date().toISOString() },
      { id: '🎨', image: '🎨', category: 'activities' as const, tags: ['art'], aiGenerated: false, created_at: new Date().toISOString() },
      { id: '🎉', image: '🎉', category: 'emotions' as const, tags: ['party'], aiGenerated: false, created_at: new Date().toISOString() },
      { id: '💎', image: '💎', category: 'emotions' as const, tags: ['diamond'], aiGenerated: false, created_at: new Date().toISOString() },
      { id: '🔥', image: '🔥', category: 'emotions' as const, tags: ['fire'], aiGenerated: false, created_at: new Date().toISOString() },
      { id: '✨', image: '✨', category: 'emotions' as const, tags: ['sparkle'], aiGenerated: false, created_at: new Date().toISOString() },
      { id: '🌟', image: '🌟', category: 'emotions' as const, tags: ['star'], aiGenerated: false, created_at: new Date().toISOString() },
      { id: '💯', image: '💯', category: 'emotions' as const, tags: ['hundred'], aiGenerated: false, created_at: new Date().toISOString() },
      { id: '🎪', image: '🎪', category: 'activities' as const, tags: ['circus'], aiGenerated: false, created_at: new Date().toISOString() },
      { id: '🎭', image: '🎭', category: 'activities' as const, tags: ['theater'], aiGenerated: false, created_at: new Date().toISOString() },
      { id: '🎬', image: '🎬', category: 'activities' as const, tags: ['movie'], aiGenerated: false, created_at: new Date().toISOString() },
    ];

    useStickerStore.setState((state) => ({
      stickers: [...demoStickerList],
    }));

    return () => {
      // Cleanup demo stickers on unmount
      useStickerStore.setState((state) => ({
        placements: state.placements.filter(p => !p.id.startsWith('demo-placement-')),
      }));
    };
  }, [demoElement1, demoElement2]);

  const handleStickerSelect = async (stickerId: string) => {
    try {
      // In demo mode, add sticker directly to store without API call
      if (demoMode) {
        const newPlacement = {
          id: `demo-placement-${Date.now()}`,
          stickerId,
          elementId: selectedElement,
          elementType: 'activity' as const,
          position: { x: 200, y: 150 },
          rotation: Math.random() * 20 - 10,
          scale: 1,
          value: selectedElement === demoElement1 ? Math.floor(Math.random() * 200) : undefined,
          created_at: new Date().toISOString(),
        };

        useStickerStore.setState((state) => ({
          placements: [...state.placements, newPlacement],
        }));

        setShowStickerModal(false);
      } else {
        // Real mode - use API
        await attachSticker(
          demoTripId,
          stickerId,
          selectedElement,
          'activity',
          { x: 200, y: 150 }
        );
        setShowStickerModal(false);
      }
    } catch (error) {
      console.error('Error placing sticker:', error);
      alert('Demo mode: Sticker placement failed. This demo works best in standalone mode.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🎨 Sticker Value Control Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-3">
            Long-press stickers to edit values • Drag to reposition • Drag to trash to delete
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900 rounded-full text-sm">
            <span className="text-blue-700 dark:text-blue-300">
              {demoMode ? '🎮 Demo Mode (No Backend Required)' : '🔌 Live Mode (Backend Connected)'}
            </span>
            <button
              onClick={() => setDemoMode(!demoMode)}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs font-medium transition-colors"
            >
              Toggle
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            📖 How to Use
          </h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">👆</span>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">Place Sticker</div>
                <div className="text-gray-600 dark:text-gray-400">
                  Click "Add Sticker" button below
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">✋</span>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">Edit Value %</div>
                <div className="text-gray-600 dark:text-gray-400">
                  Long-press sticker (400ms) to adjust percentage value (0-200%)
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🗑️</span>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">Delete</div>
                <div className="text-gray-600 dark:text-gray-400">
                  Drag sticker to bottom-right bin
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Budget Card Example */}
          <div className="relative">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 min-h-[400px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  💰 Budget Progress
                </h3>
                <button
                  onClick={() => {
                    setSelectedElement(demoElement1);
                    setShowStickerModal(true);
                  }}
                  className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-full text-sm font-medium transition-colors"
                >
                  + Add Sticker
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Budget</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">$5,000</div>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Spent</div>
                  <div className="text-2xl font-bold text-orange-600">$3,250</div>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Remaining</div>
                  <div className="text-2xl font-bold text-green-600">$1,750</div>
                </div>
              </div>

              {/* Sticker Layer */}
              <StickerCanvas
                elementId={demoElement1}
                elementType="activity"
                tripId={demoTripId}
                editable={true}
                hasValues={true}
                demoMode={demoMode}
                className="absolute inset-0"
              />
            </div>
          </div>

          {/* Activity Card Example */}
          <div className="relative">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 min-h-[400px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  🗓️ Day Activities
                </h3>
                <button
                  onClick={() => {
                    setSelectedElement(demoElement2);
                    setShowStickerModal(true);
                  }}
                  className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-full text-sm font-medium transition-colors"
                >
                  + Add Sticker
                </button>
              </div>

              <div className="space-y-3">
                {['Tokyo Tower Visit', 'Sushi Restaurant', 'Shibuya Shopping', 'Karaoke Night'].map((activity, i) => (
                  <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-2xl p-4">
                    <div className="font-medium text-gray-900 dark:text-white">{activity}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {['9:00 AM', '12:30 PM', '3:00 PM', '8:00 PM'][i]}
                    </div>
                  </div>
                ))}
              </div>

              {/* Sticker Layer */}
              <StickerCanvas
                elementId={demoElement2}
                elementType="activity"
                tripId={demoTripId}
                editable={true}
                hasValues={false}
                demoMode={demoMode}
                className="absolute inset-0"
              />
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            ✨ Features
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-700 dark:text-gray-300">Long-press to enter edit mode (400ms)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-700 dark:text-gray-300">Scale 1.15× + wobble animation</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-700 dark:text-gray-300">Value slider with cat paw handle 🐾</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-700 dark:text-gray-300">Color-coded values (green/orange/red)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-700 dark:text-gray-300">Drag to bottom-right recycle bin</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-700 dark:text-gray-300">Bin opens lid + glows when near</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-700 dark:text-gray-300">Delete animation with confetti</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-700 dark:text-gray-300">Undo toast (6 seconds)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-700 dark:text-gray-300">Haptic feedback on all interactions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-700 dark:text-gray-300">Mobile-first touch targets (48px)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticker Modal */}
      {!demoMode && (
        <StickerModal
          isOpen={showStickerModal}
          onClose={() => setShowStickerModal(false)}
          onSelect={handleStickerSelect}
          tripId={demoTripId}
        />
      )}

      {/* Demo Mode Sticker Picker */}
      {demoMode && showStickerModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowStickerModal(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Select a Sticker
            </h3>
            
            <div className="grid grid-cols-6 gap-3">
              {useStickerStore.getState().stickers.map((sticker) => (
                <button
                  key={sticker.id}
                  onClick={() => handleStickerSelect(sticker.id)}
                  className="text-4xl hover:scale-110 transition-transform p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {sticker.image}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowStickerModal(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
