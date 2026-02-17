# Particle Animation System

## Overview

The particle animation system provides decorative snow and sakura (cherry blossom) particle effects that enhance the kawaii aesthetic of the application. The system is designed to be performant, accessible, and non-intrusive.

## Components

### ParticleSystem

The core component that renders and animates particles on a canvas.

**Props:**
- `type: 'snow' | 'sakura'` - The type of particles to render
- `particleCount?: number` - Number of particles (default: 50)
- `enabled: boolean` - Whether animations are enabled
- `className?: string` - Additional CSS classes

**Features:**
- Uses `requestAnimationFrame` for smooth 60fps performance
- Particles are generated off-screen and fall naturally
- Canvas has `pointer-events: none` to avoid blocking user interactions
- Respects `prefers-reduced-motion` for accessibility
- Automatically handles window resize

**Example:**
```tsx
import ParticleSystem from '@/components/bubblequest/ParticleSystem';

<ParticleSystem type="snow" enabled={true} particleCount={50} />
```

### AnimationProvider

A provider component that wraps the app and manages particle animations based on user preferences.

**Props:**
- `children: React.ReactNode` - The app content to wrap

**Features:**
- Reads animation preference from `bubbleQuestThemeStore`
- Automatically renders the appropriate particle system
- Ensures children appear above particles with proper z-index
- Respects user's animation settings (none, snow, sakura)

**Example:**
```tsx
import AnimationProvider from '@/components/bubblequest/AnimationProvider';

<AnimationProvider>
  <App />
</AnimationProvider>
```

## Integration

The AnimationProvider is integrated at the top level of the application in `App.tsx`:

```tsx
<EnhancedErrorBoundary>
  <AnimationProvider>
    <Suspense fallback={...}>
      <Router>
        {/* App routes */}
      </Router>
    </Suspense>
  </AnimationProvider>
</EnhancedErrorBoundary>
```

## User Controls

Users can control particle animations through the Settings screen:

1. Navigate to Settings
2. Find the "Particle Animations" section
3. Select from:
   - **None** - No particle effects
   - **Snow** - Gentle snowfall effect
   - **Sakura** - Falling cherry blossom petals

The preference is automatically saved to localStorage and persists across sessions.

## Performance

The particle system is optimized for performance:

- Uses canvas rendering for efficient drawing
- Maintains 60fps through `requestAnimationFrame`
- Delta time normalization ensures consistent speed across devices
- Particles are recycled when they leave the viewport
- Canvas is positioned with `fixed` and `z-index: 0` to avoid layout shifts

## Accessibility

The system respects accessibility preferences:

- Checks `prefers-reduced-motion` media query
- Disables animations if user prefers reduced motion
- Canvas has `aria-hidden="true"` as it's purely decorative
- Does not interfere with keyboard navigation or screen readers

## Particle Types

### Snow
- Small white circles (2-5px)
- Gentle falling motion (0.5-1.5 px/frame)
- Slight horizontal drift
- Semi-transparent (0.3-0.8 opacity)
- 50 particles by default

### Sakura
- Pink elliptical petals (6-14px)
- Moderate falling speed (0.5-2 px/frame)
- Rotating motion for natural effect
- Horizontal drift for wind effect
- Semi-transparent (0.4-0.8 opacity)
- 40 particles by default

## Technical Details

### Canvas Setup
- Full viewport size (`window.innerWidth` x `window.innerHeight`)
- Positioned `fixed` with `inset-0`
- `pointer-events: none` to allow clicks through
- `z-index: 0` to stay behind content

### Animation Loop
1. Calculate delta time for frame-rate independence
2. Update particle positions based on speed and drift
3. Apply rotation (for sakura)
4. Reset particles that leave the viewport
5. Clear canvas and redraw all particles
6. Request next animation frame

### Particle Physics
- Gravity: Constant downward speed
- Drift: Horizontal movement (simulates wind)
- Rotation: Angular velocity (sakura only)
- Wrapping: Particles wrap horizontally at screen edges

## Requirements Validation

This implementation validates the following requirements:

- **7.1** - Provides "none" animation option with no particle effects
- **7.2** - Provides "snow" animation option with gentle snowfall particles
- **7.3** - Provides "sakura" animation option with falling cherry blossom petals
- **7.4** - Renders particles without blocking user interactions (`pointer-events: none`)
- **7.5** - Maintains 60fps performance using `requestAnimationFrame`
- **7.6** - Allows users to toggle animations on/off in settings

## Testing

The particle system includes comprehensive tests:

- Component rendering tests
- Animation start/stop tests
- Accessibility tests (reduced motion, aria-hidden)
- Interaction tests (pointer-events)
- Cleanup tests (unmount, resize)

Run tests with:
```bash
npm test -- ParticleSystem.test.tsx
npm test -- AnimationProvider.test.tsx
```
