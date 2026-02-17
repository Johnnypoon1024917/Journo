# Responsive Layout System

## Overview

The responsive layout system provides a comprehensive solution for building adaptive UIs that work seamlessly across mobile, tablet, and desktop devices. It automatically switches between bottom navigation (mobile/tablet) and side navigation (desktop) with smooth transitions.

## Requirements Validation

- ✅ **17.1**: Mobile-first layouts (320px-767px)
- ✅ **17.2**: Tablet layouts (768px-1023px)
- ✅ **17.3**: Desktop layouts (1024px+)
- ✅ **17.4**: Bottom navigation for mobile
- ✅ **17.5**: Side navigation for desktop
- ✅ **17.6**: Minimum 44px touch targets
- ✅ **17.7**: Safe area insets for devices with notches

## Components

### ResponsiveLayout

Main layout wrapper that handles navigation switching and responsive padding.

```tsx
import { ResponsiveLayout } from '@/components/bubblequest/ResponsiveLayout';

<ResponsiveLayout
  showNavigation={true}
  activeTab="schedule"
  onTabChange={(tab) => console.log(tab)}
>
  {/* Your content here */}
</ResponsiveLayout>
```

**Props:**
- `children`: React.ReactNode - Content to render
- `showNavigation`: boolean - Whether to show navigation (default: true)
- `activeTab`: string - Active navigation tab
- `onTabChange`: (tab: string) => void - Tab change handler
- `contentClassName`: string - Additional className for content area
- `className`: string - Additional className for layout container

**Features:**
- Automatic navigation switching based on screen size
- Smooth transitions between layouts
- Safe area insets for devices with notches
- Responsive padding and max-width constraints

### ResponsiveContainer

Simple container with responsive max-width and padding.

```tsx
import { ResponsiveContainer } from '@/components/bubblequest/ResponsiveLayout';

<ResponsiveContainer size="default">
  {/* Your content here */}
</ResponsiveContainer>
```

**Props:**
- `children`: React.ReactNode - Content to render
- `size`: 'sm' | 'default' | 'lg' | 'xl' | 'full' - Container size
- `className`: string - Additional className

**Size Variants:**
- `sm`: max-w-mobile md:max-w-tablet
- `default`: max-w-mobile md:max-w-tablet lg:max-w-desktop
- `lg`: max-w-mobile md:max-w-tablet lg:max-w-desktop xl:max-w-wide
- `xl`: max-w-mobile md:max-w-tablet lg:max-w-desktop xl:max-w-wide 2xl:max-w-ultra
- `full`: max-w-full

### ResponsiveGrid

Grid layout that adapts columns based on screen size.

```tsx
import { ResponsiveGrid } from '@/components/bubblequest/ResponsiveLayout';

<ResponsiveGrid
  mobileCols={1}
  tabletCols={2}
  desktopCols={3}
  gap="md"
>
  {items.map(item => <div key={item.id}>{item.name}</div>)}
</ResponsiveGrid>
```

**Props:**
- `children`: React.ReactNode - Grid items
- `mobileCols`: 1 | 2 - Columns on mobile (default: 1)
- `tabletCols`: 2 | 3 | 4 - Columns on tablet (default: 2)
- `desktopCols`: 2 | 3 | 4 | 5 | 6 - Columns on desktop (default: 3)
- `gap`: 'sm' | 'md' | 'lg' | 'xl' - Gap size (default: 'md')
- `className`: string - Additional className

### ResponsiveStack

Flex container that switches between row and column based on screen size.

```tsx
import { ResponsiveStack } from '@/components/bubblequest/ResponsiveLayout';

<ResponsiveStack
  mobileDirection="column"
  tabletDirection="row"
  desktopDirection="row"
  gap="md"
  align="center"
  justify="between"
>
  <div>Item 1</div>
  <div>Item 2</div>
</ResponsiveStack>
```

**Props:**
- `children`: React.ReactNode - Stack items
- `mobileDirection`: 'row' | 'column' - Direction on mobile (default: 'column')
- `tabletDirection`: 'row' | 'column' - Direction on tablet (default: 'row')
- `desktopDirection`: 'row' | 'column' - Direction on desktop (default: 'row')
- `gap`: 'sm' | 'md' | 'lg' | 'xl' - Gap size (default: 'md')
- `align`: 'start' | 'center' | 'end' | 'stretch' - Alignment (default: 'start')
- `justify`: 'start' | 'center' | 'end' | 'between' | 'around' - Justify (default: 'start')
- `className`: string - Additional className

## Utilities

### Responsive Utilities (`@/utils/responsive`)

Helper functions for responsive design:

```tsx
import {
  BREAKPOINTS,
  DEVICE_RANGES,
  MIN_TOUCH_TARGET,
  isDeviceType,
  getCurrentDeviceType,
  isTouchDevice,
  getSafeAreaInsets,
  getResponsiveValue,
  getResponsivePadding,
  getResponsiveGap,
  getResponsiveColumns,
  meetsMinTouchTarget,
  ensureMinTouchTarget,
  getResponsiveFontSize,
  getViewportDimensions,
  isPortrait,
  isLandscape,
  responsiveClass,
  responsivePadding,
  responsiveMargin,
  responsiveGapClass,
} from '@/utils/responsive';
```

**Key Functions:**

#### Device Detection
```tsx
// Check if current device is mobile
if (isDeviceType('mobile')) {
  // Mobile-specific logic
}

// Get current device type
const deviceType = getCurrentDeviceType(); // 'mobile' | 'tablet' | 'desktop'

// Check if device supports touch
if (isTouchDevice()) {
  // Touch-specific logic
}
```

#### Safe Area Insets
```tsx
// Get safe area insets for devices with notches
const insets = getSafeAreaInsets();
console.log(insets.top, insets.right, insets.bottom, insets.left);
```

#### Responsive Values
```tsx
// Get responsive value based on device type
const fontSize = getResponsiveValue({
  mobile: 14,
  tablet: 16,
  desktop: 18,
});

// Get responsive padding
const padding = getResponsivePadding(); // '1rem' | '1.5rem' | '2rem'

// Get responsive gap
const gap = getResponsiveGap('md'); // '1rem' | '1.25rem' | '1.5rem'

// Get responsive columns
const columns = getResponsiveColumns({
  mobile: 1,
  tablet: 2,
  desktop: 3,
}); // 1 | 2 | 3
```

#### Touch Target Validation
```tsx
// Check if element meets minimum touch target size (44px)
const element = document.getElementById('button');
if (meetsMinTouchTarget(element)) {
  console.log('Touch target is accessible');
}

// Ensure dimensions meet minimum touch target
const { width, height } = ensureMinTouchTarget(30, 30);
console.log(width, height); // 44, 44
```

#### Viewport Information
```tsx
// Get viewport dimensions
const { width, height, aspectRatio } = getViewportDimensions();

// Check orientation
if (isPortrait()) {
  console.log('Portrait mode');
}

if (isLandscape()) {
  console.log('Landscape mode');
}
```

#### Class Name Generators
```tsx
// Generate responsive class names
const classes = responsiveClass('p', {
  mobile: '4',
  tablet: '6',
  desktop: '8',
}); // 'p-4 md:p-6 lg:p-8'

// Generate responsive padding classes
const padding = responsivePadding('4', '6', '8'); // 'p-4 md:p-6 lg:p-8'

// Generate responsive margin classes
const margin = responsiveMargin('2', '4', '6'); // 'm-2 md:m-4 lg:m-6'

// Generate responsive gap classes
const gap = responsiveGapClass('4', '6', '8'); // 'gap-4 md:gap-6 lg:gap-8'
```

### useResponsive Hook

React hook for responsive design utilities:

```tsx
import { useResponsive } from '@/hooks/useResponsive';

function MyComponent() {
  const {
    // Breakpoint flags
    isXs, isSm, isMd, isLg, isXl, is2Xl, is3Xl,
    
    // Device type flags
    isMobile, isTablet, isDesktop,
    
    // Touch and orientation
    isTouch, isPortrait, isLandscape,
    
    // Viewport dimensions
    viewport, // { width, height, aspectRatio }
    
    // Layout helpers
    isMobileLayout, isTabletLayout, isDesktopLayout,
  } = useResponsive();

  return (
    <div>
      {isMobileLayout && <MobileView />}
      {isTabletLayout && <TabletView />}
      {isDesktopLayout && <DesktopView />}
    </div>
  );
}
```

### Additional Responsive Hooks

```tsx
import {
  useResponsiveColumns,
  useResponsiveSpacing,
  useResponsiveFontSize,
  useResponsiveContainer,
} from '@/hooks/useResponsive';

// Get responsive column count
const columns = useResponsiveColumns({
  mobile: 1,
  tablet: 2,
  desktop: 3,
  wide: 4,
});

// Get responsive spacing
const spacing = useResponsiveSpacing({
  mobile: '1rem',
  tablet: '1.5rem',
  desktop: '2rem',
});

// Get responsive font size class
const fontSizeClass = useResponsiveFontSize('lg'); // 'text-mobile-lg' | 'text-lg'

// Get responsive container class
const containerClass = useResponsiveContainer(); // 'container mx-auto px-4 max-w-mobile' | ...
```

## CSS Utilities

### Responsive Visibility

```tsx
// Show only on mobile
<div className="mobile-only">Mobile content</div>

// Show only on tablet
<div className="tablet-only">Tablet content</div>

// Show only on desktop
<div className="desktop-only">Desktop content</div>

// Show on mobile and tablet
<div className="mobile-tablet-only">Mobile & Tablet content</div>

// Show on tablet and desktop
<div className="tablet-desktop-only">Tablet & Desktop content</div>
```

### Touch Utilities

```tsx
// Touch-optimized button
<button className="btn-touch">
  Click me
</button>

// Touch manipulation (prevents double-tap zoom)
<div className="touch-manipulation">
  Content
</div>

// Touch-only content (hidden on non-touch devices)
<div className="touch-only">
  Touch-specific content
</div>

// No-touch-only content (hidden on touch devices)
<div className="no-touch-only">
  Mouse-specific content
</div>
```

### Safe Area Utilities

```tsx
// Apply safe area insets
<div className="safe-area-inset">
  Content with safe area padding
</div>

// Individual safe area utilities
<div className="pt-safe pb-safe pl-safe pr-safe">
  Content with individual safe area padding
</div>
```

### Responsive Text

```tsx
// Responsive text sizes
<h1 className="text-responsive-3xl">Heading</h1>
<p className="text-responsive-base">Body text</p>
<small className="text-responsive-xs">Small text</small>
```

### Responsive Spacing

```tsx
// Responsive spacing between elements
<div className="space-responsive-md">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

### Responsive Grids

```tsx
// 1 column on mobile, 2 on tablet, 3 on desktop
<div className="grid-responsive-1-2-3 gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>

// Auto-fit grid with minimum 280px columns
<div className="grid-responsive-auto gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

## Breakpoints

The system uses the following breakpoints (matching Tailwind config):

- **xs**: 320px - Extra small phones
- **sm**: 640px - Small tablets and large phones
- **md**: 768px - Tablets
- **lg**: 1024px - Small laptops
- **xl**: 1280px - Laptops and desktops
- **2xl**: 1536px - Large desktops
- **3xl**: 1920px - Ultra-wide displays

### Device Ranges

- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px+

## Touch Target Accessibility

All interactive elements must meet the minimum touch target size of **44px × 44px** as per WCAG guidelines (Requirement 17.6).

### Ensuring Touch Targets

```tsx
// Using utility classes
<button className="min-h-touch min-w-touch">
  Button
</button>

// Using component
<button className="btn-touch">
  Button
</button>

// Programmatically check
import { meetsMinTouchTarget, ensureMinTouchTarget } from '@/utils/responsive';

const element = document.getElementById('button');
if (!meetsMinTouchTarget(element)) {
  console.warn('Touch target too small!');
}

// Ensure minimum dimensions
const { width, height } = ensureMinTouchTarget(30, 30);
// Returns: { width: 44, height: 44 }
```

## Safe Area Insets

The system automatically handles safe area insets for devices with notches (Requirement 17.7).

### CSS Variables

```css
:root {
  --safe-area-inset-top: env(safe-area-inset-top, 0px);
  --safe-area-inset-right: env(safe-area-inset-right, 0px);
  --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-inset-left: env(safe-area-inset-left, 0px);
}
```

### Using Safe Area Insets

```tsx
// Tailwind utilities
<div className="pt-safe pb-safe">
  Content with safe area padding
</div>

// Programmatically get insets
import { getSafeAreaInsets } from '@/utils/responsive';

const insets = getSafeAreaInsets();
console.log(insets); // { top: 44, right: 0, bottom: 34, left: 0 }
```

## Migration Guide

### Updating Existing Screens

To update an existing screen to use the responsive layout system:

1. **Import ResponsiveLayout**:
```tsx
import { ResponsiveLayout } from '@/components/bubblequest/ResponsiveLayout';
```

2. **Remove manual navigation imports**:
```tsx
// Remove these
import { BottomNavigation } from '@/components/bubblequest/BottomNavigation';
import { SideNavigation } from '@/components/bubblequest/SideNavigation';
import { useMediaQuery } from '@/hooks/useMediaQuery';
```

3. **Remove isMobile state**:
```tsx
// Remove this
const isMobile = useMediaQuery('(max-width: 767px)');
```

4. **Wrap content with ResponsiveLayout**:
```tsx
// Before
return (
  <div className="min-h-screen">
    {!isMobile && <SideNavigation ... />}
    <div className={cn(!isMobile && 'ml-64', isMobile ? 'pb-20' : 'pb-8')}>
      {/* Content */}
    </div>
    {isMobile && <BottomNavigation ... />}
  </div>
);

// After
return (
  <ResponsiveLayout
    showNavigation={true}
    activeTab={activeTab}
    onTabChange={handleTabChange}
  >
    {/* Content */}
  </ResponsiveLayout>
);
```

## Examples

### Basic Screen with Navigation

```tsx
import { ResponsiveLayout } from '@/components/bubblequest/ResponsiveLayout';

export const MyScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState('schedule');

  return (
    <ResponsiveLayout
      showNavigation={true}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <h1>My Screen</h1>
      <p>Content goes here</p>
    </ResponsiveLayout>
  );
};
```

### Screen without Navigation

```tsx
import { ResponsiveLayout } from '@/components/bubblequest/ResponsiveLayout';

export const MyScreen: React.FC = () => {
  return (
    <ResponsiveLayout showNavigation={false}>
      <h1>My Screen</h1>
      <p>Content goes here</p>
    </ResponsiveLayout>
  );
};
```

### Responsive Grid Layout

```tsx
import { ResponsiveLayout, ResponsiveGrid } from '@/components/bubblequest/ResponsiveLayout';

export const MyScreen: React.FC = () => {
  return (
    <ResponsiveLayout>
      <ResponsiveGrid
        mobileCols={1}
        tabletCols={2}
        desktopCols={3}
        gap="lg"
      >
        {items.map(item => (
          <Card key={item.id}>{item.name}</Card>
        ))}
      </ResponsiveGrid>
    </ResponsiveLayout>
  );
};
```

### Responsive Stack Layout

```tsx
import { ResponsiveLayout, ResponsiveStack } from '@/components/bubblequest/ResponsiveLayout';

export const MyScreen: React.FC = () => {
  return (
    <ResponsiveLayout>
      <ResponsiveStack
        mobileDirection="column"
        desktopDirection="row"
        gap="md"
        align="center"
      >
        <div>Sidebar</div>
        <div>Main Content</div>
      </ResponsiveStack>
    </ResponsiveLayout>
  );
};
```

## Best Practices

1. **Mobile-First**: Always design for mobile first, then enhance for larger screens
2. **Touch Targets**: Ensure all interactive elements are at least 44px × 44px
3. **Safe Areas**: Use safe area utilities for devices with notches
4. **Performance**: Use ResponsiveLayout for automatic navigation switching
5. **Accessibility**: Test with keyboard navigation and screen readers
6. **Responsive Images**: Use responsive image utilities for optimal loading
7. **Breakpoints**: Use semantic breakpoints (mobile, tablet, desktop) instead of pixel values
8. **Testing**: Test on real devices with different screen sizes and orientations

## Testing

### Manual Testing Checklist

- [ ] Test on mobile (320px - 767px)
- [ ] Test on tablet (768px - 1023px)
- [ ] Test on desktop (1024px+)
- [ ] Test portrait and landscape orientations
- [ ] Test on devices with notches (iPhone X+)
- [ ] Test touch interactions on touch devices
- [ ] Test keyboard navigation on desktop
- [ ] Verify all touch targets are at least 44px × 44px
- [ ] Verify navigation switches correctly
- [ ] Verify smooth transitions between layouts
- [ ] Test with different font sizes
- [ ] Test with dark mode

### Automated Testing

```tsx
import { render, screen } from '@testing-library/react';
import { ResponsiveLayout } from '@/components/bubblequest/ResponsiveLayout';

describe('ResponsiveLayout', () => {
  it('renders children', () => {
    render(
      <ResponsiveLayout>
        <div>Test Content</div>
      </ResponsiveLayout>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('shows navigation when enabled', () => {
    render(
      <ResponsiveLayout showNavigation={true}>
        <div>Test Content</div>
      </ResponsiveLayout>
    );
    // Add assertions for navigation
  });
});
```

## Troubleshooting

### Navigation not switching

**Problem**: Navigation doesn't switch between bottom and side.

**Solution**: Ensure ResponsiveLayout is used and useResponsive hook is working correctly.

### Touch targets too small

**Problem**: Interactive elements are smaller than 44px.

**Solution**: Use `btn-touch` class or `min-h-touch min-w-touch` utilities.

### Safe area insets not working

**Problem**: Content is hidden behind notch.

**Solution**: Use `pt-safe`, `pb-safe`, etc. utilities or `safe-area-inset` class.

### Layout jumping on resize

**Problem**: Layout jumps when resizing window.

**Solution**: Use smooth transitions and avoid sudden layout changes.

## Performance Considerations

1. **Lazy Loading**: Use React.lazy() for navigation components
2. **Memoization**: Memoize expensive responsive calculations
3. **Debouncing**: Debounce resize event handlers
4. **CSS-First**: Use CSS media queries when possible
5. **Avoid Re-renders**: Use useCallback and useMemo for handlers

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- iOS Safari 14+
- Chrome Android 90+

## Related Documentation

- [BottomNavigation Component](./BottomNavigation.tsx)
- [SideNavigation Component](./SideNavigation.tsx)
- [useResponsive Hook](../../hooks/useResponsive.ts)
- [Responsive Utilities](../../utils/responsive.ts)
- [Tailwind Config](../../../tailwind.config.js)
