# Sticker Scale Persistence Fix

## Problem

When users adjusted the sticker size using the ValueControl slider (long-press → adjust value), the scale value was logged to console but the sticker didn't actually change size. The scale wasn't being persisted to the backend or updated in the store.

## Root Cause

In `StickerCanvas.tsx`, the `handleValueChange` function had a TODO comment and wasn't actually updating the placement:

```tsx
// Before
const handleValueChange = useCallback(async (placementId: string, value: number) => {
  const newScale = value / 100;
  
  if (demoMode) {
    // Demo mode works fine
    useStickerStore.setState((state) => ({
      placements: state.placements.map((p) =>
        p.id === placementId ? { ...p, value, scale: newScale } : p
      ),
    }));
  } else {
    // Real mode - only logs, doesn't update! ❌
    console.log('Value change:', placementId, value, 'scale:', newScale);
    // TODO: Implement value storage in backend
  }
}, [demoMode]);
```

## Solution

Call the existing `updatePlacement` function to persist the scale change:

```tsx
// After
const handleValueChange = useCallback(async (placementId: string, value: number) => {
  const newScale = value / 100;
  
  if (demoMode) {
    // Demo mode - update local state
    useStickerStore.setState((state) => ({
      placements: state.placements.map((p) =>
        p.id === placementId ? { ...p, value, scale: newScale } : p
      ),
    }));
  } else {
    // Real mode - update scale via API ✅
    try {
      await updatePlacement(tripId, placementId, { scale: newScale });
      console.log('✅ Scale updated:', placementId, 'value:', value, 'scale:', newScale);
    } catch (error) {
      console.error('❌ Error updating sticker scale:', error);
    }
  }
}, [demoMode, tripId, updatePlacement]);
```

## Backend Support

The backend already fully supports scale updates:

### Database Schema
```sql
CREATE TABLE sticker_attachments (
  id UUID PRIMARY KEY,
  -- ...
  scale DECIMAL(5,2) DEFAULT 1.0,  -- ✅ Scale column exists
  -- ...
);
```

### API Endpoint
```typescript
// PUT /api/stickers/attachment/:id
export const updateStickerAttachment = async (req: Request, res: Response) => {
  const { positionX, positionY, rotation, scale, zIndex } = req.body;
  
  // ✅ Scale is already handled
  if (scale !== undefined) {
    updates.push(`scale = $${paramCount++}`);
    values.push(scale);
  }
  // ...
};
```

### Frontend Service
```typescript
// stickerService.ts
async updateStickerAttachment(
  attachmentId: string,
  position: { x?: number, y?: number, rotation?: number, scale?: number, zIndex?: number }
): Promise<StickerPlacement> {
  // ✅ Scale is already supported
  const response = await api.put(`/stickers/attachment/${attachmentId}`, {
    positionX: position.x,
    positionY: position.y,
    rotation: position.rotation,
    scale: position.scale,  // ✅ Sent to backend
    zIndex: position.zIndex
  });
  // ...
}
```

## How It Works

### Value to Scale Conversion
- User sees: **0-200%** (percentage slider)
- Stored as: **0.0-2.0** (scale multiplier)
- Conversion: `scale = value / 100`

### Update Flow
1. User long-presses sticker → ValueControl appears
2. User adjusts slider (e.g., 150%)
3. `handleValueChange` called with value `150`
4. Convert to scale: `150 / 100 = 1.5`
5. Call `updatePlacement(tripId, placementId, { scale: 1.5 })`
6. Store updates placement in state
7. API persists to database
8. Sticker re-renders with new scale ✅

### Visual Update
The sticker's scale is applied via Framer Motion:

```tsx
<motion.div
  animate={{
    scale: isEditing ? currentScale * 1.15 : isDragging ? currentScale * 0.75 : currentScale,
    // ...
  }}
>
```

Where `currentScale = placement.scale || 1`

## Changes Made

**File**: `frontend/src/components/stickers/organisms/StickerCanvas.tsx`

```tsx
// Added tripId and updatePlacement to dependencies
const handleValueChange = useCallback(async (placementId: string, value: number) => {
  const newScale = value / 100;
  
  if (demoMode) {
    useStickerStore.setState((state) => ({
      placements: state.placements.map((p) =>
        p.id === placementId ? { ...p, value, scale: newScale } : p
      ),
    }));
  } else {
    // ✅ Now actually updates the placement
    try {
      await updatePlacement(tripId, placementId, { scale: newScale });
      console.log('✅ Scale updated:', placementId, 'value:', value, 'scale:', newScale);
    } catch (error) {
      console.error('❌ Error updating sticker scale:', error);
    }
  }
}, [demoMode, tripId, updatePlacement]);  // ✅ Added dependencies
```

## Testing

### Manual Test Steps
1. Open Schedule page with stickers
2. Long-press a sticker (hold for 400ms)
3. ✅ ValueControl popup appears
4. Adjust slider to 150%
5. ✅ Sticker immediately grows to 1.5x size
6. Close ValueControl
7. Refresh page
8. ✅ Sticker maintains 1.5x size (persisted)

### Console Logs
```
🎨 Updating sticker attachment: { id: '...', updates: { scale: 1.5 } }
✅ Scale updated: placement-id 150 scale: 1.5
```

## Related Issues Fixed

This fix also resolves:
- ✅ Sticker size not persisting after page refresh
- ✅ Scale changes only working in demo mode
- ✅ TODO comment about implementing value storage

## Future Enhancements

Potential improvements:
- [ ] Add loading state while scale is updating
- [ ] Add optimistic updates (update UI before API response)
- [ ] Add undo/redo for scale changes
- [ ] Add preset size buttons (50%, 100%, 150%, 200%)
- [ ] Add keyboard shortcuts for fine-tuning (arrow keys)
- [ ] Add scale limits per sticker type
- [ ] Add scale animation when changing size

## Conclusion

The scale persistence issue was simply that the `handleValueChange` function wasn't calling the existing `updatePlacement` API. The backend, database, and service layer all already supported scale updates. Adding the API call completes the feature and makes sticker resizing fully functional.
