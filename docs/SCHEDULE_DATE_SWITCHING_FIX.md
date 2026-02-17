# Schedule Date Switching Fix

## Issue
When clicking different dates in the schedule page, the activity section "活動安排" was not switching to show the activities for the selected date. The activities from the first loaded day remained visible regardless of which date was selected.

## Root Cause
The `DayCard` component was initializing its `activities` state with `useState(day.places || [])` but never updating this state when the `day` prop changed.

**Flow:**
1. User loads schedule page → `DayCard` mounts with Day 1 data → `activities` state set to Day 1's places
2. User clicks Day 2 date → `ScheduleScreen` updates `selectedDate` → `selectedDay` computed from new date
3. `DayCard` receives new `day` prop with Day 2 data
4. **Problem**: `activities` state still contains Day 1's places because `useState` only runs on initial mount
5. Result: Day 2's header shows but Day 1's activities still display

## Solution
Added a `useEffect` hook to update the `activities` state whenever the `day` prop changes.

### Code Change
**File**: `frontend/src/components/kawaii/DayCard.tsx`

```typescript
export const DayCard: React.FC<DayCardProps> = ({
  day,
  tripId,
  onActivityClick,
  onActivityReorder,
  onActivityToggle,
  enableStickers = true,
  className = '',
}) => {
  const [activities, setActivities] = useState(day.places || []);

  // Update activities when day prop changes
  React.useEffect(() => {
    setActivities(day.places || []);
  }, [day.id, day.places]);

  // ... rest of component
```

### Why This Works
- `useEffect` runs whenever dependencies change (`day.id` or `day.places`)
- When user selects a different date, `selectedDay` changes in `ScheduleScreen`
- `DayCard` receives new `day` prop with different `day.id`
- `useEffect` triggers and updates `activities` state with new day's places
- Component re-renders with correct activities for selected date

### Dependencies Explained
- `day.id`: Ensures update when switching between different days
- `day.places`: Ensures update when activities are added/removed/reordered for the current day

## Testing
- [x] Click different dates in date selector
- [x] Verify activities section updates to show correct day's activities
- [x] Verify hotel section updates correctly
- [x] Verify route summary updates correctly
- [x] Verify day number in header updates correctly
- [ ] Test: Add activity to Day 1, switch to Day 2, switch back to Day 1 → new activity should appear
- [ ] Test: Reorder activities on Day 1, switch to Day 2, switch back → order should be preserved
- [ ] Test: Toggle activity completion on Day 1, switch to Day 2, switch back → completion state preserved

## Related Files
- `frontend/src/components/kawaii/DayCard.tsx` - Fixed component
- `frontend/src/pages/ScheduleScreen.tsx` - Parent component that manages date selection
- `frontend/src/components/kawaii/DateSelector.tsx` - Date selection UI component

## Alternative Approaches Considered

### 1. Remove Local State (Not Chosen)
Could have removed `activities` state entirely and used `day.places` directly:
```typescript
const activities = day.places || [];
```

**Why not chosen**: 
- Would lose optimistic updates during drag-and-drop reordering
- Would cause unnecessary re-renders during drag operations
- Local state allows smooth UX during async operations

### 2. Use Key Prop (Complementary)
Could force remount by adding `key={day.id}` to `DayCard`:
```typescript
<DayCard key={day.id} day={selectedDay} ... />
```

**Why not chosen as primary solution**:
- Would lose component state (scroll position, animation states, etc.)
- More expensive (full remount vs state update)
- Current solution is more surgical and efficient

## Notes
- The `activities` state is still necessary for optimistic updates during drag-and-drop
- The `handleReorder` function updates local state immediately for smooth UX
- The parent's `onActivityReorder` callback handles persistence to backend
- This pattern (local state + sync with props) is common for drag-and-drop interfaces
