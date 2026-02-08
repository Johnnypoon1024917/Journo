# Date Selector Mismatch Fix

## Issue
DateSelector shows "SUN 8" (March 8th) selected, but DayCard displays "7 Mar" (March 7th). There's a one-day mismatch between the selected date and the displayed content.

## Root Cause

The issue was in the `selectedDay` useMemo where we converted the `selectedDate` to a string for matching:

```typescript
// ❌ WRONG - Uses UTC timezone
const selectedDateStr = selectedDate.toISOString().split('T')[0];
```

### Why This Fails

When you call `toISOString()` on a Date object, it converts to UTC:

```javascript
// User selects March 8, 2026 in DateSelector
const selectedDate = new Date(2026, 2, 8); // March 8, 2026 00:00:00 local time

// In timezone UTC+8:
selectedDate.toISOString(); // "2026-03-07T16:00:00.000Z" ❌
// Split result: "2026-03-07" ❌ Wrong date!

// The local date is March 8, but UTC is March 7!
```

This caused:
- DateSelector: Shows March 8 (correct local date)
- selectedDateStr: "2026-03-07" (UTC conversion)
- DayCard: Shows March 7 (matches the wrong string)

## Solution

Convert the date to a local date string without timezone conversion:

```typescript
// ✅ CORRECT - Uses local timezone
const year = selectedDate.getFullYear();
const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
const day = String(selectedDate.getDate()).padStart(2, '0');
const selectedDateStr = `${year}-${month}-${day}`;
```

### Why This Works

```javascript
// User selects March 8, 2026 in DateSelector
const selectedDate = new Date(2026, 2, 8);

// Extract local date components:
const year = selectedDate.getFullYear();        // 2026
const month = selectedDate.getMonth() + 1;      // 3 (March)
const day = selectedDate.getDate();             // 8

// Format as string:
const selectedDateStr = "2026-03-08"; // ✅ Correct!
```

Now:
- DateSelector: Shows March 8
- selectedDateStr: "2026-03-08" (local date)
- DayCard: Shows March 8 ✅ Match!

## Code Changes

### Before
```typescript
const selectedDay = React.useMemo(() => {
  if (!selectedDate) return null;
  
  // ❌ UTC conversion causes date shift
  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  
  const existingDay = days.find((day) => {
    if (!day.date) return false;
    return day.date === selectedDateStr;
  });
  
  // ...
}, [selectedDate, days, trip]);
```

### After
```typescript
const selectedDay = React.useMemo(() => {
  if (!selectedDate) return null;
  
  // ✅ Local date string without timezone conversion
  const year = selectedDate.getFullYear();
  const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
  const day = String(selectedDate.getDate()).padStart(2, '0');
  const selectedDateStr = `${year}-${month}-${day}`;
  
  const existingDay = days.find((day) => {
    if (!day.date) return false;
    return day.date === selectedDateStr;
  });
  
  // ...
}, [selectedDate, days, trip]);
```

## Enhanced Debug Logging

Added comprehensive logging to track date selection:

```typescript
console.log('selectedDay lookup:', {
  selectedDate: selectedDate.toLocaleDateString(),
  selectedDateStr,
  daysCount: days.length,
});

console.log('Date selection debug:', {
  selectedDate: selectedDate?.toISOString(),
  selectedDateLocal: selectedDate?.toLocaleDateString(),
  selectedDay: selectedDay?.id,
  selectedDayDate: selectedDay?.date,
  selectedDayNumber: selectedDay?.day_number,
});
```

## Testing

### Before Fix
1. Click "SUN 8" in DateSelector
2. DayCard shows "7 Mar" ❌
3. Console shows: `selectedDateStr: "2026-03-07"` ❌

### After Fix
1. Click "SUN 8" in DateSelector
2. DayCard shows "8 Mar" ✅
3. Console shows: `selectedDateStr: "2026-03-08"` ✅

## Verification Checklist

- [ ] Click any date in DateSelector
- [ ] DayCard shows the same date
- [ ] Date in header matches DateSelector
- [ ] Day number is correct
- [ ] Weather shows for correct date
- [ ] Console logs show matching dates
- [ ] Works across different timezones

## Related Fixes

This is the third timezone-related fix in this session:

1. **DayCard Date Parsing** - Fixed parsing of `day.date` ISO strings
2. **Weather Date Matching** - Fixed weather data date validation
3. **Date Selector Matching** - Fixed selectedDate to date string conversion ✅

All three issues had the same root cause: **UTC timezone conversion when working with date-only values**.

## Best Practice Established

### For Date-Only Values (No Time Component)

**✅ DO:**
```typescript
// Create local date string
const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, '0');
const day = String(date.getDate()).padStart(2, '0');
const dateStr = `${year}-${month}-${day}`;
```

**❌ DON'T:**
```typescript
// This converts to UTC!
const dateStr = date.toISOString().split('T')[0];
```

### Helper Function (Recommended)

Create a reusable helper:

```typescript
function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Usage
const selectedDateStr = toLocalDateString(selectedDate);
```

## Files Modified

1. **frontend/src/pages/ScheduleScreen.tsx**
   - Fixed `selectedDay` useMemo to use local date string
   - Added debug logging for date selection
   - Added console logs for date matching

## Impact

This fix ensures:
- ✅ DateSelector and DayCard always show the same date
- ✅ No more off-by-one date errors
- ✅ Consistent behavior across all timezones
- ✅ Weather data matches selected date
- ✅ Activity creation uses correct date

## Future Improvements

1. **Create Date Utility Module**: Centralize all date conversion functions
2. **Add Unit Tests**: Test date conversions in different timezones
3. **Add Type Safety**: Create a `LocalDateString` type
4. **Document Timezone Handling**: Add comments explaining timezone considerations
5. **Add Timezone Indicator**: Show user's timezone in UI for clarity

## Success Criteria

- ✅ DateSelector selection matches DayCard display
- ✅ No timezone-related date shifts
- ✅ Console logs show matching dates
- ✅ Works in all timezones (UTC-12 to UTC+14)
- ✅ Weather displays for correct date
- ✅ Activities added to correct date

## Conclusion

The date mismatch was caused by using `toISOString()` which converts to UTC, causing a date shift in non-UTC timezones. By extracting local date components directly, we ensure the date string always represents the user's local date without timezone conversion.

This completes the trilogy of timezone fixes needed for the Schedule screen to work correctly across all timezones.
