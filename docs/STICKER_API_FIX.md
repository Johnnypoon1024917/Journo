# Sticker API Fix & Weather Debug

## Issues Fixed

### 1. Sticker API Double `/api/` Prefix ✅

**Problem**: 
```
GET http://localhost:5000/api/api/trips/.../stickers 404 (Not Found)
```

The URL had a double `/api/api/` prefix causing 404 errors.

**Root Cause**:
- `API_BASE_URL` in `api.ts` already includes `/api`: `http://localhost:5000/api`
- `stickerService.ts` was adding another `/api/` prefix: `/api/trips/...`
- Result: `http://localhost:5000/api` + `/api/trips/...` = `/api/api/trips/...`

**Solution**:
Removed the `/api/` prefix from all endpoints in `stickerService.ts`:

**Before**:
```typescript
await api.get(`/api/trips/${tripId}/stickers`);
```

**After**:
```typescript
await api.get(`/trips/${tripId}/stickers`);
```

**Files Modified**:
- `frontend/src/services/stickerService.ts` - Fixed all 11 endpoints

**Endpoints Fixed**:
1. ✅ `GET /trips/{tripId}/stickers`
2. ✅ `GET /trips/{tripId}/stickers` (with category param)
3. ✅ `POST /trips/{tripId}/stickers`
4. ✅ `DELETE /trips/{tripId}/stickers/{stickerId}`
5. ✅ `POST /trips/{tripId}/stickers/generate`
6. ✅ `GET /trips/{tripId}/stickers/seasonal`
7. ✅ `GET /trips/{tripId}/sticker-placements`
8. ✅ `GET /trips/{tripId}/sticker-placements` (with element params)
9. ✅ `POST /trips/{tripId}/sticker-placements`
10. ✅ `PATCH /trips/{tripId}/sticker-placements/{placementId}`
11. ✅ `DELETE /trips/{tripId}/sticker-placements/{placementId}`

### 2. Weather Not Displaying in UI 🔍

**Problem**:
Weather data is fetched successfully but not showing in the WeatherWidget.

**Debug Steps Added**:
1. Added weather lookup logging to track date matching
2. Logs show:
   - Selected day date
   - Whether weather exists for that date
   - All available weather data keys
   - Sample weather data

**Console Logs to Check**:
```javascript
console.log('Weather lookup:', {
  selectedDayDate: '2026-03-03',
  hasWeatherForDate: true/false,
  weatherDataKeys: ['2026-03-03', '2026-03-04', ...],
  weatherSample: { temperature_high: 18, ... }
});
```

**Possible Causes**:
1. ✅ Date format mismatch (already fixed with timezone handling)
2. ⚠️ Weather data keys don't match selected day date
3. ⚠️ WeatherWidget not receiving forecast prop
4. ⚠️ Weather fetch completing after component render

**Next Steps**:
1. Check browser console for "Weather lookup:" logs
2. Verify `selectedDayDate` matches keys in `weatherDataKeys`
3. Check if `hasWeatherForDate` is true
4. If false, investigate date format mismatch

## Testing

### Sticker API Fix
1. Open Schedule screen
2. Check browser console
3. Should NOT see `/api/api/` errors
4. Sticker modal should load without errors

### Weather Display
1. Open Schedule screen
2. Check browser console for "Weather lookup:" logs
3. Verify weather data is present
4. Check if WeatherWidget displays data

## Files Modified

1. **frontend/src/services/stickerService.ts**
   - Removed `/api/` prefix from all 11 endpoints
   - Fixed double API path issue

2. **frontend/src/pages/ScheduleScreen.tsx**
   - Added weather lookup debug logging
   - Added useEffect to track weather matching

## Verification Checklist

### Sticker API
- [ ] No 404 errors for sticker endpoints
- [ ] Sticker modal loads successfully
- [ ] Can view stickers in modal
- [ ] Can attach stickers to days

### Weather Display
- [ ] Weather data fetches successfully
- [ ] Console shows weather lookup logs
- [ ] selectedDayDate matches weatherDataKeys
- [ ] hasWeatherForDate is true
- [ ] WeatherWidget displays temperature
- [ ] WeatherWidget shows location
- [ ] WeatherWidget shows condition

## Known Issues

### Weather Not Showing (Under Investigation)
If weather still doesn't show after the fix:

**Check 1: Date Format**
```javascript
// In console logs, verify:
selectedDayDate: "2026-03-03"  // ISO format
weatherDataKeys: ["2026-03-03", "2026-03-04"]  // Should match
```

**Check 2: Weather Data Structure**
```javascript
// Verify weather data has correct structure:
{
  date: "2026-03-03",
  temperature_high: 18,
  temperature_low: 8,
  condition: "Partly Cloudy",
  precipitation_probability: 20,
  icon: "partly cloudy"
}
```

**Check 3: Component Props**
```javascript
// Verify WeatherWidget receives forecast:
<WeatherWidget
  forecast={selectedDayWeather}  // Should not be undefined
  location={trip.destination}
  onLocationChange={handleWeatherLocationChange}
/>
```

## Additional Notes

### API Base URL Configuration
The API base URL is configured in `frontend/src/services/api.ts`:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

All service endpoints should be relative paths WITHOUT the `/api/` prefix:
- ✅ Correct: `/trips/${tripId}`
- ❌ Wrong: `/api/trips/${tripId}`

### Other Services to Check
If you encounter similar double `/api/` issues, check these services:
- tripService.ts
- dayService.ts
- placeService.ts
- authService.ts
- communityService.ts
- etc.

Most services are already correct, but stickerService was an outlier.

## Future Improvements

1. **Add API Path Validation**: Create a helper to ensure paths don't start with `/api/`
2. **Centralize Endpoint Definitions**: Define all endpoints in a constants file
3. **Add TypeScript Path Validation**: Use template literals with type checking
4. **Improve Error Messages**: Show full URL in error logs for easier debugging
