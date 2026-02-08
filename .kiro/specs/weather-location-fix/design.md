# Design Document: Weather Location Fix

## Overview

This design addresses the weather forecast location determination issue by improving the robustness of the coordinate resolution logic. The current implementation attempts to geocode the destination name but fails when the destination is not recognized by the OpenWeather API. This design implements a multi-tier fallback strategy and improves error handling to ensure users receive clear feedback.

## Architecture

The fix involves modifications to the backend weather service and controller layers. No frontend changes are required beyond improved error message display, which already exists.

### Component Interaction Flow

```
User Request → Weather Controller → Weather Service → OpenWeather API
                      ↓                    ↓
                 Trip Database      Geocoding/Forecast
                      ↓                    ↓
                 Places Query        Coordinate Resolution
```

## Components and Interfaces

### 1. Weather Service (`weatherService.ts`)

**Current Issues:**
- Geocoding errors are not handled gracefully
- No retry logic or fallback mechanism
- Limited logging for debugging

**Design Changes:**

#### Enhanced Geocoding Method
```typescript
async geocodeLocation(locationName: string): Promise<{ lat: number; lng: number }>
```
- Add detailed error logging with location name
- Improve error messages to distinguish between API errors and location not found
- Add timeout handling (already exists but needs better error messages)

#### New Helper Method
```typescript
async getCoordinatesForTrip(tripId: string, destination: string): Promise<{ lat: number; lng: number; source: 'geocoded' | 'place' }>
```
- Encapsulates the multi-tier coordinate resolution logic
- First attempts geocoding the destination name
- Falls back to querying places from the database
- Returns both coordinates and the source for logging purposes

### 2. Weather Controller (`weatherController.ts`)

**Current Issues:**
- Duplicate coordinate resolution logic in `getWeatherForTrip` and `refreshWeather`
- Inconsistent error handling between the two methods
- Limited context in error messages

**Design Changes:**

#### Refactored Coordinate Resolution
- Extract coordinate resolution logic into a shared private method
- Use the new `weatherService.getCoordinatesForTrip()` method
- Improve error messages with specific guidance

#### Enhanced Error Responses
```typescript
// Error response structure
{
  error: string,           // User-friendly error message
  details?: string,        // Technical details for debugging
  suggestion?: string      // Actionable suggestion for the user
}
```

### 3. Database Query Optimization

**Current Query:**
```sql
SELECT p.lat, p.lng 
FROM places p
JOIN trip_days td ON p.trip_day_id = td.id
WHERE td.trip_id = $1 AND p.lat IS NOT NULL AND p.lng IS NOT NULL
ORDER BY td.day_number, p.created_at
LIMIT 1
```

**Design Decision:** Keep the existing query as it correctly:
- Filters for places with valid coordinates
- Orders by day number (earliest day first)
- Uses creation time as a tiebreaker
- Returns only the first result

## Data Models

No changes to existing data models. The solution works with:

**Trips Table:**
- `destination` (TEXT) - Used for geocoding
- `weather_data` (JSONB) - Stores cached weather forecast

**Places Table:**
- `lat` (DOUBLE PRECISION) - Latitude coordinate
- `lng` (DOUBLE PRECISION) - Longitude coordinate

**Trip Days Table:**
- `trip_id` (UUID) - Links places to trips
- `day_number` (INT) - Orders days chronologically

## Error Handling

### Error Scenarios and Responses

| Scenario | HTTP Status | Error Message | User Action |
|----------|-------------|---------------|-------------|
| No destination set | 400 | "Trip destination not set" | Set a destination for the trip |
| Geocoding fails + No places | 400 | "Unable to determine location for weather forecast. Please add a place with location coordinates." | Add a place with coordinates |
| API key missing | 503 | "Weather service unavailable. API key not configured." | Contact administrator |
| API key invalid | 503 | "Weather service unavailable. Invalid API key." | Contact administrator |
| API timeout | 500 | "Weather API request timeout. Please try again." | Retry the request |
| Rate limit exceeded | 429 | "Weather API rate limit exceeded. Please try again later." | Wait and retry |

### Logging Strategy

**Info Level:**
- Successful geocoding with coordinates
- Fallback to place coordinates with source
- Cache hits

**Warning Level:**
- Geocoding failures with destination name
- Missing coordinates requiring fallback

**Error Level:**
- API errors (invalid key, timeout, rate limit)
- Unexpected errors during coordinate resolution

## Implementation Strategy

### Phase 1: Improve Weather Service
1. Add detailed logging to `geocodeLocation()`
2. Improve error messages with context
3. Create `getCoordinatesForTrip()` helper method

### Phase 2: Refactor Weather Controller
1. Extract shared coordinate resolution logic
2. Update `getWeatherForTrip()` to use new helper
3. Update `refreshWeather()` to use new helper
4. Standardize error response format

### Phase 3: Testing
1. Test with valid destination names
2. Test with invalid destination names (fallback to places)
3. Test with no destination and no places (error case)
4. Test with missing API key
5. Test cache behavior

## Testing Strategy

### Unit Tests (Optional)
- Weather service geocoding with valid/invalid locations
- Coordinate resolution fallback logic
- Cache validation logic

### Integration Tests (Optional)
- End-to-end weather fetch with geocoding
- End-to-end weather fetch with place fallback
- Error scenarios (no coordinates available)

### Manual Testing
1. Create a trip with a well-known destination (e.g., "Paris")
   - Verify weather loads via geocoding
2. Create a trip with an obscure destination name
   - Add a place with coordinates
   - Verify weather loads via place fallback
3. Create a trip with no destination and no places
   - Verify clear error message is displayed
4. Test with invalid API key
   - Verify service unavailable error

## Performance Considerations

- **Geocoding API Calls:** Cached for 6 hours along with weather data
- **Database Queries:** Single query with proper indexing on `trip_days.trip_id`
- **Timeout Handling:** 5-second timeout prevents hanging requests
- **Cache Strategy:** Reduces API calls by 6-hour cache window

## Security Considerations

- API key stored in environment variables (not in code)
- No user input directly passed to external APIs (destination is from database)
- Rate limiting handled by OpenWeather API
- Error messages don't expose sensitive information

## Backward Compatibility

This fix is fully backward compatible:
- No database schema changes
- No API contract changes
- Existing cached weather data remains valid
- Frontend requires no modifications
