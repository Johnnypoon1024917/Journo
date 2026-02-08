# Requirements Document

## Introduction

This specification defines the requirements for redesigning the Journo trip planner interface to match the Funliday-style user experience. The redesign focuses on creating a planning-first, collaborative canvas with seamless drag-and-drop functionality, optimistic UI updates, automatic transport routing, time calculations, AI-assisted planning, and real-time co-editing—all while maintaining existing features like offline mode and collaborative editing. The interface prioritizes mobile-first design with one-hand reachability and fully responsive layouts from iPhone SE to ultrawide desktop displays.

## Glossary

- **Trip Planner System**: The web application interface for creating and managing travel itineraries
- **Itinerary Canvas**: The central planning area where users build and organize their trip timeline
- **Timeline Panel**: The panel displaying the chronological list of places and activities grouped by day
- **Map Panel**: The collapsible panel showing an interactive map with place markers and routes
- **Place Item**: A draggable card (Attraction Card) representing a location or activity in the itinerary
- **Transport Segment**: The visual representation of travel between two places with mode, duration, and distance
- **Optimistic Update**: UI changes that occur immediately before server confirmation
- **Loading Spinner**: Visual indicator shown during database synchronization
- **Route Calculation**: Automatic computation of travel paths between consecutive places
- **Time Calculation**: Automatic computation of travel duration and arrival times
- **FAB**: Floating Action Button providing contextual quick actions
- **Day Header**: Section header displaying day information, date, weather, and summary statistics
- **Gap Indicator**: Visual element showing time gaps between activities with AI suggestions
- **Live Cursor**: Real-time indicator showing other users' editing positions
- **Inline Edit**: Direct editing of values without opening modal dialogs
- **Time Ruler**: Vertical timeline showing hours from 6 AM to 10 PM

## Requirements

### Requirement 1: Responsive Layout System

**User Story:** As a trip planner, I want the interface to adapt seamlessly across all my devices, so that I can plan trips on my phone, tablet, or desktop with an optimal experience.

#### Acceptance Criteria

1. WHILE viewing on mobile portrait (0-480px), THE Trip_Planner_System SHALL display a stacked layout with full-width Itinerary_Canvas and bottom-sheet Map_Panel
2. WHILE viewing on mobile landscape (481-768px), THE Trip_Planner_System SHALL display a split layout with 60% Itinerary_Canvas and 40% Map_Panel
3. WHILE viewing on tablet portrait (769-1024px), THE Trip_Planner_System SHALL display a split layout with 65% Itinerary_Canvas and 35% Map_Panel with vertical day list
4. WHILE viewing on tablet landscape (1025-1440px), THE Trip_Planner_System SHALL display a split layout with 70% Itinerary_Canvas and 30% Map_Panel with top tabs
5. WHILE viewing on desktop (>1440px), THE Trip_Planner_System SHALL display a flexible layout with 75% resizable Itinerary_Canvas and 25% dockable Map_Panel with max content width of 1200px
6. WHEN the user resizes the browser window, THE Trip_Planner_System SHALL transition smoothly between breakpoints without content overflow
7. THE Trip_Planner_System SHALL persist the layout preference in local storage
8. THE Trip_Planner_System SHALL use 8px baseline grid with 16dp mobile gutters, 24dp tablet gutters, and 32dp desktop gutters

### Requirement 2: Optimistic Drag-and-Drop

**User Story:** As a trip planner, I want to drag and drop places without waiting for server responses, so that I can quickly reorganize my itinerary.

#### Acceptance Criteria

1. WHEN the user drags a Place_Item, THE Trip_Planner_System SHALL display a visual drag preview
2. WHEN the user drops a Place_Item in a new position, THE Trip_Planner_System SHALL immediately update the UI to reflect the new order
3. WHEN a Place_Item is dropped, THE Trip_Planner_System SHALL display a Loading_Spinner on the affected item
4. WHILE the database update is pending, THE Trip_Planner_System SHALL allow further drag operations on other items
5. IF the database update fails, THEN THE Trip_Planner_System SHALL revert the Place_Item to its original position and display an error notification
6. WHEN the database update succeeds, THE Trip_Planner_System SHALL remove the Loading_Spinner and confirm the change
7. THE Trip_Planner_System SHALL queue multiple drag operations and process them sequentially

### Requirement 3: No Page Refresh

**User Story:** As a trip planner, I want all changes to happen without page reloads, so that I maintain my context and workflow.

#### Acceptance Criteria

1. WHEN the user performs any action, THE Trip_Planner_System SHALL update the UI without triggering a page refresh
2. WHEN data changes occur, THE Trip_Planner_System SHALL use client-side state management to update components
3. WHEN real-time updates arrive from other users, THE Trip_Planner_System SHALL merge changes without disrupting the current view
4. THE Trip_Planner_System SHALL maintain scroll position during updates
5. THE Trip_Planner_System SHALL preserve form input states during background updates

### Requirement 4: Automatic Transport Routing

**User Story:** As a trip planner, I want the system to automatically calculate routes between places, so that I can see travel paths and distances.

#### Acceptance Criteria

1. WHEN two consecutive Place_Items exist in the timeline, THE Trip_Planner_System SHALL calculate and display a Transport_Segment between them
2. WHEN the user changes the order of Place_Items, THE Trip_Planner_System SHALL recalculate all affected Transport_Segments
3. THE Trip_Planner_System SHALL display the transport mode icon (driving, walking, transit, flight) for each Transport_Segment
4. THE Trip_Planner_System SHALL show the calculated distance for each Transport_Segment
5. WHEN the user clicks a Transport_Segment, THE Trip_Planner_System SHALL allow manual selection of transport mode
6. THE Trip_Planner_System SHALL draw route polylines on the Map_Panel for each Transport_Segment
7. IF route calculation fails, THEN THE Trip_Planner_System SHALL display a straight line with a warning indicator

### Requirement 5: Automatic Time Calculations

**User Story:** As a trip planner, I want the system to calculate travel times and arrival times, so that I can plan realistic schedules.

#### Acceptance Criteria

1. WHEN a Place_Item has a departure time, THE Trip_Planner_System SHALL calculate the travel duration to the next Place_Item
2. WHEN travel duration is calculated, THE Trip_Planner_System SHALL compute and display the estimated arrival time at the next Place_Item
3. WHEN the user changes a Place_Item's time, THE Trip_Planner_System SHALL recalculate all subsequent times in the day
4. THE Trip_Planner_System SHALL display travel duration in hours and minutes format
5. THE Trip_Planner_System SHALL account for the selected transport mode when calculating travel time
6. WHEN transport mode changes, THE Trip_Planner_System SHALL update travel duration and arrival times
7. THE Trip_Planner_System SHALL highlight time conflicts when activities overlap

### Requirement 6: Enhanced Itinerary Canvas

**User Story:** As a trip planner, I want a clean, organized timeline view with inline editing capabilities, so that I can quickly build and modify my itinerary without interruptions.

#### Acceptance Criteria

1. THE Itinerary_Canvas SHALL display Place_Items grouped by day with Day_Headers
2. THE Itinerary_Canvas SHALL show a Time_Ruler from 6 AM to 10 PM for each day
3. WHEN viewing a day, THE Day_Header SHALL display date, day of week, weather icon, and summary statistics (place count, total cost, total duration)
4. THE Itinerary_Canvas SHALL display each Place_Item as a card with 80x80px thumbnail, title, time badge, transport icon, and inline edit handles (✏️ ⏱️ 🗑️)
5. THE Itinerary_Canvas SHALL show Transport_Segments between Place_Items with mode icon, duration, and distance
6. THE Itinerary_Canvas SHALL display Gap_Indicators for time gaps exceeding 1.5 hours with AI suggestions
7. THE Itinerary_Canvas SHALL provide inline "Add Activity" buttons between cards
8. WHEN a Place_Item is being synced, THE Itinerary_Canvas SHALL display a Loading_Spinner overlay on that item
9. THE Itinerary_Canvas SHALL support collapsing and expanding day sections with smooth animations
10. THE Itinerary_Canvas SHALL use 12dp card padding on mobile and 16dp on desktop

### Requirement 7: Interactive Map Panel

**User Story:** As a trip planner, I want an interactive map that updates with my timeline, so that I can visualize my journey.

#### Acceptance Criteria

1. THE Map_Panel SHALL display markers for all Place_Items in the current day
2. WHEN the user selects a day in Timeline_Panel, THE Map_Panel SHALL update to show only that day's places
3. THE Map_Panel SHALL draw route polylines connecting consecutive Place_Items
4. WHEN the user clicks a marker on the map, THE Map_Panel SHALL highlight the corresponding Place_Item in Timeline_Panel
5. THE Map_Panel SHALL auto-zoom to fit all visible markers
6. THE Map_Panel SHALL display a mini info card when hovering over markers
7. THE Map_Panel SHALL support adding new places by clicking on the map

### Requirement 8: Loading States and Feedback

**User Story:** As a trip planner, I want clear visual feedback during operations, so that I know the system is working.

#### Acceptance Criteria

1. WHEN a database operation is in progress, THE Trip_Planner_System SHALL display a Loading_Spinner on the affected component
2. THE Trip_Planner_System SHALL use different spinner sizes for different operation types (small for item updates, large for page loads)
3. WHEN an operation completes successfully, THE Trip_Planner_System SHALL show a subtle success indicator
4. IF an operation fails, THEN THE Trip_Planner_System SHALL display an error message with retry option
5. THE Trip_Planner_System SHALL show a progress indicator for batch operations
6. WHEN offline, THE Trip_Planner_System SHALL display a distinct offline indicator on pending operations

### Requirement 9: Preserve Existing Features

**User Story:** As an existing user, I want all current features to continue working, so that I don't lose functionality.

#### Acceptance Criteria

1. THE Trip_Planner_System SHALL maintain offline mode functionality with local storage
2. THE Trip_Planner_System SHALL continue to support real-time collaborative editing
3. THE Trip_Planner_System SHALL preserve budget tracking integration
4. THE Trip_Planner_System SHALL maintain packing list functionality
5. THE Trip_Planner_System SHALL support all existing place types (attraction, food, hotel, transport)
6. THE Trip_Planner_System SHALL continue to sync changes when coming back online
7. THE Trip_Planner_System SHALL maintain trip sharing and QR code features

### Requirement 10: Performance Optimization

**User Story:** As a trip planner, I want the interface to respond instantly, so that I can work efficiently.

#### Acceptance Criteria

1. WHEN dragging a Place_Item, THE Trip_Planner_System SHALL update the UI within 16 milliseconds
2. WHEN calculating routes, THE Trip_Planner_System SHALL debounce requests to avoid excessive API calls
3. THE Trip_Planner_System SHALL cache route calculations for 5 minutes
4. THE Trip_Planner_System SHALL use virtual scrolling for timelines with more than 50 items
5. THE Trip_Planner_System SHALL lazy-load map tiles as the user pans
6. THE Trip_Planner_System SHALL preload the next day's data when viewing a day
7. THE Trip_Planner_System SHALL limit concurrent route calculations to 3 requests

### Requirement 11: Responsive Design

**User Story:** As a mobile user, I want the trip planner to work well on my phone, so that I can plan on the go.

#### Acceptance Criteria

1. WHILE viewing on screens smaller than 768 pixels, THE Trip_Planner_System SHALL switch to mobile layout
2. WHEN in mobile layout, THE Trip_Planner_System SHALL provide swipe gestures to switch between Timeline_Panel and Map_Panel
3. THE Trip_Planner_System SHALL optimize touch targets to be at least 44x44 pixels
4. THE Trip_Planner_System SHALL support pinch-to-zoom on the map
5. THE Trip_Planner_System SHALL use bottom sheets for editing Place_Items on mobile
6. THE Trip_Planner_System SHALL maintain drag-and-drop functionality with long-press on mobile

### Requirement 12: Accessibility

**User Story:** As a user with accessibility needs, I want to use the trip planner with assistive technologies, so that I can plan trips independently.

#### Acceptance Criteria

1. THE Trip_Planner_System SHALL provide keyboard navigation for all drag-and-drop operations
2. THE Trip_Planner_System SHALL announce drag-and-drop state changes to screen readers
3. THE Trip_Planner_System SHALL maintain focus management during optimistic updates
4. THE Trip_Planner_System SHALL provide text alternatives for all visual indicators
5. THE Trip_Planner_System SHALL support high contrast mode
6. THE Trip_Planner_System SHALL ensure all interactive elements have accessible names
7. THE Trip_Planner_System SHALL support Dynamic Type scaling from 100% to 200%
8. THE Trip_Planner_System SHALL ensure color contrast ratio of at least 4.5:1 for all text

### Requirement 13: Inline Editing System

**User Story:** As a trip planner, I want to edit place details directly without opening modals, so that I can make quick changes without losing context.

#### Acceptance Criteria

1. WHEN the user taps a time badge, THE Trip_Planner_System SHALL display inline slider controls with 15-minute snap intervals
2. WHEN the user drags a time slider thumb, THE Trip_Planner_System SHALL provide haptic feedback on snap
3. WHEN the user adjusts a time, THE Trip_Planner_System SHALL auto-recalculate routes and times for subsequent places
4. WHEN the user taps a transport icon, THE Trip_Planner_System SHALL display a popover with transport mode options (🚗 🚶 🚇 ✈️)
5. WHEN the user taps the pencil icon, THE Trip_Planner_System SHALL open an inline edit panel for notes, cost, and tags
6. THE Trip_Planner_System SHALL save inline edits optimistically without requiring explicit save action
7. THE Trip_Planner_System SHALL limit inline edit modals to maximum 1.5 taps from initial state

### Requirement 14: Contextual FAB System

**User Story:** As a trip planner, I want quick access to relevant actions based on my current context, so that I can efficiently add content to my itinerary.

#### Acceptance Criteria

1. WHEN the Itinerary_Canvas is empty, THE Trip_Planner_System SHALL display a FAB with ➕ icon and "Start New Trip" action
2. WHEN the user is viewing an itinerary, THE Trip_Planner_System SHALL display a FAB with ➕ icon and "Add Attraction" action
3. WHEN the user is viewing a Gap_Indicator, THE Trip_Planner_System SHALL display a FAB with 🍽️ icon and "Quick Add: Meal / Rest" action
4. WHEN the Map_Panel is open, THE Trip_Planner_System SHALL display a FAB with 📍 icon and "Drop Pin Here" action
5. WHILE viewing on desktop, THE Trip_Planner_System SHALL show extended FAB with label and icon on hover
6. THE Trip_Planner_System SHALL position FAB in bottom-right corner with 16dp margin on mobile and 24dp on desktop

### Requirement 15: Real-Time Collaboration

**User Story:** As a trip planner collaborating with others, I want to see live updates and avoid conflicts, so that we can plan together seamlessly.

#### Acceptance Criteria

1. WHEN another user is editing a Place_Item, THE Trip_Planner_System SHALL display a Live_Cursor with colored dot and user name
2. WHEN another user makes a change, THE Trip_Planner_System SHALL display a change toast in top-right corner with description
3. WHEN a conflict occurs, THE Trip_Planner_System SHALL display a center overlay modal with side-by-side diff and options "Keep Mine / Theirs / Merge"
4. THE Trip_Planner_System SHALL display a presence bar at top of Itinerary_Canvas showing avatars and editing status
5. THE Trip_Planner_System SHALL support inline comment threads with 💬 bubble on Place_Items
6. THE Trip_Planner_System SHALL support @mentions in comments with user notifications
7. THE Trip_Planner_System SHALL resolve conflicts with zero data loss

### Requirement 16: AI-Assisted Planning

**User Story:** As a trip planner, I want intelligent suggestions to optimize my itinerary, so that I can create better travel plans with less effort.

#### Acceptance Criteria

1. WHEN a time gap exceeds 1.5 hours, THE Trip_Planner_System SHALL suggest meals, coffee stops, or scenic locations
2. WHEN the user completes a day plan, THE Trip_Planner_System SHALL analyze energy balance and warn if high activity is scheduled after 6 PM
3. WHEN the user adds place costs, THE Trip_Planner_System SHALL display live budget total in Day_Header with alerts when over budget
4. WHEN the user searches for places, THE Trip_Planner_System SHALL provide AI-ranked results based on context (e.g., "romantic dinner")
5. WHEN the user taps "AI Optimize Day" in Day_Header, THE Trip_Planner_System SHALL reorder places for minimum travel time and balanced energy
6. THE Trip_Planner_System SHALL display a "Why?" tooltip on every AI suggestion explaining the reasoning
7. THE Trip_Planner_System SHALL allow users to accept or dismiss AI suggestions with single tap

### Requirement 17: Day Management Controls

**User Story:** As a trip planner, I want flexible day management options, so that I can organize multi-day trips efficiently.

#### Acceptance Criteria

1. WHEN the user taps "+ New Day" after the last day tab, THE Trip_Planner_System SHALL create a new day with auto-generated name "Day X – Date"
2. WHEN the user long-presses a Day_Header, THE Trip_Planner_System SHALL offer "Split Day" option to divide into AM/PM sections with color split
3. WHEN the user selects "Duplicate Day" from three-dot menu, THE Trip_Planner_System SHALL copy all activities to a new day
4. WHEN the user taps "AI Optimize Day" button, THE Trip_Planner_System SHALL reorder activities for optimal routing and energy balance
5. THE Trip_Planner_System SHALL display day tabs as horizontal scrollable tabs on mobile portrait
6. THE Trip_Planner_System SHALL display day tabs as vertical pill list on mobile landscape
7. THE Trip_Planner_System SHALL display day tabs as vertical sidebar on desktop

### Requirement 18: Map Panel Interactions

**User Story:** As a trip planner, I want a collapsible map with rich interactions, so that I can visualize my route without cluttering the interface.

#### Acceptance Criteria

1. WHEN the Map_Panel is closed, THE Trip_Planner_System SHALL show a FAB with map icon to reopen
2. WHEN the user pulls up the Map_Panel on mobile, THE Trip_Planner_System SHALL display a 30% height peek state
3. WHEN the user fully expands the Map_Panel, THE Trip_Planner_System SHALL display 100% height on mobile or docked right on desktop
4. THE Trip_Planner_System SHALL draw color-coded route lines per day on the map
5. WHEN the user taps the map, THE Trip_Planner_System SHALL display "Add to itinerary?" modal with pin drop
6. THE Trip_Planner_System SHALL provide a commute toggle to show/hide walking paths
7. THE Trip_Planner_System SHALL provide a live traffic layer toggle in settings

### Requirement 19: Typography and Visual Design

**User Story:** As a user, I want a polished, professional interface with clear visual hierarchy, so that I can easily read and navigate the application.

#### Acceptance Criteria

1. WHILE running on iOS, THE Trip_Planner_System SHALL use SF Pro Display Bold 28-34 for display text, SF Pro Text Semibold 20 for headlines, SF Pro Text Regular 16 for body, and SF Pro Text Regular 13 for captions
2. WHILE running on Android, THE Trip_Planner_System SHALL use Roboto Black 28-34 for display text, Roboto Medium 20 for headlines, Roboto Regular 16 for body, and Roboto Regular 13 for captions
3. WHILE running on web, THE Trip_Planner_System SHALL use Inter Bold for display text, Inter Semibold for headlines, Inter Regular for body, and Inter Regular for captions
4. THE Trip_Planner_System SHALL use primary color #0066FF for buttons, active states, and day headers
5. THE Trip_Planner_System SHALL use success color #00C853 for confirmed actions and optimized routes
6. THE Trip_Planner_System SHALL use warning color #FF9800 for conflicts and time gaps exceeding 2 hours
7. THE Trip_Planner_System SHALL use error color #F44336 for overlaps and unsaved changes
8. WHEN dark mode is enabled, THE Trip_Planner_System SHALL invert neutral colors and reduce saturation by 20%

### Requirement 20: Localization for Hong Kong

**User Story:** As a Hong Kong user, I want the interface in my preferred language with local conventions, so that I can use the app naturally.

#### Acceptance Criteria

1. THE Trip_Planner_System SHALL support English, Traditional Chinese (繁體中文), and Simplified Chinese (简体中文)
2. WHEN the user is in Hong Kong, THE Trip_Planner_System SHALL auto-detect and default to Traditional Chinese
3. THE Trip_Planner_System SHALL display currency in HKD by default with toggle option in settings
4. THE Trip_Planner_System SHALL use kilometers for distance, Celsius for temperature, and 24-hour clock format
5. THE Trip_Planner_System SHALL provide language toggle in settings accessible within 2 taps
6. THE Trip_Planner_System SHALL translate all UI elements, error messages, and AI suggestions to selected language
