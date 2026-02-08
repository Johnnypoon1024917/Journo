# Implementation Plan

This implementation plan breaks down the Journo travel platform into discrete, manageable coding tasks. Each task builds incrementally on previous work, with all code integrated into the application. Tasks reference specific requirements from the requirements document.

## Project Setup and Foundation

- [x] 1. Initialize project structure and development environment
  - Create monorepo structure with frontend and backend folders
  - Initialize Vite + React + TypeScript project in frontend folder
  - Initialize Node.js + Express + TypeScript project in backend folder
  - Configure Tailwind CSS with custom theme colors and dark mode support
  - Set up ESLint and Prettier for both frontend and backend
  - Configure path aliases for clean imports (@/components, @/services, etc.)
  - Create frontend folder structure: components, pages, services, stores, hooks, types, utils
  - Create backend folder structure: routes, controllers, services, models, middleware, utils
  - Set up Docker and Docker Compose configuration files
  - Create .env.example files for both frontend and backend
  - _Requirements: 13.1, 13.2, 13.3_

- [x] 2. Set up backend API server with Express and PostgreSQL
  - Initialize Node.js + Express + TypeScript backend project
  - Set up PostgreSQL connection with Prisma or TypeORM
  - Configure environment variables for database, JWT, storage
  - Implement JWT-based authentication with bcrypt password hashing
  - Create authentication endpoints (signup, login, refresh token, logout)
  - Set up Passport.js for authentication middleware
  - Create auth store using Zustand for global auth state management on frontend
  - Implement protected route wrapper component on frontend
  - Add session persistence and automatic token refresh
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_


- [x] 3. Create database schema and migrations
  - Set up Prisma or TypeORM for database migrations
  - Write migration for users table with password hashing
  - Write migration for trips, trip_days, places, story_items, trip_likes tables
  - Write migration for packing_lists, trip_versions, trip_collaborators tables
  - Write migration for user_badges, analytics_events, currency_rates tables
  - Write migration for destination_suggestions, scraped_locations, search_queries tables
  - Implement database-level row security with PostgreSQL policies
  - Create database indexes for query optimization
  - Set up MinIO or local file storage for photos and covers
  - Create storage service with upload/download/delete methods
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

- [x] 4. Implement core TypeScript types and interfaces
  - Define Trip, TripDay, Place, StoryItem interfaces
  - Define PackingItem, TripVersion, Collaborator interfaces
  - Define User, Badge, AnalyticsEvent interfaces
  - Define DestinationSuggestion, ScrapedLocation interfaces
  - Create API response types and error types
  - Export all types from centralized types/index.ts
  - _Requirements: All requirements - foundational types_

## Real-Time Infrastructure

- [x] 4. Set up Socket.IO for real-time features
  - Install and configure Socket.IO on Express backend
  - Create WebSocket server with authentication middleware
  - Implement room-based architecture for trips
  - Create Socket.IO client service on frontend
  - Implement connection management with auto-reconnect
  - Add event emitters for trip updates, story items, packing list changes
  - Implement presence tracking for active viewers
  - Handle disconnection and reconnection gracefully
  - _Requirements: 6.5, 5.5, 17.18_

## Core Trip Management

- [x] 5. Build trip creation and editing functionality
- [x] 5.1 Create TripEditor component with form validation
  - Implement form with title, destination, dates, cover image, theme selector
  - Add client-side validation for required fields and date ranges
  - Implement theme selector with visual previews (default, adventure, romantic, foodie, chill)
  - Add cover image upload with preview and compression
  - Create API endpoint POST /api/trips for trip creation
  - Wire up form submission to backend API
  - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6_

- [x] 5.2 Implement trip list view and navigation
  - Create TripCard component displaying trip summary with cover, title, dates, destination
  - Build TripList component with grid layout
  - Create API endpoint GET /api/trips with pagination support
  - Fetch user's trips from backend API with cursor-based pagination
  - Add loading states and empty state UI
  - Implement navigation to trip detail view
  - _Requirements: 2.8_

- [x] 5.3 Add trip deletion with confirmation
  - Create confirmation modal component
  - Create API endpoint DELETE /api/trips/:id with cascade delete
  - Implement delete trip functionality on frontend
  - Show success/error toast notifications
  - Update trip list after deletion
  - _Requirements: 2.7_

- [x] 6. Implement day and place management
- [x] 6.1 Create day management interface
  - Build DayEditor component for adding/removing days
  - Implement day numbering and date assignment
  - Add drag-and-drop reordering for days
  - Persist day changes to trip_days table
  - _Requirements: 2.3_

- [x] 6.2 Build place editor with location search
  - Create PlaceEditor component with all place fields
  - Integrate Google Places Autocomplete for location search
  - Capture place name, address, lat/lng from autocomplete selection
  - Add time range picker for start/end times
  - Implement place type selector (attraction, food, hotel, transport, other)
  - Add notes field with rich text support
  - _Requirements: 2.4, 3.1, 3.2_

- [x] 6.3 Add sticker selection to places
  - Create sticker picker component with 15+ travel icons
  - Implement sticker attachment to places
  - Display selected sticker on place cards
  - _Requirements: 4.1, 4.2_

- [x] 6.4 Implement place image upload
  - Add image upload button to place editor
  - Compress images before upload using browser APIs
  - Upload to Supabase Storage photos bucket
  - Store image URL in places table
  - Display place images in trip itinerary
  - _Requirements: 4.5_

## Map Integration

- [ ] 7. Integrate Google Maps for trip visualization
- [x] 7.1 Set up Google Maps component
  - Initialize Google Maps JavaScript API with API key
  - Create MapView component with map container
  - Implement map center and zoom controls
  - Add dark mode support for map styling
  - _Requirements: 3.3_

- [x] 7.2 Display places as map markers
  - Add markers for all places in trip with custom icons by type
  - Implement marker click handler to show place details
  - Create info window component for place information
  - Update markers when places are added/removed
  - _Requirements: 3.3, 3.4_

- [x] 7.3 Add route visualization
  - Implement Google Directions API integration
  - Calculate routes between consecutive places
  - Display route polylines on map
  - Show total distance and estimated travel time
  - Make route display toggleable
  - _Requirements: 3.5_

## Travel Time and Transport

- [x] 8. Implement travel time calculation between places
  - Create service for Google Directions API calls
  - Calculate travel time when place is added or reordered
  - Auto-detect transport mode based on distance (walking <2km, driving otherwise)
  - Add manual transport mode selector (driving, walking, transit, flight)
  - Display travel time and distance between places in itinerary
  - Calculate and display total daily travel time
  - Handle flight mode without driving time calculation
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7_

## Budget Tracking

- [-] 9. Build comprehensive budget tracking system
- [x] 9.1 Create budget setup interface
  - Add budget fields to trip creation form (total budget, currency)
  - Implement currency selector with 20+ major currencies (ISO 4217)
  - Calculate and display daily budget (total / number of days)
  - Persist budget data to trips table
  - _Requirements: 16.1, 16.2, 16.5_

- [x] 9.2 Add cost tracking to places
  - Add cost and currency fields to place editor
  - Implement budget category selector (accommodation, food, transport, activities, shopping, misc)
  - Support different currency per place with conversion
  - Add tip calculator for food costs (10%, 15%, 20%)
  - Support negative costs for refunds
  - Support split costs among travelers
  - _Requirements: 16.3, 16.4, 16.17, 16.18, 16.19_

- [x] 9.3 Integrate currency exchange API
  - Create CurrencyService with Frankfurter API integration
  - Implement currency conversion with live rates
  - Cache exchange rates in database for 24 hours
  - Use cached rates when offline
  - Auto-convert place costs to trip currency
  - _Requirements: 16.13, 16.14, 16.15, 16.16_

- [x] 9.4 Build budget visualization components
  - Create BudgetCard component with progress bar
  - Implement color-coded alerts (yellow at 80%, red at 100%)
  - Build CategoryChart component with pie chart for spending breakdown
  - Create DailyBudgetRing component showing per-day spending
  - Display remaining budget and overspend amount
  - _Requirements: 16.6, 16.7, 16.8, 16.9, 16.10, 16.11, 16.12_

- [x] 9.5 Add budget export functionality
  - Implement PDF export with budget summary and charts
  - Create CSV export with date, category, place, cost, currency columns
  - Add shareable budget view at /t/:token?tab=budget
  - _Requirements: 16.20, 16.21, 16.22_

## Smart Packing List

- [x] 10. Implement intelligent packing list feature
- [x] 10.1 Create packing list data structure and UI
  - Build PackingList component with category accordion
  - Create PackingItem component with checkbox toggle
  - Implement add custom item functionality with category selection
  - Display packing progress with visual progress bar
  - Show checked/total item count
  - _Requirements: 17.1, 17.11, 17.12, 17.13, 17.14, 17.15_

- [x] 10.2 Build rule-based packing suggestion engine
  - Create packing templates table with destination/weather/duration rules
  - Implement suggestion logic for destination type (beach, city, mountain, winter)
  - Add weather-based suggestions (sunscreen for hot, jacket for cold)
  - Implement trip duration rules (extra items for 7+ days)
  - Add activity-based suggestions from itinerary keywords
  - Create specific rules for popular destinations (Japan adapter, etc.)
  - _Requirements: 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8, 17.9, 17.10_

- [x] 10.3 Add packing list collaboration and sync
  - Enable real-time sync of packing items using Socket.IO
  - Emit packing item events on add/check/uncheck
  - Subscribe to packing list events for trip
  - Allow collaborators with Editor role to add and check items
  - Display visual tags for auto-suggested vs custom items
  - Implement offline support with localStorage
  - Handle conflict resolution with last-write-wins
  - _Requirements: 17.18, 17.19, 17.20, 17.21, 17.22_

- [x] 10.4 Implement packing list export and sharing
  - Create PDF export with categories and checkbox layout
  - Add print-friendly view
  - Implement shareable link at /t/:token?tab=packing
  - Add warning for oversized lists (>50 items)
  - Implement duplicate item detection and merging
  - _Requirements: 17.23, 17.24, 17.25, 17.26, 17.27_

- [x] 10.5 Add traveler-specific packing features
  - Implement multiple traveler support
  - Generate age-appropriate suggestions for children/babies
  - Create traveler-specific packing lists
  - _Requirements: 17.28, 17.29_

## Weather Integration

- [x] 11. Integrate weather forecasting
  - Create WeatherService with OpenWeather API integration
  - Fetch 7-day forecast when trip destination and dates are set
  - Parse and display temperature, conditions, precipitation probability
  - Cache weather data in trips table for 6 hours
  - Display weather icons and temperature for each trip day
  - Show "forecast unavailable" message when API fails
  - Refresh weather data when viewing trip with stale cache
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6_

## Story Feed and Rich Media

- [x] 12. Build journey story feed feature
- [x] 12.1 Create story item components
  - Build StoryFeed component with timeline layout
  - Create StoryItem component for photo, YouTube, and note types
  - Implement photo upload with camera/gallery selection
  - Add YouTube link input with video ID extraction and embed
  - Create text note input with caption support
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6_

- [x] 12.2 Implement real-time story updates
  - Set up Socket.IO server on backend for WebSocket connections
  - Create Socket.IO client connection on frontend
  - Emit story item events when new items are added
  - Subscribe to story item events for specific trips
  - Display new story items instantly when added by any collaborator
  - Show chronological timeline with newest items first
  - Validate story item types (photo, youtube, note)
  - _Requirements: 5.5, 5.7_

## Trip Sharing and Collaboration

- [x] 13. Implement trip sharing functionality
- [x] 13.1 Create public trip sharing
  - Generate unique share token on trip creation
  - Build SharedTrip page component at /t/:token route
  - Implement public/private toggle for trips
  - Allow anonymous viewing of public trips
  - Increment view count on trip access
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6_

- [x] 13.2 Add real-time collaboration
  - Set up Socket.IO rooms for each trip
  - Emit trip update events when changes occur
  - Subscribe to trip room events on shared trip view
  - Update shared trip view when owner makes changes
  - Display live updates for places, story items, and packing list
  - Handle user presence (who's viewing the trip)
  - _Requirements: 6.5_

- [x] 13.3 Build sharing options
  - Create ShareModal component with multiple sharing methods
  - Implement copy link functionality
  - Add WhatsApp share integration
  - Add email share functionality
  - _Requirements: 6.7_

## QR Code Sharing

- [x] 14. Implement QR code generation and sharing
  - Integrate qrcode.react library
  - Generate QR code containing public trip URL
  - Create QR code modal with display and download options
  - Implement QR code download as image file
  - Test QR code scanning navigation to shared trip
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

## Collaboration and Permissions

- [x] 15. Build multi-user collaboration system
- [x] 15.1 Implement collaborator management
  - Create trip_collaborators table and RLS policies
  - Build collaborator invitation interface
  - Implement email and share link invitation methods
  - Display collaborator list with roles on trip settings
  - _Requirements: 21.1, 21.2, 21.6_

- [x] 15.2 Enforce role-based permissions
  - Implement Owner role with full access
  - Implement Editor role with edit but not delete permissions
  - Implement Viewer role with read-only access
  - Prevent editors and viewers from managing collaborators
  - Apply permissions to all trip operations
  - _Requirements: 21.3, 21.4, 21.5, 21.7, 21.8_

## Version History and Undo

- [x] 16. Implement trip version control
  - Create trip_versions table for snapshots
  - Capture version snapshot on trip modifications
  - Store last 5 versions per trip
  - Build undo button to revert to previous version
  - Build redo button to reapply undone changes
  - Create version history UI showing timestamps and changes
  - Implement restore functionality for any of last 5 versions
  - Create new snapshot before restoring old version
  - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6, 22.7_

## Enhanced Place Notes

- [x] 17. Add rich text notes with checklists to places
  - Integrate rich text editor (TipTap or similar)
  - Support text formatting (bold, italic, lists)
  - Add checkbox item functionality within notes
  - Persist checkbox states in place notes
  - Display checkbox completion count
  - Support up to 1000 characters in notes
  - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5, 23.6_

## Community Feed

- [x] 18. Build social community features
- [x] 18.1 Create community feed interface
  - Build CommunityFeed component with scrollable layout
  - Create CommunityCard component for trip display
  - Implement "Post to Community" toggle in trip settings
  - Fetch and display all community trips (is_community = true)
  - Show cover photo, title, destination, like count, view count
  - Display top 3 story items from each community trip
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.9_

- [x] 18.2 Implement like functionality
  - Create LikeButton component with heart icon
  - Implement like/unlike toggle for authenticated users
  - Increment/decrement likes_count in trips table
  - Create trip_likes record with unique constraint
  - Prevent duplicate likes from same user
  - _Requirements: 8.5, 8.6, 8.7_

- [x] 18.3 Add trip copy feature
  - Implement "Copy Itinerary" button on community cards
  - Clone trip with all days, places, and packing list
  - Set current user as owner of copied trip
  - Navigate to copied trip after creation
  - _Requirements: 8.8_

- [x] 18.4 Build community search
  - Add search input for destination, theme, or hashtag
  - Implement search filtering on community trips
  - Display search results with highlighting
  - _Requirements: 8.10_

## Offline Functionality

- [x] 19. Implement comprehensive offline support
- [x] 19.1 Set up offline storage infrastructure
  - Integrate browser localStorage for offline storage
  - Create offline storage schema for trips, days, places, story items, packing lists
  - Implement data persistence to localStorage on all changes
  - Build sync queue data structure for pending operations
  - _Requirements: 9.1, 9.2_

- [x] 19.2 Build offline UI indicators
  - Create offline badge component
  - Display offline status in app header
  - Show sync status for pending changes
  - _Requirements: 9.2_

- [x] 19.3 Implement offline trip operations
  - Enable trip creation while offline
  - Enable trip editing while offline
  - Enable place addition while offline
  - Enable viewing all previously loaded trips offline
  - Queue all changes for sync when online
  - _Requirements: 9.3, 9.4_

- [x] 19.4 Build sync mechanism
  - Detect network connectivity changes
  - Implement automatic sync when connection restored
  - Process sync queue with retry logic
  - Handle sync conflicts with last-write-wins strategy
  - Queue photo uploads for background processing
  - Display sync progress and completion
  - _Requirements: 9.5, 9.6, 9.7_

## Offline Maps

- [x] 20. Implement offline map functionality
  - Add download offline maps button to trip view
  - Implement map tile caching using Google Maps SDK
  - Store cached map tiles in localStorage
  - Display cached maps when offline
  - Provide turn-by-turn navigation with cached data
  - Show offline maps availability indicator
  - Add delete offline maps option to free storage
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_

## Dark Mode

- [x] 21. Implement dark mode support
  - Add dark mode toggle to settings page
  - Apply dark theme styling to all components using Tailwind dark: classes
  - Persist dark mode preference in localStorage
  - Load and apply saved preference on app start
  - Respect system dark mode preference if no user preference exists
  - Implement dark mode by adding/removing 'dark' class on HTML element
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

## Multi-Language Support

- [x] 22. Implement internationalization (i18n) system
- [x] 22.1 Set up i18next infrastructure
  - Install i18next, react-i18next, and i18next-browser-languagedetector packages
  - Create locales folder structure with en, zh-TW, zh-CN subfolders
  - Set up i18n configuration with language detection and localStorage persistence
  - Configure namespace support for code splitting (common, trip, place, budget, packing, community, settings, errors)
  - Initialize i18next in App.tsx with Suspense for loading states
  - _Requirements: 27.1, 27.2, 27.4_

- [x] 22.2 Create translation files for all languages
  - Write English translation files for all namespaces (common, trip, place, budget, packing, community, settings, errors)
  - Write Traditional Chinese (zh-TW) translations for all namespaces
  - Write Simplified Chinese (zh-CN) translations for all namespaces
  - Include all UI text: navigation labels, button text, form labels, error messages, tooltips
  - Translate category names, theme names, place types, and budget categories
  - _Requirements: 27.7, 27.10_

- [x] 22.3 Build language selector component
  - Create LanguageSelector component for settings page
  - Display language options: English, Traditional Chinese (繁體中文), Simplified Chinese (简体中文)
  - Implement language change handler with i18n.changeLanguage()
  - Persist selected language to localStorage
  - Show current language selection in dropdown
  - _Requirements: 27.2, 27.3, 27.4_

- [x] 22.4 Implement browser language detection
  - Create language detector utility function
  - Detect browser language from navigator.language
  - Map browser locales to supported languages (zh-TW, zh-Hant → zh-TW, zh-CN, zh-Hans, zh → zh-CN)
  - Set default language based on browser locale on first visit
  - Fall back to English if browser language not supported
  - _Requirements: 27.6_

- [x] 22.5 Add locale-aware formatting utilities
  - Install date-fns with locale support
  - Create formatDate utility with locale parameter
  - Create formatCurrency utility using Intl.NumberFormat with locale
  - Create formatNumber utility for locale-specific number formatting
  - Create formatRelativeTime and formatTimeAgo utilities
  - Apply locale formatting throughout the application
  - _Requirements: 27.9, 27.10_

- [x] 22.6 Update all components to use translations
  - Replace hardcoded text in navigation components with t() function
  - Update TripCard, TripEditor, TripList with translated strings
  - Update PlaceEditor, PlaceList with translated strings
  - Update BudgetCard, CategoryChart with translated strings
  - Update PackingList components with translated strings
  - Update CommunityFeed components with translated strings
  - Update Settings page with translated strings
  - Update all error messages and validation text
  - _Requirements: 27.3, 27.7_

- [x] 22.7 Add TypeScript types for translations
  - Create i18n.d.ts type definition file
  - Import English translation files as type sources
  - Extend react-i18next CustomTypeOptions interface
  - Enable type-safe translation keys with autocomplete
  - _Requirements: 27.3_

- [x] 22.8 Test language switching and translations
  - Write tests for language switching functionality
  - Test language persistence across sessions
  - Test browser language detection
  - Verify all translations render correctly in each language
  - Test locale-specific date and currency formatting
  - _Requirements: 27.1, 27.2, 27.3, 27.4, 27.5, 27.6, 27.9, 27.10_

## Badge System

- [x] 23. Implement achievement badges
  - Create user_badges table and badge logic
  - Implement "Golden Hour" badge for photos after 6 PM
  - Implement "Food Explorer" badge for 10+ food places
  - Implement "Early Bird" badge for places before 9 AM
  - Display earned badges on user profile page
  - Store badge records with user_id, trip_id, badge_type, earned_at
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

## PDF Export

- [ ] 24. Implement trip PDF export
  - Integrate html2pdf.js library
  - Create PDF template with trip title, dates, destination
  - Include itinerary with all places and details
  - Add map snapshot to PDF
  - Include top 3 photos from trip
  - Format PDF with proper styling and page breaks
  - Implement download PDF functionality
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

## Destination Suggestions

- [x] 25. Build destination suggestion system
- [x] 25.1 Create suggestion data and service
  - Create destination_suggestions and suggestion_interactions tables
  - Populate suggestions table with month-specific destinations
  - Build SuggestionService for fetching and personalizing suggestions
  - Implement caching strategy for suggestions (24 hours)
  - _Requirements: New feature - destination suggestions_

- [x] 25.2 Build suggestion carousel UI
  - Create DestinationCarousel component for main page
  - Display rotating banner with 5-8 top destinations for current month
  - Show destination image, name, temperature, weather, why_now text
  - Add Quick Plan and Why Now buttons
  - Implement carousel navigation (prev/next arrows, dots)
  - Track suggestion views and clicks
  - _Requirements: New feature - destination suggestions_

- [x] 25.3 Implement personalization
  - Analyze user's past trips for preferences
  - Detect climate preference from trip history
  - Detect activity preference from trip themes
  - Re-rank suggestions based on user preferences
  - _Requirements: New feature - destination suggestions_

- [x] 25.4 Add Quick Plan functionality
  - Implement quick trip creation from suggestion
  - Pre-fill trip with destination, dates (7 days), currency
  - Auto-generate packing list based on weather
  - Navigate to new trip editor
  - _Requirements: New feature - destination suggestions_

## Dynamic Location Scraping

- [x] 26. Implement location search with scraping
- [x] 26.1 Create scraping infrastructure
  - Create scraped_locations and search_queries tables
  - Build Express API endpoint POST /api/scrape/locations for web scraping
  - Implement scraping service using Cheerio or Puppeteer
  - Implement scraping for ALVA visitor statistics
  - Implement scraping for TripAdvisor data (respecting robots.txt)
  - Enrich results with Google Places API for coordinates
  - Cache results in Redis for 7 days
  - _Requirements: New feature - location scraping_

- [x] 26.2 Build location scraper service
  - Create LocationScraperService with caching
  - Implement 7-day cache for scraped results
  - Add debounced search (300ms delay)
  - Track search queries for analytics
  - Handle offline with cached results
  - _Requirements: New feature - location scraping_

- [x] 26.3 Create search UI with suggestions
  - Build PlaceSearchWithSuggestions component
  - Display scraped locations with visitor counts and tips
  - Show loading state during scraping
  - Implement suggestion selection to auto-fill place details
  - Track suggestion additions to trips
  - _Requirements: New feature - location scraping_

## Analytics Integration

- [x] 27. Implement privacy-first analytics
  - Integrate Plausible or PostHog SDK
  - Create AnalyticsService with event tracking
  - Implement batch event sending (every 10 events or 30 seconds)
  - Track key events: trip_created, trip_shared, place_added, photo_uploaded, etc.
  - Add analytics opt-out toggle in settings
  - Ensure no IP logging or cookies
  - Create Express API endpoint POST /api/analytics/events to receive and store events
  - Store events in analytics_events table
  - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5, 24.6, 24.7, 24.8, 24.9_

## Admin Portal

- [x] 28. Build administrative dashboard
- [x] 28.1 Create admin authentication and routing
  - Add admin role to user profiles
  - Create admin-only route guard
  - Build AdminLayout component
  - Set up admin routes: dashboard, users, trips, analytics, system, features
  - _Requirements: 25.1, 25.2_

- [x] 28.2 Build admin dashboard
  - Create Dashboard component with key metrics
  - Display DAU, MAU, trips created, community posts, offline syncs
  - Show storage used and API errors
  - Display active users list
  - Implement real-time metrics updates (30 second refresh)
  - Create Express API endpoint GET /api/admin/metrics for metrics aggregation
  - Use PostgreSQL queries to calculate metrics from analytics_events table
  - _Requirements: 25.3_

- [x] 28.3 Implement user management
  - Create UserManagement component
  - Add user search functionality
  - Display user trip list
  - Implement block user functionality
  - Add export users as CSV
  - _Requirements: 25.4_

- [x] 28.4 Build content moderation
  - Create TripModeration component
  - Display flagged community posts
  - Implement flag, hide, delete, and warn actions
  - Log all moderation actions
  - Send warning emails to users
  - _Requirements: 25.5_

- [x] 28.5 Create analytics deep dive
  - Build Analytics component with charts
  - Display content insights (top destinations, most liked trips)
  - Show conversion funnels (create → share → post)
  - Integrate Recharts for visualizations
  - _Requirements: 25.6, 25.7_

- [x] 28.6 Add system health monitoring
  - Display Supabase usage metrics
  - Show storage consumption
  - Track API error rates
  - Monitor external API health (Google Maps, Weather, Currency)
  - _Requirements: 25.8_

- [x] 28.7 Implement feature flags
  - Create feature_flags table
  - Build FeatureFlags component for admin
  - Implement toggle functionality for features
  - Add gradual rollout percentage support
  - Create FeatureFlagService for client-side checks
  - _Requirements: 25.9_

- [x] 28.8 Add admin analytics for suggestions
  - Display suggestion click rates and quick plan counts
  - Show top destinations from suggestions
  - Track search trends and add rates
  - Monitor scraping health and errors
  - _Requirements: 25.10, 25.11_

## Email and Calendar Integration

- [ ] 29. Implement booking import features
  - Set up email forwarding address for booking confirmations
  - Create email parsing service to extract flight, hotel, reservation details
  - Parse dates, times, locations, confirmation numbers from emails
  - Auto-create places from parsed booking data
  - Implement Google Calendar sync integration
  - Monitor calendar for events matching trip dates
  - Build review and approve interface for imported data
  - _Requirements: 26.1, 26.2, 26.3, 26.4, 26.5, 26.6, 26.7_

## PWA and Responsive Design

- [x] 30. Configure Progressive Web App
  - Create web app manifest with app metadata and icons
  - Configure Vite PWA plugin with service worker
  - Implement service worker caching strategies
  - Add install prompt for PWA
  - Test offline functionality in PWA mode
  - Generate all required icon sizes (72x72 to 512x512)
  - _Requirements: 13.2_

- [x] 31. Implement responsive design optimizations
  - [x] Create mobile-first CSS architecture with Tailwind breakpoints
  - [x] Implement touch-optimized interactions (min 44px touch targets)
  - [x] Add swipe gestures for mobile navigation
  - [x] Optimize layouts for tablet and desktop viewports
  - [x] Test responsive design across device sizes (320px to 1920px)
  - [x] Implement adaptive navigation for mobile devices
  - [x] Add touch-friendly controls and spacing
  - _Requirements: 13.3, 13.4, 13.5_

## Performance Optimization

- [ ] 32. Implement performance optimizations
  - Add route-based code splitting with React.lazy
  - Implement component-level lazy loading for heavy components
  - Create LazyImage component with intersection observer
  - Add image compression before upload
  - Implement cursor-based pagination for trip lists
  - Optimize database queries with proper indexes
  - Create materialized views for expensive aggregations
  - Set up Lighthouse CI for automated performance audits
  - _Requirements: 14.1, 14.2_

## Accessibility

- [ ] 33. Ensure accessibility compliance
  - Add ARIA labels to all interactive elements
  - Implement full keyboard navigation
  - Test with screen readers
  - Ensure proper heading hierarchy
  - Add focus indicators for keyboard users
  - Implement skip navigation links
  - _Requirements: 14.3, 14.4_

## Testing

- [ ] 34. Write unit tests for core functionality
  - Write tests for budget calculations (total spent, currency conversion, warnings)
  - Write tests for packing suggestions (weather-based, destination-based, activity-based)
  - Write tests for date utilities and validation
  - Write tests for currency service
  - Write tests for offline sync queue
  - _Requirements: All requirements - validation_

- [ ] 35. Write integration tests
  - Test trip CRUD operations with Supabase
  - Test real-time subscriptions for trips and story items
  - Test offline sync mechanisms
  - Test external API integrations (Google Maps, Weather, Currency)
  - _Requirements: All requirements - integration_

- [ ] 36. Write end-to-end tests
  - Test complete trip creation and sharing flow
  - Test shared trip viewing by anonymous users
  - Test offline trip editing and sync
  - Test community feed interactions
  - Test admin portal functionality
  - _Requirements: All requirements - end-to-end validation_

## Deployment

- [ ] 37. Set up CI/CD pipeline and Docker deployment
  - Create GitHub Actions workflow for testing
  - Add linting and type-checking to CI for both frontend and backend
  - Configure automated Docker image builds
  - Set up Docker Hub or GitHub Container Registry for image storage
  - Create production docker-compose.yml with optimized settings
  - Configure environment variables for production
  - Set up automated database migrations on deployment
  - Create health check endpoints for all services
  - _Requirements: 13.1, 13.3, 13.4_

- [ ] 38. Deploy to production with Docker
  - Set up production server (VPS, AWS EC2, DigitalOcean, etc.)
  - Install Docker and Docker Compose on production server
  - Configure Nginx reverse proxy with SSL certificates (Let's Encrypt)
  - Deploy application using docker-compose up -d
  - Run database migrations
  - Deploy responsive web application to production
  - Test PWA installation across different browsers
  - Configure custom domain (journo.app) with DNS
  - Set up monitoring and error tracking (Sentry, Prometheus, Grafana)
  - Configure automated backups for PostgreSQL and MinIO
  - Set up log aggregation (ELK stack or similar)
  - _Requirements: 13.1, 13.2, 13.6_

## Documentation

- [ ] 39. Create user documentation
  - Write user guide for trip planning
  - Document budget tracking features
  - Explain packing list functionality
  - Create sharing and collaboration guide
  - Document offline mode usage
  - _Requirements: All requirements - user documentation_

- [ ] 40. Create developer documentation
  - Document API endpoints and services
  - Write database schema documentation
  - Create component library documentation
  - Document deployment procedures
  - Write contribution guidelines
  - _Requirements: All requirements - developer documentation_
