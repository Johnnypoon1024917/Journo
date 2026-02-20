# Design Document: Country Recommendations

## Overview

The Country Recommendations feature provides travelers with curated destination suggestions based on their preferred travel month and weather preferences. This system uses a database-backed approach with pre-populated country data from trusted travel sources, implementing query-based filtering rather than AI generation. The feature integrates seamlessly with the existing BubbleQuest architecture, utilizing established patterns for hooks, services, and components.

### Key Design Decisions

1. **Database-First Approach**: All country data is pre-populated in PostgreSQL, ensuring fast queries and predictable results
2. **Client-Side Filtering**: Real-time filtering happens in the browser for instant feedback, with server-side queries for initial data loading
3. **No AI Generation**: Purely deterministic matching based on month and weather preferences
4. **Existing Pattern Integration**: Leverages useFormHandler, useDebouncedUpdate, and destinationService patterns
5. **Optional Geolocation**: Location-based prioritization is opt-in and gracefully degrades

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                           │
├─────────────────────────────────────────────────────────────┤
│  RecommendationSelector Component                            │
│    ├─ Month Selector (1-12)                                 │
│    ├─ Weather Preference (Warm/Cold/Any)                    │
│    └─ Optional: Geolocation Toggle                          │
│                                                              │
│  CountryCard Grid Component                                  │
│    ├─ Card Layout (responsive grid)                         │
│    ├─ Country Details Display                               │
│    └─ Best Months Badges                                    │
├─────────────────────────────────────────────────────────────┤
│  Hooks Layer                                                 │
│    ├─ useFormHandler (form state)                           │
│    ├─ useDebouncedUpdate (query debouncing)                 │
│    └─ useGeolocation (optional location)                    │
├─────────────────────────────────────────────────────────────┤
│  Services Layer                                              │
│    └─ destinationService (API calls)                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     Backend Layer                            │
├─────────────────────────────────────────────────────────────┤
│  Routes (routes/places.ts extension)                        │
│    ├─ GET /countries/recommendations                        │
│    └─ GET /countries/recommendations/:month                 │
│                                                              │
│  Controllers                                                 │
│    └─ CountryRecommendationController                       │
│         ├─ getRecommendations()                             │
│         └─ getRecommendationsByMonth()                      │
│                                                              │
│  Services                                                    │
│    └─ CountryRecommendationService                          │
│         ├─ queryCountries()                                 │
│         ├─ filterByMonth()                                  │
│         ├─ filterByWeather()                                │
│         └─ prioritizeByRegion()                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Database Layer                             │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL                                                  │
│    └─ countries table                                       │
│         ├─ id (PRIMARY KEY)                                 │
│         ├─ country_name (TEXT NOT NULL)                     │
│         ├─ best_months (INTEGER[] NOT NULL)                 │
│         ├─ temp_range (TEXT NOT NULL)                       │
│         ├─ avoid_months (INTEGER[])                         │
│         ├─ region (TEXT NOT NULL)                           │
│         ├─ description (TEXT NOT NULL)                      │
│         ├─ created_at (TIMESTAMP)                           │
│         └─ updated_at (TIMESTAMP)                           │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Input**: User selects month and weather preference in RecommendationSelector
2. **Form State Management**: useFormHandler manages form state and validation
3. **Debounced Query**: useDebouncedUpdate delays API call until user stops typing/selecting
4. **API Request**: destinationService sends GET request to backend with query parameters
5. **Database Query**: Backend queries countries table with month and weather filters
6. **Response**: Backend returns matching countries with all metadata
7. **Client-Side Filtering**: Frontend applies additional real-time filters as user adjusts preferences
8. **Display**: CountryCard grid renders results with responsive layout

### Optional Geolocation Flow

1. **Permission Request**: User opts into geolocation via toggle
2. **Location Detection**: useGeolocation hook detects user's coordinates
3. **Region Mapping**: Frontend maps coordinates to geographic region
4. **Priority Sorting**: Results are re-sorted to prioritize nearby regions
5. **Graceful Degradation**: If permission denied or unavailable, display results without prioritization

## Components and Interfaces

### Frontend Components

#### RecommendationSelector Component

```typescript
interface RecommendationSelectorProps {
  onSearch: (filters: RecommendationFilters) => void;
  isLoading?: boolean;
}

interface RecommendationFilters {
  month: number; // 1-12
  weatherPreference: 'Warm' | 'Cold' | 'Any';
  useGeolocation?: boolean;
}

// Component uses:
// - useFormHandler for form state
// - useDebouncedUpdate for query debouncing
// - useGeolocation for optional location detection
```

#### CountryCard Component

```typescript
interface CountryCardProps {
  country: CountryRecommendation;
  onSelect?: (country: CountryRecommendation) => void;
}

interface CountryRecommendation {
  id: string;
  country_name: string;
  best_months: number[];
  temp_range: string;
  avoid_months: number[];
  region: string;
  description: string;
}

// Component displays:
// - Country name and description
// - Temperature range
// - Best months as badges
// - Region tag
// - Optional: Distance indicator if geolocation enabled
```

#### CountryCardGrid Component

```typescript
interface CountryCardGridProps {
  countries: CountryRecommendation[];
  isLoading?: boolean;
  onCountrySelect?: (country: CountryRecommendation) => void;
}

// Responsive grid layout:
// - Mobile: 1 column
// - Tablet: 2 columns
// - Desktop: 3-4 columns
```

### Backend API Endpoints

#### GET /countries/recommendations

Query all countries with optional filters.

**Query Parameters:**
- `month` (optional): Integer 1-12
- `weather` (optional): 'warm' | 'cold' | 'any'
- `region` (optional): String region name

**Response:**
```typescript
{
  success: boolean;
  data: {
    countries: CountryRecommendation[];
    total: number;
  }
}
```

#### GET /countries/recommendations/:month

Get recommendations for a specific month.

**Path Parameters:**
- `month`: Integer 1-12

**Query Parameters:**
- `weather` (optional): 'warm' | 'cold' | 'any'

**Response:**
```typescript
{
  success: boolean;
  data: {
    countries: CountryRecommendation[];
    month: number;
  }
}
```

### Service Layer Interfaces

#### CountryRecommendationService

```typescript
class CountryRecommendationService {
  // Query countries from database
  async queryCountries(filters: QueryFilters): Promise<CountryRecommendation[]>;
  
  // Filter by month (checks best_months array)
  filterByMonth(countries: CountryRecommendation[], month: number): CountryRecommendation[];
  
  // Filter by weather preference
  filterByWeather(countries: CountryRecommendation[], preference: WeatherPreference): CountryRecommendation[];
  
  // Prioritize by region proximity
  prioritizeByRegion(countries: CountryRecommendation[], userRegion: string): CountryRecommendation[];
  
  // Check if month is in avoid_months
  isMonthAvoidable(country: CountryRecommendation, month: number): boolean;
}

interface QueryFilters {
  month?: number;
  weather?: 'warm' | 'cold' | 'any';
  region?: string;
  limit?: number;
  offset?: number;
}

type WeatherPreference = 'Warm' | 'Cold' | 'Any';
```

#### Frontend destinationService Extension

```typescript
// Extend existing destinationService.ts
class DestinationService {
  // ... existing methods ...
  
  // New methods for country recommendations
  static async getCountryRecommendations(
    filters: RecommendationFilters
  ): Promise<CountryRecommendation[]>;
  
  static async getCountryRecommendationsByMonth(
    month: number,
    weather?: WeatherPreference
  ): Promise<CountryRecommendation[]>;
}
```

## Data Models

### Database Schema

#### countries Table

```sql
CREATE TABLE countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_name TEXT NOT NULL,
  best_months INTEGER[] NOT NULL,
  temp_range TEXT NOT NULL,
  avoid_months INTEGER[],
  region TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for query performance
CREATE INDEX idx_countries_best_months ON countries USING GIN (best_months);
CREATE INDEX idx_countries_region ON countries (region);
CREATE INDEX idx_countries_avoid_months ON countries USING GIN (avoid_months);
```

**Field Descriptions:**
- `id`: Unique identifier (UUID)
- `country_name`: Full country name (e.g., "Japan", "France")
- `best_months`: Array of integers 1-12 representing optimal travel months
- `temp_range`: Human-readable temperature range (e.g., "20-30°C", "Cold (-5 to 5°C)")
- `avoid_months`: Array of integers 1-12 representing months to avoid
- `region`: Geographic region (e.g., "Asia", "Europe", "Americas", "Africa", "Oceania")
- `description`: Brief description of the destination (200-300 characters)
- `created_at`: Record creation timestamp
- `updated_at`: Record last update timestamp

**Data Constraints:**
- `best_months` must contain at least one month (1-12)
- `avoid_months` can be empty or contain months (1-12)
- `best_months` and `avoid_months` should not overlap
- `temp_range` follows format: "{min}-{max}°C" or descriptive text
- `region` must be one of: Asia, Europe, Americas, Africa, Oceania, Middle East

### Seed Data Structure

Seed data will be curated from:
- Frequent Miler (travel rewards and destination guides)
- Zicasso (luxury travel recommendations)
- TripShare (community travel insights)

**Example Seed Records:**

```typescript
const seedCountries = [
  {
    country_name: "Japan",
    best_months: [3, 4, 5, 10, 11],
    temp_range: "10-25°C",
    avoid_months: [7, 8],
    region: "Asia",
    description: "Experience cherry blossoms in spring or vibrant autumn foliage. Avoid humid summer months."
  },
  {
    country_name: "Iceland",
    best_months: [6, 7, 8],
    temp_range: "Cold (8-15°C)",
    avoid_months: [12, 1, 2],
    region: "Europe",
    description: "Midnight sun and accessible highlands in summer. Winter brings extreme cold and limited daylight."
  },
  {
    country_name: "Morocco",
    best_months: [3, 4, 5, 9, 10, 11],
    temp_range: "Warm (20-30°C)",
    avoid_months: [7, 8],
    region: "Africa",
    description: "Pleasant spring and fall weather. Summer heat can be extreme, especially inland."
  }
  // ... 47-97 more countries
];
```

### TypeScript Types

```typescript
// Shared type definitions
export interface CountryRecommendation {
  id: string;
  country_name: string;
  best_months: number[];
  temp_range: string;
  avoid_months: number[];
  region: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export type WeatherPreference = 'Warm' | 'Cold' | 'Any';

export type Region = 
  | 'Asia' 
  | 'Europe' 
  | 'Americas' 
  | 'Africa' 
  | 'Oceania' 
  | 'Middle East';

export interface RecommendationFilters {
  month?: number;
  weatherPreference?: WeatherPreference;
  region?: Region;
  useGeolocation?: boolean;
}

export interface RecommendationResponse {
  countries: CountryRecommendation[];
  total: number;
  filters: RecommendationFilters;
}
```

### Weather Classification Logic

Temperature ranges are classified as:
- **Warm**: temp_range contains "Warm" or temperature > 20°C
- **Cold**: temp_range contains "Cold" or temperature < 15°C
- **Moderate**: Everything else

```typescript
function classifyWeather(temp_range: string): 'Warm' | 'Cold' | 'Moderate' {
  const lower = temp_range.toLowerCase();
  
  if (lower.includes('warm') || lower.includes('hot')) {
    return 'Warm';
  }
  
  if (lower.includes('cold') || lower.includes('cool')) {
    return 'Cold';
  }
  
  // Parse numeric range
  const match = temp_range.match(/(\d+)-(\d+)/);
  if (match) {
    const avg = (parseInt(match[1]) + parseInt(match[2])) / 2;
    if (avg > 20) return 'Warm';
    if (avg < 15) return 'Cold';
  }
  
  return 'Moderate';
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Database Array Type Enforcement

*For any* country record insertion attempt, if best_months or avoid_months fields contain non-array values, the database SHALL reject the insertion, and if they contain array values of integers, the database SHALL accept the insertion.

**Validates: Requirements 1.2, 1.4**

### Property 2: Month Filtering Correctness

*For any* list of countries and any selected month (1-12), the filtered results SHALL include only countries where:
- The month is present in the best_months array, AND
- The month is NOT present in the avoid_months array

**Validates: Requirements 6.2, 7.3, 7.4**

### Property 3: Weather Filtering Correctness

*For any* list of countries and any weather preference:
- When preference is "Warm", all results SHALL have warm temperature classification
- When preference is "Cold", all results SHALL have cold temperature classification  
- When preference is "Any", all results matching month criteria SHALL be included regardless of temperature

**Validates: Requirements 6.3, 6.4, 6.5**

### Property 4: Seeded Data Completeness

*For all* countries in the database after seeding, each country SHALL have:
- A non-null, non-empty temp_range field
- A non-empty best_months array
- An avoid_months array (may be empty)
- A non-null region field from the valid region set

**Validates: Requirements 2.3, 2.4, 2.5, 2.6**

### Property 5: API Response Completeness

*For any* valid API query (month and weather preference), each country in the response SHALL include all metadata fields: country_name, best_months, temp_range, avoid_months, region, and description.

**Validates: Requirements 3.3**

### Property 6: API Error Handling

*For any* invalid API query (month < 1 or month > 12, or weather not in ['warm', 'cold', 'any']), the API SHALL return an error response with appropriate HTTP status code (400 Bad Request).

**Validates: Requirements 3.4**

### Property 7: Card Rendering Completeness

*For any* country recommendation, the rendered card SHALL display:
- The country_name
- The description text
- The temp_range
- The region
- Visual badges for each month in the best_months array

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 8: Filtering Determinism (Idempotence)

*For any* set of filter inputs (month, weather preference, country list), applying the filter function multiple times SHALL produce identical results each time.

**Validates: Requirements 7.5**

### Property 9: Geolocation Prioritization Preserves Filters

*For any* filtered country list and any user region, applying regional prioritization SHALL:
- Maintain the same set of countries (no additions or removals)
- Only reorder countries to prioritize nearby regions
- Preserve all month and weather filtering criteria

**Validates: Requirements 8.4**

### Property 10: Invalid Query Parameter Rejection

*For any* database insertion of a country record, if required fields (country_name, best_months, temp_range, region, description) are missing, the database SHALL reject the insertion with a constraint violation error.

**Validates: Requirements 1.4**

## Error Handling

### Database Errors

**Connection Failures:**
- Retry with exponential backoff (3 attempts)
- Log error details for debugging
- Return user-friendly error message
- Gracefully degrade to empty results if all retries fail

**Constraint Violations:**
- Validate data before insertion
- Return specific error messages indicating which constraint failed
- Log validation errors for monitoring
- Prevent partial data insertion (use transactions)

**Query Errors:**
- Validate query parameters before execution
- Return 400 Bad Request for invalid parameters
- Log query errors with sanitized parameters
- Provide helpful error messages to frontend

### API Errors

**Invalid Query Parameters:**
- Validate month is 1-12
- Validate weather is 'warm', 'cold', or 'any'
- Return 400 Bad Request with specific validation errors
- Include error details in response body

**Network Errors:**
- Implement retry logic with exponential backoff
- Cache previous results for offline fallback
- Display cached data with "offline" indicator
- Queue failed requests for retry when connection restored

**Server Errors (5xx):**
- Log full error details server-side
- Return generic error message to client
- Implement circuit breaker pattern for repeated failures
- Alert monitoring system for investigation

### Frontend Errors

**Geolocation Errors:**
- Handle permission denial gracefully
- Continue with default (non-prioritized) results
- Display optional message explaining geolocation benefits
- Never block core functionality on geolocation

**Rendering Errors:**
- Wrap components in error boundaries
- Display fallback UI for component errors
- Log errors to monitoring service
- Provide "retry" action for users

**Form Validation Errors:**
- Display inline validation messages
- Prevent submission of invalid data
- Highlight invalid fields clearly
- Provide helpful correction guidance

### Data Seeding Errors

**Source Data Issues:**
- Validate all fields before insertion
- Skip invalid records with warning logs
- Continue seeding remaining valid records
- Report summary of skipped records

**Duplicate Detection:**
- Check for existing country_name before insertion
- Update existing records instead of creating duplicates
- Log update operations for audit trail
- Maintain data consistency

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of month/weather filtering
- Edge cases (empty arrays, boundary months)
- Error conditions (invalid inputs, missing data)
- Integration points (API endpoints, database queries)
- Accessibility features (keyboard navigation, ARIA labels)

**Property-Based Tests** focus on:
- Universal properties across all inputs
- Filtering correctness for any month/weather combination
- Data completeness for any country record
- Deterministic behavior for any filter sequence
- API response structure for any valid query

### Property-Based Testing Configuration

**Testing Library:** fast-check (JavaScript/TypeScript property-based testing library)

**Test Configuration:**
- Minimum 100 iterations per property test
- Each test references its design document property
- Tag format: `Feature: country-recommendations, Property {number}: {property_text}`

**Example Property Test Structure:**

```typescript
import fc from 'fast-check';

describe('Feature: country-recommendations, Property 2: Month Filtering Correctness', () => {
  it('should only include countries where month is in best_months and not in avoid_months', () => {
    fc.assert(
      fc.property(
        fc.array(countryArbitrary),
        fc.integer({ min: 1, max: 12 }),
        (countries, month) => {
          const filtered = filterByMonth(countries, month);
          
          // All filtered countries must have month in best_months
          expect(filtered.every(c => c.best_months.includes(month))).toBe(true);
          
          // No filtered countries should have month in avoid_months
          expect(filtered.every(c => !c.avoid_months.includes(month))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing Strategy

**Database Layer Tests:**
- Test schema creation and constraints
- Test index creation and performance
- Test data insertion with valid/invalid data
- Test query performance with various filters

**API Layer Tests:**
- Test endpoint responses for valid queries
- Test error responses for invalid queries
- Test query parameter parsing
- Test response format consistency

**Service Layer Tests:**
- Test filtering logic with known datasets
- Test weather classification function
- Test region prioritization logic
- Test error handling and retries

**Component Tests:**
- Test RecommendationSelector rendering
- Test form state management
- Test debounced query triggering
- Test CountryCard rendering with various data
- Test CardGrid responsive layout
- Test keyboard navigation
- Test screen reader compatibility

**Integration Tests:**
- Test end-to-end flow from user input to display
- Test geolocation integration
- Test API integration with real endpoints
- Test offline fallback behavior

### Test Data Generators

For property-based testing, we need generators for:

```typescript
// Country record generator
const countryArbitrary = fc.record({
  id: fc.uuid(),
  country_name: fc.string({ minLength: 2, maxLength: 50 }),
  best_months: fc.array(fc.integer({ min: 1, max: 12 }), { minLength: 1, maxLength: 12 }),
  temp_range: fc.oneof(
    fc.constant('Warm (20-30°C)'),
    fc.constant('Cold (0-10°C)'),
    fc.constant('Moderate (15-25°C)')
  ),
  avoid_months: fc.array(fc.integer({ min: 1, max: 12 }), { maxLength: 12 }),
  region: fc.oneof(
    fc.constant('Asia'),
    fc.constant('Europe'),
    fc.constant('Americas'),
    fc.constant('Africa'),
    fc.constant('Oceania'),
    fc.constant('Middle East')
  ),
  description: fc.string({ minLength: 50, maxLength: 300 })
});

// Month generator
const monthArbitrary = fc.integer({ min: 1, max: 12 });

// Weather preference generator
const weatherArbitrary = fc.oneof(
  fc.constant('Warm'),
  fc.constant('Cold'),
  fc.constant('Any')
);
```

### Coverage Goals

- **Unit Test Coverage:** Minimum 80% code coverage
- **Property Test Coverage:** All 10 correctness properties implemented
- **Integration Test Coverage:** All critical user flows tested
- **Accessibility Test Coverage:** All WCAG 2.1 Level AA criteria verified

### Continuous Testing

- Run unit tests on every commit
- Run property tests on every pull request
- Run integration tests before deployment
- Run accessibility tests weekly
- Monitor test execution time and optimize slow tests
