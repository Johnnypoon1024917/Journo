/**
 * Responsive Navigation Example
 * 
 * Demonstrates how to use the responsive navigation system that automatically
 * switches between SideNavigation (desktop/tablet) and BottomNavigation (mobile).
 */

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ResponsiveKawaiiLayout } from './ResponsiveBubbleQuestNavigation';
import { Card } from './Card';
import { Button } from './Button';
import { useResponsive } from '@/hooks/useResponsive';

const ExamplePage: React.FC<{ title: string }> = ({ title }) => {
  const { isDesktop, isTablet, isMobile } = useResponsive();
  
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 mb-4">
        {title}
      </h1>
      
      <Card className="p-4 md:p-6 mb-4">
        <h2 className="text-lg font-semibold text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 mb-2">
          Current Layout
        </h2>
        <div className="space-y-2 text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300">
          <p>
            <strong>Device Type:</strong>{' '}
            {isDesktop ? 'Desktop' : isTablet ? 'Tablet' : isMobile ? 'Mobile' : 'Unknown'}
          </p>
          <p>
            <strong>Navigation:</strong>{' '}
            {isDesktop || isTablet ? 'Side Navigation (Left)' : 'Bottom Navigation'}
          </p>
        </div>
      </Card>

      <Card className="p-4 md:p-6">
        <h2 className="text-lg font-semibold text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 mb-2">
          Page Content
        </h2>
        <p className="text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300">
          This is the {title} page. The navigation automatically adapts to your screen size:
        </p>
        <ul className="mt-4 space-y-2 text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300 list-disc list-inside">
          <li>On desktop/tablet: Side navigation on the left</li>
          <li>On mobile: Bottom navigation at the bottom</li>
          <li>Content spacing adjusts automatically</li>
          <li>Navigation state is preserved across layouts</li>
        </ul>
      </Card>
    </div>
  );
};

export const ResponsiveNavigationExample: React.FC = () => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [sideNavCollapsed, setSideNavCollapsed] = useState(false);
  const { isDesktop, isTablet } = useResponsive();

  return (
    <BrowserRouter>
      <ResponsiveKawaiiLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        sideNavCollapsed={sideNavCollapsed}
        onSideNavCollapsedChange={setSideNavCollapsed}
      >
        {/* Header with controls */}
        <div className="bg-white dark:bg-bubblequest-neutral-900 border-b border-bubblequest-neutral-200 dark:border-bubblequest-neutral-800 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100">
              Responsive Navigation Example
            </h2>
            {(isDesktop || isTablet) && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSideNavCollapsed(!sideNavCollapsed)}
              >
                {sideNavCollapsed ? 'Expand' : 'Collapse'} Nav
              </Button>
            )}
          </div>
        </div>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<ExamplePage title="Schedule" />} />
          <Route path="/schedule" element={<ExamplePage title="Schedule" />} />
          <Route path="/booking" element={<ExamplePage title="Booking" />} />
          <Route path="/budget" element={<ExamplePage title="Budget" />} />
          <Route path="/shopping" element={<ExamplePage title="Shopping" />} />
          <Route path="/checklist" element={<ExamplePage title="Checklist" />} />
          <Route path="/members" element={<ExamplePage title="Members" />} />
          <Route path="/settings" element={<ExamplePage title="Settings" />} />
        </Routes>

        {/* Instructions */}
        <div className="p-4 md:p-8">
          <Card className="p-4 md:p-6">
            <h3 className="text-xl font-bold text-bubblequest-neutral-900 dark:text-bubblequest-neutral-100 mb-4">
              How to Use
            </h3>
            <div className="space-y-4 text-bubblequest-neutral-700 dark:text-bubblequest-neutral-300">
              <div>
                <h4 className="font-semibold mb-2">1. Import the Layout Component</h4>
                <pre className="bg-bubblequest-neutral-100 dark:bg-bubblequest-neutral-800 p-3 rounded-lg overflow-x-auto text-sm">
{`import { ResponsiveKawaiiLayout } from '@/components/bubblequest';`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold mb-2">2. Wrap Your Content</h4>
                <pre className="bg-bubblequest-neutral-100 dark:bg-bubblequest-neutral-800 p-3 rounded-lg overflow-x-auto text-sm">
{`<ResponsiveKawaiiLayout>
  <YourContent />
</ResponsiveKawaiiLayout>`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold mb-2">3. Optional: Control Navigation State</h4>
                <pre className="bg-bubblequest-neutral-100 dark:bg-bubblequest-neutral-800 p-3 rounded-lg overflow-x-auto text-sm">
{`const [activeTab, setActiveTab] = useState('schedule');
const [collapsed, setCollapsed] = useState(false);

<ResponsiveKawaiiLayout
  activeTab={activeTab}
  onTabChange={setActiveTab}
  sideNavCollapsed={collapsed}
  onSideNavCollapsedChange={setCollapsed}
>
  <YourContent />
</ResponsiveKawaiiLayout>`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold mb-2">4. Test Responsiveness</h4>
                <p>
                  Resize your browser window or use browser dev tools to test different screen sizes.
                  The navigation will automatically switch between side and bottom layouts.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </ResponsiveKawaiiLayout>
    </BrowserRouter>
  );
};
