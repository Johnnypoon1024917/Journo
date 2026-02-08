# Requirements Document

## Introduction

This document specifies requirements for fixing the weather forecast location determination issue in the Journo travel platform. Currently, users encounter errors when attempting to view weather forecasts because the system cannot reliably determine location coordinates from trip destination names. The system needs improved location resolution logic to ensure weather forecasts are consistently available.

## Glossary

- **Weather Service**: The backend service responsible for fetching weather data from OpenWeather API
- **Trip**: A user-created travel itinerary with destination, dates, and places
- **Place**: A specific location within a trip day that may include geographic coordinates
- **Geocoding**: The process of converting a location name into geographic coordinates (latitude/longitude)
- **Weather Controller**: The backend API endpoint handler for weather-related requests

## Requirements

### Requirement 1

**User Story:** As a trip planner, I want to see weather forecasts for my trip destination, so that I can prepare appropriately for my travel

#### Acceptance Criteria

1. WHEN a user views a trip with a valid destination name, THE Weather Service SHALL fetch and display weather forecast data
2. WHEN geocoding fails for the destination name, THE Weather Service SHALL attempt to use coordinates from the first place in the trip
3. IF both geocoding and place coordinates are unavailable, THEN THE Weather Controller SHALL return a clear error message indicating the user should add a place with location coordinates
4. THE Weather Service SHALL cache weather data for 6 hours to minimize API calls
5. WHEN cached weather data exists and is valid, THE Weather Controller SHALL return cached data without making external API calls

### Requirement 2

**User Story:** As a trip planner, I want clear feedback when weather data cannot be loaded, so that I understand what action to take

#### Acceptance Criteria

1. WHEN the Weather Service cannot determine location coordinates, THE Weather Controller SHALL return an error message that explains the issue
2. THE error message SHALL include actionable guidance such as "add a place with location coordinates"
3. WHEN the OpenWeather API key is missing or invalid, THE Weather Controller SHALL return a specific error indicating the service is unavailable
4. THE Weather Service SHALL log geocoding attempts and failures for debugging purposes

### Requirement 3

**User Story:** As a developer, I want the weather service to handle edge cases gracefully, so that the application remains stable

#### Acceptance Criteria

1. WHEN a trip has no destination set, THE Weather Controller SHALL return a 400 error with message "Trip destination not set"
2. WHEN geocoding times out, THE Weather Service SHALL fall back to place coordinates within 5 seconds
3. THE Weather Service SHALL handle API rate limits and return appropriate error messages
4. WHEN multiple places exist in a trip, THE Weather Service SHALL use coordinates from the earliest place by day number and creation time
