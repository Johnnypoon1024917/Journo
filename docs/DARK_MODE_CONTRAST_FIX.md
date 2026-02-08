# Dark Mode Color Contrast Fix

## Issues Identified

After reviewing the kawaii design system and components, I've identified several color contrast issues in both dark and light modes:

### Critical Issues

1. **White text on white backgrounds** - Some components use `text-white` without proper dark mode variants
2. **Insufficient contrast in dark mode** - Some text colors don't have enough contrast against dark backgrounds
3. **Hardcoded colors** - Some components use hardcoded hex colors that don't adapt to theme changes
4. **Missing dark mode variants** - Several components lack proper `dark:` prefixes for text colors

### Affected Components

1. **DarkModeToggle.tsx** - Icons use `text-white` which may not be visible in all contexts
2. **ChecklistItem.tsx** - Checked state uses `text-white` on primary background
3. **MemberCard.tsx** - Avatar initials use `text-white` on gradient
4. **BoardingPassCard.tsx** - Multiple white text elements on gradient backgrounds
5. **Button.tsx** - Primary variant uses `text-white` without dark mode consideration
6. **Card.tsx** - Background colors need better contrast
7. **Various components** - Category badges, status indicators, and labels

## Solutions

### 1. Update CSS Variables for Better Dark Mode Contrast

**File: `frontend/src/design-system/kawaii.css`**

Add improved dark mode color definitions with better contrast ratios.

### 2. Fix Component-Level Contrast Issues

Update all components to use proper dark mode color variants that ensure WCAG AA compliance (4.5:1 for normal text, 3:1 for large text).

### 3. Create Contrast-Safe Utility Classes

Add utility classes that automatically provide good contrast in both modes.

## Implementation Plan

### Phase 1: Update Core Design Tokens (High Priority)

1. Fix dark mode neutral colors for better contrast
2. Add contrast-safe text color utilities
3. Update gradient backgrounds to work in dark mode

### Phase 2: Fix Individual Components (High Priority)

1. Update all buttons to use contrast-safe colors
2. Fix card backgrounds and text colors
3. Update form inputs and checkboxes
4. Fix navigation components
5. Update badge and label components

### Phase 3: Add Contrast Checking (Medium Priority)

1. Add contrast ratio checking utilities
2. Create documentation for color usage
3. Add visual regression tests

## Detailed Fixes

### Fix 1: Update Dark Mode CSS Variables

```css
/* Dark Mode Overrides - IMPROVED CONTRAST */
.dark {
  /* Darker background for better contrast */
  --kawaii-cream: #1a1715;
  
  /* Improved neutral scale with better contrast */
  --kawaii-neutral-50: #0f0e0d;
  --kawaii-neutral-100: #1c1917;
  --kawaii-neutral-200: #292524;
  --kawaii-neutral-300: #44403c;
  --kawaii-neutral-400: #78716c;
  --kawaii-neutral-500: #a8a29e;
  --kawaii-neutral-600: #d6d3d1;
  --kawaii-neutral-700: #e7e5e4;
  --kawaii-neutral-800: #f5f5f4;
  --kawaii-neutral-900: #fafaf9;
  
  /* Lighter primary colors for dark mode */
  --kawaii-primary-dark: #ffccd1;
  --kawaii-primary-dark-hover: #ffe3e8;
}
```

### Fix 2: Add Contrast-Safe Text Utilities

```css
/* Contrast-safe text colors */
.text-contrast-high {
  @apply text-kawaii-neutral-900 dark:text-kawaii-neutral-100;
}

.text-contrast-medium {
  @apply text-kawaii-neutral-700 dark:text-kawaii-neutral-300;
}

.text-contrast-low {
  @apply text-kawaii-neutral-600 dark:text-kawaii-neutral-400;
}

/* Contrast-safe backgrounds */
.bg-contrast-surface {
  @apply bg-white dark:bg-kawaii-neutral-800;
}

.bg-contrast-elevated {
  @apply bg-kawaii-neutral-50 dark:bg-kawaii-neutral-700;
}
```

### Fix 3: Update Button Component

The primary button should ensure white text is always on a colored background:

```tsx
primary: cn(
  'bg-gradient-to-r from-kawaii-primary-500 to-kawaii-primary-400',
  'text-white shadow-md',
  'hover:from-kawaii-primary-600 hover:to-kawaii-primary-500',
  'focus:ring-kawaii-primary-500',
  'disabled:from-kawaii-primary-300 disabled:to-kawaii-primary-300',
  // Ensure gradient works in dark mode
  'dark:from-kawaii-primary-400 dark:to-kawaii-primary-300',
  'dark:hover:from-kawaii-primary-500 dark:hover:to-kawaii-primary-400'
),
```

### Fix 4: Update Card Component

```tsx
const baseClasses = cn(
  'rounded-xl',
  'transition-all duration-300',
  // Better contrast in dark mode
  'bg-white dark:bg-kawaii-neutral-800',
  // Ensure text has good contrast
  'text-kawaii-neutral-900 dark:text-kawaii-neutral-100'
);
```

### Fix 5: Update ChecklistItem Component

```tsx
// Checkbox button - ensure good contrast
className={cn(
  'flex-shrink-0',
  'min-w-[44px] min-h-[44px]',
  'flex items-center justify-center',
  'rounded-full',
  'transition-all duration-200',
  'focus:outline-none focus:ring-2 focus:ring-kawaii-primary/50',
  item.is_checked
    ? 'bg-kawaii-primary text-white dark:bg-kawaii-primary-400 dark:text-kawaii-neutral-900'
    : 'bg-kawaii-neutral-100 dark:bg-kawaii-neutral-700 text-kawaii-neutral-400 dark:text-kawaii-neutral-300'
)}
```

### Fix 6: Update MemberCard Component

```tsx
// Avatar with better contrast
<div
  className={cn(
    'w-12 h-12 rounded-full',
    'flex items-center justify-center',
    'bg-gradient-to-br from-kawaii-primary to-kawaii-secondary',
    // Ensure text is readable on gradient
    'text-white font-semibold text-lg',
    'shadow-sm',
    // Dark mode: use lighter gradient
    'dark:from-kawaii-primary-400 dark:to-kawaii-secondary-400',
    'dark:text-kawaii-neutral-900'
  )}
>
  {initials}
</div>
```

### Fix 7: Update BoardingPassCard Component

```tsx
// Gradient background with better dark mode support
<div className="relative bg-gradient-to-br from-pink-400 via-pink-500 to-rose-500 dark:from-pink-600 dark:via-pink-700 dark:to-rose-700 p-6">
  {/* All text elements should ensure contrast */}
  <span className="text-white/90 dark:text-white text-sm font-medium">
    {/* content */}
  </span>
</div>
```

### Fix 8: Update Category Badge Colors

```tsx
const CATEGORY_COLORS: Record<PackingCategory, { bg: string; text: string }> = {
  essentials: { 
    bg: 'bg-red-100 dark:bg-red-900/40', 
    text: 'text-red-800 dark:text-red-200' 
  },
  clothing: { 
    bg: 'bg-purple-100 dark:bg-purple-900/40', 
    text: 'text-purple-800 dark:text-purple-200' 
  },
  toiletries: { 
    bg: 'bg-blue-100 dark:bg-blue-900/40', 
    text: 'text-blue-800 dark:text-blue-200' 
  },
  electronics: { 
    bg: 'bg-yellow-100 dark:bg-yellow-900/40', 
    text: 'text-yellow-900 dark:text-yellow-200' 
  },
  documents: { 
    bg: 'bg-orange-100 dark:bg-orange-900/40', 
    text: 'text-orange-800 dark:text-orange-200' 
  },
  health: { 
    bg: 'bg-green-100 dark:bg-green-900/40', 
    text: 'text-green-800 dark:text-green-200' 
  },
  activities: { 
    bg: 'bg-pink-100 dark:bg-pink-900/40', 
    text: 'text-pink-800 dark:text-pink-200' 
  },
  misc: { 
    bg: 'bg-gray-100 dark:bg-gray-800/60', 
    text: 'text-gray-800 dark:text-gray-200' 
  },
};
```

### Fix 9: Update Role Badge Colors

```tsx
const ROLE_COLORS: Record<CollaboratorRole, { bg: string; text: string }> = {
  owner: { 
    bg: 'bg-purple-100 dark:bg-purple-900/40', 
    text: 'text-purple-800 dark:text-purple-200' 
  },
  editor: { 
    bg: 'bg-blue-100 dark:bg-blue-900/40', 
    text: 'text-blue-800 dark:text-blue-200' 
  },
  viewer: { 
    bg: 'bg-gray-100 dark:bg-gray-800/60', 
    text: 'text-gray-800 dark:text-gray-200' 
  },
};
```

## Testing Checklist

- [ ] Test all components in light mode
- [ ] Test all components in dark mode
- [ ] Verify contrast ratios meet WCAG AA standards
- [ ] Test with different primary color themes
- [ ] Test with different font sizes (12px - 24px)
- [ ] Test on mobile devices
- [ ] Test with screen readers
- [ ] Verify no white-on-white or black-on-black text

## WCAG Contrast Requirements

- **Normal text (< 18px)**: Minimum 4.5:1 contrast ratio
- **Large text (≥ 18px or ≥ 14px bold)**: Minimum 3:1 contrast ratio
- **UI components**: Minimum 3:1 contrast ratio

## Color Contrast Reference

### Light Mode
- Text on white: Use neutral-700 or darker (4.5:1+)
- Text on cream: Use neutral-800 or darker (4.5:1+)
- Text on primary: Use white (4.5:1+)

### Dark Mode
- Text on dark-800: Use neutral-100 or lighter (4.5:1+)
- Text on dark-900: Use neutral-50 or lighter (4.5:1+)
- Text on primary: Use neutral-900 or white depending on primary lightness

## Next Steps

1. Apply all fixes systematically
2. Test each component individually
3. Run automated contrast checking
4. Update documentation
5. Create visual regression tests
