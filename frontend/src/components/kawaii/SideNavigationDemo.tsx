/**
 * SideNavigation Demo Component
 * 
 * Demonstrates the SideNavigation component with various configurations.
 */

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SideNavigation } from './SideNavigation';
import { Card } from './Card';
import { Button } from './Button';

const DemoPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="p-8">
    <h1 className="text-3xl font-bold text-kawaii-neutral-900 dark:text-kawaii-neutral-100 mb-4">
      {title}
    </h1>
    <Card className="p-6">
      <p className="text-kawaii-neutral-700 dark:text-kawaii-neutral-300">
        This is the {title} page. The side navigation is fixed on the left side
        and can be collapsed to save space.
      </p>
    </Card>
  </div>
);

export const SideNavigationDemo: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('schedule');

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-kawaii-neutral-50 dark:bg-kawaii-neutral-950">
        {/* Side Navigation */}
        <SideNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
        />

        {/* Main Content */}
        <main
          className={`flex-1 transition-all duration-300 ${
            collapsed ? 'ml-20' : 'ml-60'
          }`}
        >
          {/* Demo Controls */}
          <div className="bg-white dark:bg-kawaii-neutral-900 border-b border-kawaii-neutral-200 dark:border-kawaii-neutral-800 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-kawaii-neutral-900 dark:text-kawaii-neutral-100">
                SideNavigation Demo
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCollapsed(!collapsed)}
                >
                  {collapsed ? 'Expand' : 'Collapse'} Navigation
                </Button>
              </div>
            </div>
          </div>

          {/* Routes */}
          <Routes>
            <Route path="/" element={<DemoPage title="Schedule" />} />
            <Route path="/schedule" element={<DemoPage title="Schedule" />} />
            <Route path="/booking" element={<DemoPage title="Booking" />} />
            <Route path="/budget" element={<DemoPage title="Budget" />} />
            <Route path="/shopping" element={<DemoPage title="Shopping" />} />
            <Route path="/checklist" element={<DemoPage title="Checklist" />} />
            <Route path="/members" element={<DemoPage title="Members" />} />
            <Route path="/settings" element={<DemoPage title="Settings" />} />
          </Routes>

          {/* Demo Information */}
          <div className="p-8">
            <Card className="p-6">
              <h3 className="text-xl font-bold text-kawaii-neutral-900 dark:text-kawaii-neutral-100 mb-4">
                Features
              </h3>
              <ul className="space-y-2 text-kawaii-neutral-700 dark:text-kawaii-neutral-300">
                <li>✨ Fixed left side positioning</li>
                <li>🎯 Collapsible design (240px → 80px)</li>
                <li>🎨 Active tab highlighting with primary color</li>
                <li>🖱️ Smooth hover effects</li>
                <li>⚡ Framer Motion animations</li>
                <li>🌙 Dark mode support</li>
                <li>♿ Full accessibility support</li>
                <li>📱 Responsive design (desktop/tablet only)</li>
              </ul>
            </Card>

            <Card className="p-6 mt-4">
              <h3 className="text-xl font-bold text-kawaii-neutral-900 dark:text-kawaii-neutral-100 mb-4">
                Usage Tips
              </h3>
              <ul className="space-y-2 text-kawaii-neutral-700 dark:text-kawaii-neutral-300">
                <li>
                  <strong>Desktop/Tablet:</strong> Use SideNavigation for larger screens
                </li>
                <li>
                  <strong>Mobile:</strong> Use BottomNavigation for mobile devices
                </li>
                <li>
                  <strong>Responsive:</strong> Combine with useResponsive hook to switch automatically
                </li>
                <li>
                  <strong>Content Margin:</strong> Add ml-60 (expanded) or ml-20 (collapsed) to main content
                </li>
              </ul>
            </Card>

            <Card className="p-6 mt-4">
              <h3 className="text-xl font-bold text-kawaii-neutral-900 dark:text-kawaii-neutral-100 mb-4">
                Current State
              </h3>
              <div className="space-y-2 text-kawaii-neutral-700 dark:text-kawaii-neutral-300">
                <p>
                  <strong>Active Tab:</strong> {activeTab}
                </p>
                <p>
                  <strong>Collapsed:</strong> {collapsed ? 'Yes' : 'No'}
                </p>
                <p>
                  <strong>Width:</strong> {collapsed ? '80px' : '240px'}
                </p>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
};
