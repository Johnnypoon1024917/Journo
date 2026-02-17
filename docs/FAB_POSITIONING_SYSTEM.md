# FAB Positioning System

## Overview

The FAB (Floating Action Button) positioning system ensures that all floating action buttons are properly positioned and don't overlap with each other or the bottom navigation bar on mobile devices.

## Problem Solved

Previously, FABs had hardcoded positions that caused:
1. Notification FAB overlapping with add sticker/activity FABs
2. FABs covering the bottom navigation bar on mobile
3. Inconsistent z-index hierarchy
4. No automatic stacking when multiple FABs are present

## Solution

The `useFABPosition` hook provides:
- **Responsive positioning**: Automatically adjusts for mobile vs desktop
- **Automatic stacking**: Multiple FABs stack vertically without overlap
- **Bottom nav awareness**: Positions FABs above bottom navigation on mobile
- **Consistent z-index**: Proper layering hierarchy for all FAB types

## Usage

### 1. Import the Hook

```tsx
import { useFABPosition, getFABStyle } from '@/hooks/useFABPosition';
import { useLocation } from 'react-router-dom';
```

### 2. Determine if Bottom Nav is Present

```tsx
const location = useLocation();
const hasBottomNav = location.pathname.includes('/trips/');
```

### 3. Get FAB Position

```tsx
const fabPosition = useFABPosition({ 
  type: 'primary',      // FAB type: 'notification' | 'primary' | 'secondary' | 'recycle'
  index: 1,             // Stack index (0 = bottom-most, higher = stacked above)
  hasBottomNav: true    // Whether bottom navigation is visible
});
```

### 4. Apply Position to Button

```tsx
<button
  style={getFABStyle(fabPosition)}
  className="w-14 h-14 bg-blue-500 rounded-full shadow-lg"
>
  <PlusIcon className="w-6 h-6" />
</button>
```

## FAB Types and Z-Index Hierarchy

| Type | Z-Index | Purpose | Example |
|------|---------|---------|---------|
| `notification` | 9998 | Notification bell (always visible) | Global notifications |
| `recycle` | 60 | Recycle bin for stickers | Sticker deletion |
| `primary` | 50 | Main action buttons | Add activity, Add expense |
| `secondary` | 45 | Secondary actions | Add sticker |

## Stacking Index

The `index` parameter determines vertical stacking order:
- `index: 0` - Bottom-most FAB (closest to bottom nav/edge)
- `index: 1` - Second from bottom
- `index: 2` - Third from bottom
- `index: 3` - Fourth from bottom
- etc.

**Example stacking on Schedule page:**
```tsx
// Notification FAB (always top-most)
const notificationFAB = useFABPosition({ type: 'notification', index: 0, hasBottomNav });

// Add Activity FAB
const addActivityFAB = useFABPosition({ type: 'primary', index: 1, hasBottomNav });

// Add Sticker FAB
const addStickerFAB = useFABPosition({ type: 'secondary', index: 2, hasBottomNav });

// Recycle Bin (when dragging stickers)
const recycleBinFAB = useFABPosition({ type: 'recycle', index: 3, hasBottomNav });
```

## Positioning Logic

### Mobile (with bottom navigation)
- Bottom navigation height: 64px (h-16) + 8px padding = 72px
- FAB spacing: 76px (56px FAB + 20px gap)
- Formula: `bottom = 72px + (index × 76px)`

### Desktop (no bottom navigation)
- Standard bottom padding: 24px
- FAB spacing: 76px
- Formula: `bottom = 24px + (index × 76px)`

### Right Position
- Consistent for all FABs: `right = 1rem` (16px)

## Components Updated

### 1. GlobalNotifications
```tsx
const fabPosition = useFABPosition({ 
  type: 'notification', 
  index: 0,
  hasBottomNav 
});
```

### 2. ScheduleScreen
```tsx
const addActivityFABPosition = useFABPosition({ 
  type: 'primary', 
  index: 1, 
  hasBottomNav: true 
});

const addStickerFABPosition = useFABPosition({ 
  type: 'secondary', 
  index: 2, 
  hasBottomNav: true 
});
```

### 3. FloatingAddButton (Budget Page)
```tsx
const fabPosition = useFABPosition({ 
  type: 'primary', 
  index: 1, 
  hasBottomNav 
});
```

### 4. RecycleBin (Sticker System)
```tsx
const fabPosition = useFABPosition({ 
  type: 'recycle', 
  index: 3, 
  hasBottomNav 
});
```

## Visual Layout

### Mobile View (with bottom nav)
```
┌─────────────────────┐
│                     │
│   Page Content      │
│                     │
│                     │
│              [🔔]   │ ← Notification (index 0)
│              [➕]   │ ← Primary action (index 1)
│              [✨]   │ ← Secondary action (index 2)
│              [🗑️]   │ ← Recycle bin (index 3)
├─────────────────────┤
│  Bottom Navigation  │ ← 64px height
└─────────────────────┘
```

### Desktop View (no bottom nav)
```
┌─────────────────────┐
│                     │
│   Page Content      │
│                     │
│                     │
│                     │
│              [🔔]   │ ← Notification (index 0)
│              [➕]   │ ← Primary action (index 1)
│              [✨]   │ ← Secondary action (index 2)
│              [🗑️]   │ ← Recycle bin (index 3)
└─────────────────────┘
```

## Best Practices

1. **Always use the hook**: Don't hardcode FAB positions
2. **Consistent indexing**: Use the same index for the same FAB type across pages
3. **Check bottom nav**: Always determine if bottom navigation is present
4. **Type appropriately**: Use correct FAB type for proper z-index
5. **Test responsive**: Verify positioning on both mobile and desktop

## Migration Guide

### Before
```tsx
<button className="fixed bottom-6 right-6 z-50">
  <PlusIcon />
</button>
```

### After
```tsx
const fabPosition = useFABPosition({ 
  type: 'primary', 
  index: 1, 
  hasBottomNav 
});

<button style={getFABStyle(fabPosition)}>
  <PlusIcon />
</button>
```

## Testing

Test the FAB positioning system by:
1. Opening pages with FABs on mobile (< 768px width)
2. Verifying FABs don't overlap with bottom navigation
3. Checking FABs stack properly when multiple are present
4. Testing on desktop to ensure proper spacing
5. Verifying z-index hierarchy (notification always on top)

## Future Enhancements

Potential improvements:
- Dynamic FAB registration system
- Collision detection
- Animated transitions when FABs appear/disappear
- Customizable spacing and sizes
- Accessibility improvements (focus management)
