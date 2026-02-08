# Centralized Kawaii Theme System Implementation

## Overview

This implementation consolidates all styling to use **only Kawaii style** with two configurable color themes:

1. **System Color Theme (`systemcolor`)**: Default theme for all users, configurable by admin
2. **Trip Color Theme (`tripcolour`)**: Per-trip theme, configurable by trip owner

All color configurations are stored in the database and can be changed dynamically without code changes.

## Architecture

### Database Schema

**Tables Created:**
- `system_color_theme`: Stores system-wide color configuration (admin-managed)
- `trip_color_theme`: Stores trip-specific color configurations (trip owner-managed)

Both tables store complete Kawaii color palettes:
- Primary colors (50-950 scale)
- Cream background color
- Neutral colors (50-950 scale)

### Backend API

**Endpoints:**
- `GET /api/theme/system` - Get active system theme
- `PUT /api/theme/system` - Update system theme (admin only)
- `POST /api/theme/system/reset` - Reset to default Kawaii pink
- `GET /api/theme/trip/:tripId` - Get trip theme (falls back to system)
- `PUT /api/theme/trip/:tripId` - Update trip theme (owner only)
- `DELETE /api/theme/trip/:tripId` - Delete trip theme (revert to system)

### Frontend Architecture

**Core Files:**
- `frontend/src/design-system/centralizedKawaiiTheme.css` - Single CSS file with all Kawaii variables
- `frontend/src/stores/centralizedThemeStore.ts` - Zustand store for theme management
- `frontend/src/services/themeService.ts` - API service for theme operations
- `frontend/src/types/theme.ts` - TypeScript types and presets

**Components:**
- `frontend/src/components/admin/SystemThemeConfig.tsx` - Admin theme configuration UI
- `frontend/src/components/trip/TripThemeSettings.tsx` - Trip owner theme settings UI

## How It Works

### 1. CSS Custom Properties

All colors are defined as CSS custom properties in `:root`:

```css
:root {
  --kawaii-primary-500: #FFB3BA;
  --kawaii-cream: #FFF8F0;
  --kawaii-neutral-500: #78716c;
  /* ... etc */
}
```

### 2. Dynamic Theme Application

When a theme is loaded from the database, the store applies it by updating CSS custom properties:

```typescript
root.style.setProperty('--kawaii-primary-500', theme.primary_500);
```

### 3. Theme Hierarchy

- **Global pages**: Use system theme
- **Trip pages**: Use trip theme if configured, otherwise fall back to system theme
- **Admin portal**: Can modify system theme
- **Trip settings**: Trip owner can modify trip theme

## Theme Presets

Six built-in Kawaii presets:
1. **Kawaii Pink** (default) - #FFB3BA
2. **Kawaii Orange** - #F4A460
3. **Kawaii Blue** - #6B9BD1
4. **Kawaii Teal** - #7ECEC4
5. **Kawaii Purple** - #C5B3E6
6. **Kawaii Yellow** - #FFD97D

## Migration Steps

### 1. Database Migration

Run the migration:
```bash
cd backend
npm run migrate
```

This creates the theme tables and inserts default system theme.

### 2. Update Frontend Index

Replace all design system imports with centralized theme:

```typescript
// Remove old imports
// import './design-system/design-system.css';
// import './design-system/kawaii.css';

// Add centralized theme
import './design-system/centralizedKawaiiTheme.css';
```

### 3. Initialize Theme on App Load

In your main App component:

```typescript
import { useCentralizedThemeStore } from '@/stores/centralizedThemeStore';

function App() {
  const { loadSystemTheme } = useCentralizedThemeStore();
  
  useEffect(() => {
    loadSystemTheme();
  }, []);
  
  // ... rest of app
}
```

### 4. Load Trip Theme on Trip Pages

In trip view components:

```typescript
import { useCentralizedThemeStore } from '@/stores/centralizedThemeStore';

function TripView({ tripId }: { tripId: string }) {
  const { loadTripTheme } = useCentralizedThemeStore();
  
  useEffect(() => {
    loadTripTheme(tripId);
  }, [tripId]);
  
  // ... rest of component
}
```

### 5. Add Admin Theme Configuration

Add route to admin panel:

```typescript
import { SystemThemeConfig } from '@/components/admin/SystemThemeConfig';

// In admin routes
<Route path="/admin/theme" element={<SystemThemeConfig />} />
```

### 6. Add Trip Theme Settings

Add to trip settings page:

```typescript
import { TripThemeSettings } from '@/components/trip/TripThemeSettings';

// In trip settings
<TripThemeSettings tripId={tripId} isOwner={isOwner} />
```

## Component Updates

### Using Kawaii Variables

All components should use CSS custom properties:

```tsx
// ✅ Good - Uses centralized variables
<div style={{ backgroundColor: 'var(--kawaii-cream)' }}>
  <h1 style={{ color: 'var(--kawaii-primary-500)' }}>Title</h1>
</div>

// ❌ Bad - Hardcoded colors
<div style={{ backgroundColor: '#FFF8F0' }}>
  <h1 style={{ color: '#FFB3BA' }}>Title</h1>
</div>
```

### Utility Classes

Use provided Kawaii utility classes:

```tsx
<div className="kawaii-card">
  <button className="kawaii-button kawaii-button-primary">
    Click Me
  </button>
</div>
```

## Cleanup Tasks

### Files to Remove

1. **Old Design System Files:**
   - `frontend/src/design-system/design-system.css`
   - `frontend/src/design-system/tokens.ts`
   - `frontend/src/design-system/types.ts` (if not used elsewhere)

2. **Old Kawaii Files:**
   - `frontend/src/design-system/kawaii.css` (merged into centralized)
   - `frontend/src/design-system/kawaii-tokens.ts` (replaced)
   - `frontend/src/stores/kawaiiThemeStore.ts` (replaced)

3. **Old Theme Provider:**
   - `frontend/src/design-system/ThemeProvider.tsx` (if not needed)

### Components to Update

Search for hardcoded colors and replace with CSS variables:

```bash
# Find RGB/RGBA colors
grep -r "rgb(" frontend/src/components/

# Find hex colors
grep -r "#[0-9a-fA-F]\{6\}" frontend/src/components/

# Find Tailwind color classes
grep -r "bg-\|text-" frontend/src/components/
```

## Testing

### 1. Test System Theme

1. Login as admin
2. Navigate to `/admin/theme`
3. Change system theme color
4. Verify all pages update

### 2. Test Trip Theme

1. Create a trip
2. Navigate to trip settings
3. Change trip theme color
4. Verify only trip pages update
5. Navigate away from trip
6. Verify system theme is restored

### 3. Test Fallback

1. Create a trip without custom theme
2. Verify it uses system theme
3. Update system theme
4. Verify trip reflects system theme changes

## Benefits

1. **Single Source of Truth**: All colors in one place
2. **Database-Driven**: No code changes needed for color updates
3. **Hierarchical**: System theme with trip-level overrides
4. **Type-Safe**: Full TypeScript support
5. **Performance**: CSS custom properties are fast
6. **Maintainable**: Easy to understand and modify

## Future Enhancements

1. **Color Palette Generator**: Auto-generate 50-950 scale from single color
2. **Theme Preview**: Live preview before applying
3. **Theme History**: Track theme changes over time
4. **Theme Templates**: Save and share custom themes
5. **Accessibility Checker**: Validate contrast ratios
6. **Dark Mode**: Add dark mode support (currently disabled)

## Support

For issues or questions:
1. Check database migrations are applied
2. Verify API endpoints are accessible
3. Check browser console for errors
4. Ensure CSS custom properties are supported (all modern browsers)
