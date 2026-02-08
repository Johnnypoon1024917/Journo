# Kawaii Design Guide

## Design Philosophy

The kawaii design system brings joy, playfulness, and delight to the Journo travel planning experience. Inspired by Japanese kawaii culture, the design uses soft colors, rounded shapes, and friendly animations to create an emotional connection with users.

## Core Principles

### 1. Soft & Gentle
- Soft color palettes (pastels, light gradients)
- Rounded corners everywhere (no sharp edges)
- Gentle animations (smooth, not jarring)
- Comfortable spacing (breathing room)

### 2. Playful & Fun
- Emoji usage throughout
- Animated elements (rotation, bounce)
- Hover effects that delight
- Personality in every interaction

### 3. Clear & Accessible
- High contrast for readability
- Large touch targets (44px minimum)
- Clear visual hierarchy
- Intuitive navigation

### 4. Cohesive & Consistent
- Unified color system
- Consistent spacing scale
- Reusable components
- Predictable patterns

## Color System

### Primary Colors
```css
/* Soft Pink/Coral - Main brand color */
kawaii-primary-50:  #FFF5F7
kawaii-primary-100: #FFE4E9
kawaii-primary-200: #FFC9D4
kawaii-primary-300: #FFADBF
kawaii-primary-400: #FF92AA
kawaii-primary-500: #FFB3BA (Base)
kawaii-primary-600: #FF7B8F
kawaii-primary-700: #FF5A74
kawaii-primary-800: #FF3859
kawaii-primary-900: #FF1744
```

### Secondary Colors
```css
/* Complementary accent color */
kawaii-secondary-50:  #F0F9FF
kawaii-secondary-100: #E0F2FE
kawaii-secondary-200: #BAE6FD
kawaii-secondary-300: #7DD3FC
kawaii-secondary-400: #38BDF8
kawaii-secondary-500: #0EA5E9 (Base)
kawaii-secondary-600: #0284C7
kawaii-secondary-700: #0369A1
kawaii-secondary-800: #075985
kawaii-secondary-900: #0C4A6E
```

### Neutral Colors
```css
/* Text and UI elements */
kawaii-neutral-50:  #FAFAFA
kawaii-neutral-100: #F5F5F5
kawaii-neutral-200: #E5E5E5
kawaii-neutral-300: #D4D4D4
kawaii-neutral-400: #A3A3A3
kawaii-neutral-500: #737373
kawaii-neutral-600: #525252
kawaii-neutral-700: #404040
kawaii-neutral-800: #262626
kawaii-neutral-900: #171717
```

### Cream/Background
```css
/* Warm background tones */
kawaii-cream-50:  #FFFBF5
kawaii-cream-100: #FFF7ED
kawaii-cream-200: #FFEDD5
kawaii-cream-300: #FED7AA
```

### Semantic Colors
```css
/* Success */
success-50:  #F0FDF4
success-500: #22C55E
success-600: #16A34A

/* Error */
error-50:  #FEF2F2
error-500: #EF4444
error-600: #DC2626

/* Warning */
warning-50:  #FFFBEB
warning-500: #F59E0B
warning-600: #D97706
```

## Typography

### Font Family
```css
font-family: 'Noto Sans TC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Font Sizes
```css
text-xs:   12px  /* Helper text */
text-sm:   14px  /* Small text */
text-base: 16px  /* Body text (default) */
text-lg:   18px  /* Large text */
text-xl:   20px  /* Subheadings */
text-2xl:  24px  /* Headings */
text-3xl:  30px  /* Large headings */
text-4xl:  36px  /* Hero text */
text-5xl:  48px  /* Large hero */
text-6xl:  60px  /* Extra large */
text-7xl:  72px  /* Massive */
```

### Font Weights
```css
font-light:    300  /* Light text */
font-normal:   400  /* Body text */
font-medium:   500  /* Emphasis */
font-semibold: 600  /* Subheadings */
font-bold:     700  /* Headings */
```

## Spacing Scale

### Padding/Margin
```css
p-1:  4px
p-2:  8px
p-3:  12px
p-4:  16px
p-5:  20px
p-6:  24px
p-8:  32px
p-10: 40px
p-12: 48px
p-16: 64px
p-20: 80px
```

### Gap
```css
gap-1: 4px
gap-2: 8px
gap-3: 12px
gap-4: 16px
gap-6: 24px
gap-8: 32px
```

## Border Radius

### Sizes
```css
rounded-lg:   8px   /* Small elements */
rounded-xl:   12px  /* Inputs, small cards */
rounded-2xl:  16px  /* Cards, buttons */
rounded-3xl:  24px  /* Large cards */
rounded-full: 9999px /* Circles, pills */
```

### Usage
- **Buttons**: `rounded-xl` (12px)
- **Inputs**: `rounded-xl` (12px)
- **Cards**: `rounded-2xl` or `rounded-3xl` (16-24px)
- **Images**: `rounded-2xl` or `rounded-3xl`
- **Pills/Tags**: `rounded-full`

## Shadows

### Elevation Levels
```css
/* Small - Subtle depth */
shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)

/* Medium - Default cards */
shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1)

/* Large - Elevated cards */
shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1)

/* Extra Large - Modals */
shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1)

/* 2XL - Floating elements */
shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25)
```

## Animations

### Duration
```css
duration-75:  75ms   /* Very fast */
duration-100: 100ms  /* Fast */
duration-150: 150ms  /* Quick */
duration-200: 200ms  /* Default */
duration-300: 300ms  /* Moderate */
duration-500: 500ms  /* Slow */
duration-700: 700ms  /* Very slow */
```

### Easing
```css
ease-linear:  linear
ease-in:      cubic-bezier(0.4, 0, 1, 1)
ease-out:     cubic-bezier(0, 0, 0.2, 1)
ease-in-out:  cubic-bezier(0.4, 0, 0.2, 1)
```

### Common Animations

#### Hover Scale
```tsx
whileHover={{ scale: 1.05 }}
transition={{ duration: 0.2 }}
```

#### Hover Lift
```tsx
whileHover={{ y: -5 }}
transition={{ duration: 0.2 }}
```

#### Tap Scale
```tsx
whileTap={{ scale: 0.95 }}
transition={{ duration: 0.1 }}
```

#### Fade In
```tsx
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
transition={{ duration: 0.3 }}
```

#### Slide Up
```tsx
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.4 }}
```

#### Rotate (Emoji)
```tsx
animate={{ rotate: [0, 10, -10, 0] }}
transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
```

## Component Patterns

### Button
```tsx
<Button
  variant="primary"    // primary | secondary | ghost
  size="md"           // sm | md | lg
  loading={false}
  fullWidth={false}
>
  Button Text
</Button>
```

### Input
```tsx
<Input
  label="Email address"
  placeholder="you@example.com"
  error="Error message"
  helperText="Helper text"
  variant="default"   // default | error | success
/>
```

### Card
```tsx
<div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg p-8 border border-kawaii-primary-100">
  {/* Card content */}
</div>
```

### Gradient Background
```tsx
<div className="bg-gradient-to-br from-kawaii-cream-50 via-kawaii-primary-50/30 to-kawaii-secondary-50/30">
  {/* Content */}
</div>
```

### Glass-morphism
```tsx
<div className="bg-white/80 backdrop-blur-md border border-kawaii-primary-100">
  {/* Content */}
</div>
```

## Emoji Usage

### Guidelines
1. **Use sparingly**: Don't overdo it
2. **Be consistent**: Same emoji for same meaning
3. **Size appropriately**: Larger for headers, smaller for inline
4. **Animate subtly**: Rotation or bounce, not both

### Common Emojis
- ✈️ Travel/Trips
- 🗺️ Maps/Planning
- 📸 Photos/Memories
- 👥 Collaboration/Friends
- 🎒 Packing/Preparation
- 🌸 Beauty/Aesthetics
- 💖 Favorites/Wishlist
- 🔍 Search/Explore
- 🎉 Celebration/Success
- ⚠️ Warning/Error
- 👋 Welcome/Greeting

## Layout Patterns

### Hero Section
```tsx
<section className="relative min-h-[70vh] flex items-center justify-center px-6 py-20">
  {/* Decorative background */}
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute top-20 left-10 w-72 h-72 bg-kawaii-primary-200/30 rounded-full blur-3xl"></div>
  </div>
  
  {/* Content */}
  <div className="relative text-center max-w-4xl">
    {/* Hero content */}
  </div>
</section>
```

### Feature Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
  {features.map((feature) => (
    <div className="bg-gradient-to-br from-pink-100 to-pink-50 p-8 rounded-3xl">
      {/* Feature content */}
    </div>
  ))}
</div>
```

### Card Grid
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
  {items.map((item) => (
    <div className="group cursor-pointer">
      <div className="rounded-3xl overflow-hidden">
        {/* Card content */}
      </div>
    </div>
  ))}
</div>
```

## Responsive Design

### Breakpoints
```css
sm:  640px   /* Small tablets */
md:  768px   /* Tablets */
lg:  1024px  /* Laptops */
xl:  1280px  /* Desktops */
2xl: 1536px  /* Large desktops */
```

### Mobile-First Approach
```tsx
<div className="
  text-2xl          /* Mobile: 24px */
  md:text-4xl       /* Tablet: 36px */
  lg:text-5xl       /* Desktop: 48px */
">
  Responsive Text
</div>
```

## Accessibility

### Focus States
```css
focus:outline-none
focus:ring-2
focus:ring-kawaii-primary-500
focus:ring-offset-2
```

### Touch Targets
```css
min-h-[44px]  /* Minimum height */
min-w-[44px]  /* Minimum width */
```

### Color Contrast
- Text on light background: `kawaii-neutral-700` or darker
- Text on dark background: `kawaii-neutral-100` or lighter
- Links: `kawaii-primary-600` with hover state

## Best Practices

### Do's ✅
- Use soft, rounded corners
- Add gentle animations
- Maintain consistent spacing
- Use emoji thoughtfully
- Provide clear feedback
- Keep it simple and clean
- Test on mobile devices
- Ensure accessibility

### Don'ts ❌
- Don't use sharp corners
- Don't overuse animations
- Don't ignore spacing
- Don't spam emojis
- Don't hide important info
- Don't make it cluttered
- Don't forget mobile
- Don't sacrifice accessibility

## Examples

### Button Examples
```tsx
// Primary button
<Button variant="primary" size="lg">
  Get Started 🎒
</Button>

// Secondary button
<Button variant="secondary" size="md">
  Learn More
</Button>

// Ghost button
<Button variant="ghost" size="sm">
  Cancel
</Button>
```

### Card Examples
```tsx
// Feature card
<div className="bg-gradient-to-br from-pink-100 to-pink-50 p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all">
  <div className="text-6xl mb-6">👥</div>
  <h3 className="text-2xl font-bold mb-4">Collaborate</h3>
  <p className="text-kawaii-neutral-600">Plan together with friends</p>
</div>

// Content card
<div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-kawaii-primary-100">
  <h3 className="text-xl font-bold mb-2">Card Title</h3>
  <p className="text-kawaii-neutral-600">Card content goes here</p>
</div>
```

## Conclusion

The kawaii design system creates a delightful, cohesive experience across the Journo platform. By following these guidelines, you can maintain consistency while adding your own creative touches. Remember: the goal is to make trip planning feel fun and joyful! ✨
