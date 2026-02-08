# Implementation Plan

## Core Infrastructure

- [x] 1. Set up optimistic update infrastructure
  - Create OptimisticUpdateManager service with queue and rollback
  - Implement sync queue with IndexedDB persistence
  - Add loading state management to place store
  - Create error handling utilities with retry logic
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.1, 3.2, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 2. Create route calculation service
  - Implement RouteCalculationService with Google Maps Directions API
  - Add route caching with 5-minute TTL
  - Create fallback straight-line calculation
  - Implement debouncing for route requests
  - Add transport mode selection logic
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 10.2, 10.3, 10.7_

- [x] 3. Create time calculation service
  - Implement TimeCalculationService for travel duration
  - Add arrival time computation logic
  - Create cascade update function for subsequent times
  - Implement time conflict detection
  - Add transport mode time multipliers
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 4. Enhance data models
  - Add new fields to Place model (calculatedArrivalTime, travelTimeFromPrevious, etc.)
  - Create TransportRoute model
  - Create SyncQueueItem model
  - Add database migrations for new fields
  - Update TypeScript types
  - _Requirements: 2.1, 4.1, 5.1, 9.1_

## Layout Components

- [x] 5. Create TripPlannerLayout component
  - Build responsive split-screen container
  - Implement panel resizing with drag handle
  - Add mobile layout with swipe navigation
  - Create layout preference persistence
  - Add keyboard shortcuts (Ctrl+1 for timeline, Ctrl+2 for map)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 11.1, 11.2_

- [x] 6. Build TimelinePanel component
  - Create scrollable timeline container
  - Implement day grouping logic
  - Add quick action buttons (add place, transport, accommodation)
  - Create empty state for new trips
  - Add virtual scrolling for long timelines
  - _Requirements: 6.1, 6.2, 6.6, 6.7, 10.4_

- [x] 7. Build MapPanel component
  - Create Google Maps integration
  - Implement custom marker rendering
  - Add route polyline drawing
  - Create auto-zoom to fit markers
  - Add click-to-add-place functionality
  - Implement lazy loading for map tiles
  - _Requirements: 7.1, 7.2, 7.3, 7.5, 7.7, 10.5_

## Timeline Components

- [x] 8. Create DayGroup component
  - Build collapsible day section
  - Add day header with date and statistics
  - Implement place list container
  - Create expand/collapse animation
  - Add day summary (total cost, duration, places count)
  - _Requirements: 6.1, 6.2, 6.7_

- [x] 9. Create PlaceCard component
  - Build place card with image, name, time, cost
  - Add drag handle for reordering
  - Implement loading spinner overlay
  - Create error state with retry button
  - Add quick edit and delete buttons
  - Implement touch-friendly design (44x44px targets)
  - _Requirements: 6.3, 8.1, 8.2, 8.3, 8.4, 11.3_

- [x] 10. Create TransportSegment component
  - Build transport info display (mode icon, duration, distance)
  - Add transport mode selector dropdown
  - Implement calculating state with spinner
  - Create error state for failed calculations
  - Add route preview on hover
  - _Requirements: 4.3, 4.4, 4.5, 6.4_

## Drag and Drop System

- [x] 11. Implement drag-and-drop with @dnd-kit
  - Set up DndContext with sensors
  - Create SortableContext for place list
  - Implement useSortable hook in PlaceCard
  - Add drag overlay with preview
  - Create drop animation
  - _Requirements: 2.1, 2.2_

- [x] 12. Add optimistic updates to drag-and-drop
  - Implement immediate UI reorder on drop
  - Add loading spinner to dragged item
  - Create API call for database update
  - Implement rollback on failure
  - Add success confirmation
  - Queue multiple drag operations
  - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 13. Add mobile drag-and-drop support
  - Implement long-press to initiate drag
  - Add haptic feedback on drag start
  - Create mobile-optimized drag preview
  - Implement auto-scroll during drag
  - _Requirements: 11.6_

## Route and Time Integration

- [x] 14. Integrate route calculation with timeline
  - Calculate routes when places are added or reordered
  - Update TransportSegment components with route data
  - Draw route polylines on map
  - Handle route calculation errors gracefully
  - Cache calculated routes
  - _Requirements: 4.1, 4.2, 4.6, 4.7_

- [x] 15. Integrate time calculation with timeline
  - Calculate travel times based on routes
  - Compute arrival times for each place
  - Update subsequent times when a time changes
  - Highlight time conflicts
  - Display time calculations in PlaceCard
  - _Requirements: 5.1, 5.2, 5.3, 5.7_

- [x] 16. Add transport mode selection
  - Create transport mode picker UI
  - Recalculate route when mode changes
  - Update travel time based on mode
  - Update map polyline style by mode
  - Persist transport mode preference
  - _Requirements: 4.5, 5.5, 5.6_

## Map Features

- [x] 17. Implement interactive map markers
  - Create custom markers with place type icons
  - Add marker click to select place
  - Implement marker hover with info card
  - Sync marker selection with timeline
  - Add marker clustering for dense areas
  - _Requirements: 7.1, 7.4, 7.6_

- [x] 18. Add route visualization on map
  - Draw polylines for transport routes
  - Color-code polylines by transport mode
  - Add direction arrows on routes
  - Implement route hover to highlight segment
  - Show route details in tooltip
  - _Requirements: 7.3, 4.6_

- [x] 19. Implement map interactions
  - Add click-to-add-place functionality
  - Create place search with autocomplete
  - Implement map bounds auto-adjustment
  - Add zoom controls
  - Support pinch-to-zoom on mobile
  - _Requirements: 7.7, 11.4_

## State Management

- [x] 20. Create trip planner store
  - Set up Zustand store for trip state
  - Add places array with CRUD operations
  - Implement drag state management
  - Create sync queue state
  - Add route cache state
  - _Requirements: 2.7, 3.2, 10.3_

- [x] 21. Implement real-time sync
  - Set up Supabase real-time subscriptions
  - Handle incoming place updates
  - Merge remote changes with local state
  - Resolve conflicts (last-write-wins)
  - Maintain scroll position during updates
  - _Requirements: 3.3, 3.4, 9.2_

- [x] 22. Add offline support
  - Queue operations when offline
  - Store queue in IndexedDB
  - Process queue when coming online
  - Show offline indicators on pending items
  - Handle sync conflicts
  - _Requirements: 8.6, 9.1, 9.6_

## Loading States and Feedback

- [x] 23. Implement loading indicators
  - Create reusable Spinner component (small, medium, large)
  - Add loading overlay for PlaceCard
  - Create skeleton loaders for initial load
  - Implement progress bar for batch operations
  - Add subtle success animations
  - _Requirements: 8.1, 8.2, 8.3, 8.5_

- [x] 24. Add error handling and notifications
  - Create toast notification system
  - Implement error messages with retry
  - Add error boundaries for component failures
  - Create offline notification banner
  - Implement undo functionality for destructive actions
  - _Requirements: 8.4, 8.6_

## Performance Optimization

- [x] 25. Optimize rendering performance
  - Implement React.memo for PlaceCard
  - Add useMemo for expensive calculations
  - Use useCallback for event handlers
  - Implement virtual scrolling for long lists
  - Optimize map marker rendering
  - _Requirements: 10.1, 10.4_

- [x] 26. Optimize API calls
  - Debounce route calculation requests
  - Implement request deduplication
  - Add request cancellation for stale requests
  - Batch multiple updates when possible
  - Limit concurrent route calculations
  - _Requirements: 10.2, 10.7_

- [x] 27. Implement caching strategies
  - Cache route calculations with TTL
  - Preload next day's data
  - Cache map tiles
  - Implement service worker for offline assets
  - Add cache invalidation logic
  - _Requirements: 10.3, 10.6_

## Responsive Design

- [x] 28. Implement mobile layout
  - Create stacked layout for mobile
  - Add swipe gestures for panel switching
  - Implement bottom sheet for place editing
  - Optimize touch targets (44x44px minimum)
  - Add mobile-specific navigation
  - _Requirements: 11.1, 11.2, 11.3, 11.5_

- [x] 29. Add responsive breakpoints
  - Define breakpoints (mobile: <768px, tablet: 768-1024px, desktop: >1024px)
  - Adjust panel widths by breakpoint
  - Optimize font sizes for mobile
  - Hide non-essential elements on small screens
  - Test on various devices
  - _Requirements: 1.3, 11.1_

## Accessibility

- [x] 30. Implement keyboard navigation
  - Add keyboard shortcuts for common actions
  - Implement arrow key navigation in timeline
  - Add Space/Enter for drag-and-drop
  - Create focus indicators
  - Implement skip links
  - _Requirements: 12.1, 12.3_

- [x] 31. Add screen reader support
  - Add ARIA labels to all interactive elements
  - Implement live regions for updates
  - Announce drag-and-drop state changes
  - Provide text alternatives for icons
  - Test with NVDA and VoiceOver
  - _Requirements: 12.2, 12.4, 12.6_

- [ ] 32. Ensure visual accessibility
  - Support high contrast mode
  - Ensure 4.5:1 color contrast ratio
  - Add focus visible styles
  - Support browser zoom up to 200%
  - Test with color blindness simulators
  - _Requirements: 12.5_

## Integration and Migration

- [ ] 33. Integrate with existing features
  - Connect budget tracking to place costs
  - Link packing list to trip
  - Maintain trip sharing functionality
  - Preserve QR code generation
  - Keep collaborative editing working
  - _Requirements: 9.2, 9.3, 9.4, 9.7_

- [x] 34. Create feature flag system
  - Add feature flag for new UI
  - Create toggle in settings
  - Implement A/B testing logic
  - Add analytics tracking
  - Create rollback mechanism
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [x] 35. Migrate existing data
  - Add new fields to existing places
  - Backfill transport routes for existing trips
  - Migrate place order to new system
  - Test data migration with production data
  - Create rollback script
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

## Testing

- [ ]* 36. Write unit tests
  - Test OptimisticUpdateManager rollback logic
  - Test RouteCalculationService with mocked API
  - Test TimeCalculationService calculations
  - Test PlaceCard rendering states
  - Test DayGroup expand/collapse
  - _Requirements: All requirements - validation_

- [ ]* 37. Write integration tests
  - Test drag-and-drop with database sync
  - Test route recalculation on reorder
  - Test time cascade updates
  - Test offline queue processing
  - Test real-time sync merging
  - _Requirements: All requirements - integration_

- [ ]* 38. Write E2E tests
  - Test complete trip planning flow
  - Test drag-and-drop with loading states
  - Test offline mode and sync
  - Test mobile responsive layout
  - Test keyboard navigation
  - _Requirements: All requirements - end-to-end validation_

## Documentation and Polish

- [ ]* 39. Create user documentation
  - Write guide for new drag-and-drop interface
  - Document transport mode selection
  - Explain time calculations
  - Create mobile usage guide
  - Add keyboard shortcuts reference
  - _Requirements: All requirements - user documentation_

- [ ] 40. Polish UI and animations
  - Add smooth transitions for drag-and-drop
  - Create loading animations
  - Add micro-interactions (hover effects, button feedback)
  - Implement success/error animations
  - Add empty state illustrations
  - _Requirements: 2.1, 8.2, 8.3_

- [ ] 41. Performance testing and optimization
  - Run Lighthouse audits
  - Test with 100+ places in timeline
  - Measure drag-and-drop performance
  - Test on low-end devices
  - Optimize bundle size
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_
# Additional Implementation Tasks

## Inline Editing System

- [x] 42. Implement inline time editor
  - Create InlineTimeEditor component with dual slider thumbs
  - Add 15-minute snap intervals with visual feedback
  - Implement haptic feedback on snap (mobile)
  - Auto-recalculate subsequent place times on change
  - Add visual time range indicator
  - _Requirements: 13.1, 13.2, 13.3, 13.6_

- [x] 43. Add inline transport mode selector
  - Create transport mode popover with icons (🚗 🚶 🚇 ✈️)
  - Implement tap-to-open behavior on transport icon
  - Recalculate route and time on mode change
  - Update map polyline style based on mode
  - Persist mode selection
  - _Requirements: 13.4, 4.5, 5.5, 5.6_

- [x] 44. Implement inline notes and cost editor
  - Create inline edit panel for notes, cost, and tags
  - Add tap-to-edit on pencil icon
  - Implement optimistic save without explicit save button
  - Add currency formatting (HKD default)
  - Support multi-line notes with auto-expand
  - _Requirements: 13.5, 13.6, 20.3_

## Contextual FAB System

- [ ] 45. Create contextual FAB component
  - Build FAB with context-aware icon and action
  - Implement context detection (empty, itinerary, gap, map)
  - Add extended FAB with label on desktop hover
  - Position in bottom-right with responsive margins
  - Add smooth transitions between contexts
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

- [ ] 46. Integrate FAB with itinerary canvas
  - Connect FAB to trip wizard for empty canvas
  - Connect FAB to place search for itinerary view
  - Connect FAB to quick-add menu for gap indicators
  - Connect FAB to pin-drop mode for map view
  - Add keyboard shortcut (Ctrl+N) for FAB action
  - _Requirements: 14.1, 14.2, 14.3, 14.4_

## Real-Time Collaboration

- [ ] 47. Implement live cursor system
  - Create LiveCursor component with colored dots
  - Add user name labels on cursors
  - Implement cursor position tracking via Supabase Realtime
  - Add cursor throttling (100ms updates)
  - Show "User is editing..." indicator on place cards
  - _Requirements: 15.1_

- [ ] 48. Build presence system
  - Create presence bar showing active users
  - Display user avatars with online status
  - Implement join/leave notifications
  - Add "X users editing" counter
  - Show editing status per user
  - _Requirements: 15.4_

- [ ] 49. Implement change notifications
  - Create toast notification system for changes
  - Display change description (e.g., "John moved Dinner → 7 PM")
  - Position toasts in top-right corner
  - Add auto-dismiss after 5 seconds
  - Stack multiple toasts vertically
  - _Requirements: 15.2_

- [ ] 50. Build conflict resolution system
  - Create conflict detection logic (concurrent edits)
  - Build conflict modal with side-by-side diff
  - Implement "Keep Mine / Theirs / Merge" options
  - Add conflict resolution with zero data loss
  - Test with simultaneous edits
  - _Requirements: 15.3, 15.7_

- [ ] 51. Add comment system
  - Create comment bubble component (💬)
  - Implement inline comment threads on place cards
  - Add @mention support with user autocomplete
  - Send notifications for @mentions
  - Store comments in Supabase
  - _Requirements: 15.5, 15.6_

## AI-Assisted Planning

- [ ] 52. Create AI suggestion service
  - Build AISuggestionService with gap-filling logic
  - Implement energy balance analyzer
  - Create day optimizer algorithm
  - Add smart search ranking
  - Implement suggestion explainability ("Why?" tooltips)
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

- [ ] 53. Implement gap indicator component
  - Create GapIndicator component for time gaps > 1.5h
  - Display AI suggestions (meals, coffee, scenic stops)
  - Add one-tap accept for suggestions
  - Implement dismiss functionality
  - Show gap duration prominently
  - _Requirements: 16.1, 16.7_

- [ ] 54. Add budget tracking with AI
  - Display live budget total in day header
  - Implement "Over by HK$X" alerts
  - Add budget visualization (progress bar)
  - Suggest budget-friendly alternatives when over
  - Support multiple currencies with HKD default
  - _Requirements: 16.3, 20.3_

- [ ] 55. Implement AI day optimizer
  - Add "AI Optimize Day" button to day header
  - Implement optimization algorithm (min travel + energy balance)
  - Show before/after preview
  - Allow user to accept or reject optimization
  - Explain optimization reasoning
  - _Requirements: 16.5, 16.6, 17.4_

- [ ] 56. Build smart search with AI ranking
  - Implement context-aware search (e.g., "romantic dinner")
  - Add AI ranking based on time, location, budget
  - Display ranking confidence scores
  - Support natural language queries
  - Cache search results
  - _Requirements: 16.4_

## Day Management

- [ ] 57. Implement day management controls
  - Add "+ New Day" button with auto-naming
  - Implement "Split Day" with AM/PM color split
  - Add "Duplicate Day" functionality
  - Create three-dot menu for day actions
  - Add day deletion with confirmation
  - _Requirements: 17.1, 17.2, 17.3_

- [ ] 58. Create responsive day tabs
  - Build horizontal scrollable tabs for mobile portrait
  - Create vertical pill list for mobile landscape
  - Implement vertical sidebar for desktop
  - Add active day highlighting
  - Support swipe gestures to switch days (mobile)
  - _Requirements: 17.5, 17.6, 17.7, 1.1, 1.2_

## Enhanced Map Features

- [ ] 59. Implement collapsible map panel
  - Create three-state map panel (closed, peek, full)
  - Add pull-up gesture for mobile
  - Implement 30% peek state on mobile
  - Add FAB to reopen when closed
  - Support docked mode on desktop
  - _Requirements: 18.1, 18.2, 18.3_

- [ ] 60. Add map interaction features
  - Implement pin drop with "Add to itinerary?" modal
  - Add commute toggle for walking paths
  - Create traffic layer toggle
  - Color-code route lines by day
  - Add route line hover effects
  - _Requirements: 18.4, 18.5, 18.6, 18.7_

## Typography and Visual Design

- [ ] 61. Implement design system
  - Create typography system (SF Pro / Roboto / Inter)
  - Implement platform-specific font loading
  - Add Dynamic Type support (100-200% scaling)
  - Create color palette with design tokens
  - Implement dark mode with 20% saturation reduction
  - _Requirements: 19.1, 19.2, 19.3, 19.8, 12.7_

- [ ] 62. Apply color system
  - Use primary-500 (#0066FF) for buttons and headers
  - Use success-500 (#00C853) for confirmations
  - Use warning-500 (#FF9800) for conflicts and gaps
  - Use error-500 (#F44336) for errors
  - Ensure 4.5:1 contrast ratio for all text
  - _Requirements: 19.4, 19.5, 19.6, 19.7, 12.8_

## Localization

- [ ] 63. Implement localization service
  - Create LocalizationService with language support
  - Add English, Traditional Chinese, Simplified Chinese
  - Implement auto-detect for Hong Kong (繁體中文)
  - Add language toggle in settings (≤2 taps)
  - Translate all UI elements and messages
  - _Requirements: 20.1, 20.2, 20.5, 20.6_

- [ ] 64. Add regional formatting
  - Implement HKD currency formatting
  - Use kilometers for distance
  - Use Celsius for temperature
  - Use 24-hour clock format
  - Add currency toggle in settings
  - _Requirements: 20.3, 20.4_

## Weather Integration

- [ ] 65. Add weather display
  - Integrate weather API for destination
  - Display weather icon and temperature in day header
  - Show forecast for each day
  - Add weather-based AI tips
  - Cache weather data for 1 hour
  - _Requirements: 6.3_

## Time Ruler

- [ ] 66. Implement time ruler
  - Create vertical time ruler (6 AM - 10 PM)
  - Add hour markers with labels
  - Align place cards with time ruler
  - Highlight current time
  - Support 24-hour format
  - _Requirements: 6.2, 20.4_

## Enhanced Responsive Design

- [ ] 67. Implement breakpoint system
  - Define 5 breakpoints (mobile portrait to desktop)
  - Create responsive layout switcher
  - Test on iPhone SE, iPad, foldables, ultrawide
  - Implement smooth transitions between breakpoints
  - Add max content width (1200px) for ultrawide
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8_

- [ ] 68. Apply spacing system
  - Implement 8px baseline grid
  - Use 16dp gutters on mobile
  - Use 24dp gutters on tablet
  - Use 32dp gutters on desktop
  - Apply 12dp card padding (mobile), 16dp (desktop)
  - _Requirements: 1.8_

## Polish and Micro-interactions

- [ ] 69. Add haptic feedback
  - Implement haptic on time slider snap
  - Add haptic on drag start (mobile)
  - Add haptic on successful action
  - Use platform-specific haptic APIs
  - Make haptic optional in settings
  - _Requirements: 13.2_

- [ ] 70. Enhance animations
  - Add smooth drag-and-drop animations
  - Create loading state transitions
  - Implement success/error animations
  - Add FAB context transition animations
  - Create day expand/collapse animations
  - _Requirements: 6.9_

## Testing and Validation

- [ ]* 71. Test inline editing system
  - Test time slider with 15-min snaps
  - Test transport mode switching
  - Test notes and cost editing
  - Verify optimistic saves
  - Test on mobile and desktop
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

- [ ]* 72. Test collaboration features
  - Test live cursors with multiple users
  - Test conflict resolution
  - Test comment threads and @mentions
  - Verify zero data loss
  - Test with poor network conditions
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

- [ ]* 73. Test AI suggestions
  - Test gap-filling suggestions
  - Test energy balance warnings
  - Test day optimization
  - Test smart search ranking
  - Verify "Why?" explanations
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

- [ ]* 74. Test localization
  - Test all three languages
  - Test auto-detect for Hong Kong
  - Test currency formatting (HKD)
  - Test distance/temperature/time formats
  - Verify all translations
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_

- [ ]* 75. Test responsive breakpoints
  - Test on iPhone SE (mobile portrait)
  - Test on iPhone landscape
  - Test on iPad portrait and landscape
  - Test on desktop (1440px, 1920px, 2560px)
  - Test on foldable devices
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
