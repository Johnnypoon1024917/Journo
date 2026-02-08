# UI Polish and Animations Guide

This document describes all the animations and micro-interactions implemented for the Funliday UI redesign.

## Overview

The animation system provides smooth, performant transitions that enhance the user experience without being distracting. All animations follow these principles:

- **Purposeful**: Every animation serves a functional purpose
- **Performant**: GPU-accelerated where possible
- **Accessible**: Respects `prefers-reduced-motion` setting
- **Consistent**: Uses standardized easing curves and durations

## Animation Categories

### 1. Drag and Drop Animations

#### Dragging State
- **Effect**: Card scales down slightly and rotates 2 degrees with shadow
- **Duration**: 150ms
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)`
- **Usage**: Applied when user drags a place card

```css
.place-card.dragging {
  opacity: 0.6;
  transform: scale(0.98) rotate(2deg);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}
```

#### Drop Animation
- **Effect**: Bounce effect when card is dropped
- **Duration**: 400ms
- **Easing**: `cubic-bezier(0.34, 1.56, 0.64, 1)` (elastic)
- **Usage**: Applied after successful drop

### 2. Loading Animations

#### Spinner
- **Effect**: Smooth rotation
- **Duration**: 800ms continuous
- **Easing**: `cubic-bezier(0.4, 0, 0.6, 1)`
- **Sizes**: Small (16px), Medium (24px), Large (40px)

#### Loading Overlay
- **Effect**: Fade in with blur backdrop
- **Duration**: 200ms
- **Usage**: Shown during database sync operations

#### Skeleton Loader
- **Effect**: Shimmer animation from left to right
- **Duration**: 1.5s continuous
- **Usage**: Initial page load states

#### Progress Bar
- **Effect**: Smooth width transition or indeterminate slide
- **Duration**: 300ms (determinate), 1.5s (indeterminate)
- **Usage**: Batch operations, file uploads

### 3. Micro-interactions

#### Button Hover
- **Effect**: Slight lift with shadow
- **Transform**: `translateY(-1px)`
- **Duration**: 150ms
- **Usage**: All interactive buttons

#### Button Active
- **Effect**: Returns to original position
- **Transform**: `translateY(0)`
- **Duration**: 150ms

#### Card Hover
- **Effect**: Lift with border color change
- **Transform**: `translateY(-2px)`
- **Duration**: 200ms
- **Usage**: Place cards, day groups

#### Drag Handle Hover
- **Effect**: Color change and scale up
- **Transform**: `scale(1.1)`
- **Color**: Changes to blue
- **Duration**: 150ms

#### Action Button Hover
- **Effect**: Background change with lift
- **Transform**: `translateY(-1px)`
- **Duration**: 150ms

### 4. Success/Error Animations

#### Success Indicator
- **Effect**: Pop in with elastic bounce
- **Duration**: 500ms
- **Easing**: `cubic-bezier(0.34, 1.56, 0.64, 1)`
- **Components**: SuccessAnimation component

#### Success Checkmark
- **Effect**: Draw animation using stroke-dashoffset
- **Duration**: 400ms
- **Delay**: 200ms (after circle appears)

#### Error Shake
- **Effect**: Horizontal shake
- **Duration**: 400ms
- **Usage**: Form validation errors, failed operations

#### Error Overlay
- **Effect**: Pulse in
- **Duration**: 300ms
- **Usage**: Sync failures on place cards

### 5. Empty State Animations

#### Empty State Fade In
- **Effect**: Fade in with upward slide
- **Duration**: 500ms
- **Transform**: `translateY(20px)` to `translateY(0)`

#### Illustration Float
- **Effect**: Gentle up and down motion
- **Duration**: 3s continuous
- **Transform**: `translateY(-10px)` oscillation

### 6. Toast/Notification Animations

#### Toast Slide In
- **Effect**: Slide in from right
- **Duration**: 300ms
- **Transform**: `translateX(100%)` to `translateX(0)`

#### Toast Slide Out
- **Effect**: Slide out to right
- **Duration**: 200ms
- **Transform**: `translateX(0)` to `translateX(100%)`

### 7. Modal/Dialog Animations

#### Backdrop Fade
- **Effect**: Fade in
- **Duration**: 200ms
- **Usage**: Modal backgrounds

#### Modal Scale
- **Effect**: Scale up with elastic bounce
- **Duration**: 250ms
- **Easing**: `cubic-bezier(0.34, 1.56, 0.64, 1)`
- **Transform**: `scale(0.9)` to `scale(1)`

### 8. Collapse/Expand Animations

#### Day Group Expand
- **Effect**: Height and opacity transition
- **Duration**: 300ms
- **Properties**: `max-height`, `opacity`

#### Chevron Rotation
- **Effect**: 180-degree rotation
- **Duration**: 200ms
- **Usage**: Expand/collapse indicators

### 9. Transport Segment Animations

#### Calculating Pulse
- **Effect**: Opacity oscillation
- **Duration**: 1.5s continuous
- **Usage**: While calculating routes

#### Route Line Draw
- **Effect**: Stroke dash animation
- **Duration**: 1s
- **Usage**: Drawing routes on map

#### Mode Change
- **Effect**: Rotate 90 degrees on hover
- **Duration**: 150ms
- **Usage**: Transport mode selector button

### 10. List Item Animations

#### Staggered Appearance
- **Effect**: Fade in with slide, staggered by 50ms per item
- **Duration**: 300ms per item
- **Usage**: Initial list rendering

## Component Usage

### EmptyState Component
```tsx
<EmptyState
  illustration="trip"
  title="No trips yet"
  description="Create your first trip to get started"
  action={{
    label: "Create Trip",
    onClick: handleCreate
  }}
/>
```

### SuccessAnimation Component
```tsx
<SuccessAnimation
  show={showSuccess}
  message="Trip saved!"
  duration={2000}
  onComplete={() => setShowSuccess(false)}
/>
```

### ProgressBar Component
```tsx
<ProgressBar
  progress={uploadProgress}
  label="Uploading photos"
  variant="success"
  showPercentage
/>
```

### TransportSegment Component
```tsx
<TransportSegment
  mode="driving"
  duration={15}
  distance={5200}
  isCalculating={false}
  onModeChange={handleModeChange}
/>
```

## Performance Considerations

### GPU Acceleration
Animations use `transform` and `opacity` properties which are GPU-accelerated:
- ✅ `transform: translateX/Y/Z, scale, rotate`
- ✅ `opacity`
- ❌ Avoid animating `width`, `height`, `top`, `left`

### Will-Change
Applied to frequently animated elements:
```css
.gpu-accelerated {
  transform: translateZ(0);
  will-change: transform;
}
```

### Reduced Motion
All animations respect user preferences:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Easing Curves

Standard easing curves used throughout:

- **Ease Out**: `cubic-bezier(0.4, 0, 0.2, 1)` - Default for most transitions
- **Ease In Out**: `cubic-bezier(0.4, 0, 0.6, 1)` - Smooth continuous animations
- **Elastic**: `cubic-bezier(0.34, 1.56, 0.64, 1)` - Success states, emphasis

## Duration Guidelines

- **Micro-interactions**: 150ms (hover, focus)
- **Standard transitions**: 200-300ms (cards, buttons)
- **Complex animations**: 400-500ms (success, error)
- **Continuous**: 800ms-3s (spinners, pulses, floats)

## Testing Animations

### Browser DevTools
1. Open Chrome DevTools
2. Go to "More tools" > "Animations"
3. Trigger animations to see timeline
4. Adjust playback speed for debugging

### Reduced Motion Testing
```javascript
// Test in browser console
document.documentElement.style.setProperty('prefers-reduced-motion', 'reduce');
```

### Performance Testing
- Use Chrome DevTools Performance tab
- Look for 60fps (16.67ms per frame)
- Check for layout thrashing
- Verify GPU acceleration in Layers panel

## Best Practices

1. **Keep it subtle**: Animations should enhance, not distract
2. **Be consistent**: Use the same durations and easings for similar actions
3. **Provide feedback**: Every user action should have visual feedback
4. **Respect preferences**: Always honor `prefers-reduced-motion`
5. **Test on devices**: Verify performance on low-end devices
6. **Use transforms**: Prefer `transform` over position properties
7. **Avoid layout shifts**: Don't animate properties that trigger reflow

## Troubleshooting

### Animation feels janky
- Check if animating layout properties (width, height, top, left)
- Verify GPU acceleration with DevTools Layers panel
- Reduce animation complexity
- Check for JavaScript blocking main thread

### Animation doesn't play
- Verify CSS is imported in index.css
- Check for conflicting styles
- Ensure element has proper display property
- Verify animation class is applied

### Animation too fast/slow
- Adjust duration in CSS
- Check for conflicting transition properties
- Verify easing curve is appropriate

## Future Enhancements

Potential additions for future iterations:

- [ ] Page transition animations
- [ ] Parallax scrolling effects
- [ ] Gesture-based animations for mobile
- [ ] Advanced map marker animations
- [ ] Photo gallery transitions
- [ ] Confetti effect for milestones
- [ ] Loading skeleton variations
- [ ] Custom cursor animations
