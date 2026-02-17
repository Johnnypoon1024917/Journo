# SideNavigation Component

## Overview

The `SideNavigation` component provides a fixed side navigation bar for desktop and tablet layouts. It features a collapsible design with smooth animations, larger icons and labels optimized for desktop use, and hover effects for better user experience.

## Features

- **Fixed Left Positioning**: Stays fixed on the left side of the screen
- **Collapsible Design**: Can be collapsed to show only icons, saving screen space
- **Smooth Animations**: Uses Framer Motion for fluid transitions
- **7 Navigation Tabs**: Schedule, Booking, Budget, Shopping, Checklist, Members, Settings
- **Active State Highlighting**: Active tab is highlighted with primary theme color
- **Hover Effects**: Interactive hover states for better feedback
- **Badge Support**: Can display notification badges on tabs
- **Routing Integration**: Works with React Router for navigation
- **Dark Mode Support**: Adapts to dark mode theme
- **Accessibility**: Proper ARIA labels and keyboard navigation support

## Usage

### Basic Usage

```tsx
import { SideNavigation } from '@/components/bubblequest';

function App() {
  return (
    <div className="flex">
      <SideNavigation />
      <main className="flex-1 ml-60">
        {/* Your content */}
      </main>
    </div>
  );
}
```

### Controlled Collapsed State

```tsx
import { useState } from 'react';
import { SideNavigation } from '@/components/bubblequest';

function App() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex">
      <SideNavigation
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
      />
      <main className={`flex-1 ${collapsed ? 'ml-20' : 'ml-60'}`}>
        {/* Your content */}
      </main>
    </div>
  );
}
```

### With Custom Active Tab

```tsx
import { SideNavigation } from '@/components/bubblequest';

function App() {
  const [activeTab, setActiveTab] = useState('schedule');

  return (
    <div className="flex">
      <SideNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <main className="flex-1 ml-60">
        {/* Your content */}
      </main>
    </div>
  );
}
```

### Responsive Layout

```tsx
import { SideNavigation } from '@/components/bubblequest';
import { BottomNavigation } from '@/components/bubblequest';
import { useResponsive } from '@/hooks/useResponsive';

function App() {
  const { isDesktop } = useResponsive();

  return (
    <div className="flex">
      {isDesktop && <SideNavigation />}
      <main className={`flex-1 ${isDesktop ? 'ml-60' : ''}`}>
        {/* Your content */}
      </main>
      {!isDesktop && <BottomNavigation />}
    </div>
  );
}
```

## Props

### SideNavigationProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `activeTab` | `string` | Auto-detected from route | Currently active tab ID |
| `onTabChange` | `(tab: string) => void` | `undefined` | Callback when tab is clicked |
| `collapsed` | `boolean` | `false` | Whether the navigation is collapsed |
| `onCollapsedChange` | `(collapsed: boolean) => void` | `undefined` | Callback when collapse state changes |
| `className` | `string` | `undefined` | Additional CSS classes |

### NavItem

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier for the tab |
| `icon` | `React.ComponentType` | Outline icon component |
| `activeIcon` | `React.ComponentType` | Solid icon component for active state |
| `label` | `string` | Display label for the tab |
| `route` | `string` | Route path for navigation |
| `badge` | `number` (optional) | Badge count to display |

## Navigation Items

The component includes 7 default navigation items:

1. **Schedule** (`/schedule`) - Calendar icon
2. **Booking** (`/booking`) - Ticket icon
3. **Budget** (`/budget`) - Currency icon
4. **Shopping** (`/shopping`) - Shopping bag icon
5. **Checklist** (`/checklist`) - Clipboard icon
6. **Members** (`/members`) - Users icon
7. **Settings** (`/settings`) - Cog icon

## Styling

### Width

- **Expanded**: 240px
- **Collapsed**: 80px

### Colors

The component uses the BubbleQuest theme colors:

- **Background**: `bg-white` / `dark:bg-bubblequest-neutral-900`
- **Border**: `border-bubblequest-neutral-200` / `dark:border-bubblequest-neutral-800`
- **Active State**: `bg-bubblequest-primary-50` / `dark:bg-bubblequest-primary-900/20`
- **Text**: `text-bubblequest-neutral-700` / `dark:text-bubblequest-neutral-300`
- **Active Text**: `text-bubblequest-primary-700` / `dark:text-bubblequest-primary-300`

### Animations

- **Width Transition**: Spring animation (stiffness: 300, damping: 30)
- **Hover Scale**: 1.02x scale on hover
- **Tap Scale**: 0.98x scale on tap
- **Label Fade**: Opacity and slide animation when collapsing/expanding

## Accessibility

- **ARIA Labels**: All buttons have proper `aria-label` attributes
- **Current Page**: Active tab has `aria-current="page"`
- **Keyboard Navigation**: Full keyboard support with focus indicators
- **Focus Rings**: Visible focus rings for keyboard navigation

## Layout Considerations

### Content Margin

When using SideNavigation, add appropriate left margin to your main content:

```tsx
<main className="ml-60"> {/* 240px when expanded */}
  {/* Content */}
</main>

<main className="ml-20"> {/* 80px when collapsed */}
  {/* Content */}
</main>
```

### Responsive Design

Use with `useResponsive` hook to show/hide based on screen size:

```tsx
const { isDesktop } = useResponsive();

{isDesktop ? <SideNavigation /> : <BottomNavigation />}
```

### Z-Index

The component has `z-40` to ensure it stays above content but below modals.

## Examples

### With Badge Notifications

```tsx
// Note: Badge support is built-in but requires custom nav items
// The default items don't include badges
```

### Custom Styling

```tsx
<SideNavigation
  className="shadow-2xl"
/>
```

### Persistent Collapsed State

```tsx
import { useState, useEffect } from 'react';

function App() {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('nav-collapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('nav-collapsed', String(collapsed));
  }, [collapsed]);

  return (
    <SideNavigation
      collapsed={collapsed}
      onCollapsedChange={setCollapsed}
    />
  );
}
```

## Requirements

This component satisfies:
- **Requirement 17.5**: Desktop/tablet side navigation with collapsible option

## Related Components

- **BottomNavigation**: Mobile navigation component
- **ResponsiveNavigation**: Wrapper that switches between Side and Bottom navigation
- **BubbleQuestThemeProvider**: Provides theme context for colors

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires CSS Grid and Flexbox support
- Requires JavaScript for animations and interactions
