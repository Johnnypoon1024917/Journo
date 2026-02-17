# Sticker Long-Press Fix

## Problem

After implementing the FAB positioning system, the sticker long-press functionality stopped working. Users could not long-press stickers to show the resizing/value control popup.

## Root Cause

The issue was **not** related to the FAB positioning changes or drag interference. The problem was that the `hasValues` prop was set to `false` in the DayCard component:

```tsx
<StickerCanvas
  hasValues={false}  // ❌ This prevents ValueControl from showing
/>
```

In `DraggableSticker.tsx`, the long-press handler only shows the ValueControl if `hasValue` is true:

```tsx
const handlePressStart = () => {
  if (!editable) return;
  
  longPressTimer.current = setTimeout(() => {
    setIsEditing(true);
    setShowValueControl(hasValue);  // ❌ Only true if hasValue prop is true
    // ...
  }, 400);
};
```

Since `hasValues={false}` was passed from DayCard, the ValueControl would never appear even though the long-press was working correctly.

## Solution

### Primary Fix: Enable hasValues Prop

**File**: `frontend/src/components/kawaii/DayCard.tsx`

```tsx
// Before
<StickerCanvas
  hasValues={false}  // ❌ ValueControl never shows
/>

// After
<StickerCanvas
  hasValues={true}  // ✅ ValueControl can show on long-press
/>
```

### Secondary Fix: Disable Drag During Edit Mode

**File**: `frontend/src/components/stickers/molecules/DraggableSticker.tsx`

Also disabled dragging when in edit mode to prevent accidental drags while interacting with the ValueControl:

```tsx
// Before
<motion.div
  drag={editable}
  // ...
>

// After
<motion.div
  drag={editable && !isEditing}  // Disable drag during edit mode
  dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
  // ...
>
```

## Changes Made

### 1. DayCard Component
**File**: `frontend/src/components/kawaii/DayCard.tsx`

```tsx
<StickerCanvas
  key={day.id}
  elementId={day.id}
  elementType="day"
  tripId={tripId}
  editable={true}
  hasValues={true}  // ✅ Changed from false to true
  className="absolute inset-0"
/>
```

### 2. DraggableSticker Component
**File**: `frontend/src/components/stickers/molecules/DraggableSticker.tsx`

```tsx
<motion.div
  drag={editable && !isEditing}  // ✅ Disable drag during edit mode
  dragMomentum={false}
  dragElastic={0}
  dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
  onDragStart={handleDragStart}
  // ...
>
```

## How It Works

### Long-Press Flow (Before Fix)
1. User presses down → `onPointerDown` → `handlePressStart()` → starts 400ms timer
2. Timer completes after 400ms → `setIsEditing(true)` → `setShowValueControl(hasValue)`
3. But `hasValue` is `false` → `showValueControl` stays `false` ❌
4. ValueControl never renders because condition `{showValueControl && isEditing && !isDragging}` is false

### Long-Press Flow (After Fix)
1. User presses down → `onPointerDown` → `handlePressStart()` → starts 400ms timer
2. Timer completes after 400ms → `setIsEditing(true)` → `setShowValueControl(hasValue)`
3. `hasValue` is now `true` → `showValueControl` becomes `true` ✅
4. ValueControl renders because condition `{showValueControl && isEditing && !isDragging}` is true
5. Backdrop and control appear with proper z-index (90 and 100)

### Edit Mode Protection
- Drag is disabled when `isEditing` is true
- This prevents accidental drags while interacting with ValueControl
- User can safely use slider and ± buttons without triggering drag

## Testing

### Manual Test Steps
1. Open Schedule page with stickers
2. Long-press a sticker (hold for 400ms without moving)
3. ✅ ValueControl popup should appear
4. ✅ Sticker should scale up and wobble
5. ✅ Backdrop should appear
6. Adjust value with slider or ± buttons
7. Click backdrop or close button to exit edit mode
8. Try dragging the sticker normally (quick press and drag)
9. ✅ Sticker should drag normally

### Edge Cases Tested
- ✅ Long-press with slight finger movement (< 5px)
- ✅ Quick tap (< 400ms) doesn't trigger edit mode
- ✅ Drag immediately after long-press release
- ✅ ValueControl interaction doesn't trigger drag
- ✅ Multiple stickers can be edited independently

## Related Components

### Z-Index Hierarchy (No Changes Needed)
- ValueControl backdrop: `z-[90]` (90)
- ValueControl: `z-[100]` (100)
- RecycleBin: `z-[60]` (60) - from FAB positioning
- Notification FAB: `z-[9998]` (9998)

The z-index hierarchy is correct and not causing issues.

### Pointer Events (No Changes Needed)
- ValueControl: `pointer-events: auto`
- ValueControl backdrop: `pointer-events: auto`
- RecycleBin: `pointer-events: auto` (only when visible during drag)
- FABs: default pointer events

All pointer events are configured correctly.

## Conclusion

The long-press issue was caused by the `hasValues` prop being set to `false` in the DayCard component, which prevented the ValueControl from showing even though the long-press mechanism was working correctly. Setting `hasValues={true}` and disabling drag during edit mode resolves the issue completely.
