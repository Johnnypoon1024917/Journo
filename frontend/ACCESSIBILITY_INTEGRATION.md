# Accessibility Integration Guide

Quick guide to integrate accessibility features into your BubbleQuest app.

## 1. Import Styles

Add to your main CSS/SCSS file (e.g., `src/index.css` or `src/App.css`):

```css
/* Existing accessibility styles */
@import './styles/accessibility.css';

/* New accessibility enhancements */
@import './styles/reduced-motion.css';
@import './styles/high-contrast.css';
```

## 2. Wrap App with Providers

Update your `App.tsx` or main entry point:

```tsx
import { AccessibilityProvider } from './providers/AccessibilityProvider';
import { SkipLinks } from './components/accessibility/SkipLinks';

function App() {
  return (
    <AccessibilityProvider>
      {/* Skip links for keyboard navigation */}
      <SkipLinks />
      
      {/* Your existing app structure */}
      <Router>
        <Layout>
          <Routes>
            {/* Your routes */}
          </Routes>
        </Layout>
      </Router>
    </AccessibilityProvider>
  );
}
```

## 3. Add IDs to Main Landmarks

Update your layout components to include proper IDs for skip links:

```tsx
function Layout({ children }) {
  return (
    <>
      <nav id="main-navigation" tabIndex={-1}>
        {/* Navigation content */}
      </nav>

      <main id="main-content" tabIndex={-1}>
        {children}
      </main>

      <div id="search" tabIndex={-1}>
        {/* Search component */}
      </div>
    </>
  );
}
```

## 4. Use Accessibility Features

### In Components

```tsx
import { useAccessibilityContext } from './providers/AccessibilityProvider';

function MyComponent() {
  const {
    shouldAnimate,
    isHighContrast,
    fontSize,
    getAnimationDuration,
  } = useAccessibilityContext();

  return (
    <div
      style={{
        fontSize: `${fontSize}px`,
        transition: shouldAnimate ? 'all 0.3s' : 'none',
        animationDuration: `${getAnimationDuration(300)}ms`,
      }}
    >
      {/* Content */}
    </div>
  );
}
```

### Replace Existing Modals

Replace your existing modal components with the accessible version:

```tsx
import { AccessibleModal } from './components/accessibility/AccessibleModal';

function MyFeature() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="My Modal"
      description="Modal description"
    >
      {/* Modal content */}
    </AccessibleModal>
  );
}
```

### Add Live Announcements

For dynamic content updates:

```tsx
import { useLiveRegion } from './components/accessibility/LiveRegion';

function MyFeature() {
  const { announce } = useLiveRegion();

  const handleSave = async () => {
    try {
      await saveData();
      announce('Data saved successfully', 'polite');
    } catch (error) {
      announce('Failed to save data', 'assertive');
    }
  };

  return (
    <button onClick={handleSave}>Save</button>
  );
}
```

### Add Map Controls

For map components:

```tsx
import { AccessibleMapControls } from './components/map/AccessibleMapControls';

function MapView() {
  const [zoom, setZoom] = useState(10);

  return (
    <div className="flex gap-4">
      <div className="map-container">
        {/* Your map component */}
      </div>

      <AccessibleMapControls
        onZoomIn={() => setZoom(z => z + 1)}
        onZoomOut={() => setZoom(z => z - 1)}
        onPanUp={handlePanUp}
        onPanDown={handlePanDown}
        onPanLeft={handlePanLeft}
        onPanRight={handlePanRight}
        onResetView={handleResetView}
        currentZoom={zoom}
      />
    </div>
  );
}
```

## 5. Update Existing Components

### Add ARIA Labels to Icon Buttons

```tsx
// Before
<button onClick={handleClose}>
  <CloseIcon />
</button>

// After
<button onClick={handleClose} aria-label="Close dialog">
  <CloseIcon aria-hidden="true" />
</button>
```

### Add ARIA Attributes to Forms

```tsx
// Before
<input
  type="email"
  placeholder="Email"
  value={email}
  onChange={handleChange}
/>

// After
<input
  type="email"
  id="email"
  placeholder="Email"
  value={email}
  onChange={handleChange}
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby={hasError ? "email-error" : undefined}
/>
{hasError && (
  <span id="email-error" role="alert">
    {errorMessage}
  </span>
)}
```

### Add Keyboard Navigation

```tsx
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';

function MyComponent() {
  useKeyboardNavigation({
    enableArrowKeys: true,
    enableEscape: true,
    onEscape: handleClose,
    onArrowKey: (direction) => handleNavigation(direction),
  });

  return (
    <div>
      {/* Component content */}
    </div>
  );
}
```

## 6. Test Accessibility

### Manual Testing

1. **Keyboard Navigation:**
   ```
   - Unplug mouse
   - Navigate using Tab/Shift+Tab
   - Activate with Enter/Space
   - Close with Escape
   ```

2. **Screen Reader:**
   ```
   - Mac: Enable VoiceOver (Cmd+F5)
   - Windows: Install NVDA
   - Navigate and verify announcements
   ```

3. **Zoom:**
   ```
   - Zoom browser to 200%
   - Verify layout doesn't break
   - Check all content is readable
   ```

4. **High Contrast:**
   ```
   - Windows: Enable High Contrast Mode
   - Verify all content is visible
   ```

5. **Reduced Motion:**
   ```
   - Mac: System Preferences > Accessibility > Display > Reduce motion
   - Windows: Settings > Ease of Access > Display > Show animations
   - Verify animations are disabled
   ```

### Automated Testing

Run accessibility tests:

```bash
npm test -- accessibility.wcag.test.tsx
```

## 7. Common Patterns

### Status Messages

```tsx
<div role="status" aria-live="polite">
  {statusMessage}
</div>
```

### Error Messages

```tsx
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>
```

### Loading States

```tsx
<div role="status" aria-live="polite" aria-busy="true">
  Loading...
</div>
```

### Disabled Buttons

```tsx
<button
  disabled={isDisabled}
  aria-disabled={isDisabled}
  aria-label="Save changes"
>
  Save
</button>
```

## 8. CSS Classes

Use these utility classes for accessibility:

```css
/* Screen reader only */
.sr-only

/* Focus visible */
.focus-visible:outline-none
.focus-visible:ring-2

/* Reduced motion */
.animate-fade
.animate-slide-up
.animate-scale

/* High contrast */
.high-contrast
.forced-colors

/* Touch targets */
.min-h-touch
.min-w-touch
```

## 9. Troubleshooting

### Focus indicators not visible
- Check if `outline: none` is being applied
- Ensure `:focus-visible` styles are present
- Verify z-index isn't hiding outline

### Screen reader not announcing
- Check `aria-live` attribute is present
- Verify element isn't `display: none`
- Ensure message changes trigger announcement

### Animations not respecting reduced motion
- Import `reduced-motion.css`
- Use CSS variables for animation duration
- Check `prefers-reduced-motion` media query

### High contrast mode not working
- Import `high-contrast.css`
- Verify `forced-colors` media query
- Check border colors are defined

## 10. Resources

- [Full Documentation](../docs-consolidated/features/ACCESSIBILITY.md)
- [WCAG Audit](../ACCESSIBILITY_AUDIT.md)
- [Example Implementation](./src/examples/AccessibilityExample.tsx)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
