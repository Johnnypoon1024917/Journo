/**
 * Trip Theme Settings Component
 * 
 * Allows trip owners to customize the color theme for a specific trip.
 * Each trip can have its own unique color theme.
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HexColorPicker } from 'react-colorful';
import { useCentralizedThemeStore } from '@/stores/centralizedThemeStore';
import { cn } from '@/utils/cn';

interface TripThemeSettingsProps {
  tripId: string;
  isOwner: boolean;
}

// Simple color presets for trips
const TRIP_COLOR_PRESETS = [
  { name: 'Pink', value: '#FFB3BA', description: 'Soft pink' },
  { name: 'Orange', value: '#F4A460', description: 'Warm orange' },
  { name: 'Blue', value: '#6B9BD1', description: 'Calm blue' },
  { name: 'Teal', value: '#7ECEC4', description: 'Fresh teal' },
  { name: 'Purple', value: '#C5B3E6', description: 'Dreamy purple' },
  { name: 'Yellow', value: '#FFD97D', description: 'Cheerful yellow' },
  { name: 'Green', value: '#90EE90', description: 'Fresh green' },
  { name: 'Red', value: '#FF6B6B', description: 'Vibrant red' },
];

export const TripThemeSettings: React.FC<TripThemeSettingsProps> = ({ tripId, isOwner }) => {
  const {
    currentTheme,
    tripTheme,
    systemTheme,
    isLoading,
    error,
    loadTripTheme,
    updateTripTheme,
    deleteTripTheme,
  } = useCentralizedThemeStore();

  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customColor, setCustomColor] = useState('#FFB3BA');
  const [hasCustomTheme, setHasCustomTheme] = useState(false);

  useEffect(() => {
    loadTripTheme(tripId);
  }, [tripId, loadTripTheme]);

  useEffect(() => {
    if (tripTheme) {
      setCustomColor(tripTheme.primary_500);
      setHasCustomTheme(true);
    } else if (systemTheme) {
      setCustomColor(systemTheme.primary_500);
      setHasCustomTheme(false);
    }
  }, [tripTheme, systemTheme]);

  const currentColor = currentTheme?.primary_500 || '#FFB3BA';

  const handlePresetClick = async (color: string) => {
    console.log('🎨 Setting trip theme to:', color);
    setCustomColor(color);
    setShowCustomPicker(false);
    
    try {
      await updateTripTheme(tripId, { primary_500: color });
      setHasCustomTheme(true);
      console.log('✅ Trip theme updated successfully');
    } catch (err: any) {
      console.error('❌ Failed to update trip theme:', err);
      
      // Show user-friendly error message
      if (err.response?.status === 403) {
        alert('⚠️ Only the trip owner can change the theme.\n\nYou are not the owner of this trip.');
      } else if (err.response?.status === 401) {
        alert('⚠️ Please log in to change the trip theme.');
      } else {
        alert('❌ Failed to update trip theme. Please try again.');
      }
    }
  };

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
  };

  const handleCustomColorApply = async () => {
    console.log('🎨 Applying custom trip theme:', customColor);
    
    try {
      await updateTripTheme(tripId, { primary_500: customColor });
      setHasCustomTheme(true);
      console.log('✅ Custom trip theme applied successfully');
    } catch (err) {
      console.error('❌ Failed to apply custom trip theme:', err);
    }
  };

  const handleResetToSystem = async () => {
    console.log('🔄 Resetting trip theme to system default');
    
    try {
      await deleteTripTheme(tripId);
      setHasCustomTheme(false);
      if (systemTheme) {
        setCustomColor(systemTheme.primary_500);
      }
      console.log('✅ Trip theme reset to system default');
    } catch (err) {
      console.error('❌ Failed to reset trip theme:', err);
    }
  };

  if (!isOwner) {
    return (
      <div className="p-6">
        <p className="text-neutral-600">
          Only the trip owner can customize the theme.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-neutral-200 rounded w-2/3 mb-6"></div>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-neutral-200 rounded-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--kawaii-primary-500)' }}>
        Trip Theme Color
      </h2>
      <p className="text-neutral-600 mb-6">
        Choose a unique color theme for this trip. Each trip can have its own color!
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}

      {/* Status Badge */}
      <div className="mb-6">
        {hasCustomTheme ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: currentColor }}
            />
            <span className="text-green-700 font-medium">Custom Trip Theme</span>
            <button
              onClick={handleResetToSystem}
              className="text-sm text-green-600 hover:text-green-800 underline ml-2"
            >
              Reset to Default
            </button>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
            <span className="text-blue-700 font-medium">Using Default Theme</span>
          </div>
        )}
      </div>

      {/* Preset Colors */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          Preset Colors
        </label>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {TRIP_COLOR_PRESETS.map((preset) => {
            const isSelected = preset.value.toLowerCase() === currentColor.toLowerCase();
            
            return (
              <motion.button
                key={preset.name}
                onClick={() => handlePresetClick(preset.value)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'relative w-full aspect-square rounded-full',
                  'min-h-[44px] min-w-[44px]',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                  'transition-all duration-200',
                  isSelected && 'ring-2 ring-offset-2 ring-neutral-400'
                )}
                style={{ backgroundColor: preset.value }}
                aria-label={`Select ${preset.name} theme`}
                aria-pressed={isSelected}
                title={preset.description}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <svg
                      className="w-6 h-6 text-white drop-shadow-md"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
        
        {/* Color names */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3 mt-2">
          {TRIP_COLOR_PRESETS.map((preset) => (
            <div
              key={`${preset.name}-label`}
              className="text-center text-xs text-neutral-600"
            >
              {preset.name}
            </div>
          ))}
        </div>
      </div>

      {/* Custom Color Picker */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          Custom Color
        </label>
        
        <div className="flex items-start gap-4">
          {/* Custom color button */}
          <motion.button
            onClick={() => setShowCustomPicker(!showCustomPicker)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'relative w-16 h-16 rounded-xl border-2',
              'min-h-[44px] min-w-[44px]',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              'transition-all duration-200',
              showCustomPicker
                ? 'ring-2 ring-offset-2 ring-neutral-400'
                : 'border-neutral-300'
            )}
            style={{
              background: `linear-gradient(135deg, ${customColor} 0%, ${customColor}dd 100%)`
            }}
            aria-label="Custom color picker"
            aria-expanded={showCustomPicker}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <svg
                className="w-8 h-8 text-white drop-shadow-md"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
            </motion.div>
          </motion.button>

          {/* Color picker panel */}
          {showCustomPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1"
            >
              <HexColorPicker
                color={customColor}
                onChange={handleCustomColorChange}
                className="w-full"
              />
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                      setCustomColor(value);
                    }
                  }}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg',
                    'border border-neutral-300',
                    'bg-white text-neutral-900',
                    'text-sm font-mono',
                    'focus:outline-none focus:ring-2 focus:ring-kawaii-primary-500/20'
                  )}
                  placeholder="#FFB3BA"
                />
                <button
                  onClick={handleCustomColorApply}
                  className={cn(
                    'px-4 py-2 rounded-lg',
                    'bg-kawaii-primary-500 hover:bg-kawaii-primary-600',
                    'text-white font-medium',
                    'transition-colors'
                  )}
                >
                  Apply
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {!showCustomPicker && (
          <p className="mt-2 text-xs text-neutral-500">
            Click the color square to open the custom color picker
          </p>
        )}
      </div>

      {/* Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200"
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-blue-600 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-blue-700">
            This color theme only applies to this trip. Other trips will keep their own themes.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
