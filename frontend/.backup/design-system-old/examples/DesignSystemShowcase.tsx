/**
 * Design System Showcase
 * 
 * Example component demonstrating the modern UI foundation and design system.
 * Shows various components, animations, and responsive behaviors.
 */

import React, { useState } from 'react';
import { 
  Button, 
  Input, 
  Text, 
  Icon, 
  Avatar, 
  Badge, 
  Spinner, 
  Divider 
} from '../atoms';
import { cn } from '../../utils/cn';

export const DesignSystemShowcase: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleButtonClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="container-responsive py-8 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <Text variant="display" className="animate-fade-in">
          Modern Design System
        </Text>
        <Text variant="body" color="secondary" className="animate-fade-in [animation-delay:200ms]">
          A comprehensive UI foundation with atomic components, smooth animations, and responsive design.
        </Text>
      </div>

      {/* Typography Section */}
      <section className="space-y-6">
        <Text variant="heading">Typography</Text>
        <div className="space-y-4">
          <Text variant="display" size="lg">Display Text</Text>
          <Text variant="heading">Heading Text</Text>
          <Text variant="subheading">Subheading Text</Text>
          <Text variant="body">
            Body text with proper line height and spacing for optimal readability. 
            This demonstrates the responsive typography system.
          </Text>
          <Text variant="caption" color="muted">Caption text for metadata and helper information</Text>
          <Text variant="overline" color="secondary">Overline Text</Text>
        </div>
      </section>

      <Divider />

      {/* Buttons Section */}
      <section className="space-y-6">
        <Text variant="heading">Buttons</Text>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary" onClick={handleButtonClick} loading={loading}>
            Primary Button
          </Button>
          <Button variant="secondary">
            Secondary Button
          </Button>
          <Button variant="tertiary">
            Tertiary Button
          </Button>
          <Button variant="danger">
            Danger Button
          </Button>
          <Button variant="ghost">
            Ghost Button
          </Button>
          <Button variant="link">
            Link Button
          </Button>
        </div>

        {/* Button Sizes */}
        <div className="flex flex-wrap items-center gap-4">
          <Button size="xs">Extra Small</Button>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="xl">Extra Large</Button>
        </div>

        {/* Buttons with Icons */}
        <div className="flex flex-wrap gap-4">
          <Button icon={<Icon name="plus" />} iconPosition="left">
            Add Item
          </Button>
          <Button variant="secondary" icon={<Icon name="search" />} iconPosition="left">
            Search
          </Button>
          <Button variant="tertiary" icon={<Icon name="chevron-right" />} iconPosition="right">
            Next
          </Button>
          <Button variant="ghost" icon={<Icon name="heart" />} />
        </div>
      </section>

      <Divider />

      {/* Form Elements Section */}
      <section className="space-y-6">
        <Text variant="heading">Form Elements</Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
          <Input
            placeholder="Enter your name"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <Input
            type="email"
            placeholder="Enter your email"
            variant="default"
          />
          <Input
            placeholder="Success state"
            variant="success"
          />
          <Input
            placeholder="Error state"
            variant="error"
          />
          <Input
            placeholder="Disabled input"
            disabled
          />
          <Input
            placeholder="Read-only input"
            readOnly
            value="Read-only value"
          />
        </div>
      </section>

      <Divider />

      {/* Icons Section */}
      <section className="space-y-6">
        <Text variant="heading">Icons</Text>
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-4">
          {[
            'plus', 'minus', 'x-mark', 'check', 'search', 'heart',
            'star', 'map-pin', 'calendar', 'clock', 'camera',
            'chevron-left', 'chevron-right', 'chevron-up', 'chevron-down'
          ].map((iconName) => (
            <div key={iconName} className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
              <Icon name={iconName} size="lg" />
              <Text variant="caption" className="text-center text-xs">
                {iconName}
              </Text>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* Avatars and Badges Section */}
      <section className="space-y-6">
        <Text variant="heading">Avatars & Badges</Text>
        
        {/* Avatars */}
        <div className="space-y-4">
          <Text variant="subheading" size="sm">Avatars</Text>
          <div className="flex items-center gap-4">
            <Avatar size="xs" alt="John Doe" fallback="JD" />
            <Avatar size="sm" alt="Jane Smith" fallback="JS" status="online" />
            <Avatar size="md" alt="Bob Johnson" fallback="BJ" status="away" />
            <Avatar size="lg" alt="Alice Brown" fallback="AB" status="busy" />
            <Avatar size="xl" alt="Charlie Wilson" fallback="CW" status="offline" />
          </div>
        </div>

        {/* Badges */}
        <div className="space-y-4">
          <Text variant="subheading" size="sm">Badges</Text>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="default">Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="info">Info</Badge>
          </div>
          
          {/* Dot badges */}
          <div className="flex items-center gap-3">
            <Badge dot variant="success" />
            <Badge dot variant="warning" />
            <Badge dot variant="error" />
            <Badge dot variant="info" />
          </div>
        </div>
      </section>

      <Divider />

      {/* Loading States Section */}
      <section className="space-y-6">
        <Text variant="heading">Loading States</Text>
        <div className="flex items-center gap-6">
          <Spinner size="xs" />
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
          <Spinner size="xl" />
        </div>
        
        <div className="flex items-center gap-6">
          <Spinner variant="primary" />
          <Spinner variant="white" className="bg-neutral-800 p-2 rounded" />
          <Spinner speed="slow" />
          <Spinner speed="fast" />
        </div>
      </section>

      <Divider />

      {/* Animation Examples */}
      <section className="space-y-6">
        <Text variant="heading">Animations & Micro-interactions</Text>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Hover Card */}
          <div className="card-modern p-6 cursor-pointer group">
            <div className="space-y-3">
              <Icon name="heart" size="lg" className="text-primary-500 group-hover:animate-bounce-gentle" />
              <Text variant="subheading" size="sm">Hover Effects</Text>
              <Text variant="caption" color="muted">
                Smooth hover animations with micro-interactions
              </Text>
            </div>
          </div>

          {/* Loading Card */}
          <div className="card-modern p-6">
            <div className="space-y-3">
              <Spinner className="text-primary-500" />
              <Text variant="subheading" size="sm">Loading States</Text>
              <Text variant="caption" color="muted">
                Elegant loading indicators with smooth animations
              </Text>
            </div>
          </div>

          {/* Interactive Card */}
          <div className="card-modern p-6 cursor-pointer transform transition-all duration-300 hover:scale-105 active:scale-95">
            <div className="space-y-3">
              <Icon name="star" size="lg" className="text-warning-500" />
              <Text variant="subheading" size="sm">Interactive</Text>
              <Text variant="caption" color="muted">
                Touch-friendly interactions with visual feedback
              </Text>
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* Responsive Design */}
      <section className="space-y-6">
        <Text variant="heading">Responsive Design</Text>
        <div className="grid grid-responsive-1-2-3 gap-6">
          <div className="card-modern p-6 text-center">
            <Icon name="map-pin" size="xl" className="text-primary-500 mx-auto mb-3" />
            <Text variant="subheading" size="sm">Mobile First</Text>
            <Text variant="caption" color="muted">
              Optimized for touch devices with appropriate sizing
            </Text>
          </div>
          
          <div className="card-modern p-6 text-center">
            <Icon name="calendar" size="xl" className="text-secondary-500 mx-auto mb-3" />
            <Text variant="subheading" size="sm">Tablet Ready</Text>
            <Text variant="caption" color="muted">
              Adaptive layouts for tablet experiences
            </Text>
          </div>
          
          <div className="card-modern p-6 text-center">
            <Icon name="camera" size="xl" className="text-success-500 mx-auto mb-3" />
            <Text variant="subheading" size="sm">Desktop Enhanced</Text>
            <Text variant="caption" color="muted">
              Rich interactions for desktop users
            </Text>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="text-center pt-8">
        <Text variant="caption" color="muted">
          Modern design system built with accessibility, performance, and user experience in mind.
        </Text>
      </div>
    </div>
  );
};