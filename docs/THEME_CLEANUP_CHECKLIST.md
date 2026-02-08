# Theme System Cleanup Checklist

## Phase 1: Database Setup ✅

- [x] Create migration `033_centralized_theme_system.sql`
- [x] Define `system_color_theme` table
- [x] Define `trip_color_theme` table
- [x] Add indexes and triggers
- [ ] Run migration: `cd backend && npm run migrate`

## Phase 2: Backend Implementation ✅

- [x] Create `backend/src/types/theme.ts`
- [x] Create `backend/src/routes/theme.ts`
- [x] Register theme routes in `backend/src/index.ts`
- [ ] Test API endpoints with Postman/curl

## Phase 3: Frontend Core ✅

- [x] Create `frontend/src/design-system/centralizedKawaiiTheme.css`
- [x] Create `frontend/src/types/theme.ts`
- [x] Create `frontend/src/services/themeService.ts`
- [x] Create `frontend/src/stores/centralizedThemeStore.ts`

## Phase 4: Frontend Components ✅

- [x] Create `frontend/src/components/admin/SystemThemeConfig.tsx`
- [x] Create `frontend/src/components/trip/TripThemeSettings.tsx`

## Phase 5: Integration (TODO)

### Update Main App

- [ ] Update `frontend/src/index.css`:
  ```css
  /* Remove old imports */
  /* @import './design-system/design-system.css'; */
  /* @import './design-system/kawaii.css'; */
  
  /* Add centralized theme */
  @import './design-system/centralizedKawaiiTheme.css';
  ```

- [ ] Update `frontend/src/App.tsx`:
  ```typescript
  import { useCentralizedThemeStore } from '@/stores/centralizedThemeStore';
  
  function App() {
    const { loadSystemTheme } = useCentralizedThemeStore();
    
    useEffect(() => {
      loadSystemTheme();
    }, [loadSystemTheme]);
    
    // ... rest
  }
  ```

### Update Trip Pages

- [ ] Find all trip view components
- [ ] Add theme loading:
  ```typescript
  const { loadTripTheme, resetToSystemTheme } = useCentralizedThemeStore();
  
  useEffect(() => {
    if (tripId) {
      loadTripTheme(tripId);
    }
    return () => resetToSystemTheme();
  }, [tripId]);
  ```

### Update Admin Routes

- [ ] Add route to admin panel:
  ```typescript
  <Route path="/admin/theme" element={<SystemThemeConfig />} />
  ```

- [ ] Add navigation link in admin sidebar

### Update Trip Settings

- [ ] Add `TripThemeSettings` to trip settings page
- [ ] Verify owner-only access

## Phase 6: Component Migration (TODO)

### Find Hardcoded Colors

- [ ] Run color detection script:
  ```bash
  npx tsx frontend/src/scripts/findHardcodedColors.ts
  ```

### High Priority Components

Components with most hardcoded colors (from analysis):

1. [ ] `frontend/src/components/kawaii/AddActivityModal.tsx`
   - Replace `rgb(255, 248, 240)` with `var(--kawaii-cream)`
   - Replace `rgb(254, 242, 242)` with error state color

2. [ ] `frontend/src/components/kawaii/EditActivityModal.tsx`
   - Replace `rgb(255, 248, 240)` with `var(--kawaii-cream)`

3. [ ] `frontend/src/components/kawaii/KawaiiModal.tsx`
   - Replace `rgb(255, 248, 240)` with `var(--kawaii-cream)`

4. [ ] `frontend/src/components/kawaii/StickerModal.tsx`
   - Replace `rgb(255, 248, 240)` with `var(--kawaii-cream)`

5. [ ] `frontend/src/components/trip/TripSidebar.tsx`
   - Replace all `rgba()` colors with CSS variables

6. [ ] `frontend/src/components/trip/TimelinePanel.tsx`
   - Replace hex colors with CSS variables

7. [ ] `frontend/src/components/map/InfoWindow.tsx`
   - Replace hex colors with CSS variables

8. [ ] `frontend/src/components/budget/CategoryChart.tsx`
   - Replace category colors with Kawaii palette

### Search and Replace Patterns

Common replacements:

```bash
# Kawaii cream background
rgb(255, 248, 240) → var(--kawaii-cream)
#FFF8F0 → var(--kawaii-cream)

# Kawaii primary pink
#FFB3BA → var(--kawaii-primary-500)
rgb(255, 179, 186) → var(--kawaii-primary-500)

# Kawaii primary variants
#ff6b7f → var(--kawaii-primary-600)
#ff4d63 → var(--kawaii-primary-700)

# Neutral colors
#fafaf9 → var(--kawaii-neutral-50)
#f5f5f4 → var(--kawaii-neutral-100)
#78716c → var(--kawaii-neutral-500)
#1c1917 → var(--kawaii-neutral-900)
```

## Phase 7: Remove Old Files (TODO)

### Design System Files

- [ ] Delete `frontend/src/design-system/design-system.css`
- [ ] Delete `frontend/src/design-system/tokens.ts`
- [ ] Delete `frontend/src/design-system/kawaii.css`
- [ ] Delete `frontend/src/design-system/kawaii-tokens.ts`
- [ ] Delete `frontend/src/stores/kawaiiThemeStore.ts`
- [ ] Delete `frontend/src/design-system/ThemeProvider.tsx` (if unused)
- [ ] Delete `frontend/src/design-system/types.ts` (if unused)

### Update Imports

Search for and update imports:

```bash
# Find old theme imports
grep -r "from '@/design-system/tokens'" frontend/src/
grep -r "from '@/design-system/kawaii-tokens'" frontend/src/
grep -r "from '@/stores/kawaiiThemeStore'" frontend/src/
```

Replace with:
```typescript
import { useCentralizedThemeStore } from '@/stores/centralizedThemeStore';
```

## Phase 8: Testing (TODO)

### Manual Testing

- [ ] Test system theme changes (admin)
  - [ ] Change to each preset
  - [ ] Use custom color picker
  - [ ] Verify all pages update
  - [ ] Reset to default

- [ ] Test trip theme changes (trip owner)
  - [ ] Create new trip
  - [ ] Change trip theme
  - [ ] Verify only trip pages update
  - [ ] Delete trip theme
  - [ ] Verify fallback to system theme

- [ ] Test theme hierarchy
  - [ ] Navigate from trip to home
  - [ ] Verify theme switches correctly
  - [ ] Navigate between different trips
  - [ ] Verify each trip's theme loads

- [ ] Test permissions
  - [ ] Non-admin cannot access system theme config
  - [ ] Non-owner cannot change trip theme
  - [ ] Collaborators see trip theme but cannot edit

### Browser Testing

- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

### Accessibility Testing

- [ ] Verify contrast ratios (WCAG AA)
- [ ] Test with screen readers
- [ ] Test keyboard navigation
- [ ] Test with high contrast mode

## Phase 9: Documentation (TODO)

- [ ] Update README with theme system info
- [ ] Add API documentation for theme endpoints
- [ ] Create user guide for theme customization
- [ ] Add developer guide for using theme variables

## Phase 10: Deployment (TODO)

### Pre-deployment

- [ ] Run all tests
- [ ] Check for console errors
- [ ] Verify no broken imports
- [ ] Test database migration on staging

### Deployment

- [ ] Deploy backend with migration
- [ ] Deploy frontend
- [ ] Verify production works
- [ ] Monitor for errors

### Post-deployment

- [ ] Announce new theme system to users
- [ ] Create tutorial video/guide
- [ ] Monitor user feedback
- [ ] Fix any reported issues

## Success Criteria

- ✅ All colors use CSS custom properties
- ✅ No hardcoded color values in components
- ✅ System theme configurable by admin
- ✅ Trip theme configurable by trip owner
- ✅ Theme changes apply instantly
- ✅ Proper fallback to system theme
- ✅ All old design system files removed
- ✅ No console errors or warnings
- ✅ Passes accessibility checks
- ✅ Works across all browsers

## Rollback Plan

If issues occur:

1. Revert frontend deployment
2. Keep database migration (backward compatible)
3. Old theme system still works with default values
4. Fix issues and redeploy

## Notes

- Keep old theme files until fully tested
- Document any custom color mappings
- Consider gradual rollout (feature flag)
- Monitor performance impact
- Gather user feedback early
