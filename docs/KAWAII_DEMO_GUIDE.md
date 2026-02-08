# Kawaii UI Components Demo Guide

## How to Access the Demo Pages

### Main Demo Page
The main kawaii components demo page is accessible at:

**URL**: `http://localhost:5173/kawaii-demo`

This page showcases ALL kawaii UI components including:
- ✅ Theme customization (colors, font size, dark mode, animations)
- ✅ Buttons (all variants, sizes, states)
- ✅ Cards (default, elevated, outlined)
- ✅ Input fields (default, error, success, disabled)
- ✅ **CountdownTimer** - Real-time countdown with animations
- ✅ **DateSelector** - Horizontal scrollable date picker
- ✅ **SideNavigation** - Desktop/tablet side navigation (collapsible)
- ✅ **BottomNavigation** - Mobile bottom navigation bar
- ✅ **Responsive Navigation** - Auto-switching navigation
- ✅ FAB (Floating Action Button)

### Individual Component Demos

If you want to see individual component demos, there are also standalone demo files:

1. **SideNavigation Demo**
   - File: `frontend/src/components/kawaii/SideNavigationDemo.tsx`
   - Shows the side navigation in isolation

2. **DateSelector Demo**
   - File: `frontend/src/components/kawaii/DateSelectorDemo.tsx`
   - Shows the date selector with sample data

3. **Responsive Navigation Example**
   - File: `frontend/src/components/kawaii/ResponsiveNavigationExample.tsx`
   - Shows how to use the responsive navigation wrapper

4. **Component Demo** (Base components)
   - File: `frontend/src/components/kawaii/ComponentDemo.tsx`
   - Original demo for base components

## Starting the Development Server

If the server isn't running yet:

```bash
cd frontend
npm run dev
```

Then navigate to: `http://localhost:5173/kawaii-demo`

## What You'll See

### 1. Theme Settings Section
- Color presets (pink, orange, blue, teal, purple, yellow)
- Font size slider (12px - 24px)
- Dark mode toggle
- Animation effects (none, snow, sakura)

### 2. Buttons Section
- All button variants (primary, secondary, ghost)
- All sizes (small, medium, large)
- States (loading, disabled)
- With icons (left/right positioning)

### 3. Cards Section
- Default card with subtle shadow
- Elevated card with hover effect
- Outlined card with border

### 4. Inputs Section
- Default input with helper text
- Error state with error message
- Success state
- Disabled state

### 5. CountdownTimer Section
- Live countdown to a sample departure date (7 days from now)
- Animated numbers with smooth transitions
- Progress bar with animated plane icon
- Updates every second

### 6. DateSelector Section
- Horizontal scrollable date pills
- 7 sample dates
- Selected date highlighting
- Smooth scroll animations

### 7. SideNavigation Section
- Interactive demo in a contained area
- Collapsible navigation (click the arrow button)
- Shows all 7 tabs
- Active tab highlighting
- Content area that adjusts to collapsed/expanded state

### 8. BottomNavigation Section
- Fixed at the bottom of the page
- 7 tabs with icons and labels
- Try clicking different tabs to see the active state change
- Touch-optimized for mobile

### 9. FAB (Floating Action Button)
- Fixed at bottom-right corner
- Pulse animation
- Click to see alert

## Testing Responsive Behavior

To test the responsive navigation:

1. Open the demo page: `http://localhost:5173/kawaii-demo`
2. Open browser DevTools (F12)
3. Toggle device toolbar (Ctrl+Shift+M or Cmd+Shift+M)
4. Try different screen sizes:
   - **Mobile** (<768px): Shows BottomNavigation
   - **Tablet** (768px-1023px): Shows SideNavigation
   - **Desktop** (1024px+): Shows SideNavigation

## Component Documentation

Each component has detailed documentation:

- `CountdownTimer.md` - CountdownTimer component docs
- `DateSelector.md` - DateSelector component docs
- `SideNavigation.md` - SideNavigation component docs
- `BottomNavigation.md` - BottomNavigation component docs

These files are located in: `frontend/src/components/kawaii/`

## Testing

All components have comprehensive test suites:

```bash
cd frontend
npm test
```

Test files are located in: `frontend/src/components/kawaii/__tests__/`

## Next Steps

After viewing the demos, you can:

1. **Integrate components** into your app screens
2. **Customize themes** using the theme provider
3. **Add translations** using the i18n system (already configured for EN, ZH-TW, ZH-CN, JA)
4. **Continue implementation** of remaining tasks from the spec

## Need Help?

- Check component documentation files (*.md)
- Review test files for usage examples
- Look at the demo implementations for integration patterns

Enjoy exploring the kawaii UI components! 🎨✨
