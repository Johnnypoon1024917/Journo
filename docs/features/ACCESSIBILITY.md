# Accessibility Features

Comprehensive WCAG 2.1 AA/AAA compliance implementation for BubbleQuest.

## Overview

BubbleQuest is designed to be accessible to all users, including those with:
- Visual impairments (screen readers, high contrast, color blindness)
- Motor impairments (keyboard-only navigation)
- Cognitive impairments (reduced motion, clear focus indicators)
- Hearing impairments (visual alternatives to audio)

## WCAG Compliance

### Level AA Compliance (Minimum)
- ✅ 4.5:1 contrast ratio for normal text
- ✅ 3:1 contrast ratio for large text and UI components
- ✅ Keyboard accessible (all functionality available via keyboard)
- ✅ Focus visible (clear focus indicators on all interactive elements)
- ✅ Meaningful sequence (logical tab order)
- ✅ Labels and instructions (all form inputs properly labeled)
- ✅ Resize text (up to 200% without loss of functionality)

### Level AAA Compliance (Enhanced)
- ✅ 7:1 contrast ratio for normal text (high contrast mode)
- ✅ 4.5:1 contrast ratio for large text (high contrast mode)
- ✅ Enhanced focus indicators (3px outline with offset)
- ✅ No timing requirements (or user can extend time limits)

## Core Features

### 1. ARIA Labels and Roles

All interactive elements have proper ARIA attributes:

```tsx
// Buttons
<button aria-label="Close dialog" aria-pressed="false">
  <Icon name="close" aria-hidden="true" />
</button>

// Forms
<input
  type="email"
  id="email"
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby="email-error"
/>

// Modals
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Modal Title</h2>
  <p id="modal-description">Modal description</p>
</div>

// Live regions
<div role="status" aria-live="polite" aria-atomic="true">
  Loading...
</div>
```

### 2. Keyboard Navigation

Full keyboard support for all interactive elements:

**Global Shortcuts:**
- `Tab` / `Shift+Tab` - Navigate between interactive elements
- `Enter` / `Space` - Activate buttons and links
- `Escape` - Close modals, dropdowns, and cancel actions
- `Arrow keys` - Navigate within lists, menus, and maps
- `Home` / `End` - Jump to first/last item

**Map Controls:**
- `Arrow keys` - Pan map in all directions
- `+` / `-` - Zoom in/out
- `Home` - Reset map view

**Form Controls:**
- `Tab` - Move to next field
- `Shift+Tab` - Move to previous field
- `Space` - Toggle checkboxes
- `Arrow keys` - Select radio buttons

### 3. Skip Links

Skip links allow keyboard users to jump to main content areas:

```tsx
import { SkipLinks } from '@/components/accessibility/SkipLinks';

<SkipLinks
  links={[
    { id: 'skip-to-main', label: 'Skip to main content', targetId: 'main-content' },
    { id: 'skip-to-nav', label: 'Skip to navigation', targetId: 'main-navigation' },
  ]}
/>
```

Skip links are visually hidden but appear on focus.

### 4. Focus Management

**Focus Trap:**
Traps focus within modals and dialogs:

```tsx
import { FocusTrap } from '@/components/accessibility/FocusTrap';

<FocusTrap active={isModalOpen}>
  <Modal>...</Modal>
</FocusTrap>
```

**Focus Indicators:**
All interactive elements have clear focus indicators:
- 3px solid outline
- 2px offset from element
- High contrast colors (blue in light mode, light blue in dark mode)

### 5. Screen Reader Support

**Live Regions:**
Announce dynamic content changes:

```tsx
import { LiveRegion } from '@/components/accessibility/LiveRegion';

<LiveRegion
  message="Item added to cart"
  politeness="polite"
  role="status"
  clearAfter={3000}
/>
```

**ARIA Announcer:**
Global announcer for state changes:

```tsx
import { useAriaAnnouncer } from '@/hooks/useAriaAnnouncer';

const { announceSuccess, announceError } = useAriaAnnouncer();

announceSuccess('Trip saved successfully');
announceError('Failed to save trip');
```

### 6. Reduced Motion

Respects user's motion preferences:

```tsx
import { useReducedMotion } from '@/hooks/useAccessibility';

const { shouldAnimate, getAnimationDuration } = useReducedMotion();

<div
  style={{
    transition: shouldAnimate ? 'transform 0.3s' : 'none',
    animationDuration: `${getAnimationDuration(300)}ms`,
  }}
>
  Content
</div>
```

**CSS Support:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 7. High Contrast Mode

Automatic detection and enhanced styles:

```tsx
import { useHighContrast } from '@/hooks/useHighContrast';

const { isHighContrast, contrastLevel } = useHighContrast();

// Styles automatically applied via CSS
```

**Features:**
- Detects Windows High Contrast Mode
- Detects `prefers-contrast: more`
- Enhanced border widths (2px → 3px)
- Increased focus indicator size (3px → 4px)
- Removes subtle shadows
- Ensures 7:1 contrast ratio

### 8. Dynamic Text Sizing

Supports system font scaling and zoom:

```tsx
import { useDynamicTextSize } from '@/hooks/useDynamicTextSize';

const { fontSize, scale, updateFontSize } = useDynamicTextSize({
  baseSize: 16,
  minScale: 0.75,
  maxScale: 2.0,
});
```

**CSS Variables:**
```css
:root {
  --base-font-size: 16px;
  --font-scale: 1;
}

body {
  font-size: var(--base-font-size);
}
```

All text uses `rem` units for proper scaling.

### 9. Color Blindness Support

Visual patterns in addition to color:

**Status Indicators:**
- Success: ✓ Green with checkmark
- Warning: ⚠ Yellow with warning icon
- Error: ✕ Red with X icon

**Charts and Graphs:**
- Patterns (stripes, dots) in addition to colors
- Labels and legends
- High contrast between adjacent elements

### 10. Touch Accessibility

Optimized for touch devices:

**Touch Targets:**
- Minimum 44x44px (iOS) / 48x48px (Android)
- Adequate spacing between targets (8px minimum)
- No hover-only interactions

**Touch Gestures:**
- Swipe gestures have keyboard alternatives
- Pinch-to-zoom supported on maps
- Long-press has click alternative

## Components

### Accessible Modal

```tsx
import { AccessibleModal } from '@/components/accessibility/AccessibleModal';

<AccessibleModal
  isOpen={isOpen}
  onClose={handleClose}
  title="Modal Title"
  description="Modal description"
  closeOnEscape={true}
  closeOnOverlayClick={true}
>
  <p>Modal content</p>
</AccessibleModal>
```

### Accessible Map Controls

```tsx
import { AccessibleMapControls } from '@/components/map/AccessibleMapControls';

<AccessibleMapControls
  onZoomIn={handleZoomIn}
  onZoomOut={handleZoomOut}
  onPanUp={handlePanUp}
  onPanDown={handlePanDown}
  onPanLeft={handlePanLeft}
  onPanRight={handlePanRight}
  onResetView={handleResetView}
  currentZoom={zoom}
/>
```

## Hooks

### useKeyboardNavigation

```tsx
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

useKeyboardNavigation({
  enableArrowKeys: true,
  enableActivation: true,
  enableEscape: true,
  onActivate: handleActivate,
  onEscape: handleEscape,
  onArrowKey: (direction) => console.log(direction),
});
```

### useAccessibility

```tsx
import { useAccessibility } from '@/hooks/useAccessibility';

const {
  prefersReducedMotion,
  isHighContrast,
  fontSize,
  shouldAnimate,
} = useAccessibility();
```

## Testing

### Manual Testing

**Keyboard Navigation:**
1. Unplug mouse
2. Navigate entire app using only keyboard
3. Verify all functionality is accessible
4. Check focus indicators are visible

**Screen Reader:**
1. Enable VoiceOver (Mac) or NVDA (Windows)
2. Navigate through app
3. Verify all content is announced
4. Check ARIA labels are meaningful

**Zoom:**
1. Zoom browser to 200%
2. Verify layout doesn't break
3. Check all content is readable
4. Ensure no horizontal scrolling

**High Contrast:**
1. Enable Windows High Contrast Mode
2. Verify all content is visible
3. Check borders and focus indicators

**Reduced Motion:**
1. Enable "Reduce motion" in system preferences
2. Verify animations are disabled
3. Check essential transitions remain

### Automated Testing

```tsx
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('should have no accessibility violations', async () => {
  const { container } = render(<Component />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Best Practices

### Do's
✅ Use semantic HTML (`<button>`, `<nav>`, `<main>`, etc.)
✅ Provide text alternatives for images
✅ Use sufficient color contrast (4.5:1 minimum)
✅ Make all functionality keyboard accessible
✅ Provide clear focus indicators
✅ Use ARIA labels for icon-only buttons
✅ Test with real assistive technologies
✅ Use `rem` units for text sizing

### Don'ts
❌ Don't use `div` or `span` for buttons
❌ Don't rely on color alone to convey information
❌ Don't disable focus outlines without replacement
❌ Don't use `tabindex` values greater than 0
❌ Don't create keyboard traps (except in modals)
❌ Don't use `px` units for font sizes
❌ Don't assume all users can see or use a mouse

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [NVDA Screen Reader](https://www.nvaccess.org/)
- [VoiceOver User Guide](https://support.apple.com/guide/voiceover/welcome/mac)

## Support

For accessibility issues or questions:
1. Check this documentation
2. Review WCAG guidelines
3. Test with assistive technologies
4. File an issue with "accessibility" label
