import { useState } from 'react';

interface StickerPickerProps {
  selectedSticker?: string | null;
  onSelect: (sticker: string) => void;
}

const STICKERS = [
  '✈️', // Plane
  '🏨', // Hotel
  '🍕', // Pizza
  '🍔', // Burger
  '🍜', // Ramen
  '☕', // Coffee
  '🍷', // Wine
  '🎭', // Theater/Arts
  '🏛️', // Museum
  '🏖️', // Beach
  '⛰️', // Mountain
  '🏔️', // Snow Mountain
  '🌊', // Ocean
  '🎡', // Ferris Wheel
  '🎢', // Roller Coaster
  '🎪', // Circus
  '🏰', // Castle
  '⛪', // Church
  '🕌', // Mosque
  '🛕', // Temple
  '🗼', // Tokyo Tower
  '🗽', // Statue of Liberty
  '🗿', // Moai
  '⛩️', // Torii Gate
  '🚂', // Train
  '🚕', // Taxi
  '🚌', // Bus
  '🚇', // Metro
  '🚢', // Ship
  '⛵', // Sailboat
  '🚁', // Helicopter
  '🎒', // Backpack
  '📸', // Camera
  '🎫', // Ticket
  '🎨', // Art
  '🎵', // Music
  '⚽', // Soccer
  '🏊', // Swimming
  '🚴', // Cycling
  '🧘', // Yoga
  '💆', // Spa
  '🛍️', // Shopping
  '🎁', // Gift
  '💝', // Heart Gift
  '❤️', // Heart
  '⭐', // Star
  '🌟', // Glowing Star
  '🔥', // Fire
  '💎', // Diamond
];

export default function StickerPicker({ selectedSticker, onSelect }: StickerPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (sticker: string) => {
    onSelect(sticker);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Sticker
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-left flex items-center justify-between"
      >
        <span className="text-2xl">{selectedSticker || '📍'}</span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Sticker Grid */}
          <div className="absolute z-20 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            <div className="grid grid-cols-8 gap-1 p-2">
              {STICKERS.map((sticker, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelect(sticker)}
                  className={`
                    text-2xl p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                    ${selectedSticker === sticker ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500' : ''}
                  `}
                  title={sticker}
                >
                  {sticker}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
