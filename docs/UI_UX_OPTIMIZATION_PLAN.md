# UI/UX Optimization Plan

## Overview
Comprehensive optimization of the application's UI/UX focusing on:
1. Improved drag-and-drop for activity cards
2. Standardized layout components
3. Consistent FAB positioning across pages
4. Reusable component architecture

## Phase 1: Drag-and-Drop Optimization

### Current Issues
- Activity cards are sometimes hard to drag
- Touch targets may be too small
- Drag sensitivity needs improvement

### Solutions
1. **Increase touch target size**
   - Minimum 44x44px for mobile touch targets
   - Add larger drag handle area

2. **Improve drag sensors**
   - Increase pointer activation distance
   - Add delay for better touch detection
   - Optimize collision detection

3. **Visual feedback**
   - Clear drag handle indicator
   - Better hover/active states
   - Smooth animations

### Files to Modify
- `frontend/src/components/trip/EnhancedItineraryView.tsx`
- `frontend/src/components/trip/ItineraryView.tsx`
- `frontend/src/components/kawaii/ActivityCard.tsx`
- `frontend/src/hooks/useEnhancedDragDrop.ts`

## Phase 2: Reusable Layout Components

### Create New Components

#### 1. `PageLayout.tsx`
Wrapper component for all pages with:
- Consistent padding/margins
- Responsive container
- Sticker display integration
- Loading/error states

#### 2. `NavigationWrapper.tsx`
Handles navigation rendering:
- Automatic mobile/desktop detection
- Side navigation for desktop
- Bottom navigation for mobile
- Consistent active tab handling

#### 3. `FABContainer.tsx`
Standardized FAB positioning:
- Consistent position across pages
- Responsive positioning
- Z-index management
- Multiple FAB support (primary/secondary)

### Standard Layout Structure
```tsx
<PageLayout>
  <NavigationWrapper
    activeTab={tab}
    onTabChange={handleTabChange}
  >
    {/* Page content */}
  </NavigationWrapper>
  
  <FABContainer
    primary={{
      icon: <PlusIcon />,
      onClick: handleAdd,
      label: 'Add'
    }}
    secondary={[
      { icon: <StarIcon />, onClick: handleSticker }
    ]}
  />
</PageLayout>
```

## Phase 3: Standardize Existing Pages

### Pages to Update
1. ✅ ScheduleScreen
2. ✅ ChecklistScreen
3. ✅ BookingScreen
4. ✅ ShoppingScreen
5. ✅ MembersScreen
6. ✅ SettingsScreen

### Standardization Checklist
- [ ] Use PageLayout wrapper
- [ ] Use NavigationWrapper
- [ ] Use FABContainer
- [ ] Consistent spacing (padding, margins)
- [ ] Consistent header styles
- [ ] Consistent card styles
- [ ] Consistent button styles
- [ ] Consistent modal styles

## Phase 4: Style Consistency

### Design Tokens to Enforce
```css
/* Spacing */
--page-padding-mobile: 1rem;
--page-padding-desktop: 2rem;
--section-gap: 1.5rem;
--card-gap: 1rem;

/* FAB Position */
--fab-bottom-mobile: 5rem; /* Above bottom nav */
--fab-bottom-desktop: 2rem;
--fab-right: 1.5rem;

/* Z-Index Layers */
--z-content: 1;
--z-sticky: 10;
--z-fab: 40;
--z-navigation: 50;
--z-modal: 100;
--z-toast: 200;
```

### Component Hierarchy
```
z-index: 200 - Toasts/Notifications
z-index: 100 - Modals
z-index: 50  - Navigation (Bottom/Side)
z-index: 40  - FAB
z-index: 10  - Sticky headers
z-index: 1   - Content
```

## Implementation Order

### Step 1: Create Base Components (Day 1)
1. Create `PageLayout.tsx`
2. Create `NavigationWrapper.tsx`
3. Create `FABContainer.tsx`
4. Create shared style constants

### Step 2: Optimize Drag-and-Drop (Day 1)
1. Update drag sensors configuration
2. Improve ActivityCard drag handle
3. Add visual feedback
4. Test on mobile devices

### Step 3: Migrate Pages (Day 2-3)
1. Start with ScheduleScreen (most complex)
2. ChecklistScreen
3. BookingScreen
4. ShoppingScreen
5. MembersScreen
6. SettingsScreen

### Step 4: Polish & Testing (Day 3)
1. Cross-browser testing
2. Mobile device testing
3. Accessibility audit
4. Performance optimization

## Success Metrics
- [ ] Drag-and-drop works smoothly on first try (>95% success rate)
- [ ] FAB position consistent across all pages
- [ ] Navigation behavior consistent
- [ ] Code duplication reduced by >60%
- [ ] Page load time improved
- [ ] Accessibility score >90

## Files to Create
- `frontend/src/components/layout/PageLayout.tsx`
- `frontend/src/components/layout/NavigationWrapper.tsx`
- `frontend/src/components/layout/FABContainer.tsx`
- `frontend/src/styles/layout-constants.ts`
- `frontend/src/hooks/usePageLayout.ts`

## Files to Modify
- All page components in `frontend/src/pages/`
- `frontend/src/components/kawaii/ActivityCard.tsx`
- `frontend/src/hooks/useEnhancedDragDrop.ts`
- `frontend/src/components/trip/EnhancedItineraryView.tsx`

## Breaking Changes
None - all changes are additive and backward compatible.

## Migration Guide
Each page will be migrated incrementally:
1. Wrap with PageLayout
2. Replace navigation code with NavigationWrapper
3. Replace FAB code with FABContainer
4. Remove duplicate styling
5. Test functionality
6. Commit

## Notes
- Keep existing components working during migration
- Test each page after migration
- Document any edge cases
- Maintain theme compatibility
