# Contrast Migration Guide

## How to Apply Contrast Improvements to Other Components

This guide helps you apply the same contrast improvements to other components in BubbleQuest.

## Step-by-Step Process

### 1. Identify Low Contrast Elements

Use the contrast auditor to find issues:

```typescript
import { logContrastIssues, highlightContrastIssues } from '@/utils/contrastAuditor';

// In browser console or component
logContrastIssues();           // See list of issues
highlightContrastIssues();     // Visual overlay
```

### 2. Update Color Tokens

Replace low-contrast colors with higher-contrast alternatives:

```tsx
// ❌ Before
className="text-gray-400"      // 2.8:1 contrast
className="border-gray-200"    // 1.2:1 contrast
className="bg-blue-400"        // 3.2:1 with white text

// ✅ After
className="text-neutral-700"   // 10.7:1 contrast
className="border-neutral-400" // 3.8:1 contrast
className="bg-primary-600"     // 5.6:1 with white text
```

### 3. Add High Contrast Support

Add high-contrast variants to your components:

```tsx
// Pattern for buttons
className={cn(
  'bg-primary-600 text-white',
  'hover:bg-primary-700',
  // Add high contrast support
  'high-contrast:bg-[#0369a1]',
  'high-contrast:border-2',
  'high-contrast:border-black'
)}

// Pattern for text
className={cn(
  'text-neutral-700',
  // Add high contrast support
  'high-contrast:text-black'
)}

// Pattern for borders
className={cn(
  'border-2 border-neutral-300',
  // Add high contrast support
  'high-contrast:border-black'
)}
```

### 4. Update Component Props

If your component accepts color props, add contrast checking:

```tsx
import { useTheme } from '@/contexts/ThemeContext';
import { checkContrast } from '@/utils/contrastChecker';

function MyComponent({ bgColor, textColor }) {
  const { highContrast, adjustColor, getTextColor } = useTheme();
  
  // Adjust colors if needed
  const safeBgColor = highContrast ? adjustColor(bgColor, true) : bgColor;
  const safeTextColor = highContrast ? getTextColor(safeBgColor) : textColor;
  
  return (
    <div style={{ background: safeBgColor, color: safeTextColor }}>
      Content
    </div>
  );
}
```

## Component-Specific Patterns

### Cards

```tsx
// Before
<div className="bg-white border border-gray-200 shadow-sm">
  <h3 className="text-gray-900">Title</h3>
  <p className="text-gray-500">Description</p>
</div>

// After
<div className="
  bg-white 
  border-2 border-neutral-300
  shadow-sm
  high-contrast:border-black
">
  <h3 className="text-neutral-900 high-contrast:text-black">Title</h3>
  <p className="text-neutral-700 high-contrast:text-black">Description</p>
</div>
```

### Form Inputs

```tsx
// Before
<input className="
  border border-gray-300
  text-gray-900
  placeholder:text-gray-400
" />

// After
<input className="
  border-2 border-neutral-400
  text-neutral-900
  placeholder:text-neutral-600
  focus:border-primary-600
  focus:ring-2 focus:ring-primary-500
  high-contrast:border-black
  high-contrast:focus:border-black
  high-contrast:focus:ring-black
" />
```

### Badges/Tags

```tsx
// Before
<span className="
  bg-blue-100 
  text-blue-800
  border border-blue-200
">
  Badge
</span>

// After
<span className="
  bg-primary-100 
  text-primary-800
  border-2 border-primary-300
  high-contrast:bg-white
  high-contrast:text-black
  high-contrast:border-black
">
  Badge
</span>
```

### Links

```tsx
// Before
<a className="text-blue-500 hover:text-blue-700">
  Link text
</a>

// After
<a className="
  text-primary-700 
  hover:text-primary-800
  underline
  decoration-2
  underline-offset-2
  high-contrast:text-[#0000ee]
  high-contrast:decoration-[#0000ee]
">
  Link text
</a>
```

### Modals/Dialogs

```tsx
// Before
<div className="
  fixed inset-0 
  bg-black bg-opacity-50
">
  <div className="bg-white rounded-lg shadow-xl">
    <h2 className="text-gray-900">Modal Title</h2>
    <p className="text-gray-600">Modal content</p>
  </div>
</div>

// After
<div className="
  fixed inset-0 
  bg-black bg-opacity-50
  high-contrast:bg-black
">
  <div className="
    bg-white 
    rounded-lg 
    shadow-xl
    border-2 border-neutral-300
    high-contrast:border-black
    high-contrast:border-4
  ">
    <h2 className="
      text-neutral-900
      high-contrast:text-black
    ">
      Modal Title
    </h2>
    <p className="
      text-neutral-700
      high-contrast:text-black
    ">
      Modal content
    </p>
  </div>
</div>
```

### Tooltips

```tsx
// Before
<div className="
  bg-gray-900 
  text-white 
  text-sm
  rounded
  shadow-lg
">
  Tooltip text
</div>

// After
<div className="
  bg-neutral-900 
  text-white 
  text-sm
  rounded
  shadow-lg
  border-2 border-neutral-700
  high-contrast:bg-black
  high-contrast:text-white
  high-contrast:border-white
  high-contrast:border-3
">
  Tooltip text
</div>
```

### Dropdown Menus

```tsx
// Before
<div className="
  bg-white 
  border border-gray-200
  shadow-lg
  rounded-lg
">
  <button className="
    hover:bg-gray-100
    text-gray-700
  ">
    Menu item
  </button>
</div>

// After
<div className="
  bg-white 
  border-2 border-neutral-300
  shadow-lg
  rounded-lg
  high-contrast:border-black
  high-contrast:border-3
">
  <button className="
    hover:bg-neutral-100
    text-neutral-800
    high-contrast:text-black
    high-contrast:hover:bg-gray-200
    high-contrast:border-b
    high-contrast:border-black
  ">
    Menu item
  </button>
</div>
```

## Testing Your Changes

### 1. Visual Inspection
```bash
# Enable high contrast in your OS
# Windows: Alt + Shift + Print Screen
# macOS: System Preferences → Accessibility → Display → Increase Contrast
```

### 2. Automated Testing
```typescript
import { checkContrast } from '@/utils/contrastChecker';

// Test your colors
const result = checkContrast('#334155', '#ffffff', false);
console.log(`Contrast: ${result.ratio.toFixed(2)}:1`);
console.log(`Passes AA: ${result.meetsAA}`);
console.log(`Passes AAA: ${result.meetsAAA}`);
```

### 3. Browser DevTools
1. Inspect element
2. Click color swatch in Styles panel
3. Check contrast ratio indicator
4. Look for green checkmarks (AA/AAA)

## Common Patterns Reference

### Color Replacements

| Old Color | New Color | Contrast | Use Case |
|-----------|-----------|----------|----------|
| gray-300 | neutral-400 | 3.8:1 | Borders |
| gray-400 | neutral-600 | 6.2:1 | Text |
| gray-500 | neutral-700 | 10.7:1 | Headings |
| blue-400 | primary-600 | 5.6:1 | Buttons |
| blue-500 | primary-700 | 7.2:1 | Links |

### Border Width Upgrades

```tsx
// Upgrade all borders for better visibility
border → border-2
border-2 → border-2 (keep)
border-0 → border-0 (keep for intentional removal)

// In high contrast mode
high-contrast:border-2 → high-contrast:border-3
```

### Text Size Considerations

```tsx
// Large text (≥18pt or ≥14pt bold) needs 3:1 minimum
<h1 className="text-4xl text-neutral-700">  // 10.7:1 ✓ AAA

// Normal text needs 4.5:1 minimum
<p className="text-base text-neutral-700">   // 10.7:1 ✓ AAA

// Small text should be even darker
<small className="text-sm text-neutral-800"> // 14.8:1 ✓ AAA
```

## Checklist for Each Component

- [ ] Identify all text elements
- [ ] Check contrast ratios (aim for 4.5:1 minimum)
- [ ] Update color tokens to higher contrast versions
- [ ] Add high-contrast variant classes
- [ ] Test with high contrast mode enabled
- [ ] Verify focus indicators are visible
- [ ] Check disabled states
- [ ] Test with browser zoom at 200%
- [ ] Run contrast auditor
- [ ] Document any custom colors used

## Troubleshooting

### Issue: Colors look too dark
**Solution**: You're on the right track! Higher contrast means darker colors. Test with actual users with low vision.

### Issue: High contrast mode not working
**Solution**: Ensure ThemeProvider is wrapping your app and high-contrast.css is imported.

### Issue: Gradients breaking in high contrast
**Solution**: Use solid colors in high contrast mode:
```tsx
className="
  bg-gradient-to-r from-blue-400 to-purple-400
  high-contrast:bg-primary-600
  high-contrast:from-primary-600
  high-contrast:to-primary-600
"
```

### Issue: Custom colors not adjusting
**Solution**: Use the theme context:
```tsx
const { adjustColor } = useTheme();
const safeColor = adjustColor(customColor);
```

## Resources

- [CONTRAST_IMPROVEMENTS.md](./CONTRAST_IMPROVEMENTS.md) - Full documentation
- [CONTRAST_QUICK_GUIDE.md](./CONTRAST_QUICK_GUIDE.md) - Quick reference
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

## Getting Help

If you're unsure about a contrast ratio:
1. Use the contrast auditor: `logContrastIssues()`
2. Check with browser DevTools color picker
3. Test with WebAIM Contrast Checker
4. Refer to the color recommendations in CONTRAST_QUICK_GUIDE.md
