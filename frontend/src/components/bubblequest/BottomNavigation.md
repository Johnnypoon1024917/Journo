# BottomNavigation Component

## Overview

The `BottomNavigation` component is a fixed bottom navigation bar designed for mobile interfaces. It provides easy access to the 7 main sections of the Journo travel platform.

## Features

### Core Functionality
- **Fixed Positioning**: Stays at the bottom of the screen with safe area insets for devices with notches
- **7 Navigation Tabs**: Schedule, Booking, Budget, Shopping, Checklist, Members, Settings
- **Active State Highlighting**: Active tab is highlighted with the primary theme color
- **Touch Optimized**: 44px minimum touch target height for accessibility
- **Routing Integration**: Works seamlessly with React Router for navigation

### Visual Design
- **Heroicons**: Uses outline icons for inactive tabs and solid icons for active tabs
- **Smooth Animations**: Framer Motion animations for:
  - Tap feedback (scale 0.95)
  - Active icon scale (1.1)
  - Animated indicator bar with `layoutId` for smooth transitions
- **Badge Support**: Optional badge indicators for notifications (e.g., unread counts)
- **Dark Mode**: Full support for dark mode with appropriate color adjustments

### Accessibility
- **ARIA Labels**: Each tab has proper `aria-label` attributes
- **Current Page Indicator**: Active tab has `aria-current="page"` attribute
- **Keyboard Navigation**: Focus states with visible focus rings
- **Screen Reader Support**: Semantic HTML with proper navigation role

## Usage

### Basic Usage (Uncontrolled)

The component can automatically determine the active tab from the current route:

```tsx
import { BottomNavigation } from '@/components/bubblequest';

function App() {
  return (
    <div>
      {/* Your app content */}
      <BottomNavigation />
    </div>
  );
}
```

### Controlled Usage

You can also control the active tab state manually:

```tsx
import { BottomNavigation } from '@/components/bubblequest';
import { useState } from 'react';

function App() {
  const [activeTab, setActiveTab] = useState('schedule');

  return (
    <div>
      {/* Your app content */}
      <BottomNavigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}
```

### Custom Styling

You can add custom classes to the navigation:

```tsx
<BottomNavigation className="custom-shadow" />
```

## Props

### BottomNavigationProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `activeTab` | `string` | Auto-detected from route | The ID of the currently active tab |
| `onTabChange` | `(tab: string) => void` | `undefined` | Callback fired when a tab is clicked |
| `className` | `string` | `undefined` | Additional CSS classes to apply |

## Navigation Items

The component includes 7 predefined navigation items:

| ID | Label | Icon | Route |
|----|-------|------|-------|
| `schedule` | Schedule | CalendarDaysIcon | `/schedule` |
| `booking` | Booking | TicketIcon | `/booking` |
| `budget` | Budget | CurrencyDollarIcon | `/budget` |
| `shopping` | Shopping | ShoppingBagIcon | `/shopping` |
| `checklist` | Checklist | ClipboardDocumentCheckIcon | `/checklist` |
| `members` | Members | UsersIcon | `/members` |
| `settings` | Settings | Cog6ToothIcon | `/settings` |

## Styling

The component uses Tailwind CSS classes with the kawaii design system tokens:

- **Background**: `bg-white` / `dark:bg-bubblequest-neutral-900`
- **Border**: `border-t border-bubblequest-neutral-200` / `dark:border-bubblequest-neutral-800`
- **Active Color**: `text-bubblequest-primary-600` / `dark:text-bubblequest-primary-400`
- **Inactive Color**: `text-bubblequest-neutral-500` / `dark:text-bubblequest-neutral-400`
- **Shadow**: `shadow-lg`

## Animations

### Tap Animation
- Scale down to 0.95 on tap
- Spring animation with stiffness 400, damping 17

### Active Icon Animation
- Scale up to 1.1 when active
- Spring animation with stiffness 300, damping 20

### Active Indicator Bar
- Smooth transition between tabs using Framer Motion's `layoutId`
- Spring animation with stiffness 500, damping 30

## Responsive Behavior

The component is designed for mobile-first:
- Fixed at bottom with `z-index: 40`
- Safe area insets: `pb-safe` class adds padding for devices with notches
- Minimum height of 64px (16 * 4)
- Flexible layout that adapts to screen width

## Integration with Layout

When using the BottomNavigation, ensure your main content has bottom padding to prevent overlap:

```tsx
<div className="pb-20">
  {/* Your content */}
</div>
<BottomNavigation />
```

The FAB component is positioned at `bottom: 80px` to appear above the navigation.

## Testing

The component includes comprehensive tests covering:
- Rendering all 7 tabs
- Tab labels display
- Active tab highlighting
- Click handlers
- Custom className application
- Accessibility attributes
- Touch target sizes
- Icon rendering
- Route-based active tab detection

Run tests:
```bash
npm test -- BottomNavigation.test.tsx
```

## Requirements Satisfied

This component satisfies the following requirements from the bubblequest-ui-redesign spec:

- **8.1**: Fixed bottom navigation bar with 7 tabs
- **8.2**: Tabs for Schedule, Booking, Budget, Shopping, Checklist, Members, Settings
- **8.3**: Active tab highlighting with primary theme color
- **8.4**: Tab navigation with route changes
- **8.5**: Appropriate icons for each tab

## Future Enhancements

Potential improvements for future iterations:

1. **i18n Support**: Add internationalization for tab labels (planned for task 4)
2. **Badge Customization**: Allow custom badge content and styling
3. **Custom Icons**: Support for custom icon components per tab
4. **Animation Preferences**: Respect user's reduced motion preferences
5. **Haptic Feedback**: Add haptic feedback on mobile devices
6. **Swipe Gestures**: Support swipe gestures to switch between tabs

## Related Components

- **SideNavigation**: Desktop/tablet navigation (task 3.4)
- **FAB**: Floating action button positioned above navigation
- **ThemeProvider**: Provides theme colors for active state

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- iOS Safari 14+
- Android Chrome 90+
- Requires CSS Grid and CSS Custom Properties support
