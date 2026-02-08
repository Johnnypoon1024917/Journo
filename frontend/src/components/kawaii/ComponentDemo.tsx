/**
 * Kawaii Components Demo
 * 
 * A demo page showcasing all kawaii UI components.
 * This can be used for visual testing and documentation.
 */

import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Button, FAB, Card, Input, Checkbox, Slider, BottomNavigation } from './index';

export const ComponentDemo: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [sliderValue, setSliderValue] = useState(16);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('schedule');

  const handleLoadingClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-kawaii-neutral-50 dark:bg-kawaii-neutral-900 p-8 pb-24">
        <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-kawaii-neutral-900 dark:text-white mb-2">
            Kawaii UI Components
          </h1>
          <p className="text-kawaii-neutral-600 dark:text-kawaii-neutral-400">
            A showcase of all kawaii-style components with Framer Motion animations
          </p>
        </div>

        {/* Buttons Section */}
        <Card variant="elevated" padding="lg">
          <h2 className="text-2xl font-semibold mb-6 text-kawaii-neutral-900 dark:text-white">
            Buttons
          </h2>
          <div className="space-y-6">
            {/* Variants */}
            <div>
              <h3 className="text-sm font-medium text-kawaii-neutral-700 dark:text-kawaii-neutral-300 mb-3">
                Variants
              </h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="ghost">Ghost Button</Button>
              </div>
            </div>

            {/* Sizes */}
            <div>
              <h3 className="text-sm font-medium text-kawaii-neutral-700 dark:text-kawaii-neutral-300 mb-3">
                Sizes
              </h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>

            {/* States */}
            <div>
              <h3 className="text-sm font-medium text-kawaii-neutral-700 dark:text-kawaii-neutral-300 mb-3">
                States
              </h3>
              <div className="flex flex-wrap gap-4">
                <Button loading={loading} onClick={handleLoadingClick}>
                  {loading ? 'Loading...' : 'Click to Load'}
                </Button>
                <Button disabled>Disabled Button</Button>
              </div>
            </div>

            {/* With Icons */}
            <div>
              <h3 className="text-sm font-medium text-kawaii-neutral-700 dark:text-kawaii-neutral-300 mb-3">
                With Icons
              </h3>
              <div className="flex flex-wrap gap-4">
                <Button icon={<span>🎨</span>} iconPosition="left">
                  Left Icon
                </Button>
                <Button icon={<span>✨</span>} iconPosition="right">
                  Right Icon
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Cards Section */}
        <Card variant="elevated" padding="lg">
          <h2 className="text-2xl font-semibold mb-6 text-kawaii-neutral-900 dark:text-white">
            Cards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card variant="default" padding="md">
              <h3 className="font-semibold mb-2">Default Card</h3>
              <p className="text-sm text-kawaii-neutral-600 dark:text-kawaii-neutral-400">
                Standard card with subtle shadow
              </p>
            </Card>
            <Card variant="elevated" padding="md" hoverable>
              <h3 className="font-semibold mb-2">Elevated Card</h3>
              <p className="text-sm text-kawaii-neutral-600 dark:text-kawaii-neutral-400">
                Hover me for lift effect!
              </p>
            </Card>
            <Card variant="outlined" padding="md">
              <h3 className="font-semibold mb-2">Outlined Card</h3>
              <p className="text-sm text-kawaii-neutral-600 dark:text-kawaii-neutral-400">
                Card with border instead of shadow
              </p>
            </Card>
          </div>
        </Card>

        {/* Input Section */}
        <Card variant="elevated" padding="lg">
          <h2 className="text-2xl font-semibold mb-6 text-kawaii-neutral-900 dark:text-white">
            Text Input
          </h2>
          <div className="space-y-4 max-w-md">
            <Input
              label="Default Input"
              placeholder="Enter text..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              helperText="This is helper text"
            />
            <Input
              label="Success Input"
              variant="success"
              placeholder="Valid input"
              defaultValue="valid@email.com"
            />
            <Input
              label="Error Input"
              error="This field is required"
              placeholder="Enter required field"
            />
            <Input
              label="Disabled Input"
              disabled
              placeholder="Disabled input"
            />
          </div>
        </Card>

        {/* Checkbox Section */}
        <Card variant="elevated" padding="lg">
          <h2 className="text-2xl font-semibold mb-6 text-kawaii-neutral-900 dark:text-white">
            Checkbox
          </h2>
          <div className="space-y-4 max-w-md">
            <Checkbox
              label="Accept terms and conditions"
              helperText="You must accept to continue"
              checked={checkboxValue}
              onChange={(e) => setCheckboxValue(e.target.checked)}
            />
            <Checkbox
              label="Subscribe to newsletter"
              helperText="Get weekly updates"
            />
            <Checkbox
              label="Disabled checkbox"
              disabled
              helperText="This option is not available"
            />
          </div>
        </Card>

        {/* Slider Section */}
        <Card variant="elevated" padding="lg">
          <h2 className="text-2xl font-semibold mb-6 text-kawaii-neutral-900 dark:text-white">
            Slider
          </h2>
          <div className="space-y-6 max-w-md">
            <Slider
              label="Font Size"
              min={12}
              max={24}
              step={1}
              value={sliderValue}
              onChange={(e) => setSliderValue(Number(e.target.value))}
              showValue
              valueFormatter={(val) => `${val}px`}
              helperText="Adjust the font size"
            />
            <Slider
              label="Volume"
              min={0}
              max={100}
              step={5}
              defaultValue={75}
              showValue
              valueFormatter={(val) => `${val}%`}
            />
            <Slider
              label="Disabled Slider"
              min={0}
              max={100}
              defaultValue={50}
              disabled
              helperText="This slider is disabled"
            />
          </div>
        </Card>

        {/* FAB Section */}
        <Card variant="elevated" padding="lg">
          <h2 className="text-2xl font-semibold mb-6 text-kawaii-neutral-900 dark:text-white">
            Floating Action Button (FAB)
          </h2>
          <p className="text-kawaii-neutral-600 dark:text-kawaii-neutral-400 mb-4">
            The FAB appears in the bottom-right corner with a pulse animation.
            Scroll down to see it in action!
          </p>
          <div className="h-64 bg-kawaii-neutral-100 dark:bg-kawaii-neutral-800 rounded-lg flex items-center justify-center">
            <p className="text-kawaii-neutral-500">
              Look at the bottom-right corner →
            </p>
          </div>
        </Card>

        {/* Bottom Navigation Section */}
        <Card variant="elevated" padding="lg">
          <h2 className="text-2xl font-semibold mb-6 text-kawaii-neutral-900 dark:text-white">
            Bottom Navigation
          </h2>
          <p className="text-kawaii-neutral-600 dark:text-kawaii-neutral-400 mb-4">
            Fixed bottom navigation bar with 7 tabs. Active tab: <strong>{activeTab}</strong>
          </p>
          <div className="bg-kawaii-neutral-100 dark:bg-kawaii-neutral-800 rounded-lg p-4">
            <p className="text-sm text-kawaii-neutral-600 dark:text-kawaii-neutral-400 mb-2">
              Features:
            </p>
            <ul className="list-disc list-inside text-sm text-kawaii-neutral-600 dark:text-kawaii-neutral-400 space-y-1">
              <li>Fixed bottom positioning with safe area insets</li>
              <li>7 tabs: Schedule, Booking, Budget, Shopping, Checklist, Members, Settings</li>
              <li>Active tab highlighting with primary color</li>
              <li>Touch-optimized with 44px minimum height</li>
              <li>Smooth animations with Framer Motion</li>
              <li>Heroicons for tab icons</li>
              <li>Routing integration</li>
            </ul>
          </div>
          <div className="mt-4 p-4 bg-kawaii-cream dark:bg-kawaii-neutral-700 rounded-lg">
            <p className="text-sm text-kawaii-neutral-700 dark:text-kawaii-neutral-300">
              💡 <strong>Tip:</strong> The bottom navigation is visible at the bottom of this page. 
              Try clicking different tabs to see the active state change!
            </p>
          </div>
        </Card>
      </div>

      {/* FAB */}
      <FAB
        onClick={() => alert('FAB clicked!')}
        label="Add new item"
        position="bottom-right"
      />

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
    </BrowserRouter>
  );
};
