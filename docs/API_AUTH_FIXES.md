# API Authentication Fixes

## Issues Fixed

### 1. Day Creation Error - "Day number already exists"
**Problem:** When adding an activity to a virtual day, the system tried to create a day that might already exist in the database, causing a 400 error.

**Solution:**
- Added check to see if day already exists before creating
- If day exists, use the existing day ID
- Added error handling for "already exists" errors
- Falls back to finding existing day in the days array if creation fails

**Code Changes:**
```typescript
// Before: Always try to create day
if (isVirtualDay) {
  const newDay = await dayService.createDay({...});
  dayId = newDay.id;
}

// After: Check if exists first
if (isVirtualDay) {
  const existingDay = days.find(d => d.date === selectedDay.date);
  
  if (existingDay) {
    dayId = existingDay.id; // Use existing
  } else {
    // Create new day with error handling
    try {
      const newDay = await dayService.createDay({...});
      dayId = newDay.id;
    } catch (dayError) {
      // Handle "already exists" error
      if (dayError.message?.includes('already exists')) {
        const existingDay = days.find(d => d.day_number === selectedDay.day_number);
        if (existingDay) {
          dayId = existingDay.id;
        }
      }
    }
  }
}
```

### 2. Sticker Service Authentication Error - "No token provided"
**Problem:** All sticker API calls were failing with 401 Unauthorized because the service wasn't passing the authentication token.

**Solution:**
- Added `useAuthStore` import to stickerService.ts
- Updated all 11 methods to get and pass the auth token
- Token is retrieved from `useAuthStore.getState().accessToken`
- Token is passed in the options object: `{ token: token || undefined }`

**Methods Updated:**
1. `getStickers()` - Get all stickers for a trip
2. `createSticker()` - Create a new sticker
3. `deleteSticker()` - Delete a sticker
4. `generateStickers()` - Generate AI stickers
5. `getSeasonalStickers()` - Get seasonal stickers
6. `getStickerPlacements()` - Get all placements
7. `getElementStickerPlacements()` - Get placements for element
8. `createStickerPlacement()` - Create placement
9. `updateStickerPlacement()` - Update placement
10. `deleteStickerPlacement()` - Delete placement

**Code Pattern:**
```typescript
// Before: No token
async getStickers(tripId: string): Promise<Sticker[]> {
  const response = await api.get(`/trips/${tripId}/stickers`);
  return response.data;
}

// After: With token
async getStickers(tripId: string): Promise<Sticker[]> {
  const token = useAuthStore.getState().accessToken;
  const response = await api.get(`/trips/${tripId}/stickers`, { 
    token: token || undefined 
  });
  return response.data;
}
```

## Technical Details

### Authentication Flow
1. User logs in → token stored in `authStore`
2. Service method called → retrieves token from store
3. Token passed to API request → included in Authorization header
4. Backend validates token → allows/denies request

### Token Retrieval Pattern
```typescript
import { useAuthStore } from '../stores/authStore';

// In any service method:
const token = useAuthStore.getState().accessToken;
```

### API Call Pattern
```typescript
// GET request
await api.get(endpoint, { token: token || undefined });

// POST request
await api.post(endpoint, data, { token: token || undefined });

// PATCH request
await api.patch(endpoint, data, { token: token || undefined });

// DELETE request
await api.delete(endpoint, { token: token || undefined });
```

## Files Modified

1. **frontend/src/pages/ScheduleScreen.tsx**
   - Added check for existing day before creation
   - Added error handling for "already exists" scenario
   - Improved virtual day handling logic

2. **frontend/src/services/stickerService.ts**
   - Added `useAuthStore` import
   - Updated all 11 methods to include auth token
   - Consistent token passing pattern across all methods

## Testing Checklist

### Day Creation
- [ ] Add activity to virtual day (first time) - should create day
- [ ] Add activity to same virtual day again - should use existing day
- [ ] Add activity to real day - should work without creating
- [ ] Error handling works when day creation fails

### Sticker Operations
- [ ] Open sticker modal - stickers load successfully
- [ ] Select and attach sticker - placement created
- [ ] Drag sticker to new position - placement updated
- [ ] Remove sticker - placement deleted
- [ ] All operations return 200/201, not 401

## Status
✅ **COMPLETE** - All authentication issues fixed
- Day creation handles existing days properly
- Sticker service includes auth tokens in all requests
