# Implementation Plan: Country Recommendations

## Overview

This implementation plan breaks down the Country Recommendations feature into discrete, incremental tasks. The feature provides database-backed destination suggestions based on travel month and weather preferences, integrating seamlessly with the existing BubbleQuest architecture.

## Tasks

- [ ] 1. Database schema and migration
  - [x] 1.1 Create countries table migration
    - Create migration file `backend/src/migrations/051_create_countries_table.sql`
    - Define table schema with id, country_name, best_months, temp_range, avoid_months, region, description, timestamps
    - Add GIN indexes on best_months and avoid_months arrays
    - Add B-tree index on region field
    - _Requirements: 1.1, 1.2, 1.5_
  
  - [ ]* 1.2 Write property test for database array type enforcement
    - **Property 1: Database Array Type Enforcement**
    - **Validates: Requirements 1.2, 1.4**
  
  - [ ]* 1.3 Write unit test for schema creation
    - Test migration runs successfully
    - Test indexes are created
    - _Requirements: 1.5_

- [ ] 2. Seed data preparation and loading
  - [x] 2.1 Create seed data file with 50-100 countries
    - Create `backend/src/scripts/seedCountries.ts`
    - Curate data from Frequent Miler, Zicasso, TripShare
    - Include all required fields for each country
    - Validate data structure before seeding
    - _Requirements: 2.1, 2.2_
  
  - [x] 2.2 Implement seed script execution
    - Add database insertion logic
    - Handle duplicate detection (update vs insert)
    - Add error handling and logging
    - Add npm script for seeding
    - _Requirements: 2.2_
  
  - [ ]* 2.3 Write property test for seeded data completeness
    - **Property 4: Seeded Data Completeness**
    - **Validates: Requirements 2.3, 2.4, 2.5, 2.6**

- [ ] 3. Backend service layer
  - [x] 3.1 Create CountryRecommendationService
    - Create `backend/src/services/countryRecommendationService.ts`
    - Implement queryCountries() method with database queries
    - Implement filterByMonth() method
    - Implement filterByWeather() method with temperature classification
    - Implement prioritizeByRegion() method
    - Add error handling and logging
    - _Requirements: 7.3, 7.4, 6.2, 6.3, 6.4, 8.2_
  
  - [ ]* 3.2 Write property test for month filtering correctness
    - **Property 2: Month Filtering Correctness**
    - **Validates: Requirements 6.2, 7.3, 7.4**
  
  - [ ]* 3.3 Write property test for weather filtering correctness
    - **Property 3: Weather Filtering Correctness**
    - **Validates: Requirements 6.3, 6.4, 6.5**
  
  - [ ]* 3.4 Write property test for filtering determinism
    - **Property 8: Filtering Determinism (Idempotence)**
    - **Validates: Requirements 7.5**
  
  - [ ]* 3.5 Write unit tests for service methods
    - Test queryCountries with various filters
    - Test weather classification function
    - Test error handling
    - _Requirements: 6.2, 6.3, 6.4, 6.5_

- [ ] 4. Backend API layer
  - [x] 4.1 Create CountryRecommendationController
    - Create `backend/src/controllers/countryRecommendationController.ts`
    - Implement getRecommendations() handler
    - Implement getRecommendationsByMonth() handler
    - Add query parameter validation
    - Add error response handling
    - _Requirements: 3.2, 3.3, 3.4, 3.5_
  
  - [x] 4.2 Extend routes/places.ts with country endpoints
    - Add GET /countries/recommendations route
    - Add GET /countries/recommendations/:month route
    - Wire up controller methods
    - Add authentication middleware
    - _Requirements: 3.1_
  
  - [ ]* 4.3 Write property test for API response completeness
    - **Property 5: API Response Completeness**
    - **Validates: Requirements 3.3**
  
  - [ ]* 4.4 Write property test for API error handling
    - **Property 6: API Error Handling**
    - **Validates: Requirements 3.4**
  
  - [ ]* 4.5 Write unit tests for API endpoints
    - Test valid query responses
    - Test invalid query error responses
    - Test response format
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

- [x] 5. Checkpoint - Backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Frontend service layer extension
  - [x] 6.1 Extend destinationService with country recommendation methods
    - Add getCountryRecommendations() method to `frontend/src/services/destinationService.ts`
    - Add getCountryRecommendationsByMonth() method
    - Implement caching strategy
    - Add retry logic with exponential backoff
    - Add error classification
    - _Requirements: 9.3_
  
  - [ ]* 6.2 Write unit tests for service methods
    - Test API calls with various parameters
    - Test caching behavior
    - Test error handling and retries
    - _Requirements: 3.3, 3.4_

- [ ] 7. Frontend TypeScript types
  - [x] 7.1 Create country recommendation types
    - Create `frontend/src/types/countryRecommendation.ts`
    - Define CountryRecommendation interface
    - Define WeatherPreference type
    - Define Region type
    - Define RecommendationFilters interface
    - Define RecommendationResponse interface
    - _Requirements: 3.5_

- [ ] 8. RecommendationSelector component
  - [x] 8.1 Create RecommendationSelector component
    - Create `frontend/src/components/destination/RecommendationSelector.tsx`
    - Implement month selector UI (1-12)
    - Implement weather preference selector (Warm/Cold/Any)
    - Implement optional geolocation toggle
    - Integrate useFormHandler for form state
    - Integrate useDebouncedUpdate for query debouncing
    - Integrate destinationService for API calls
    - Apply BubbleQuest theming
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 9.1, 9.2_
  
  - [ ]* 8.2 Write unit tests for RecommendationSelector
    - Test component rendering
    - Test form state management
    - Test debounced query triggering
    - Test geolocation toggle
    - _Requirements: 4.1, 4.2_

- [ ] 9. CountryCard component
  - [x] 9.1 Create CountryCard component
    - Create `frontend/src/components/destination/CountryCard.tsx`
    - Display country_name, description, temp_range, region
    - Render best_months as visual badges
    - Add optional distance indicator for geolocation
    - Apply BubbleQuest theming
    - Ensure keyboard accessibility
    - Add ARIA labels for screen readers
    - _Requirements: 5.2, 5.3, 5.6, 11.2_
  
  - [ ]* 9.2 Write property test for card rendering completeness
    - **Property 7: Card Rendering Completeness**
    - **Validates: Requirements 5.1, 5.2, 5.3**
  
  - [ ]* 9.3 Write unit tests for CountryCard
    - Test rendering with various country data
    - Test badge rendering for best_months
    - Test accessibility attributes
    - _Requirements: 5.2, 5.3, 11.2_

- [ ] 10. CountryCardGrid component
  - [x] 10.1 Create CountryCardGrid component
    - Create `frontend/src/components/destination/CountryCardGrid.tsx`
    - Implement responsive grid layout (1/2/3-4 columns)
    - Render CountryCard for each country
    - Add loading state
    - Add empty state
    - Apply BubbleQuest theming
    - Ensure keyboard navigation
    - _Requirements: 5.1, 5.4, 5.5, 5.6, 11.1_
  
  - [ ]* 10.2 Write unit tests for CountryCardGrid
    - Test grid rendering with various country counts
    - Test responsive layout at different viewports
    - Test keyboard navigation
    - Test loading and empty states
    - _Requirements: 5.1, 5.4, 5.5, 11.1_

- [ ] 11. Client-side filtering logic
  - [x] 11.1 Implement filtering utilities
    - Create `frontend/src/utils/countryFiltering.ts`
    - Implement filterByMonth() function
    - Implement filterByWeather() function
    - Implement classifyWeather() function
    - Implement prioritizeByRegion() function
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 8.2_
  
  - [ ]* 11.2 Write property test for geolocation prioritization
    - **Property 9: Geolocation Prioritization Preserves Filters**
    - **Validates: Requirements 8.4**
  
  - [ ]* 11.3 Write unit tests for filtering utilities
    - Test filterByMonth with edge cases
    - Test filterByWeather with various temp ranges
    - Test classifyWeather function
    - Test prioritizeByRegion logic
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 8.2_

- [x] 12. Checkpoint - Frontend components complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Integration and main page
  - [x] 13.1 Create country recommendations page
    - Create `frontend/src/pages/CountryRecommendations.tsx`
    - Integrate RecommendationSelector component
    - Integrate CountryCardGrid component
    - Implement real-time filtering on user input
    - Add error boundary
    - Add loading states
    - _Requirements: 6.6_
  
  - [x] 13.2 Add navigation to country recommendations
    - Add route to `frontend/src/App.tsx`
    - Add navigation link in main menu
    - Update navigation types
    - _Requirements: 9.5_
  
  - [ ]* 13.3 Write integration tests
    - Test end-to-end flow from input to display
    - Test real-time filtering updates
    - Test error handling
    - _Requirements: 6.6_

- [ ] 14. Accessibility enhancements
  - [x] 14.1 Add comprehensive accessibility features
    - Ensure all form controls have labels
    - Add focus indicators to all interactive elements
    - Verify color contrast ratios meet WCAG AA
    - Test keyboard navigation flow
    - Add skip links if needed
    - Test with screen reader
    - _Requirements: 11.1, 11.2, 11.3, 11.6_
  
  - [ ]* 14.2 Write accessibility tests
    - Test keyboard navigation
    - Test ARIA labels and roles
    - Test color contrast
    - Test focus indicators
    - _Requirements: 11.1, 11.2, 11.3, 11.6_

- [ ] 15. Responsive design verification
  - [x] 15.1 Test and refine responsive layouts
    - Test at 320px (mobile)
    - Test at 768px (tablet)
    - Test at 1024px (desktop)
    - Test at 1920px+ (large desktop)
    - Verify touch interactions on mobile
    - _Requirements: 11.4, 11.5_
  
  - [ ]* 15.2 Write responsive design tests
    - Test layout at various viewport sizes
    - Test touch interactions
    - _Requirements: 11.4, 11.5_

- [ ] 16. Optional: Python scraper for data updates
  - [ ] 16.1 Create Python scraper script
    - Create `backend/python_scraper/country_weather_scraper.py`
    - Implement weather API integration
    - Implement data parsing and validation
    - Add error handling and logging
    - _Requirements: 10.1, 10.2_
  
  - [ ] 16.2 Create scheduler for periodic updates
    - Add cron job configuration
    - Implement database update logic
    - Add error handling without breaking core functionality
    - Add logging for monitoring
    - _Requirements: 10.2, 10.3, 10.4_
  
  - [ ]* 16.3 Write unit tests for scraper
    - Test data parsing
    - Test database updates
    - Test error handling
    - Test core functionality without scheduler
    - _Requirements: 10.3, 10.4, 10.5_

- [x] 17. Final checkpoint - Complete feature verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The feature integrates with existing BubbleQuest patterns (useFormHandler, useDebouncedUpdate, destinationService)
- Backend uses TypeScript with PostgreSQL
- Frontend uses React with TypeScript
- Testing uses Jest and fast-check for property-based testing
