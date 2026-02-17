# Reduce Motion Implementation

## Overview

This document describes the implementation of Reduce Motion support for the Journo iOS app, ensuring compliance with WCAG 2.1 Level AA accessibility requirements (Success Criterion 2.3.3 Animation from Interactions).

## Implementation Summary

The Reduce Motion feature detects the user's system preference for reduced motion and automatically disables or minimizes non-essential animations throughout the application. This provides a better experience for users with vestibular disorders or motion sensitivity.

## Files Created/Modified

### New Files

1. **`src/providers/ReduceMotionProvider.tsx`**
   - React context provider for reduce motion state
   - Detects `prefers-reduced-motion` media query
   - Provides utilities for animation/transition duration calculation
   - Updates CSS custom properties and HTML classes

2. **`src/pages/ReduceMotionDemo.tsx`**
   - Interactive demo page showing reduce motion in action
   - Demonstrates various animation types (fade, scale, spin, slide, hover, pulse)
   - Provides testing instructions for different platforms
   - Shows real-time status of reduce motion preference

3. **`src/hooks/__tests__/useReducedMotion.test.ts`**
   - Comprehensive test suite for `useReducedMotion` hook
   - Tests preference detection, animation/transition duration calculation
   - Tests dynamic preference changes
   - 12 test cases, all passing

4. **`src/utils/__tests__/accessibility.reducedMotion.test.ts`**
   - Test suite for accessibility utility functions
   - Tests `prefersReducedMotion`, `getAnimationDuration`, `getTransitionDuration`
   - Tests `createAccessibleTransition` and `createAccessibleAnimation`
   - 19 test cases, all passing

### Modified Files

1. **`src/utils/accessibility.ts`**
   - Enhanced `prefersReducedMotion()` function with SSR safety
   - Added `getAnimationDuration()` - returns 0ms when reduced motion is preferred
   - Added `getTransitionDuration()` - returns 1ms when reduced motion is preferred
   - Added `createAccessibleTransition()` - creates CSS transition strings respecting reduce motion
   - Added `createAccessibleAnimation()` - creates CSS animation strings respecting reduce motion

2. **`src/hooks/useAccessibility.ts`**
   - Enhanced `useReducedMotion()` hook to return object with utilities
   - Returns `prefersReducedMotion`, `shouldAnimate`, `getAnimationDuration`, `getTransitionDuration`
   - Listens for media query changes and updates state dynamically

3. **`src/utils/animations.ts`**
   - Updated `createTransition()` to respect reduce motion preference
   - Updated `createAnimation()` to respect reduce motion preference
   - Added `getAnimationDuration()` utility
   - Added `getTransitionDuration()` utility

4. **`src/styles/accessibility.css`**
   - Added CSS custom properties for animation control
   - Added `.reduce-motion` class support
   - Comprehensive `@media (prefers-reduced-motion: reduce)` rules
   - Disables non-essential animations (spin, pulse, bounce, float, glow, shimmer)
   - Provides instant transitions for essential feedback
   - Maintains focus indicators and state changes
   - Covers all animation types: drag-and-drop, loading, hover, modal, toast, etc.

## How It Works

### 1. Detection

The system detects the user's reduce motion preference using the CSS media query:

```javascript
window.matchMedia('(prefers-reduced-motion: reduce)').matches
```

### 2. React Context

The `ReduceMotionProvider` wraps the application and provides reduce motion state:

```tsx
<ReduceMotionProvider>
  <App />
</ReduceMotionProvider>
```

### 3. Hook Usage

Components can access reduce motion state using the hook:

```tsx
const { prefersReducedMotion, shouldAnimate, getAnimationDuration, getTransitionDuration } = useReducedMotion();

// Use in component
<div
  style={{
    animation: shouldAnimate ? 'fadeIn 300ms ease' : 'none',
    transition: `opacity ${getTransitionDuration(200)}ms ease`,
  }}
>
  Content
</div>
```

### 4. CSS Approach

CSS automatically respects reduce motion through media queries:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 5. Utility Functions

Utility functions help create accessible animations:

```typescript
// Transitions
const transition = createAccessibleTransition('opacity', 200, 'ease');
// Returns: "opacity 200ms ease" (normal) or "opacity 1ms ease" (reduced motion)

// Animations
const animation = createAccessibleAnimation('fadeIn', 300, 'ease', 'forwards');
// Returns: "fadeIn 300ms ease forwards" (normal) or "fadeIn 0ms ease forwards" (reduced motion)
```

## Animation Behavior

### When Reduce Motion is Enabled

- **Animations**: Duration set to 0ms (instant)
- **Transitions**: Duration set to 1ms (minimal, ensures events still fire)
- **Non-essential animations disabled**: spin, pulse, bounce, float, glow, shimmer
- **Essential feedback preserved**: focus indicators, state changes, visibility toggles

### When Reduce Motion is Disabled

- All animations run normally with specified durations
- Full visual feedback and micro-interactions enabled

## Testing

### How to Test

**macOS:**
```
System Preferences → Accessibility → Display → Reduce motion
```

**iOS:**
```
Settings → Accessibility → Motion → Reduce Motion
```

**Windows:**
```
Settings → Ease of Access → Display → Show animations
```

**Browser DevTools:**
```
Rendering → Emulate CSS media feature prefers-reduced-motion
```

### Test Suite

Run the test suite:

```bash
npm test -- useReducedMotion.test.ts accessibility.reducedMotion.test.ts
```

**Results:**
- 31 tests total
- 31 passing
- 0 failing

### Demo Page

Visit `/reduce-motion-demo` to see an interactive demonstration of the feature.

## Compliance

This implementation meets the following accessibility standards:

- **WCAG 2.1 Level AA**: Success Criterion 2.3.3 Animation from Interactions
- **iOS Human Interface Guidelines**: Respect for Motion preferences
- **Requirements 9.7**: Reduce Motion support

## Key Features

1. **Automatic Detection**: Detects system preference on mount and updates dynamically
2. **CSS Custom Properties**: Global control via `--animation-duration-multiplier`
3. **React Context**: Centralized state management
4. **Utility Functions**: Helper functions for creating accessible animations
5. **Comprehensive CSS Rules**: Covers all animation types in the application
6. **Essential Feedback Preserved**: Focus indicators and state changes remain visible
7. **Performance Optimized**: Minimal overhead, uses native browser APIs
8. **Well Tested**: 31 passing tests covering all functionality

## Usage Examples

### In Components

```tsx
import { useReducedMotion } from '../hooks/useAccessibility';

function MyComponent() {
  const { shouldAnimate, getTransitionDuration } = useReducedMotion();
  
  return (
    <div
      className="card"
      style={{
        transition: `transform ${getTransitionDuration(200)}ms ease`,
      }}
      onMouseEnter={(e) => {
        if (shouldAnimate) {
          e.currentTarget.style.transform = 'translateY(-4px)';
        }
      }}
    >
      Content
    </div>
  );
}
```

### In CSS

```css
.animated-element {
  animation: fadeIn 300ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .animated-element {
    animation: none;
  }
}
```

### With Utility Functions

```typescript
import { createAccessibleTransition, createAccessibleAnimation } from '../utils/accessibility';

const transition = createAccessibleTransition('opacity', 200);
const animation = createAccessibleAnimation('slideIn', 300);
```

## Future Enhancements

1. **User Override**: Allow users to override system preference in app settings
2. **Granular Control**: Different levels of motion reduction (none, reduced, minimal)
3. **Animation Presets**: Pre-configured animation sets for different motion levels
4. **Performance Monitoring**: Track animation performance impact
5. **A/B Testing**: Test different motion reduction strategies

## References

- [WCAG 2.1 - Animation from Interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)
- [MDN - prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [iOS Human Interface Guidelines - Motion](https://developer.apple.com/design/human-interface-guidelines/motion)
- [Designing Safer Web Animation For Motion Sensitivity](https://alistapart.com/article/designing-safer-web-animation-for-motion-sensitivity/)

## Conclusion

The Reduce Motion implementation provides a comprehensive solution for respecting user motion preferences, ensuring the Journo app is accessible to users with vestibular disorders or motion sensitivity. The implementation is well-tested, performant, and follows industry best practices.
