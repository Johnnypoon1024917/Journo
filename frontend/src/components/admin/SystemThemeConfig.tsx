/**
 * System Theme Configuration Component
 * 
 * Admin interface for configuring system-wide color theme
 */

import React, { useEffect, useState } from 'react';
import { useCentralizedThemeStore } from '@/stores/centralizedThemeStore';
import { KAWAII_THEME_PRESETS } from '@/types/theme';

export const SystemThemeConfig: React.FC = () => {
  const {
    systemTheme,
    isLoading,
    error,
    loadSystemTheme,
    updateSystemTheme,
  } = useCentralizedThemeStore();

  const [primaryColor, setPrimaryColor] = useState('var(--bubblequest-primary-500)');

  useEffect(() => {
    loadSystemTheme();
  }, [loadSystemTheme]);

  useEffect(() => {
    if (systemTheme) {
      setPrimaryColor(systemTheme.primary_500);
    }
  }, [systemTheme]);

  const handlePresetClick = async (preset: typeof KAWAII_THEME_PRESETS[0]) => {
    await updateSystemTheme(preset.colors);
  };

  const handleCustomColorChange = async (color: string) => {
    setPrimaryColor(color);
    await updateSystemTheme({ primary_500: color });
  };

  if (isLoading) {
    return <div className="p-6">Loading theme configuration...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--bubblequest-primary-500)' }}>
        System Theme Configuration
      </h1>
      <p className="text-neutral-600 mb-8">
        Configure the default color theme for all users. Changes apply system-wide.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}

      {/* Theme Presets */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Theme Presets</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {KAWAII_THEME_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handlePresetClick(preset)}
              className="p-4 rounded-xl border-2 transition-all hover:scale-105"
              style={{
                borderColor: systemTheme?.primary_500 === preset.colors.primary_500 
                  ? 'var(--bubblequest-primary-500)' 
                  : 'var(--bubblequest-neutral-200)',
                backgroundColor: 'var(--bubblequest-cream)',
              }}
            >
              <div
                className="w-full h-16 rounded-lg mb-3"
                style={{ backgroundColor: preset.colors.primary_500 }}
              />
              <h3 className="font-semibold text-sm">{preset.name}</h3>
              <p className="text-xs text-neutral-500">{preset.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Custom Color Picker */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Custom Primary Color</h2>
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={primaryColor}
            onChange={(e) => handleCustomColorChange(e.target.value)}
            className="w-20 h-20 rounded-xl cursor-pointer"
          />
          <div>
            <p className="font-medium">Primary Color</p>
            <p className="text-sm text-neutral-500">{primaryColor}</p>
          </div>
        </div>
      </section>

      {/* Current Theme Preview */}
      {systemTheme && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Current Theme Preview</h2>
          <div className="grid grid-cols-5 gap-2">
            {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => (
              <div key={shade} className="text-center">
                <div
                  className="w-full h-16 rounded-lg mb-2"
                  style={{ 
                    backgroundColor: systemTheme[`primary_${shade}` as keyof typeof systemTheme] as string 
                  }}
                />
                <p className="text-xs text-neutral-600">{shade}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
