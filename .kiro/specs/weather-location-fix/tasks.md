# Implementation Plan

- [x] 1. Enhance weather service with improved coordinate resolution
  - [x] 1.1 Add detailed logging to geocodeLocation method
    - Add console.log statements for geocoding attempts with location name
    - Log successful geocoding with returned coordinates
    - Improve error messages to include the location name that failed
    - _Requirements: 2.2, 2.4_
  
  - [x] 1.2 Create getCoordinatesForTrip helper method in weatherService
    - Write new method that accepts tripId and destination as parameters
    - Implement geocoding attempt as first strategy
    - Implement database query for place coordinates as fallback strategy
    - Return coordinates with source indicator ('geocoded' or 'place')
    - Add comprehensive logging for each resolution attempt
    - _Requirements: 1.1, 1.2, 1.3, 3.4_

- [x] 2. Refactor weather controller to use improved coordinate resolution
  - [x] 2.1 Extract shared coordinate resolution logic
    - Create private helper method in WeatherController class
    - Move coordinate resolution logic from getWeatherForTrip into helper
    - Ensure helper returns coordinates or throws descriptive error
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 2.2 Update getWeatherForTrip method
    - Replace inline coordinate resolution with call to helper method
    - Update error handling to use new error response structure
    - Add suggestion field to error responses with actionable guidance
    - Ensure proper error status codes (400 for client errors, 503 for service unavailable)
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1_
  
  - [x] 2.3 Update refreshWeather method
    - Replace inline coordinate resolution with call to helper method
    - Ensure consistent error handling with getWeatherForTrip
    - Add same error response structure and status codes
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3_

- [x] 3. Improve error handling and messages
  - [x] 3.1 Standardize error response format
    - Update all error responses to include error, details, and suggestion fields
    - Ensure API key errors return 503 status with clear message
    - Ensure timeout errors return 500 status with retry suggestion
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_
  
  - [x] 3.2 Add rate limit error handling
    - Catch rate limit errors from OpenWeather API
    - Return 429 status with appropriate message
    - _Requirements: 2.3, 3.3_

- [x] 4. Manual testing and verification
  - [x] 4.1 Test with valid destination names
    - Create test trip with well-known destination (e.g., "Paris", "Tokyo")
    - Verify weather loads successfully via geocoding
    - Check logs confirm geocoding was used
    - _Requirements: 1.1, 1.4, 1.5_
  
  - [x] 4.2 Test fallback to place coordinates
    - Create test trip with obscure or invalid destination name
    - Add a place with valid lat/lng coordinates
    - Verify weather loads successfully using place coordinates
    - Check logs confirm fallback was used
    - _Requirements: 1.2, 3.4_
  
  - [x] 4.3 Test error scenarios
    - Create trip with no destination and no places
    - Verify clear error message is returned
    - Test with missing/invalid API key (temporarily modify .env)
    - Verify service unavailable error is returned
    - _Requirements: 1.3, 2.1, 2.2, 2.3, 3.1_
