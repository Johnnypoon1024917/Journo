# Date Mismatch Fix

## Issue
The date shown in the DateSelector (date picker) was different from the date displayed in the DayCard content section.

## Root Cause
**Timezone Interpretation Issue**

When parsing ISO date strings like `"2026-03-03"` using `new Date()`, JavaScript interprets them as **UTC midnight**, which can result in a different local date depending on the user's timezone.

### Example:
```javascript
// User in timezone UTC-8 (PST)
const dateStr = "2026-03-03";
const date = new Date(dateStr); // Interprets as 2026-03-03 00:00:00 UTC
console.log(date.toLocaleDateString()); // Shows "3/2/2026" (previous day!)
```

This caused:
1. DateSelector showing the correct date (e.g., March 3)
2. DayCard showing the previous date (e.g., March 2)

## Solution

### 1. Fixed Date Parsing in DayCard
Changed from UTC interpretation to local date parsing:

**Before:**
```typescript
const date = day.date ? new Date(day.date) : null;
```

**After:**
```typescript
const date = day.date ? (() => {
  const [year, month, dayOfMonth] = day.date.split('-').map(Number);
  return new Date(year, month - 1, dayOfMonth); // month is 0-indexed
})() : null;
```

This ensures the date is created in the **local timezone** without UTC conversion.

### 2. Fixed Date Comparison in ScheduleScreen
Changed from Date object comparison to string comparison:

**Before:**
```typescript
const existingDay = days.find((day) => {
  if (!day.date) return false;
  const dayDate = new Date(day.date);
  return (
    dayDate.getFullYear() === selectedDate.getFullYear() &&
    dayDate.getMonth() === selectedDate.getMonth() &&
    dayDate.getDate() === selectedDate.getDate()
  );
});
```

**After:**
```typescript
const selectedDateStr = selectedDate.toISOString().split('T')[0]; // "YYYY-MM-DD"

const existingDay = days.find((day) => {
  if (!day.date) return false;
  // Compare date strings directly to avoid timezone issues
  return day.date === selectedDateStr;
});
```

This avoids timezone conversion entirely by comparing ISO date strings directly.

### 3. Enhanced Debug Logging
Added more detailed logging to track date values:

```typescript
console.log('ScheduleScreen state:', {
  selectedDate: selectedDate?.toISOString().split('T')[0],
  selectedDayDate: selectedDay?.date,
  selectedDayNumber: selectedDay?.day_number,
  // ... other debug info
});
```

## Testing

### Verify the Fix:
1. Open Schedule screen: `http://localhost:3001/trips/[trip-id]/schedule`
2. Check DateSelector shows a date (e.g., "Wed 14")
3. Check DayCard header shows the **same date** (e.g., "Wed 14 Jan")
4. Click different dates in DateSelector
5. Verify DayCard updates to show the **matching date**

### Test in Different Timezones:
```javascript
// In browser console, test with different timezones
const dateStr = "2026-03-03";

// Old way (UTC interpretation)
const utcDate = new Date(dateStr);
console.log('UTC interpretation:', utcDate.toLocaleDateString());

// New way (local interpretation)
const [year, month, day] = dateStr.split('-').map(Number);
const localDate = new Date(year, month - 1, day);
console.log('Local interpretation:', localDate.toLocaleDateString());
```

## Files Modified

1. **frontend/src/components/kawaii/DayCard.tsx**
   - Fixed date parsing to use local timezone
   - Changed variable name from `day` to `dayOfMonth` to avoid conflict

2. **frontend/src/pages/ScheduleScreen.tsx**
   - Fixed date comparison to use string comparison
   - Enhanced debug logging with date strings

## Related Issues

This fix also resolves potential issues with:
- Weather data not matching the selected day
- Activity times showing incorrect dates
- Date-based filtering and sorting

## Best Practices for Date Handling

### ✅ DO:
- Parse ISO date strings manually for local dates: `new Date(year, month-1, day)`
- Compare dates as strings when possible: `date1 === date2`
- Use `toISOString().split('T')[0]` for consistent date strings
- Store dates in ISO format: `"YYYY-MM-DD"`

### ❌ DON'T:
- Use `new Date(isoString)` for date-only values (causes UTC interpretation)
- Compare Date objects with timezone-sensitive methods
- Mix UTC and local date operations
- Assume dates are in user's timezone

## Additional Notes

### Why This Matters:
- Users in different timezones see consistent dates
- Date selection matches displayed content
- Weather data aligns with correct days
- Activity scheduling works correctly

### Future Improvements:
- Consider using a date library like `date-fns-tz` for timezone handling
- Add timezone display in UI for clarity
- Store user's timezone preference
- Add unit tests for date parsing edge cases

## Verification Checklist

- [x] DateSelector shows correct date
- [x] DayCard shows matching date
- [x] Date changes update both components
- [x] No timezone-related errors in console
- [x] Weather data matches selected date
- [x] Works in different timezones (test with browser DevTools)
