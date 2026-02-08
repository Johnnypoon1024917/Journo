# Requirements Document: Kawaii UI Redesign

## Introduction

This document specifies the requirements for implementing a comprehensive kawaii-style UI redesign for the Journo travel platform. The redesign transforms the existing functional travel planning application into a nostalgic, joyful experience inspired by decorating physical travel schedule books, while retaining ALL existing functionality and using the existing backend APIs without modification.

The core vision is to recreate the childhood joy of decorating schedule books ("好似以前細個痴schedule book 咁") with modern digital convenience, AI assistance, and seamless integration with tools like Google Maps.

## Glossary

- **System**: The Journo travel platform web application
- **User**: A person planning or managing a trip using the application
- **Trip**: A travel project with dates, destinations, and associated planning data
- **Sticker**: A decorative AI-generated illustration that can be placed on trip elements
- **Theme**: A customizable color scheme and visual style applied to the application
- **Document**: An uploaded PDF file (ticket, booking confirmation, etc.) with OCR-extracted data
- **Activity**: A scheduled event or location visit within a trip itinerary
- **Booking**: A flight, hotel, or transportation reservation
- **Shopping_Item**: An item on the trip shopping list
- **Checklist_Item**: A preparation or packing task for the trip
- **Member**: A collaborator with access to a shared trip
- **Animation_Effect**: Optional particle animations (snow, sakura, etc.)
- **At_A_Glance_View**: A single card displaying all key information for a day
- **Bottom_Navigation**: The fixed navigation bar with 7 tabs at the bottom of the screen
- **FAB**: Floating Action Button for primary actions
- **OCR**: Optical Character Recognition for extracting text from uploaded documents
- **Locale**: A language and regional setting (e.g., en-US, zh-TW, zh-CN, ja-JP)
- **i18n**: Internationalization - the process of designing software to support multiple languages

## Requirements

### Requirement 1: Design System Foundation

**User Story:** As a developer, I want a comprehensive design system with kawaii-style tokens, so that I can build consistent UI components across the application.

#### Acceptance Criteria

1. THE System SHALL define a complete color palette with soft pink/coral primary colors (#FFB3BA), 6 theme options (orange, blue, teal, pink, purple, yellow), and neutral tones
2. THE System SHALL provide typography tokens using Noto Sans TC font with adjustable sizes from 12px to 24px (default 16px)
3. THE System SHALL define spacing tokens optimized for touch interactions (minimum 44px touch targets)
4. THE System SHALL provide shadow, border radius, and animation tokens for consistent visual effects
5. THE System SHALL support theme customization with live preview and persistence to localStorage
6. THE System SHALL support dark mode with appropriate color adjustments

### Requirement 2: At-A-Glance Schedule View

**User Story:** As a user, I want to see all my daily trip information on a single card, so that I can quickly understand my schedule without navigating multiple screens.

#### Acceptance Criteria

1. WHEN viewing a trip day, THE System SHALL display date, weather, hotel, flights, and activities on a single card
2. THE System SHALL show a countdown timer to trip departure with days, hours, minutes, and seconds
3. THE System SHALL display current weather conditions with temperature and forecast for each day
4. WHEN multiple days exist, THE System SHALL provide horizontal scrolling or swiping between day cards
5. THE System SHALL display cute character illustrations on each day card
6. WHEN activities are completed, THE System SHALL show visual checkmarks or completion indicators

### Requirement 3: Google Maps Integration

**User Story:** As a user, I want to tap any location to open Google Maps for directions, so that I can easily navigate to my destinations.

#### Acceptance Criteria

1. WHEN a user taps a location name or address, THE System SHALL open Google Maps with that location
2. THE System SHALL construct proper Google Maps URLs with destination coordinates when available
3. THE System SHALL fall back to search-based Google Maps URLs when coordinates are unavailable
4. THE System SHALL open Google Maps in a new browser tab or window
5. THE System SHALL provide visual indicators (icons or styling) that locations are tappable

### Requirement 4: AI-Generated Travel Stickers

**User Story:** As a user, I want to decorate my trip with AI-generated kawaii stickers, so that I can personalize my travel schedule book.

#### Acceptance Criteria

1. THE System SHALL provide 8 sticker categories: characters, activities, transportation, food, landmarks, emotions, weather, and seasonal
2. WHEN creating a new trip, THE System SHALL generate destination-appropriate stickers using AI
3. THE System SHALL allow users to browse and select stickers from a modal grid interface
4. WHEN a user selects a sticker, THE System SHALL attach it to the selected trip element (day, activity, etc.)
5. THE System SHALL persist sticker placements and display them on trip cards
6. THE System SHALL generate seasonal stickers based on trip dates (cherry blossoms for spring, snow for winter, etc.)

### Requirement 5: PDF Document Upload with OCR

**User Story:** As a user, I want to upload PDF documents and have key information extracted automatically, so that I can quickly access my tickets and bookings.

#### Acceptance Criteria

1. THE System SHALL accept PDF file uploads for flights, hotels, car rentals, tickets, insurance, visas, and other documents
2. WHEN a PDF is uploaded, THE System SHALL generate a thumbnail preview
3. WHEN a PDF is uploaded, THE System SHALL extract key information using OCR (dates, locations, confirmation numbers, amounts)
4. THE System SHALL categorize documents by type (flight, hotel, car, ticket, insurance, visa, other)
5. THE System SHALL provide search and filter functionality for uploaded documents
6. THE System SHALL allow offline access to uploaded documents
7. THE System SHALL display documents in a boarding pass style card layout

### Requirement 6: Theme Customization

**User Story:** As a user, I want to customize the app's appearance, so that I can make it feel personal and match my preferences.

#### Acceptance Criteria

1. THE System SHALL provide 6 preset theme colors (orange, blue, teal, pink, purple, yellow)
2. THE System SHALL provide a custom color picker for selecting any primary color
3. THE System SHALL provide a font size slider ranging from 12px to 24px with default at 16px
4. THE System SHALL provide a dark mode toggle
5. THE System SHALL provide animation effect options (none, snow, sakura)
6. WHEN theme settings change, THE System SHALL apply changes immediately with live preview
7. WHEN theme settings change, THE System SHALL persist settings to localStorage
8. WHEN the app loads, THE System SHALL restore saved theme settings

### Requirement 7: Particle Animations

**User Story:** As a user, I want optional decorative animations like falling snow or sakura petals, so that my trip planning feels more magical and ceremonial.

#### Acceptance Criteria

1. THE System SHALL provide a "none" animation option with no particle effects
2. THE System SHALL provide a "snow" animation option with gentle snowfall particles
3. THE System SHALL provide a "sakura" animation option with falling cherry blossom petals
4. WHEN animations are enabled, THE System SHALL render particles without blocking user interactions
5. WHEN animations are enabled, THE System SHALL maintain 60fps performance
6. THE System SHALL allow users to toggle animations on/off in settings

### Requirement 8: Bottom Navigation

**User Story:** As a user, I want easy access to all main sections of the app, so that I can quickly navigate between schedule, bookings, budget, shopping, checklist, members, and settings.

#### Acceptance Criteria

1. THE System SHALL display a fixed bottom navigation bar with 7 tabs
2. THE System SHALL include tabs for: Schedule (行程), Booking (預約), Budget (記帳), Shopping (購物), Checklist (準備), Members (成員), Settings (設置)
3. WHEN a tab is active, THE System SHALL highlight it with the primary theme color
4. WHEN a tab is tapped, THE System SHALL navigate to the corresponding screen
5. THE System SHALL display appropriate icons for each tab
6. THE System SHALL show tab labels in the user's language

### Requirement 9: Schedule Screen

**User Story:** As a user, I want to view and manage my trip itinerary, so that I can see my daily schedule and make adjustments.

#### Acceptance Criteria

1. THE System SHALL display a countdown timer showing days, hours, minutes, and seconds until departure
2. THE System SHALL display a date selector for navigating between trip days
3. THE System SHALL display weather information for each day
4. THE System SHALL display hotel information for each day
5. THE System SHALL display flight information for each day
6. THE System SHALL display a list of activities with times and locations for each day
7. WHEN a user drags an activity, THE System SHALL allow reordering within the day
8. WHEN a user taps the FAB, THE System SHALL open a form to add a new activity
9. WHEN a user taps an activity, THE System SHALL allow editing or deleting it

### Requirement 10: Booking Screen

**User Story:** As a user, I want to manage my flight and accommodation bookings, so that I can keep track of all my reservations.

#### Acceptance Criteria

1. THE System SHALL display bookings in boarding pass style cards
2. THE System SHALL provide tabs for "Tickets" and "Accommodation" with counts
3. WHEN displaying flight bookings, THE System SHALL show origin, destination, times, flight number, and date
4. WHEN displaying accommodation bookings, THE System SHALL show hotel name, check-in/out dates, and location
5. WHEN a user taps "+ New", THE System SHALL open a form to add a new booking
6. WHEN a user taps a booking card, THE System SHALL allow editing booking details
7. THE System SHALL allow users to delete bookings via swipe or menu actions

### Requirement 11: Shopping Screen

**User Story:** As a user, I want to create and manage a shopping list for my trip, so that I can track what I need to buy.

#### Acceptance Criteria

1. THE System SHALL display shopping items with checkboxes, images, and tags
2. THE System SHALL show statistics: number of items to buy and number bought
3. WHEN a user checks an item, THE System SHALL mark it as bought and update statistics
4. THE System SHALL provide filter options by category (all, food, clothing, important, other)
5. WHEN a user taps "+ New", THE System SHALL open a form to add a new shopping item
6. THE System SHALL allow users to add images to shopping items
7. THE System SHALL allow users to specify store names for shopping items
8. THE System SHALL allow users to delete shopping items via swipe or menu actions

### Requirement 12: Budget Screen

**User Story:** As a user, I want to track my trip expenses, so that I can stay within budget.

#### Acceptance Criteria

1. THE System SHALL display a list of expenses with amounts, categories, and dates
2. THE System SHALL calculate and display total expenses
3. THE System SHALL provide category breakdown of expenses
4. WHEN a user taps "+ New", THE System SHALL open a form to add a new expense
5. THE System SHALL allow users to edit or delete expenses
6. THE System SHALL support multiple currencies with conversion

### Requirement 13: Checklist Screen

**User Story:** As a user, I want to create packing and preparation checklists, so that I don't forget important items or tasks.

#### Acceptance Criteria

1. THE System SHALL display checklist items with checkboxes
2. THE System SHALL show progress (number of items completed vs total)
3. WHEN a user checks an item, THE System SHALL mark it as complete and update progress
4. WHEN a user taps "+ New", THE System SHALL open a form to add a new checklist item
5. THE System SHALL allow users to categorize checklist items (packing, documents, tasks)
6. THE System SHALL allow users to delete checklist items

### Requirement 14: Members Screen

**User Story:** As a user, I want to invite collaborators to my trip, so that we can plan together.

#### Acceptance Criteria

1. THE System SHALL display a list of trip members with avatars and names
2. WHEN a user taps "+ Invite", THE System SHALL open a form to invite new members by email
3. THE System SHALL show member roles (owner, editor, viewer)
4. THE System SHALL allow the trip owner to remove members
5. THE System SHALL allow the trip owner to change member permissions

### Requirement 15: Settings Screen

**User Story:** As a user, I want to configure app settings, so that I can customize my experience.

#### Acceptance Criteria

1. THE System SHALL display theme color selection with 6 presets and custom picker
2. THE System SHALL display font size adjustment slider
3. THE System SHALL display dark mode toggle
4. THE System SHALL display animation effects selection
5. THE System SHALL display language selection options
6. THE System SHALL display account settings (profile, password, logout)
7. WHEN settings change, THE System SHALL apply them immediately

### Requirement 16: New Trip Creation

**User Story:** As a user, I want to easily create a new trip with a beautiful onboarding experience, so that starting a new project feels special and ceremonial.

#### Acceptance Criteria

1. WHEN a user creates a new trip, THE System SHALL display a template selection screen (beach, mountain, city, cultural, custom)
2. THE System SHALL collect basic trip information (name, destination, dates, number of travelers)
3. THE System SHALL allow users to choose a theme color during trip creation
4. THE System SHALL allow users to choose a sticker style during trip creation
5. THE System SHALL allow users to choose animation effects during trip creation
6. WHEN AI assistance is enabled, THE System SHALL generate suggested attractions, restaurants, and daily itinerary
7. WHEN AI assistance is enabled, THE System SHALL generate themed stickers for the destination
8. WHEN trip creation is complete, THE System SHALL navigate to the new trip's schedule screen

### Requirement 17: Responsive Design

**User Story:** As a user, I want the app to work well on my device, so that I can use it on mobile, tablet, or desktop.

#### Acceptance Criteria

1. THE System SHALL provide mobile-first layouts optimized for 320px-767px screens
2. THE System SHALL provide tablet layouts optimized for 768px-1023px screens
3. THE System SHALL provide desktop layouts optimized for 1024px+ screens
4. WHEN on mobile, THE System SHALL use bottom navigation
5. WHEN on desktop, THE System SHALL use side navigation
6. THE System SHALL ensure all touch targets are minimum 44px for accessibility
7. THE System SHALL handle safe area insets for devices with notches

### Requirement 18: Offline Support

**User Story:** As a user, I want to access my trip information offline, so that I can view my schedule and documents without internet connection.

#### Acceptance Criteria

1. THE System SHALL cache trip data for offline access
2. THE System SHALL cache uploaded documents for offline access
3. WHEN offline, THE System SHALL display cached data
4. WHEN offline, THE System SHALL queue user changes for sync when online
5. WHEN connection is restored, THE System SHALL sync queued changes to the server
6. THE System SHALL indicate offline status to the user

### Requirement 19: Real-Time Collaboration

**User Story:** As a user, I want to see changes made by collaborators in real-time, so that we can plan together seamlessly.

#### Acceptance Criteria

1. WHEN a collaborator makes a change, THE System SHALL update the UI for all connected users
2. THE System SHALL show which user is currently editing an item
3. THE System SHALL prevent conflicting edits to the same item
4. THE System SHALL display notifications when collaborators join or leave
5. THE System SHALL sync changes within 1 second of being made

### Requirement 20: Multi-Language Support

**User Story:** As a user, I want to use the app in my preferred language, so that I can understand all content and navigate comfortably.

#### Acceptance Criteria

1. THE System SHALL support multiple languages including English, Traditional Chinese, Simplified Chinese, and Japanese
2. THE System SHALL detect the user's browser language and set it as the default
3. WHEN a user changes language in settings, THE System SHALL update all UI text immediately
4. THE System SHALL persist the selected language to localStorage
5. THE System SHALL translate all static UI elements (buttons, labels, navigation, etc.)
6. THE System SHALL provide language-specific date and time formatting
7. THE System SHALL provide language-specific number and currency formatting
8. THE System SHALL load only the required language bundle to minimize bundle size
9. WHEN user-generated content exists in multiple languages, THE System SHALL display it in the user's selected language when available

### Requirement 21: Performance

**User Story:** As a user, I want the app to be fast and responsive, so that I can work efficiently.

#### Acceptance Criteria

1. THE System SHALL load the initial page in under 2 seconds on 3G connection
2. THE System SHALL render screen transitions in under 500ms
3. THE System SHALL maintain 60fps during animations
4. THE System SHALL keep bundle size under 50MB
5. THE System SHALL achieve a Lighthouse performance score of 90+
6. THE System SHALL lazy load images and non-critical resources

