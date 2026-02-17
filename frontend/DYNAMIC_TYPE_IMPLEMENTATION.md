# Dynamic Type Implementation

## Overview

This document describes the Dynamic Type implementation for the Journo iOS app, which supports text scaling from 82% to 200% for accessibility compliance (Requirement 9.3).

## Implementation Details

### 1. Core Hook: `useDynamicType`

Located in `frontend/src/hooks/useDynamicType.ts`

**Features:**
- Detects system font size preferences
- Supports scaling from 0.82x to 2.0x (82% to 200%)
- Automatically updates when font size changes
- Provides scale information (isLargeText, isAccessibilitySize)
- Handles browser zoom detection

**Usage:**
```typescript
import { useDynamicType } from '../hooks/useDynamicType';

function MyComponent() {
  const { textScale, isLargeText, isAccessibilitySize } = useDynamicType();
  
  return (
    <div>
      <p>Current scale: {textScale}x</p>
      {isAccessibilitySize && <p>Accessibility size active</p>}
    </div>
  );
}
```

### 2. Provider: `DynamicTypeProvider`

Located in `frontend/src/providers/DynamicTypeProvider.tsx`

**Features:**
- Wraps the entire application
- Automatically applies Dynamic Type scaling
- Adds CSS classes for large text and accessibility sizes
- Sets data attributes for CSS targeting

**Integration:**
```typescript
import { DynamicTypeProvider } from './providers/DynamicTypeProvider';

function App() {
  return (
    <DynamicTypeProvider minScale={0.82} maxScale={2.0}>
      {/* Your app content */}
    </DynamicTypeProvider>
  );
}
```

### 3. CSS Support

Located in `frontend/src/styles/accessibility.css`

**Features:**
- CSS custom property `--text-scale` for dynamic scaling
- Responsive text classes (`.text-dynamic-xs`, `.text-dynamic-base`, etc.)
- Automatic scaling for all text elements (h1-h6, p, button, input, etc.)
- Layout adaptations for large text
- Touch target size scaling

**Usage:**
```css
/* Use dynamic text classes */
.my-text {
  font-size: calc(1rem * var(--text-scale));
}

/* Or use predefined classes */
<p className="text-dynamic-base">This text scales with Dynamic Type</p>
```

### 4. Tailwind Integration

The implementation works seamlessly with Tailwind CSS classes. All Tailwind text utilities will scale proportionally.

## iOS Dynamic Type Scale Factors

| Size | Scale | Percentage |
|------|-------|------------|
| xSmall | 0.82 | 82% |
| Small | 0.88 | 88% |
| Medium | 0.94 | 94% |
| Large (Default) | 1.0 | 100% |
| xLarge | 1.12 | 112% |
| xxLarge | 1.24 | 124% |
| xxxLarge | 1.35 | 135% |
| Accessibility 1 | 1.5 | 150% |
| Accessibility 2 | 1.75 | 175% |
| Accessibility 3 | 2.0 | 200% |

## Testing

### Unit Tests

Located in `frontend/src/hooks/__tests__/useDynamicType.test.ts`

**Test Coverage:**
- ✓ Default text scale detection
- ✓ Large text detection (scale > 1.2)
- ✓ Accessibility size detection (scale >= 1.5)
- ✓ Scale clamping (min/max)
- ✓ Dynamic scale updates
- ✓ CSS custom property updates
- ✓ Scaling up to 200%
- ✓ Layout adaptation

**Run tests:**
```bash
cd frontend
npm test -- useDynamicType.test.ts
```

### Manual Testing

1. Visit `/dynamic-type-demo` to test different scale levels
2. Use the slider to adjust text scale from 82% to 200%
3. Test preset scale buttons
4. Verify all text elements scale proportionally
5. Verify layouts adapt to larger text
6. Verify touch targets maintain minimum size

## Browser Support

- **iOS Safari**: Full support via system font size settings
- **Chrome/Firefox**: Supports browser zoom and font size preferences
- **Desktop**: Supports browser zoom up to 200%

## Accessibility Compliance

This implementation satisfies:
- **Requirement 9.3**: Support Dynamic Type for text scaling (up to 200%)
- **WCAG 2.1 Level AA**: Text can be resized up to 200% without loss of content or functionality
- **iOS Human Interface Guidelines**: Supports all Dynamic Type sizes including accessibility sizes

## Layout Adaptations

When text scale increases, the following adaptations occur:

1. **Grid Layouts**: Switch to responsive columns that wrap
2. **Flex Layouts**: Enable wrapping to prevent overflow
3. **Spacing**: Scales proportionally with text
4. **Touch Targets**: Maintain minimum 44x44px size
5. **Modals/Dialogs**: Become scrollable if content exceeds viewport
6. **Navigation**: Padding and spacing scale with text

## Best Practices

### DO:
- ✓ Use relative units (rem, em, %) for font sizes
- ✓ Use `text-dynamic-*` classes for scalable text
- ✓ Test layouts at 200% scale
- ✓ Ensure touch targets scale appropriately
- ✓ Use flexible layouts (flexbox, grid)

### DON'T:
- ✗ Use fixed pixel values for font sizes
- ✗ Use fixed-width containers that don't adapt
- ✗ Assume text will fit in fixed-height containers
- ✗ Rely on specific line counts or text wrapping

## Troubleshooting

### Text not scaling
- Ensure `DynamicTypeProvider` wraps your app
- Check that you're using relative units (rem, em)
- Verify `accessibility.css` is imported

### Layout breaking at large scales
- Use flexible layouts (flexbox, grid)
- Avoid fixed widths and heights
- Test at 200% scale during development

### Touch targets too small
- Use `min-height` and `min-width` with `calc()` and `var(--text-scale)`
- Ensure buttons have adequate padding

## Future Enhancements

- [ ] Add user preference for text scale override
- [ ] Implement per-component scale adjustments
- [ ] Add visual indicators for current scale level
- [ ] Create more granular scale presets
- [ ] Add analytics tracking for scale usage

## References

- [iOS Human Interface Guidelines - Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
- [WCAG 2.1 - Resize Text](https://www.w3.org/WAI/WCAG21/Understanding/resize-text.html)
- [MDN - CSS env()](https://developer.mozilla.org/en-US/docs/Web/CSS/env)
