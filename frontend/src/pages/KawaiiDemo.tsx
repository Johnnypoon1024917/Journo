/**
 * Kawaii Components Demo Page
 * 
 * Showcases all kawaii UI components for testing and demonstration.
 */

import React, { useState } from 'react';
import { 
  Button, 
  FAB, 
  Card, 
  Input, 
  CountdownTimer, 
  DateSelector,
  BottomNavigation,
  SideNavigation,
  ResponsiveKawaiiNavigation
} from '@/components/kawaii';
import { KawaiiThemeProvider, useKawaiiTheme } from '@/components/kawaii/KawaiiThemeProvider';
import { kawaiiThemePresets } from '@/stores/kawaiiThemeStore';

const KawaiiDemoContent: React.FC = () => {
  const {
    primaryColor,
    fontSize,
    darkMode,
    animations,
    setPrimaryColor,
    setFontSize,
    setDarkMode,
    setAnimations,
  } = useKawaiiTheme();

  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('schedule');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sideNavCollapsed, setSideNavCollapsed] = useState(false);

  // Sample dates for DateSelector
  const tripDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  // Sample departure date for CountdownTimer (7 days from now)
  const departureDate = new Date();
  departureDate.setDate(departureDate.getDate() + 7);

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-kawaii-neutral-50 dark:bg-kawaii-neutral-900 p-4 sm:p-8 pb-24">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-kawaii-neutral-900 dark:text-kawaii-neutral-50 mb-2">
            Kawaii UI Components
          </h1>
          <p className="text-kawaii-neutral-600 dark:text-kawaii-neutral-400">
            Nostalgic, joyful design inspired by decorating schedule books
          </p>
        </div>

        {/* Theme Controls */}
        <Card>
          <h2 className="text-2xl font-semibold mb-4">Theme Settings</h2>
          
          <div className="space-y-6">
            {/* Color Presets */}
            <div>
              <label className="block text-sm font-medium mb-2">Primary Color</label>
              <div className="flex flex-wrap gap-3">
                {kawaiiThemePresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setPrimaryColor(preset.value)}
                    className="w-12 h-12 rounded-full border-4 transition-all hover:scale-110"
                    style={{
                      backgroundColor: preset.value,
                      borderColor: primaryColor === preset.value ? '#000' : 'transparent',
                    }}
                    title={preset.name}
                  />
                ))}
              </div>
              <p className="text-sm text-kawaii-neutral-500 mt-2">
                Current: {primaryColor}
              </p>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Font Size: {fontSize}px
              </label>
              <input
                type="range"
                min="12"
                max="24"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Dark Mode */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Dark Mode</label>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  darkMode ? 'bg-kawaii-500' : 'bg-kawaii-neutral-300'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    darkMode ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {/* Animations */}
            <div>
              <label className="block text-sm font-medium mb-2">Animations</label>
              <div className="flex gap-2">
                {(['none', 'snow', 'sakura'] as const).map((type) => (
                  <Button
                    key={type}
                    variant={animations === type ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setAnimations(type)}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Buttons */}
        <Card>
          <h2 className="text-2xl font-semibold mb-4">Buttons</h2>
          
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button disabled>Disabled</Button>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                icon={<span>★</span>}
                iconPosition="left"
              >
                With Icon Left
              </Button>
              <Button
                icon={<span>→</span>}
                iconPosition="right"
              >
                With Icon Right
              </Button>
            </div>

            <div>
              <Button
                loading={loading}
                onClick={handleLoadingDemo}
                fullWidth
              >
                {loading ? 'Loading...' : 'Click to Load'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="default">
            <h3 className="font-semibold mb-2">Default Card</h3>
            <p className="text-sm text-kawaii-neutral-600 dark:text-kawaii-neutral-400">
              Standard card with subtle shadow
            </p>
          </Card>

          <Card variant="elevated" hoverable>
            <h3 className="font-semibold mb-2">Elevated Card</h3>
            <p className="text-sm text-kawaii-neutral-600 dark:text-kawaii-neutral-400">
              Hover me for lift effect!
            </p>
          </Card>

          <Card variant="outlined">
            <h3 className="font-semibold mb-2">Outlined Card</h3>
            <p className="text-sm text-kawaii-neutral-600 dark:text-kawaii-neutral-400">
              Card with border instead of shadow
            </p>
          </Card>
        </div>

        {/* Inputs */}
        <Card>
          <h2 className="text-2xl font-semibold mb-4">Inputs</h2>
          
          <div className="space-y-4">
            <Input
              label="Default Input"
              placeholder="Enter text..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              helperText="This is helper text"
            />

            <Input
              label="Error State"
              placeholder="Enter text..."
              error="This field is required"
            />

            <Input
              label="Success State"
              variant="success"
              placeholder="Enter text..."
              value="Valid input"
              readOnly
            />

            <Input
              label="Disabled Input"
              placeholder="Cannot edit..."
              disabled
            />
          </div>
        </Card>

        {/* FAB Demo */}
        <Card>
          <h2 className="text-2xl font-semibold mb-4">Floating Action Button</h2>
          <p className="text-kawaii-neutral-600 dark:text-kawaii-neutral-400">
            Look at the bottom-right corner of the screen! The FAB floats above all content.
          </p>
        </Card>

        {/* CountdownTimer Demo */}
        <Card>
          <h2 className="text-2xl font-semibold mb-4">Countdown Timer</h2>
          <p className="text-kawaii-neutral-600 dark:text-kawaii-neutral-400 mb-4">
            Displays time remaining until trip departure with smooth animations.
          </p>
          <CountdownTimer departureDate={departureDate} />
        </Card>

        {/* DateSelector Demo */}
        <Card>
          <h2 className="text-2xl font-semibold mb-4">Date Selector</h2>
          <p className="text-kawaii-neutral-600 dark:text-kawaii-neutral-400 mb-4">
            Horizontal scrollable date selector for navigating trip days.
          </p>
          <DateSelector
            dates={tripDates}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        </Card>

        {/* SideNavigation Demo */}
        <Card>
          <h2 className="text-2xl font-semibold mb-4">Side Navigation (Desktop/Tablet)</h2>
          <p className="text-kawaii-neutral-600 dark:text-kawaii-neutral-400 mb-4">
            Fixed side navigation for desktop and tablet layouts. Try collapsing it!
          </p>
          <div className="relative h-96 bg-kawaii-neutral-100 dark:bg-kawaii-neutral-800 rounded-lg overflow-hidden">
            <SideNavigation
              activeTab={activeTab}
              onTabChange={setActiveTab}
              collapsed={sideNavCollapsed}
              onCollapsedChange={setSideNavCollapsed}
            />
            <div className={`transition-all duration-300 ${sideNavCollapsed ? 'ml-20' : 'ml-60'} p-6`}>
              <h3 className="text-lg font-semibold mb-2">Content Area</h3>
              <p className="text-sm text-kawaii-neutral-600 dark:text-kawaii-neutral-400">
                Active tab: <strong>{activeTab}</strong>
              </p>
              <p className="text-sm text-kawaii-neutral-600 dark:text-kawaii-neutral-400 mt-2">
                The side navigation is {sideNavCollapsed ? 'collapsed' : 'expanded'}.
              </p>
            </div>
          </div>
        </Card>

        {/* BottomNavigation Demo */}
        <Card>
          <h2 className="text-2xl font-semibold mb-4">Bottom Navigation (Mobile)</h2>
          <p className="text-kawaii-neutral-600 dark:text-kawaii-neutral-400 mb-4">
            Fixed bottom navigation bar visible at the bottom of this page. Active tab: <strong>{activeTab}</strong>
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
            </ul>
          </div>
        </Card>

        {/* Responsive Navigation Demo */}
        <Card>
          <h2 className="text-2xl font-semibold mb-4">Responsive Navigation</h2>
          <p className="text-kawaii-neutral-600 dark:text-kawaii-neutral-400 mb-4">
            Automatically switches between SideNavigation (desktop/tablet) and BottomNavigation (mobile).
          </p>
          <div className="bg-kawaii-cream dark:bg-kawaii-neutral-700 rounded-lg p-4">
            <p className="text-sm text-kawaii-neutral-700 dark:text-kawaii-neutral-300">
              💡 <strong>Tip:</strong> Resize your browser window to see the navigation automatically switch between layouts!
            </p>
          </div>
        </Card>
      </div>

      {/* FAB */}
      <FAB
        onClick={() => alert('FAB clicked!')}
        label="Add new item"
      />

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
};

export const KawaiiDemo: React.FC = () => {
  return (
    <KawaiiThemeProvider>
      <KawaiiDemoContent />
    </KawaiiThemeProvider>
  );
};

export default KawaiiDemo;
