# Requirements Document

## Introduction

Journo is a responsive web-based travel planning and real-time journey sharing platform that enables users to create rich trip itineraries, share experiences through photos and videos, and engage with a community feed. The system is built with a self-hosted architecture using PostgreSQL database and Node.js/Express backend, deployable via Docker for full control and flexibility. The platform supports offline functionality through Progressive Web App capabilities and integrates Google Maps for location services. The platform combines personal trip planning with social features, allowing users to share their journeys in real-time and discover trips from the community.

## Glossary

- **Journo System**: The complete travel planning and sharing platform including responsive web interface, PWA capabilities, and self-hosted backend services
- **Trip**: A travel itinerary containing multiple days, places, and associated media
- **Journey Feed**: A real-time timeline of photos, videos, and notes associated with a specific trip
- **Community Feed**: A public social feed displaying trips shared by all users
- **Story Item**: An individual piece of content (photo, YouTube video, or note) in a journey feed
- **Share Token**: A unique identifier used to generate public links for trip sharing
- **Offline Mode**: Application state where functionality continues without internet connectivity
- **PWA**: Progressive Web App - a web application that can be installed and used like a native app
- **Responsive Design**: A web design approach that ensures optimal viewing and interaction across a wide range of devices and screen sizes
- **Place**: A location within a trip itinerary with associated details (time, notes, photos, stickers)
- **Sticker**: A visual icon that can be attached to places in an itinerary
- **Theme**: A visual styling preset that changes colors and icons throughout a trip
- **Badge**: An achievement earned by users based on their trip activities
- **RLS**: Row Level Security - database-level access control policies
- **Budget Tracker**: A feature that tracks expenses per place and calculates daily and total trip costs
- **Packing List**: A checklist of items to bring on a trip, with smart suggestions based on destination
- **Transport Mode**: The method of travel between places (driving, walking, transit, flight)
- **Trip Version**: A snapshot of trip data at a point in time for undo/redo functionality
- **Collaborator Role**: A permission level assigned to users who can access a trip (Owner, Editor, Viewer)
- **Admin Portal**: A backend dashboard for system monitoring, user management, and content moderation
- **Analytics Event**: A tracked user action or system occurrence for measuring platform usage
- **DAU/MAU**: Daily Active Users / Monthly Active Users - key metrics for platform engagement

## Requirements

### Requirement 1: User Authentication and Profile Management

**User Story:** As a user, I want to create an account and manage my profile, so that I can save my trips and participate in the community.

#### Acceptance Criteria

1. THE Journo System SHALL provide user registration through email and password
2. THE Journo System SHALL provide user authentication through Supabase Auth
3. THE Journo System SHALL display a profile page showing the user's trips, earned badges, and account settings
4. THE Journo System SHALL allow users to log out from the settings page
5. THE Journo System SHALL persist user authentication state across sessions

### Requirement 2: Trip Creation and Management

**User Story:** As a user, I want to create and edit trip itineraries with multiple days and places, so that I can plan my travels in detail.

#### Acceptance Criteria

1. WHEN a user clicks the create trip button, THE Journo System SHALL display a trip creation form accepting title, destination, start date, end date, and cover image
2. THE Journo System SHALL allow users to select from five theme options (Default, Adventure, Romantic, Foodie, Chill) that modify visual styling
3. THE Journo System SHALL enable users to add multiple days to a trip with associated dates
4. THE Journo System SHALL enable users to add places to each day with name, address, coordinates, time range, notes, image, type, and sticker
5. THE Journo System SHALL validate that place types are one of: attraction, food, hotel, transport, or other
6. THE Journo System SHALL allow users to edit all trip details after creation
7. THE Journo System SHALL allow users to delete trips they own
8. THE Journo System SHALL display a list of all trips owned by the authenticated user on the home screen

### Requirement 3: Location Services and Mapping

**User Story:** As a user, I want to search for locations and view them on a map, so that I can accurately plan my trip route.

#### Acceptance Criteria

1. WHEN a user adds a place to their itinerary, THE Journo System SHALL provide Google Places Autocomplete for location search
2. WHEN a user selects a location from autocomplete, THE Journo System SHALL capture the place name, address, latitude, and longitude
3. THE Journo System SHALL display an interactive Google Map showing all places in a trip as pins
4. WHEN a user clicks a map pin, THE Journo System SHALL display the place details
5. THE Journo System SHALL optionally display route lines connecting places in chronological order on the map

### Requirement 4: Visual Customization

**User Story:** As a user, I want to customize my trip with stickers and themes, so that my itinerary reflects the personality of my journey.

#### Acceptance Criteria

1. THE Journo System SHALL provide at least 15 sticker options including icons for pizza, plane, heart, and other travel-related symbols
2. THE Journo System SHALL allow users to attach one sticker to each place in their itinerary
3. WHEN a user selects a theme, THE Journo System SHALL apply theme-specific colors and icons throughout the trip interface
4. THE Journo System SHALL generate a cover image using the first uploaded photo with destination text overlay
5. THE Journo System SHALL allow users to upload a custom cover image

### Requirement 5: Journey Feed and Rich Media

**User Story:** As a user, I want to add photos, YouTube videos, and notes to my trip, so that I can document my journey as it happens.

#### Acceptance Criteria

1. THE Journo System SHALL allow users to upload photos from camera or gallery to their trip
2. WHEN a user uploads a photo, THE Journo System SHALL store it in Supabase Storage and create a story item record
3. THE Journo System SHALL allow users to paste YouTube URLs and extract the video ID for embedding
4. THE Journo System SHALL allow users to add text notes as story items
5. THE Journo System SHALL display all story items in chronological order in a timeline-style journey feed
6. THE Journo System SHALL allow users to add captions to photos and videos
7. THE Journo System SHALL validate that story item types are one of: photo, youtube, or note

### Requirement 6: Real-Time Trip Sharing

**User Story:** As a user, I want to share my trip with others via a public link, so that friends and family can follow my journey in real-time.

#### Acceptance Criteria

1. WHEN a trip is created, THE Journo System SHALL generate a unique share token for the trip
2. THE Journo System SHALL provide a public URL in the format `/t/:token` for accessing shared trips
3. THE Journo System SHALL allow users to toggle trip visibility between public and private
4. WHEN a trip is public, THE Journo System SHALL allow anyone with the link to view the trip without authentication
5. THE Journo System SHALL update shared trip views in real-time using Supabase Realtime when the owner makes changes
6. THE Journo System SHALL increment the view count when a user accesses a shared trip
7. THE Journo System SHALL provide sharing options for WhatsApp, email, and copy link

### Requirement 7: QR Code Sharing

**User Story:** As a user, I want to generate a QR code for my trip, so that others can quickly access it by scanning with their phone.

#### Acceptance Criteria

1. THE Journo System SHALL generate a QR code containing the public trip URL
2. WHEN a user clicks the QR code button, THE Journo System SHALL display the QR code in a modal
3. THE Journo System SHALL allow users to download the QR code as an image file
4. WHEN a QR code is scanned, THE Journo System SHALL navigate to the shared trip view

### Requirement 8: Community Feed and Social Features

**User Story:** As a user, I want to browse trips shared by other users and interact with them, so that I can discover travel inspiration and connect with the community.

#### Acceptance Criteria

1. THE Journo System SHALL provide a toggle to post trips to the community feed
2. WHEN a trip is posted to community, THE Journo System SHALL set the is_community flag to true
3. THE Journo System SHALL display all community trips in a scrollable feed on the community tab
4. THE Journo System SHALL display each community trip with cover photo, title, destination, like count, and view count
5. THE Journo System SHALL allow authenticated users to like community trips
6. WHEN a user likes a trip, THE Journo System SHALL increment the likes_count and create a trip_likes record
7. THE Journo System SHALL prevent users from liking the same trip multiple times
8. THE Journo System SHALL provide a "Copy Itinerary" button that clones a community trip to the user's own trips
9. THE Journo System SHALL display the top 3 story items from each community trip in the feed
10. THE Journo System SHALL allow users to search community trips by destination, theme, or hashtag

### Requirement 9: Offline Functionality

**User Story:** As a user, I want to create and edit trips without internet connectivity, so that I can use the app anywhere during my travels.

#### Acceptance Criteria

1. THE Journo System SHALL store all trip data in browser localStorage for offline access
2. WHEN the device loses internet connectivity, THE Journo System SHALL display an "Offline" badge in the UI
3. WHILE offline, THE Journo System SHALL allow users to create new trips, edit existing trips, and add places
4. WHILE offline, THE Journo System SHALL allow users to view all previously loaded trips
5. WHEN internet connectivity is restored, THE Journo System SHALL synchronize all offline changes to Supabase
6. THE Journo System SHALL handle conflicts when syncing offline changes with server data
7. WHILE offline, THE Journo System SHALL queue photo uploads for processing when connectivity returns

### Requirement 10: Dark Mode

**User Story:** As a user, I want to toggle between light and dark themes, so that I can use the app comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Journo System SHALL provide a dark mode toggle in the settings page
2. WHEN a user toggles dark mode, THE Journo System SHALL apply dark theme styling to all UI components
3. THE Journo System SHALL persist the dark mode preference in localStorage
4. WHEN the app loads, THE Journo System SHALL apply the user's saved dark mode preference
5. THE Journo System SHALL respect the system dark mode preference if no user preference is saved
6. THE Journo System SHALL implement dark mode using Tailwind CSS dark class on the HTML element

### Requirement 11: Badge System

**User Story:** As a user, I want to earn badges for my travel activities, so that I can track my achievements and share my accomplishments.

#### Acceptance Criteria

1. WHEN a user uploads a photo with timestamp after 6 PM, THE Journo System SHALL award the "Golden Hour" badge
2. WHEN a user adds 10 places with type "food" across all trips, THE Journo System SHALL award the "Food Explorer" badge
3. WHEN a user adds a place with start time before 9 AM, THE Journo System SHALL award the "Early Bird" badge
4. THE Journo System SHALL display earned badges on the user's profile page
5. THE Journo System SHALL store badge records with user_id, trip_id, badge_type, and earned_at timestamp

### Requirement 12: Export and Sharing Options

**User Story:** As a user, I want to export my trip as a PDF, so that I can print or share it outside the app.

#### Acceptance Criteria

1. THE Journo System SHALL provide a PDF export button for each trip
2. WHEN a user exports a trip, THE Journo System SHALL generate a PDF containing the itinerary, map snapshot, and top 3 photos
3. THE Journo System SHALL format the PDF with trip title, dates, destination, and all places with details
4. THE Journo System SHALL allow users to download the generated PDF file

### Requirement 13: Responsive Web Design

**User Story:** As a user, I want to access Journo on any device through a responsive web interface, so that I can use the platform seamlessly on desktop, tablet, and mobile browsers.

#### Acceptance Criteria

1. THE Journo System SHALL function as a web application accessible through modern browsers
2. THE Journo System SHALL be installable as a Progressive Web App with offline capabilities
3. THE Journo System SHALL provide a responsive design that adapts to screen sizes from 320px to 1920px width
4. THE Journo System SHALL optimize touch interactions for mobile devices with appropriate button sizes and spacing
5. THE Journo System SHALL provide mobile-optimized navigation with collapsible menus and touch-friendly controls
6. THE Journo System SHALL use browser localStorage for consistent offline storage across devices

### Requirement 14: Performance and Accessibility

**User Story:** As a user, I want the app to load quickly and be accessible, so that I can use it efficiently regardless of my connection speed or abilities.

#### Acceptance Criteria

1. THE Journo System SHALL load the initial page in less than 2 seconds on 3G network connections
2. THE Journo System SHALL lazy-load images to improve page load performance
3. THE Journo System SHALL provide ARIA labels for all interactive elements
4. THE Journo System SHALL support full keyboard navigation
5. THE Journo System SHALL maintain a web application bundle size under 15MB
6. THE Journo System SHALL maintain a native application size under 50MB

### Requirement 15: Data Security and Access Control

**User Story:** As a user, I want my private trips to remain secure, so that only I and people I share with can access them.

#### Acceptance Criteria

1. THE Journo System SHALL implement Row Level Security policies in Supabase
2. THE Journo System SHALL allow trip owners to perform all operations (read, update, delete) on their own trips
3. WHEN a trip is marked as public, THE Journo System SHALL allow any user to view the trip
4. WHEN a trip is marked as community, THE Journo System SHALL display the trip in the community feed
5. THE Journo System SHALL allow only authenticated users to create trip likes
6. THE Journo System SHALL prevent users from accessing private trips they do not own
7. THE Journo System SHALL store uploaded photos in Supabase Storage with appropriate access policies

### Requirement 16: Budget Tracking

**User Story:** As a user, I want to track expenses for each place and monitor my total trip budget, so that I can manage my travel spending effectively.

#### Acceptance Criteria

1. WHEN creating a trip, THE Journo System SHALL allow users to set a total budget amount and currency code
2. THE Journo System SHALL support at least 20 major currency codes including USD, EUR, GBP, JPY, and AUD following ISO 4217 standard
3. WHEN adding a place, THE Journo System SHALL allow users to enter a cost amount and optionally a different currency
4. THE Journo System SHALL categorize place costs into accommodation, food, transport, activities, shopping, or misc categories
5. THE Journo System SHALL calculate daily budget by dividing total budget by number of trip days
6. THE Journo System SHALL calculate and display the total spent amount across all places in a trip
7. THE Journo System SHALL calculate and display the remaining budget by subtracting total spent from total budget
8. THE Journo System SHALL display a budget breakdown showing costs per day
9. WHEN total spent exceeds 80 percent of total budget, THE Journo System SHALL display a yellow warning indicator
10. WHEN total spent exceeds 100 percent of total budget, THE Journo System SHALL display a red alert indicator with overspend amount
11. THE Journo System SHALL display budget summary with visual progress bar showing percentage spent
12. THE Journo System SHALL display a category breakdown showing spending by accommodation, food, transport, activities, shopping, and misc
13. THE Journo System SHALL integrate with Frankfurter API to fetch live currency exchange rates
14. WHEN a place cost is in a different currency, THE Journo System SHALL automatically convert it to the trip currency using live rates
15. THE Journo System SHALL cache currency exchange rates for 24 hours to reduce API calls
16. WHEN offline, THE Journo System SHALL use the last known exchange rate for currency conversion
17. THE Journo System SHALL allow users to enter negative costs for refunds
18. THE Journo System SHALL provide an option to add tip percentage (10%, 15%, 20%) to food costs
19. THE Journo System SHALL allow users to mark costs as split among multiple travelers
20. THE Journo System SHALL export budget summary as PDF including pie chart and daily breakdown
21. THE Journo System SHALL export budget data as CSV with columns for date, category, place, cost, and currency
22. THE Journo System SHALL provide a shareable link to view budget summary at `/t/:token?tab=budget`

### Requirement 17: Smart Packing List

**User Story:** As a user, I want a packing checklist with smart suggestions, so that I don't forget essential items for my trip.

#### Acceptance Criteria

1. THE Journo System SHALL provide a packing list feature for each trip
2. WHEN a trip is created with destination and dates, THE Journo System SHALL automatically generate a packing list with suggested items
3. THE Journo System SHALL categorize packing items into essentials, clothing, toiletries, electronics, documents, health, activities, and misc categories
4. THE Journo System SHALL use rule-based logic to suggest items based on destination type (beach, city, mountain, winter)
5. THE Journo System SHALL use weather forecast data to suggest weather-appropriate items (sunscreen for hot weather, jacket for cold)
6. THE Journo System SHALL suggest items based on trip duration (extra underwear for trips over 7 days)
7. THE Journo System SHALL analyze trip itinerary for activity keywords (hiking, swimming, business) and suggest relevant items
8. WHEN destination is Japan, THE Journo System SHALL suggest travel adapter Type A/B and JR Pass
9. WHEN maximum temperature exceeds 30 degrees Celsius, THE Journo System SHALL suggest sunscreen SPF50 and hat
10. WHEN trip itinerary includes hiking activities, THE Journo System SHALL suggest hiking boots and water bottle
11. THE Journo System SHALL allow users to add custom packing items with text descriptions and category selection
12. THE Journo System SHALL allow users to mark packing items as checked or unchecked with toggle interaction
13. THE Journo System SHALL display packing list progress with visual progress bar showing percentage of items checked
14. THE Journo System SHALL display item count as checked/total format (e.g., 18/28 items)
15. THE Journo System SHALL group packing items by category in an accordion interface
16. THE Journo System SHALL display visual tags indicating auto-suggested items versus custom items
17. THE Journo System SHALL display emoji icons for each category (briefcase for essentials, shirt for clothing, etc.)
18. THE Journo System SHALL allow trip collaborators with Editor role to add and check packing items
19. THE Journo System SHALL sync packing list changes in real-time using Supabase Realtime
20. THE Journo System SHALL store packing list data in browser localStorage for offline access
21. WHEN offline, THE Journo System SHALL allow users to check and add packing items with sync on reconnect
22. THE Journo System SHALL merge packing list conflicts using last-write-wins strategy when syncing offline changes
23. THE Journo System SHALL export packing list as PDF with categories and checkbox layout
24. THE Journo System SHALL provide a shareable link to view packing list at `/t/:token?tab=packing`
25. THE Journo System SHALL provide a print-friendly view of the packing list
26. WHEN packing list exceeds 50 items, THE Journo System SHALL display a suggestion to consider a smaller bag
27. THE Journo System SHALL detect and merge duplicate items with similar names (T-shirt and Tshirt)
28. THE Journo System SHALL allow users to add multiple travelers and generate traveler-specific packing suggestions
29. WHEN trip includes children or babies, THE Journo System SHALL suggest age-appropriate items (diapers, toys, formula)

### Requirement 18: Weather Integration

**User Story:** As a user, I want to see weather forecasts for my trip dates, so that I can pack appropriately and plan activities.

#### Acceptance Criteria

1. WHEN a trip has a destination and dates set, THE Journo System SHALL fetch a 7-day weather forecast using OpenWeather API
2. THE Journo System SHALL display weather forecast data including temperature, conditions, and precipitation probability
3. THE Journo System SHALL cache weather data in the trip record to reduce API calls
4. THE Journo System SHALL refresh weather data when the trip is viewed and cached data is older than 6 hours
5. THE Journo System SHALL display weather icons and temperature for each day in the trip itinerary
6. WHEN weather data is unavailable, THE Journo System SHALL display a message indicating forecast is not available

### Requirement 19: Travel Time Calculation

**User Story:** As a user, I want to see estimated travel time between places, so that I can plan realistic itineraries.

#### Acceptance Criteria

1. WHEN a place is added to a trip day, THE Journo System SHALL calculate travel time from the previous place using Google Directions API
2. THE Journo System SHALL determine transport mode automatically based on distance (walking under 2km, driving otherwise)
3. THE Journo System SHALL allow users to manually select transport mode from driving, walking, transit, or flight options
4. THE Journo System SHALL display travel time and distance between consecutive places in the itinerary
5. THE Journo System SHALL display total travel time for each day
6. THE Journo System SHALL update travel time calculations when place order or locations change
7. WHEN transport mode is flight, THE Journo System SHALL display flight icon without calculating driving time

### Requirement 20: Offline Maps and Navigation

**User Story:** As a user, I want to download trip maps for offline use, so that I can navigate without internet connectivity.

#### Acceptance Criteria

1. THE Journo System SHALL provide a download button to cache map tiles for the trip area
2. WHEN a user downloads offline maps, THE Journo System SHALL store map tiles using Google Maps SDK offline capabilities
3. WHILE offline, THE Journo System SHALL display cached map tiles for the trip area
4. THE Journo System SHALL provide turn-by-turn navigation to places using cached map data when offline
5. THE Journo System SHALL indicate when offline maps are available for a trip
6. THE Journo System SHALL allow users to delete downloaded maps to free storage space

### Requirement 21: Collaboration and Permissions

**User Story:** As a trip owner, I want to invite collaborators with different permission levels, so that I can control who can edit my trip.

#### Acceptance Criteria

1. THE Journo System SHALL support three collaborator roles: Owner, Editor, and Viewer
2. THE Journo System SHALL allow trip owners to invite collaborators by email or share link
3. WHEN a user has Owner role, THE Journo System SHALL allow full access to edit, delete, and manage collaborators
4. WHEN a user has Editor role, THE Journo System SHALL allow editing trip details, places, and story items but not deleting the trip
5. WHEN a user has Viewer role, THE Journo System SHALL allow read-only access to the trip
6. THE Journo System SHALL display collaborator list with roles on the trip settings page
7. THE Journo System SHALL allow owners to change collaborator roles or remove collaborators
8. THE Journo System SHALL prevent editors and viewers from modifying collaborator permissions

### Requirement 22: Version History and Undo

**User Story:** As a user, I want to undo changes and restore previous versions of my trip, so that I can recover from accidental edits or deletions.

#### Acceptance Criteria

1. WHEN a trip is modified, THE Journo System SHALL create a version snapshot containing the complete trip state
2. THE Journo System SHALL store the last 5 versions of each trip
3. THE Journo System SHALL provide an undo button that reverts to the previous version
4. THE Journo System SHALL provide a redo button that reapplies an undone change
5. THE Journo System SHALL display a version history list showing timestamp and change description for each version
6. THE Journo System SHALL allow users to restore any of the last 5 versions
7. WHEN a version is restored, THE Journo System SHALL create a new version snapshot of the current state before restoring

### Requirement 23: Enhanced Place Notes

**User Story:** As a user, I want to add rich notes with checklists to places, so that I can track important details and tasks for each location.

#### Acceptance Criteria

1. THE Journo System SHALL provide a rich text editor for place notes
2. THE Journo System SHALL support text formatting including bold, italic, and lists in place notes
3. THE Journo System SHALL allow users to add checkbox items within place notes
4. THE Journo System SHALL persist checkbox states (checked/unchecked) in place notes
5. THE Journo System SHALL display checkbox completion count for places with checklist items
6. THE Journo System SHALL support at least 1000 characters in place notes

### Requirement 24: Analytics and Event Tracking

**User Story:** As a platform administrator, I want to track user behavior and system usage, so that I can measure growth and identify improvement opportunities.

#### Acceptance Criteria

1. THE Journo System SHALL integrate Plausible or PostHog for privacy-first analytics
2. THE Journo System SHALL track key events including trip_created, trip_shared, place_added, photo_uploaded, and community_posted
3. THE Journo System SHALL track offline_sync_started and offline_sync_completed events
4. THE Journo System SHALL track budget_updated and packing_item_checked events
5. THE Journo System SHALL not log IP addresses or use tracking cookies
6. THE Journo System SHALL provide an opt-out toggle for analytics in user settings
7. WHEN a user opts out, THE Journo System SHALL not send any analytics events for that user
8. THE Journo System SHALL aggregate analytics data nightly using Supabase Edge Functions
9. THE Journo System SHALL comply with GDPR requirements for analytics data collection

### Requirement 25: Admin Portal

**User Story:** As a platform administrator, I want a backend dashboard to monitor system health and moderate content, so that I can maintain a safe and functional platform.

#### Acceptance Criteria

1. THE Journo System SHALL provide an admin portal accessible at `/admin` route
2. THE Journo System SHALL restrict admin portal access to users with admin role in Supabase Auth
3. THE Journo System SHALL display a dashboard showing DAU, MAU, trips created, community posts, and offline syncs
4. THE Journo System SHALL provide user management features including search, view trips, and block users
5. THE Journo System SHALL provide trip moderation features to flag, hide, or delete inappropriate community posts
6. THE Journo System SHALL display content insights showing top destinations and most liked trips
7. THE Journo System SHALL provide analytics deep dive with conversion funnels for create, share, and community post actions
8. THE Journo System SHALL display system health metrics including Supabase usage, storage, and API errors
9. THE Journo System SHALL provide feature flags to toggle budget, packing, and offline maps features
10. THE Journo System SHALL allow administrators to export user and trip data as CSV files
11. THE Journo System SHALL support moderator role with limited permissions for content moderation only

### Requirement 26: Email and Calendar Integration

**User Story:** As a user, I want to import trip details from booking emails or calendar events, so that I don't have to manually enter all information.

#### Acceptance Criteria

1. THE Journo System SHALL provide an email forwarding address for importing booking confirmations
2. WHEN a booking email is forwarded, THE Journo System SHALL parse flight, hotel, and reservation details
3. THE Journo System SHALL extract dates, times, locations, and confirmation numbers from booking emails
4. THE Journo System SHALL create places in the trip itinerary from parsed booking data
5. THE Journo System SHALL provide Google Calendar sync to import events as trip places
6. WHEN calendar sync is enabled, THE Journo System SHALL monitor for new events matching trip dates
7. THE Journo System SHALL allow users to review and approve imported data before adding to trip

### Requirement 27: Multi-Language Support

**User Story:** As a user, I want to change the application language, so that I can use the platform in my preferred language.

#### Acceptance Criteria

1. THE Journo System SHALL support three language options: English, Traditional Chinese, and Simplified Chinese
2. THE Journo System SHALL provide a language selector in the settings page
3. WHEN a user selects a language, THE Journo System SHALL translate all user interface text to the selected language
4. THE Journo System SHALL persist the language preference in localStorage
5. WHEN the app loads, THE Journo System SHALL apply the user's saved language preference
6. THE Journo System SHALL detect the browser language on first visit and set the default language to Traditional Chinese, Simplified Chinese, or English based on browser locale
7. THE Journo System SHALL translate static content including navigation labels, button text, form labels, error messages, and tooltips
8. THE Journo System SHALL maintain user-generated content (trip titles, place names, notes) in the original language entered by the user
9. THE Journo System SHALL format dates, times, and numbers according to the selected language locale conventions
10. THE Journo System SHALL translate currency names and category labels to the selected language
