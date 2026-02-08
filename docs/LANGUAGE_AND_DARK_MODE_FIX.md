# Language and Dark Mode Fix

## Changes Made

### 1. Set Traditional Chinese as Default Language

**File: `frontend/src/i18n/config.ts`**

Changed the default language from English to Traditional Chinese (zh-TW):

```typescript
fallbackLng: 'zh-TW',
lng: 'zh-TW', // Set Traditional Chinese as default
```

This ensures that:
- The app loads in Traditional Chinese by default
- Users who haven't selected a language will see Traditional Chinese
- The fallback language is also Traditional Chinese

### 2. Force Light Mode (Disable Dark Mode)

Dark mode has been completely disabled across the application to ensure consistent light mode experience.

#### Changes:

**File: `frontend/src/hooks/useDarkMode.ts`**
- Modified to always return `darkMode: false`
- Forces light mode preference in localStorage
- Removes dark class from document root
- Disabled toggle and preference functions

**File: `frontend/src/App.tsx`**
- Added effect to force remove dark class on app initialization
- Added MutationObserver to watch for and prevent any dark class additions
- Ensures light mode is maintained throughout the app lifecycle

**File: `frontend/src/stores/kawaiiThemeStore.ts`** (Already configured)
- Dark mode already disabled in kawaii theme store
- Always applies light mode CSS variables
- Prevents dark mode from being saved to localStorage

### 3. How It Works

The fix implements multiple layers of protection against dark mode:

1. **Hook Level**: `useDarkMode` hook always returns false for dark mode
2. **Store Level**: Kawaii theme store doesn't allow dark mode to be set
3. **App Level**: MutationObserver watches for and removes any dark class additions
4. **Storage Level**: Forces 'light' mode in localStorage

### 4. Testing

To verify the changes:

1. **Language Test**:
   - Clear browser localStorage
   - Reload the app
   - Verify UI is in Traditional Chinese

2. **Dark Mode Test**:
   - Check that no pages show dark backgrounds
   - Verify document root doesn't have 'dark' class
   - Check localStorage shows 'journo-dark-mode': 'light'

### 5. Affected Components

All pages and components that previously had dark mode support will now only display in light mode:

- Home page
- Login/Register pages
- Trip pages (Schedule, Booking, Shopping, Checklist, Members, Settings)
- Packing page
- Badge demo
- All kawaii components

### 6. User Experience

- **Language**: Users will see Traditional Chinese by default, but can still change language in settings
- **Theme**: Users can still customize:
  - Primary color (6 presets + custom)
  - Font size (12-24px)
  - Animations (none, snow, sakura)
- **Dark Mode**: Not available (toggle is disabled in settings)

## Rollback Instructions

If you need to re-enable dark mode:

1. Revert changes in `frontend/src/hooks/useDarkMode.ts`
2. Revert changes in `frontend/src/App.tsx` (remove MutationObserver)
3. Update `frontend/src/stores/kawaiiThemeStore.ts` to allow dark mode

If you need to change default language back to English:

1. In `frontend/src/i18n/config.ts`, change:
   ```typescript
   fallbackLng: 'en',
   lng: 'en',
   ```

## Notes

- All existing dark mode CSS classes remain in the codebase but are not applied
- This allows for easy re-enabling of dark mode in the future if needed
- The kawaii design system is optimized for light mode with soft, pastel colors
