# Sticker Persistence Fix - Different Days Should Show Different Stickers

## Issue
When clicking different days in the date picker, stickers were changing or disappearing. Each day should maintain its own set of stickers independently - Day 1's stickers should always appear when viewing Day 1, Day 2's stickers when viewing Day 2, etc.

## Root Cause
The `StickerCanvas` component was not properly remounting when the day changed, leading to stale state and incorrect placement filtering. When switching from Day 1 to Day 2:

1. `DayCard` component updates with new `day` prop (Day 2 data)
2. `StickerCanvas` receives new `elementId` (Day 2's ID)
3. `useEffect` runs and loads Day 2's placements
4. **Problem**: Component state from Day 1 was still present, causing rendering issues
5. Result: Stickers appeared inconsistent or disappeared

## Solution

### 1. Added Key Prop to Force Remount
**File**: `frontend/src/components/kawaii/DayCard.tsx`

Added `key={day.id}` to `StickerCanvas` to force React to unmount the old instance and mount a fresh one when the day changes.

```typescript
{enableStickers && (
  <StickerCanvas
    key={day.id}  // ← Forces remount when day changes
    elementId={day.id}
    elementType="day"
    tripId={tripId}
    editable={true}
    hasValues={false}
    className="absolute inset-0"
  />
)}
```

### 2. Improved Store Update Logic
**File**: `frontend/src/components/stickers/organisms/StickerCanvas.tsx`

Enhanced the placement merging logic with better logging to track store updates:

```typescript
useStickerStore.setState((state) => {
  // Keep all existing placements
  const existingPlacements = [...state.placements];
  
  // Remove old placements for THIS element only (to avoid duplicates)
  const otherPlacements = existingPlacements.filter(p => p.elementId !== elementId);
  
  // Add new placements for this element
  const updatedPlacements = [...otherPlacements, ...elementPlacements];
  
  console.log('📊 Store update:', {
    before: existingPlacements.length,
    after: updatedPlacements.length,
    thisElement: elementPlacements.length,
    otherElements: otherPlacements.length
  });
  
  return { placements: updatedPlacements };
});
```

## How It Works Now

### Component Lifecycle
1. **Day 1 Selected**:
   - `DayCard` renders with Day 1 data
   - `StickerCanvas` mounts with `key="day-1-id"` and `elementId="day-1-id"`
   - Loads Day 1's placements from API
   - Stores them in global store: `[...otherPlacements, ...day1Placements]`
   - Renders Day 1's stickers

2. **User Switches to Day 2**:
   - `DayCard` updates with Day 2 data
   - React sees `key` changed from `"day-1-id"` to `"day-2-id"`
   - **Unmounts** old `StickerCanvas` instance (cleans up Day 1 state)
   - **Mounts** new `StickerCanvas` instance with fresh state
   - Loads Day 2's placements from API
   - Stores them: `[...day1Placements, ...day2Placements]` (keeps Day 1's!)
   - Renders Day 2's stickers

3. **User Switches Back to Day 1**:
   - React unmounts Day 2's `StickerCanvas`
   - Mounts new Day 1 `StickerCanvas`
   - Loads Day 1's placements (already in store, but refreshes from API)
   - Renders Day 1's stickers (same as before!)

### Store Management
The global store maintains placements for ALL days:
```typescript
placements: [
  { id: 'p1', elementId: 'day-1-id', stickerId: 'cat-1', position: {x: 10, y: 20} },
  { id: 'p2', elementId: 'day-1-id', stickerId: 'cat-2', position: {x: 30, y: 40} },
  { id: 'p3', elementId: 'day-2-id', stickerId: 'cat-3', position: {x: 50, y: 60} },
  { id: 'p4', elementId: 'day-3-id', stickerId: 'cat-4', position: {x: 70, y: 80} },
]
```

Each `StickerCanvas` filters to show only its own:
```typescript
const elementPlacements = getElementPlacements(elementId);
// For Day 1: returns [p1, p2]
// For Day 2: returns [p3]
// For Day 3: returns [p4]
```

## Benefits of Key Prop Approach

### Pros
1. **Clean State**: Each day gets a fresh component instance with no stale state
2. **Predictable**: React's built-in remounting behavior is well-understood
3. **Simple**: No complex state synchronization logic needed
4. **Isolated**: Each day's stickers are completely independent

### Cons
1. **Performance**: Remounting is slightly more expensive than updating
2. **Lost State**: Any temporary UI state (drag position, animations) is reset

However, for this use case, the pros outweigh the cons because:
- Sticker data is persisted in the store and API
- Remounting ensures correct data is always displayed
- Performance impact is negligible (only happens on day switch)

## Alternative Approaches Considered

### 1. Deep useEffect Dependencies (Not Chosen)
```typescript
useEffect(() => {
  loadPlacements();
}, [elementId, day.id, day.places, placements.length]);
```
**Why not**: Too many dependencies, hard to reason about, potential infinite loops

### 2. Force Update on Day Change (Not Chosen)
```typescript
const [updateKey, setUpdateKey] = useState(0);
useEffect(() => {
  setUpdateKey(k => k + 1);
}, [day.id]);
```
**Why not**: Hacky, the `key` prop is the React-idiomatic way to achieve this

### 3. Separate Store Per Day (Not Chosen)
```typescript
const dayStores = {
  'day-1-id': { placements: [...] },
  'day-2-id': { placements: [...] },
};
```
**Why not**: Over-engineered, global store with filtering is simpler

## Testing Checklist

- [x] Add `key` prop to StickerCanvas in DayCard
- [x] Improve store update logging
- [ ] Test: Add sticker to Day 1, switch to Day 2, switch back → Day 1 sticker still there
- [ ] Test: Add sticker to Day 2, switch to Day 1 → Day 1 shows its own stickers, not Day 2's
- [ ] Test: Add multiple stickers to different days → each day shows only its own
- [ ] Test: Delete sticker from Day 1, switch to Day 2, switch back → sticker stays deleted
- [ ] Test: Move sticker on Day 1, switch to Day 2, switch back → position preserved
- [ ] Test: Rapid day switching → no crashes, correct stickers always shown

## Console Logs to Watch

When switching days, you should see:
```
🔄 StickerCanvas loading placements: { elementId: 'day-2-id', elementType: 'day', entityType: 'trip_day' }
✅ StickerCanvas loaded placements: 2
📊 Store update: { before: 3, after: 5, thisElement: 2, otherElements: 3 }
```

This shows:
- Loading placements for Day 2
- Found 2 placements for Day 2
- Store had 3 placements before (from other days)
- Store now has 5 placements total (3 from other days + 2 from Day 2)

## Related Files
- `frontend/src/components/kawaii/DayCard.tsx` - Added key prop
- `frontend/src/components/stickers/organisms/StickerCanvas.tsx` - Improved store update
- `frontend/src/stores/stickerStore.ts` - Global placement store
- `frontend/src/pages/ScheduleScreen.tsx` - Day selection logic

## Notes
- The `key` prop is a React best practice for forcing remounts when identity changes
- The store maintains placements for all days, not just the current one
- Each `StickerCanvas` is responsible for loading its own placements
- Placements are cached in the store to avoid redundant API calls
- The `getElementPlacements` function filters the global store by `elementId`
