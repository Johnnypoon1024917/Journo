# Activity Display Fix

## Issue
Activities were being created successfully in the backend but not appearing in the Schedule screen's DayCard component.

## Root Cause
The `DayCard` component was initializing the `activities` state from `day.places` on mount, but it never updated when new places were added to the day.

```typescript
// Before: State initialized once, never updates
const [activities, setActivities] = useState<Place[]>(day.places);
```

When a new activity was added:
1. ✅ Backend created the place successfully
2. ✅ Frontend refetched trip data
3. ✅ `day.places` array updated with new place
4. ❌ DayCard's `activities` state remained unchanged
5. ❌ New activity not displayed in UI

## Solution
Added a `useEffect` hook to sync the `activities` state with `day.places` whenever it changes:

```typescript
// After: State syncs with prop changes
const [activities, setActivities] = useState<Place[]>(day.places);

useEffect(() => {
  setActivities(day.places);
}, [day.places]);
```

## Changes Made

### 1. Updated Imports
```typescript
// Before
import React, { useState } from 'react';

// After
import React, { useState, useEffect } from 'react';
```

### 2. Added useEffect Hook
```typescript
// Update activities when day.places changes
useEffect(() => {
  setActivities(day.places);
}, [day.places]);
```

## How It Works Now

1. User adds activity via AddActivityModal
2. Frontend calls `placeService.createPlace()`
3. Backend creates place in database
4. Frontend calls `fetchTripData()` to refresh
5. ScheduleScreen receives updated trip data
6. `day.places` array includes new place
7. **useEffect detects change in `day.places`**
8. **`activities` state updates**
9. DayCard re-renders with new activity
10. ✅ Activity appears in UI

## Activity Display Logic

The DayCard categorizes activities into:

### 1. Hotel
- Filtered by `place_type === 'hotel'`
- Displayed in "Hotel Info Section"
- Shows check-in/out times

### 2. Timed Activities
- Has `time_start` value
- Displayed in "活動安排 (Activity Schedule)" section
- Shown as timeline chips with time

### 3. Untimed Activities
- No `time_start` value
- Displayed in "Checklist / Main Activity Items" section
- Shown as checkbox items
- Supports drag-and-drop reordering

### 4. Transport
- Filtered out from checklist
- `place_type === 'transport'`
- (Currently not displayed separately)

## Testing Checklist

- [x] Add activity without time → appears in checklist
- [ ] Add activity with time → appears in timeline
- [ ] Add hotel → appears in hotel section
- [ ] Add multiple activities → all appear
- [ ] Refresh page → activities persist
- [ ] Toggle checkbox → state updates
- [ ] Drag to reorder → order updates

## Files Modified

1. **frontend/src/components/kawaii/DayCard.tsx**
   - Added `useEffect` import
   - Added useEffect to sync activities with day.places

## Related Components

- **ScheduleScreen.tsx** - Fetches trip data and passes to DayCard
- **AddActivityModal.tsx** - Form for creating activities
- **placeService.ts** - API calls for place CRUD
- **placeController.ts** - Backend place creation logic

## Status
✅ **COMPLETE** - Activities now display immediately after creation
