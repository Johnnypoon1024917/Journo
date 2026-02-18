# Contrast Quick Reference Guide

## Quick Fixes for Common Issues

### Button Contrast Issues

**Problem**: Button text barely visible
```tsx
// ❌ Bad - Low contrast
<button className="bg-blue-400 text-white">Click me</button>

// ✅ Good - High contrast
<button className="bg-primary-600 text-white">Click me</button>
```

**Problem**: Ghost button invisible
```tsx
// ❌ Bad - Very low contrast
<button className="bg-transparent text-gray-300">Cancel</button>

// ✅ Good - Readable contrast
<button className="bg-transparent text-neutral-800 border-2 border-neutral-400">Cancel</button>
```

### Text Contrast Issues

**Problem**: Gray text on white background
```tsx
// ❌ Bad - Fails AA
<p className="text-gray-400">Description text</p>

// ✅ Good - Passes AA
<p className="text-neutral-700">Description text</p>
```

### Link Contrast Issues

**Problem**: Links hard to see
```tsx
// ❌ Bad - Low contrast
<a className="text-blue-400">Learn more</a>

// ✅ Good - High contrast
<a className="text-primary-700 underline">Learn more</a>
```

## Using the Theme Context

```tsx
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { highContrast, adjustColor, getTextColor } = useTheme();
  
  // Automatically adjust colors for high contrast
  const bgColor = adjustColor('#0ea5e9', true);
  const textColor = getTextColor(bgColor);
  
  return (
    <div 
      style={{ 
        background: bgColor, 
        color: textColor 
      }}
    >
      Content
    </div>
  );
}
```

## High Contrast Tailwind Classes

```tsx
// Automatically adjusts in high contrast mode
<button className="
  bg-primary-600 
  text-white
  high-contrast:bg-[#0369a1]
  high-contrast:border-2
  high-contrast:border-black
">
  Primary Action
</button>

<button className="
  bg-white
  text-neutral-700
  border-2
  border-neutral-300
  high-contrast:border-black
  high-contrast:text-black
">
  Secondary Action
</button>
```

## Checking Contrast in Development

### Console Audit
```typescript
import { logContrastIssues } from '@/utils/contrastAuditor';

// Run in browser console or useEffect
logContrastIssues();
```

### Visual Overlay
```typescript
import { highlightContrastIssues } from '@/utils/contrastAuditor';

// Highlights problem areas with red borders
highlightContrastIssues();
```

## Minimum Contrast Ratios

| Text Size | WCAG AA | WCAG AAA |
|-----------|---------|----------|
| Normal (< 18pt) | 4.5:1 | 7:1 |
| Large (≥ 18pt or ≥ 14pt bold) | 3:1 | 4.5:1 |
| UI Components | 3:1 | - |

## Color Recommendations

### Safe Text Colors on White Background
- `text-neutral-800` (14.8:1) ✓ AAA
- `text-neutral-700` (10.7:1) ✓ AAA
- `text-neutral-600` (6.2:1) ✓ AA
- `text-primary-700` (5.4:1) ✓ AA

### Safe Text Colors on Dark Background
- `text-white` (21:1) ✓ AAA
- `text-neutral-100` (18.2:1) ✓ AAA
- `text-neutral-200` (15.1:1) ✓ AAA

### Safe Button Backgrounds (with white text)
- `bg-primary-600` (5.6:1) ✓ AA
- `bg-primary-700` (7.2:1) ✓ AAA
- `bg-error-600` (5.9:1) ✓ AA
- `bg-success-600` (4.8:1) ✓ AA

## Testing Checklist

- [ ] Test with browser zoom at 200%
- [ ] Enable Windows High Contrast Mode
- [ ] Test with Chrome DevTools contrast checker
- [ ] Verify with color blindness simulator
- [ ] Test on mobile in bright sunlight
- [ ] Run automated contrast audit
- [ ] Check disabled states
- [ ] Verify focus indicators

## Common Mistakes to Avoid

1. **Using opacity for disabled states** - Reduces contrast
   ```tsx
   // ❌ Bad
   <button disabled className="opacity-50">Disabled</button>
   
   // ✅ Good
   <button disabled className="bg-gray-300 text-gray-600">Disabled</button>
   ```

2. **Gradients on text** - Can reduce contrast
   ```tsx
   // ❌ Bad
   <h1 className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
     Title
   </h1>
   
   // ✅ Good
   <h1 className="text-neutral-900">Title</h1>
   ```

3. **Light text on light backgrounds**
   ```tsx
   // ❌ Bad
   <div className="bg-gray-100 text-gray-400">Content</div>
   
   // ✅ Good
   <div className="bg-gray-100 text-gray-800">Content</div>
   ```

## Browser DevTools Tips

### Chrome
1. Inspect element
2. Click color swatch in Styles panel
3. View contrast ratio indicator
4. Green checkmarks = passes AA/AAA

### Firefox
1. Inspect element
2. Accessibility panel
3. Check for contrast warnings

## Quick Fixes by Component

### Cards
```tsx
<div className="
  bg-white 
  border-2 
  border-neutral-300
  high-contrast:border-black
">
  <h3 className="text-neutral-900">Title</h3>
  <p className="text-neutral-700">Description</p>
</div>
```

### Forms
```tsx
<input className="
  border-2
  border-neutral-400
  text-neutral-900
  placeholder:text-neutral-500
  high-contrast:border-black
" />
```

### Badges
```tsx
<span className="
  bg-primary-100
  text-primary-800
  border
  border-primary-300
  high-contrast:bg-white
  high-contrast:text-black
  high-contrast:border-black
">
  Badge
</span>
```

## Resources

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Chrome DevTools Accessibility](https://developer.chrome.com/docs/devtools/accessibility/reference/)
