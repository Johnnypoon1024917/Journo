# BubbleQuest UI Components

This directory contains the bubblequest-style UI components for the Journo travel platform redesign.

## Components Implemented

### 1. Button Component
**File:** `Button.tsx`

A reusable button with kawaii styling and Framer Motion animations.

**Features:**
- Three variants: `primary`, `secondary`, `ghost`
- Three sizes: `sm`, `md`, `lg`
- Framer Motion animations:
  - Scale on tap (0.95)
  - Hover effect with scale (1.02)
  - Spring animation with stiffness 400, damping 17
- Icon placement (left/right)
- Loading state with spinner
- Disabled state with reduced opacity
- Touch-optimized with 44px minimum height
- Full width option

**Requirements:** 1.1, 1.4

**Usage:**
```tsx
import { Button } from '@/components/bubblequest';

<Button variant="primary" size="md" onClick={handleClick}>
  Click me
</Button>

<Button 
  variant="secondary" 
  icon={<Icon />} 
  iconPosition="left"
  loading={isLoading}
>
  Submit
</Button>
```

### 2. FAB (Floating Action Button) Component
**File:** `FAB.tsx`

A floating action button for primary actions.

**Features:**
- Fixed positioning with z-index 50
- Gradient background (primary-500 to primary-600)
- Pulse animation on idle (scale 1 to 1.05)
- Tap feedback with scale animation (0.9)
- Hover effect with scale (1.1)
- Custom icon support
- Two positions: `bottom-right`, `bottom-center`
- Positioned above bottom navigation (bottom: 80px)

**Requirements:** 1.4

**Usage:**
```tsx
import { FAB } from '@/components/bubblequest';

<FAB 
  onClick={handleAdd} 
  icon={<PlusIcon />}
  label="Add new item"
  position="bottom-right"
/>
```

### 3. Card Component
**File:** `Card.tsx`

A container component with kawaii styling for content grouping.

**Features:**
- Three variants: `default`, `elevated`, `outlined`
- Three padding sizes: `sm`, `md`, `lg`
- Framer Motion animations:
  - Hover lift effect (y: -4px, scale: 1.02)
  - Tap feedback (scale: 0.98)
- Optional hoverable state
- Rounded corners (rounded-xl)
- Dark mode support

**Requirements:** 1.1, 1.4

**Usage:**
```tsx
import { Card } from '@/components/bubblequest';

<Card variant="elevated" padding="md" hoverable onClick={handleClick}>
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</Card>
```

### 4. Input Component
**File:** `Input.tsx`

A text input field with kawaii styling and validation states.

**Features:**
- Touch-optimized with 44px minimum height
- Rounded corners (rounded-xl)
- Three variants: `default`, `error`, `success`
- Label support
- Error messages with icon
- Helper text
- Focus ring animations
- Dark mode support
- Disabled state

**Requirements:** 1.3, 1.4

**Usage:**
```tsx
import { Input } from '@/components/bubblequest';

<Input 
  label="Email"
  placeholder="Enter your email"
  error={errors.email}
  helperText="We'll never share your email"
/>
```

### 5. Checkbox Component
**File:** `Checkbox.tsx`

A checkbox input with kawaii styling and animations.

**Features:**
- Touch-optimized with 44px minimum target size
- Rounded corners (rounded-lg)
- Smooth check/uncheck animations with Framer Motion
- Animated checkmark path (pathLength animation)
- Label support
- Helper text
- Disabled state
- Dark mode support

**Requirements:** 1.3, 1.4

**Usage:**
```tsx
import { Checkbox } from '@/components/bubblequest';

<Checkbox 
  label="Accept terms and conditions"
  helperText="You must accept to continue"
  checked={accepted}
  onChange={(e) => setAccepted(e.target.checked)}
/>
```

### 6. Slider Component
**File:** `Slider.tsx`

A range slider input with kawaii styling and animations.

**Features:**
- Touch-optimized with 44px minimum target size
- Rounded track and thumb
- Animated fill track with Framer Motion
- Value display with scale animation
- Custom value formatter support
- Label and helper text
- Min/max/step support
- Disabled state
- Dark mode support

**Requirements:** 1.3, 1.4

**Usage:**
```tsx
import { Slider } from '@/components/bubblequest';

<Slider 
  label="Font Size"
  min={12}
  max={24}
  step={1}
  value={fontSize}
  onChange={(e) => setFontSize(Number(e.target.value))}
  showValue
  valueFormatter={(val) => `${val}px`}
/>
```

### 7. BottomNavigation Component
**File:** `BottomNavigation.tsx`

Fixed bottom navigation bar for mobile with 7 tabs.

**Features:**
- Fixed bottom positioning with safe area insets
- 7 tabs: Schedule, Booking, Budget, Shopping, Checklist, Members, Settings
- Active tab highlighting with primary color
- Touch-optimized with 44px minimum height
- Smooth animations with Framer Motion:
  - Scale animation on tap (0.95)
  - Active icon scale (1.1)
  - Animated active indicator bar with layoutId
- Heroicons for tab icons (outline and solid variants)
- Badge support for notifications
- Routing integration with React Router
- Accessibility support (ARIA labels, aria-current)
- Dark mode support

**Requirements:** 8.1, 8.2, 8.3, 8.4, 8.5

**Usage:**
```tsx
import { BottomNavigation } from '@/components/bubblequest';

// Controlled mode
<BottomNavigation 
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>

// Uncontrolled mode (uses React Router location)
<BottomNavigation />
```

## Design Tokens

All components use kawaii design tokens from `@/design-system/bubblequest-tokens.ts`:

- **Colors:** Soft pink/coral primary colors with 6 theme options
- **Typography:** Noto Sans TC font family
- **Spacing:** Touch-optimized spacing scale
- **Animations:** Spring animations with consistent timing
- **Shadows:** Soft shadows for depth
- **Border Radius:** Rounded corners (xl = 1rem)

## Testing

All components have comprehensive tests in `__tests__/components.test.tsx`:

- Rendering tests
- Interaction tests (clicks, inputs, changes)
- Prop validation
- Accessibility tests

Run tests:
```bash
npm test -- components.test.tsx
```

## Dependencies

- **framer-motion:** For smooth animations
- **react:** Core framework
- **@/utils/cn:** Utility for className merging

## Next Steps

These base components will be used to build:
- Navigation components (BottomNavigation, SideNavigation)
- Screen-specific components (DayCard, BoardingPassCard, etc.)
- Advanced features (sticker system, particle animations)
