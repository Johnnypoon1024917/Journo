import React, { useState } from 'react';
import { useDynamicType, applyDynamicTypeScale } from '../hooks/useDynamicType';

/**
 * DynamicTypeDemo
 * 
 * Demo page to showcase Dynamic Type support
 * Allows testing text scaling from 82% to 200%
 */

export const DynamicTypeDemo: React.FC = () => {
  const { textScale, isLargeText, isAccessibilitySize, effectiveScale } = useDynamicType();
  const [manualScale, setManualScale] = useState(1.0);

  const handleScaleChange = (newScale: number) => {
    setManualScale(newScale);
    applyDynamicTypeScale(newScale);
  };

  const presetScales = [
    { label: 'xSmall', value: 0.82 },
    { label: 'Small', value: 0.88 },
    { label: 'Medium', value: 0.94 },
    { label: 'Large (Default)', value: 1.0 },
    { label: 'xLarge', value: 1.12 },
    { label: 'xxLarge', value: 1.24 },
    { label: 'xxxLarge', value: 1.35 },
    { label: 'Accessibility 1', value: 1.5 },
    { label: 'Accessibility 2', value: 1.75 },
    { label: 'Accessibility 3 (200%)', value: 2.0 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Dynamic Type Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test text scaling from 82% to 200% for accessibility
          </p>
        </div>

        {/* Current Scale Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Current Scale Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Text Scale</p>
              <p className="text-2xl font-bold text-blue-600">{textScale.toFixed(2)}x</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Effective Scale</p>
              <p className="text-2xl font-bold text-blue-600">{effectiveScale.toFixed(2)}x</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Large Text</p>
              <p className="text-2xl font-bold">{isLargeText ? '✓ Yes' : '✗ No'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Accessibility Size</p>
              <p className="text-2xl font-bold">{isAccessibilitySize ? '✓ Yes' : '✗ No'}</p>
            </div>
          </div>
        </div>

        {/* Scale Control */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Adjust Text Scale</h2>
          
          {/* Slider */}
          <div className="mb-6">
            <label htmlFor="manual-scale-slider" className="block text-sm font-medium mb-2">
              Manual Scale: {manualScale.toFixed(2)}x ({Math.round(manualScale * 100)}%)
            </label>
            <input
              id="manual-scale-slider"
              type="range"
              min="0.82"
              max="2.0"
              step="0.01"
              value={manualScale}
              onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              aria-label={`Manual scale: ${manualScale.toFixed(2)}x or ${Math.round(manualScale * 100)} percent`}
            />
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
              <span>82%</span>
              <span>100%</span>
              <span>150%</span>
              <span>200%</span>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {presetScales.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handleScaleChange(preset.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  Math.abs(manualScale - preset.value) < 0.01
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Text Samples */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Text Samples</h2>
          
          <div className="space-y-6">
            {/* Headings */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Headings</h3>
              <h1 className="text-4xl font-bold mb-2">Heading 1 (4xl)</h1>
              <h2 className="text-3xl font-bold mb-2">Heading 2 (3xl)</h2>
              <h3 className="text-2xl font-bold mb-2">Heading 3 (2xl)</h3>
              <h4 className="text-xl font-bold mb-2">Heading 4 (xl)</h4>
              <h5 className="text-lg font-bold mb-2">Heading 5 (lg)</h5>
              <h6 className="text-base font-bold">Heading 6 (base)</h6>
            </div>

            {/* Body Text */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Body Text</h3>
              <p className="text-base mb-2">
                This is regular body text at base size. It should scale proportionally with the text scale setting.
                The quick brown fox jumps over the lazy dog.
              </p>
              <p className="text-sm mb-2">
                This is small text. Even at smaller sizes, text should remain readable when scaled up.
              </p>
              <p className="text-xs">
                This is extra small text. Accessibility features ensure this remains legible.
              </p>
            </div>

            {/* Buttons */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Buttons</h3>
              <div className="flex flex-wrap gap-2">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Primary Button
                </button>
                <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
                  Secondary Button
                </button>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  Danger Button
                </button>
              </div>
            </div>

            {/* Form Inputs */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Form Inputs</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="demo-text-input" className="block text-sm font-medium mb-1">Text Input</label>
                  <input
                    id="demo-text-input"
                    type="text"
                    placeholder="Enter text here"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="demo-textarea" className="block text-sm font-medium mb-1">Textarea</label>
                  <textarea
                    id="demo-textarea"
                    placeholder="Enter multiple lines of text"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Select</label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option>Option 1</option>
                    <option>Option 2</option>
                    <option>Option 3</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Lists */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Lists</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>First list item</li>
                <li>Second list item with more text to show wrapping behavior</li>
                <li>Third list item</li>
              </ul>
            </div>

            {/* Links */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Links</h3>
              <p>
                This is a paragraph with <a href="#" className="text-blue-600 hover:underline">an inline link</a> that should scale properly.
              </p>
            </div>
          </div>
        </div>

        {/* Guidelines */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Dynamic Type Guidelines</h2>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li>✓ All text scales proportionally with the system font size</li>
            <li>✓ Layouts adapt to accommodate larger text (up to 200%)</li>
            <li>✓ Touch targets maintain minimum 44x44px size</li>
            <li>✓ Buttons and form inputs scale with text</li>
            <li>✓ Spacing adjusts to maintain visual hierarchy</li>
            <li>✓ Content remains readable at all scale levels</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DynamicTypeDemo;
