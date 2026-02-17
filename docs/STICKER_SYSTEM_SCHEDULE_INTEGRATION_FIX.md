# Sticker System Schedule Integration Fix

## Issue
When selecting a sticker on the schedule page, the sticker was not appearing. Console logs showed the old `StickerDisplay` component was still being used instead of the new `StickerCanvas` component.

## Root Cause Analysis

1. **Multiple Components Rendering Stickers**: Both `PageLayout` and `DayCard` were rendering sticker components
   - `PageLayout` was using the old `StickerDisplay` component
   - `DayCard` was using the new `StickerCanvas` component
   - The old component was taking precedence

2. **Placement Loading Issue**: The `loadPlacements` function in the store only loaded placements for the trip entity (`'trip'`), not for day entities (`'trip_day'`)
   - When attaching a sticker to a day, it was saved correctly to the backend
   - But when loading placements, only trip-level placements were fetched
   - Day-level placements were never loaded into the store

## Changes Made

### 1. Updated PageLayout Component
**File**: `frontend/src/components/layout/PageLayout.tsx`

- Changed import from old `StickerDisplay` to new `StickerCanvas`
- Updated component usage to match new API with `hasValues` prop
- Added proper className for positioning

```typescript
// Before
import { StickerDisplay } from '@/components/kawaii/StickerDisplay';
<StickerDisplay tripId={tripId} elementType={...} elementId={...} editable={true} />

// After
import { StickerCanvas } from '@/components/stickers/organisms/StickerCanvas';
<StickerCanvas tripId={tripId} elementType={...} elementId={...} editable={true} hasValues={false} className="absolute inset-0 pointer-events-none" />
```

### 2. Disabled Stickers in ScheduleScreen PageLayout
**File**: `frontend/src/pages/ScheduleScreen.tsx`

- Changed `showStickers={true}` to `showStickers={false}` in PageLayout
- This prevents duplicate sticker rendering since `DayCard` already handles stickers
- Removed `loadPlacements` call from initial load (line 218)
- Removed `loadPlacements` import from useStickerStore

```typescript
// Before
<PageLayout tripId={tripId} showStickers>

// After
<PageLayout tripId={tripId} showStickers={false}>
```

### 3. Updated StickerCanvas to Load Own Placements
**File**: `frontend/src/components/stickers/organisms/StickerCanvas.tsx`

- Added `useEffect` hook to load placements for the specific element when component mounts
- Added import for `stickerService`
- Each `StickerCanvas` instance now loads its own placements independently

```typescript
// Added useEffect to load element-specific placements
React.useEffect(() => {
  if (demoMode) return;
  
  const loadElementPlacements = async () => {
    const entityType = entityTypeMap[elementType] || 'trip_day';
    const elementPlacements = await stickerService.getEntityStickers(entityType, elementId);
    
    // Merge with existing placements in store
    useStickerStore.setState((state) => {
      const otherPlacements = state.placements.filter(p => p.elementId !== elementId);
      const newPlacements = [...otherPlacements, ...elementPlacements];
      return { placements: newPlacements };
    });
  };
  
  loadElementPlacements();
}, [elementId, elementType, demoMode]);
```

### 4. Updated Store loadPlacements Function
**File**: `frontend/src/stores/stickerStore.ts`

- Added documentation clarifying that `loadPlacements` only loads trip-level placements
- Individual components should load their own placements

```typescript
// Added comment explaining the behavior
// Note: We only load trip-level placements here
// Individual components (DayCard, ActivityCard, etc.) should load their own placements
// when they mount by calling stickerService.getEntityStickers directly
```

### 5. Simplified handleStickerSelect
**File**: `frontend/src/pages/ScheduleScreen.tsx`

- Removed `loadPlacements` call after attaching sticker
- The new sticker is automatically added to the store by `attachSticker`
- `StickerCanvas` will automatically render it from the store

```typescript
// Before
await attachSticker(tripId, stickerId, selectedDay.id, 'day', { x: 50, y: 50 });
await loadPlacements(tripId);

// After
await attachSticker(tripId, stickerId, selectedDay.id, 'day', { x: 50, y: 50 });
// StickerCanvas will automatically show the new sticker
```

## Architecture Improvements

### Decentralized Placement Loading
- **Before**: Central `loadPlacements` function tried to load all placements for a trip
- **After**: Each `StickerCanvas` component loads its own placements when it mounts
- **Benefits**:
  - More efficient - only loads placements when needed
  - More scalable - works for any entity type (trip, day, activity, booking)
  - Easier to maintain - each component is self-contained

### Component Responsibility
- **PageLayout**: No longer responsible for rendering stickers (unless explicitly enabled)
- **DayCard**: Renders its own `StickerCanvas` for day-level stickers
- **StickerCanvas**: Self-contained component that loads and manages its own placements

## Testing Checklist

- [x] PageLayout updated to use new StickerCanvas
- [x] ScheduleScreen disables PageLayout stickers
- [x] StickerCanvas loads own placements on mount
- [x] handleStickerSelect simplified
- [ ] Test: Select sticker from modal → sticker appears on day card
- [ ] Test: Drag sticker to new position → position saved
- [ ] Test: Long-press sticker → value control appears
- [ ] Test: Drag sticker to trash → sticker deleted with animation
- [ ] Test: Click undo after delete → sticker restored
- [ ] Test: Multiple stickers on same day → all render correctly
- [ ] Test: Navigate between days → each day shows its own stickers

## Next Steps

1. Test the sticker attachment flow in the browser
2. Verify console logs show `StickerCanvas` instead of `StickerDisplay`
3. Check that stickers appear after selection
4. Test drag-to-reposition functionality
5. Test drag-to-trash deletion
6. Test value control (if enabled with `hasValues={true}`)

## Related Files

- `frontend/src/components/layout/PageLayout.tsx`
- `frontend/src/pages/ScheduleScreen.tsx`
- `frontend/src/components/stickers/organisms/StickerCanvas.tsx`
- `frontend/src/stores/stickerStore.ts`
- `frontend/src/components/kawaii/DayCard.tsx`
- `frontend/src/components/kawaii/StickerDisplay.tsx` (old component, still used in BookingScreen and ShoppingScreen)

## Migration Notes

Other screens still using the old `StickerDisplay` component:
- `BookingScreen.tsx`
- `ShoppingScreen.tsx`
- `DayCardNew.tsx`

These should be migrated to use `StickerCanvas` in the future for consistency.
