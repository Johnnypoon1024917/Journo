# Implementation Plan: Community Threads Feed

## Overview

This implementation plan breaks down the community threads feed feature into discrete coding tasks. The approach follows an incremental strategy: database → backend API → frontend components → real-time integration → testing. Each task builds on previous work to ensure continuous integration without orphaned code.

## Tasks

- [x] 1. Database schema and migrations
  - Create migration file for all community-related tables
  - Add indexes for performance optimization
  - Create database functions for engagement score calculation
  - Test migration rollback and re-application
  - _Requirements: 1.1, 2.1, 4.1, 8.1, 12.1_

- [x] 2. Backend: Community service layer
  - [x] 2.1 Implement CommunityService class with feed generation methods
    - Implement generateForYouFeed with engagement scoring
    - Implement generateFollowingFeed with user filtering
    - Implement getCommunityPosts with community filtering
    - Implement cursor-based pagination logic
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 7.1, 7.3, 8.5_
  
  - [ ]* 2.2 Write property test for engagement score calculation
    - **Property 21: Engagement score calculation**
    - **Validates: Requirements 5.1, 5.2, 5.3**
  
  - [ ]* 2.3 Write property test for feed ordering
    - **Property 22: For You feed ordering**
    - **Validates: Requirements 5.4**
  
  - [x] 2.4 Implement post CRUD operations
    - Implement createPost with validation and sanitization
    - Implement getPostById with engagement data
    - Implement updatePost with ownership check
    - Implement deletePost with cascade logic
    - Implement getPostReplies with threading
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 1.8, 2.1, 2.2_
  
  - [ ]* 2.5 Write property test for XSS sanitization
    - **Property 2: XSS sanitization**
    - **Validates: Requirements 1.2**
  
  - [ ]* 2.6 Write property test for content length validation
    - **Property 3: Content length validation**
    - **Validates: Requirements 1.3**
  
  - [ ]* 2.7 Write property test for cascade deletion
    - **Property 8: Cascade deletion of replies**
    - **Validates: Requirements 1.8, 2.5**
  
  - [x] 2.8 Implement engagement actions
    - Implement likePost and unlikePost with count updates
    - Implement repostPost and unrepostPost with count updates
    - Implement bookmarkPost and unbookmarkPost
    - Update engagement score after each action
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [ ]* 2.9 Write property test for like action round trip
    - **Property 16: Like action round trip**
    - **Validates: Requirements 4.1, 4.2**
  
  - [x] 2.10 Implement trip embed integration
    - Create fetchTripSummary method to get trip data
    - Handle trip not found gracefully
    - Cache trip summaries in Redis
    - _Requirements: 3.1_
  
  - [ ]* 2.11 Write property test for trip summary fetching
    - **Property 13: Trip summary fetching**
    - **Validates: Requirements 3.1**

- [x] 3. Backend: Cache layer integration
  - [x] 3.1 Implement feed caching with Redis
    - Create cache key generation for feeds
    - Implement getCachedFeed and cacheFeed methods
    - Set 2-minute TTL for feed cache
    - Implement cache invalidation on new posts
    - _Requirements: 5.5, 5.6_
  
  - [ ]* 3.2 Write property test for cache hit behavior
    - **Property 23: Feed cache hit**
    - **Validates: Requirements 5.5**
  
  - [x] 3.3 Implement trending cache
    - Create trending posts calculation
    - Cache trending results with immediate invalidation
    - Implement trending communities calculation
    - _Requirements: 11.1, 11.2, 11.4, 11.5_
  
  - [ ]* 3.4 Write property test for trending post identification
    - **Property 43: Trending post identification**
    - **Validates: Requirements 11.1**

- [x] 4. Backend: Rate limiting and content sanitization
  - [x] 4.1 Implement rate limiting middleware for post creation
    - Use express-rate-limit with Redis store
    - Set 5 posts per hour per user limit
    - Return 429 with Retry-After header
    - _Requirements: 1.6_
  
  - [ ]* 4.2 Write property test for rate limiting enforcement
    - **Property 6: Rate limiting enforcement**
    - **Validates: Requirements 1.6**
  
  - [x] 4.3 Implement content sanitization
    - Use DOMPurify or similar library
    - Sanitize post content before storage
    - Remove script tags, event handlers, javascript: URLs
    - _Requirements: 1.2_

- [x] 5. Backend: Community controller and routes
  - [x] 5.1 Implement CommunityController with all endpoints
    - Implement feed endpoints (getForYouFeed, getFollowingFeed, getCommunityFeed, getTrendingPosts)
    - Implement post CRUD endpoints
    - Implement engagement action endpoints
    - Implement community management endpoints
    - Implement search endpoints
    - Implement moderation endpoints
    - _Requirements: All backend requirements_
  
  - [x] 5.2 Create community routes with authentication middleware
    - Define all routes with proper HTTP methods
    - Apply authentication middleware to protected routes
    - Apply rate limiting to post creation routes
    - Apply validation middleware to all routes
    - _Requirements: All backend requirements_
  
  - [ ]* 5.3 Write integration tests for API endpoints
    - Test post creation flow end-to-end
    - Test engagement action flow
    - Test feed pagination
    - Test error handling

- [x] 6. Backend: Search and discovery
  - [x] 6.1 Implement search functionality
    - Implement searchPosts with full-text search
    - Implement searchCommunities with name/description matching
    - Implement relevance scoring for search results
    - Add search result highlighting
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [ ]* 6.2 Write property test for search result matching
    - **Property 39: Search result matching**
    - **Validates: Requirements 10.1**
  
  - [x] 6.3 Implement tag filtering
    - Implement getPostsByTag endpoint
    - Parse hashtags from post content
    - Store tags in array field
    - _Requirements: 20.2, 20.5_
  
  - [ ]* 6.4 Write property test for hashtag parsing
    - **Property 87: Hashtag parsing**
    - **Validates: Requirements 20.2**
  
  - [x] 6.5 Implement trip publishing endpoint
    - Create publishTripToCommunity endpoint
    - Auto-generate summary text from trip title and destinations
    - Extract and add destination tags automatically
    - Mark trip as shared in database
    - _Requirements: 21.3, 21.5, 21.7_
  
  - [ ]* 6.6 Write property test for auto-generated trip summary
    - **Property 93: Auto-generated trip summary**
    - **Validates: Requirements 21.3**
  
  - [ ]* 6.7 Write property test for automatic destination tagging
    - **Property 95: Automatic destination tagging**
    - **Validates: Requirements 21.5**

- [x] 7. Backend: Content moderation
  - [x] 7.1 Implement reporting system
    - Implement reportPost endpoint
    - Implement getReports endpoint for moderators
    - Implement reviewReport endpoint
    - Implement automatic flagging for multiple reports
    - _Requirements: 12.1, 12.2, 12.3_
  
  - [ ]* 7.2 Write property test for report record creation
    - **Property 48: Report record creation**
    - **Validates: Requirements 12.1**
  
  - [ ]* 7.3 Write property test for multiple report flagging
    - **Property 49: Multiple report flagging**
    - **Validates: Requirements 12.2**

- [x] 8. Backend: Socket.IO integration
  - [x] 8.1 Extend socketService with community events
    - Implement emitNewPost for broadcasting new posts
    - Implement emitPostUpdated for post updates
    - Implement emitPostDeleted for deletions
    - Implement emitEngagementUpdate for like/repost counts
    - Implement emitNewReply for thread replies
    - Implement emitCommunityJoined and emitCommunityLeft
    - _Requirements: 2.4, 4.7, 9.1, 9.2, 9.3, 9.4_
  
  - [ ]* 8.2 Write property test for real-time broadcasting
    - **Property 12: Real-time reply broadcasting**
    - **Validates: Requirements 2.4, 9.3**
  
  - [x] 8.3 Implement socket room management for communities
    - Create community rooms (community:{id})
    - Join/leave rooms on community membership changes
    - Broadcast to community rooms
    - _Requirements: 9.1, 9.4_

- [x] 9. Checkpoint - Backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Frontend: TypeScript types and interfaces
  - [x] 10.1 Create community type definitions
    - Define Post, Community, CommunityMember interfaces
    - Define Like, Repost, Bookmark, Report interfaces
    - Define PostWithEngagement, TripSummary interfaces
    - Define FeedResult, EngagementData interfaces
    - Create in frontend/src/types/community.ts
    - _Requirements: All frontend requirements_

- [x] 11. Frontend: Community service layer
  - [x] 11.1 Implement communityService API client
    - Implement feed fetching methods (getForYouFeed, getFollowingFeed, getCommunityFeed)
    - Implement post CRUD methods
    - Implement engagement action methods
    - Implement community management methods
    - Implement search methods
    - Implement moderation methods
    - Use axios with authentication headers
    - Create in frontend/src/services/communityService.ts
    - _Requirements: All frontend requirements_

- [x] 12. Frontend: Community store with Zustand
  - [x] 12.1 Implement communityStore with state and actions
    - Define feed state (forYouFeed, followingFeed, communityFeeds, trendingPosts)
    - Define pagination cursors and loading states
    - Implement fetchForYouFeed, fetchFollowingFeed, fetchCommunityFeed actions
    - Implement post CRUD actions
    - Implement engagement actions with optimistic updates
    - Implement real-time update handlers
    - Create in frontend/src/stores/communityStore.ts
    - _Requirements: 4.5, 4.6, 9.5_
  
  - [ ]* 12.2 Write property test for optimistic UI updates
    - **Property 19: Optimistic UI updates**
    - **Validates: Requirements 4.5**
  
  - [ ]* 12.3 Write unit tests for store actions
    - Test fetchForYouFeed with pagination
    - Test optimistic like/unlike
    - Test revert on error

- [x] 13. Frontend: Custom hooks
  - [x] 13.1 Implement useCommunityFeed hook
    - Accept feedType and communityId options
    - Return posts, isLoading, hasMore, loadMore, refresh
    - Implement infinite scroll logic
    - Create in frontend/src/hooks/useCommunityFeed.ts
    - _Requirements: 7.5, 7.6_
  
  - [ ]* 13.2 Write property test for pagination deduplication
    - **Property 29: Pagination deduplication**
    - **Validates: Requirements 7.6**
  
  - [x] 13.3 Implement usePostActions hook
    - Accept postId parameter
    - Return like, unlike, repost, unrepost, bookmark, unbookmark methods
    - Return isLiked, isReposted, isBookmarked states
    - Handle optimistic updates
    - Create in frontend/src/hooks/usePostActions.ts
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 13.4 Implement useCommunitySocket hook
    - Subscribe to community socket events on mount
    - Update store when events received
    - Handle reconnection
    - Create in frontend/src/hooks/useCommunitySocket.ts
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [ ]* 13.5 Write property test for automatic reconnection
    - **Property 38: Automatic reconnection**
    - **Validates: Requirements 9.6**
  
  - [x] 13.6 Implement useCommunitySearch hook
    - Accept searchType option (posts or communities)
    - Return query, setQuery, results, isSearching
    - Implement debounced search
    - Create in frontend/src/hooks/useCommunitySearch.ts
    - _Requirements: 10.1, 10.3_

- [x] 14. Frontend: Thread card component
  - [x] 14.1 Implement ThreadCard component
    - Display author avatar and name
    - Display post content with expand/collapse for long text
    - Display trip embed accordion if present
    - Display media carousel if present
    - Display tags as clickable links
    - Display engagement bar (like/reply/repost/bookmark buttons)
    - Display nested replies with visual connectors
    - Create in frontend/src/components/community/ThreadCard.tsx
    - _Requirements: 2.3, 3.2, 3.3, 19.1, 19.2, 20.3_
  
  - [ ]* 14.2 Write property test for nested reply rendering
    - **Property 11: Nested reply rendering**
    - **Validates: Requirements 2.3**
  
  - [ ]* 14.3 Write unit tests for ThreadCard
    - Test post content display
    - Test engagement button clicks
    - Test trip embed accordion
    - Test media carousel

- [x] 15. Frontend: Community composer component
  - [x] 15.1 Implement CommunityComposer modal
    - Display textarea with character count (500 max)
    - Display trip selector dropdown
    - Display media upload with preview (4 max)
    - Display tag autocomplete
    - Display community selector
    - Display submit button
    - Handle form validation
    - Support pre-populated trip embed for trip publishing
    - Create in frontend/src/components/community/CommunityComposer.tsx
    - _Requirements: 1.3, 1.4, 1.5, 8.3, 20.1, 21.2, 21.4_
  
  - [ ]* 15.2 Write property test for tag autocomplete
    - **Property 86: Tag autocomplete suggestions**
    - **Validates: Requirements 20.1**
  
  - [ ]* 15.3 Write unit tests for CommunityComposer
    - Test character count validation
    - Test media upload limit
    - Test form submission
    - Test pre-populated trip embed
  
  - [x] 15.4 Implement ShareTripButton component
    - Display "Share to Community" button on trip details page
    - Show "Shared" status if trip already published
    - Open composer with pre-populated trip data
    - Create in frontend/src/components/trips/ShareTripButton.tsx
    - _Requirements: 21.1, 21.2, 21.7_
  
  - [ ]* 15.5 Write property test for Share to Community button visibility
    - **Property 91: Share to Community button visibility**
    - **Validates: Requirements 21.1**
  
  - [ ]* 15.6 Write property test for pre-populated composer
    - **Property 92: Pre-populated composer on trip share**
    - **Validates: Requirements 21.2**

- [x] 16. Frontend: Community page layout
  - [x] 16.1 Implement Community page component
    - Create fixed header with search bar
    - Create tab navigation (For You / Following)
    - Create infinite scroll feed container
    - Create floating action button (mobile)
    - Create sidebar with trending and communities (desktop)
    - Implement responsive layout breakpoints
    - Create in frontend/src/pages/Community.tsx
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_
  
  - [ ]* 16.2 Write property test for responsive layout
    - **Property 57: Mobile layout structure**
    - **Property 58: Desktop layout structure**
    - **Validates: Requirements 14.1, 14.2, 14.4, 14.5**
  
  - [ ]* 16.3 Write property test for tab scroll preservation
    - **Property 59: Tab scroll position preservation**
    - **Validates: Requirements 14.3**

- [x] 17. Frontend: Additional community components
  - [x] 17.1 Implement CommunityProfile component
    - Display community info (name, description, icon)
    - Display member count and post count
    - Display join/leave button
    - Create in frontend/src/components/community/CommunityProfile.tsx
    - _Requirements: 8.1, 8.2, 8.6_
  
  - [x] 17.2 Implement TrendingSidebar component
    - Display trending posts list
    - Display suggested communities list
    - Display joined communities list
    - Create in frontend/src/components/community/TrendingSidebar.tsx
    - _Requirements: 11.2, 11.3_
  
  - [x] 17.3 Implement SearchResults component
    - Display search results with highlighting
    - Display empty state with suggestions
    - Create in frontend/src/components/community/SearchResults.tsx
    - _Requirements: 10.4, 10.5_
  
  - [ ]* 17.4 Write property test for search result highlighting
    - **Property 42: Search result highlighting**
    - **Validates: Requirements 10.4**

- [x] 18. Frontend: Media handling components
  - [x] 18.1 Implement MediaCarousel component
    - Display swipeable carousel for multiple media
    - Display pagination dots
    - Handle click to open lightbox
    - Create in frontend/src/components/community/MediaCarousel.tsx
    - _Requirements: 19.1, 19.2, 19.3_
  
  - [ ]* 18.2 Write property test for carousel pagination
    - **Property 83: Carousel pagination dots**
    - **Validates: Requirements 19.2**
  
  - [x] 18.3 Implement MediaLightbox component
    - Display fullscreen media view
    - Handle close with X button and ESC key
    - Handle navigation between media items
    - Create in frontend/src/components/community/MediaLightbox.tsx
    - _Requirements: 19.3, 19.4_
  
  - [ ]* 18.4 Write property test for lightbox closing
    - **Property 85: Lightbox closing**
    - **Validates: Requirements 19.4**

- [x] 19. Frontend: Trip embed component
  - [x] 19.1 Implement TripEmbed component
    - Display trip summary in accordion
    - Display mini map with destinations on expand
    - Handle trip not found gracefully
    - Display "Full Trip" badge for published trips
    - Provide link to full trip itinerary
    - Create in frontend/src/components/community/TripEmbed.tsx
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 21.6, 21.8_
  
  - [ ]* 19.2 Write property test for trip embed rendering
    - **Property 14: Trip embed accordion rendering**
    - **Validates: Requirements 3.2**
  
  - [ ]* 19.3 Write unit tests for TripEmbed
    - Test accordion expand/collapse
    - Test map rendering
    - Test error fallback
    - Test "Full Trip" badge display
    - Test full trip link navigation
  
  - [ ]* 19.4 Write property test for Full Trip badge display
    - **Property 96: Full Trip badge display**
    - **Validates: Requirements 21.6**
  
  - [ ]* 19.5 Write property test for full trip itinerary link
    - **Property 98: Full trip itinerary link**
    - **Validates: Requirements 21.8**

- [x] 20. Frontend: Offline support
  - [x] 20.1 Implement offline queue service
    - Queue engagement actions in local storage when offline
    - Sync queued actions on reconnection
    - Handle sync failures with retry
    - Create in frontend/src/services/offlineCommunityService.ts
    - _Requirements: 13.1, 13.3, 13.4_
  
  - [ ]* 20.2 Write property test for offline action queueing
    - **Property 53: Offline action queueing**
    - **Validates: Requirements 13.1**
  
  - [ ]* 20.3 Write property test for offline sync
    - **Property 55: Offline sync on reconnection**
    - **Validates: Requirements 13.3**
  
  - [x] 20.2 Implement offline feed caching
    - Cache feed data in IndexedDB
    - Display cached posts when offline
    - Update cache on successful fetches
    - _Requirements: 13.5_
  
  - [ ]* 20.5 Write property test for offline cached access
    - **Property 56: Offline cached post access**
    - **Validates: Requirements 13.5**

- [x] 21. Frontend: Accessibility implementation
  - [x] 21.1 Add keyboard navigation support
    - Add focus indicators to all interactive elements
    - Implement keyboard shortcuts (j/k for navigation, l for like, etc.)
    - Ensure proper tab order
    - _Requirements: 15.1_
  
  - [ ]* 21.2 Write property test for keyboard focus indicators
    - **Property 60: Keyboard focus indicators**
    - **Validates: Requirements 15.1**
  
  - [x] 21.3 Add ARIA labels and roles
    - Add aria-label to all buttons
    - Add role attributes to custom components
    - Add aria-live regions for real-time updates
    - _Requirements: 15.2, 15.4_
  
  - [ ]* 21.4 Write property test for ARIA compliance
    - **Property 63: ARIA labels and roles**
    - **Validates: Requirements 15.4**
  
  - [x] 21.5 Add alt text to all images
    - Generate descriptive alt text for media
    - Add alt text to user avatars
    - _Requirements: 15.3_
  
  - [ ]* 21.6 Write property test for image alt text
    - **Property 62: Image alt text**
    - **Validates: Requirements 15.3**
  
  - [x] 21.7 Ensure non-color information indicators
    - Add icons to engagement buttons
    - Add text labels to status indicators
    - _Requirements: 15.5_
  
  - [x] 21.8 Add form label associations
    - Associate labels with inputs in composer
    - Add aria-labelledby to search input
    - _Requirements: 15.6_

- [x] 22. Frontend: Performance optimizations
  - [x] 22.1 Implement list virtualization
    - Use react-window or react-virtualized for feed
    - Render only visible posts plus buffer
    - _Requirements: 16.3_
  
  - [ ]* 22.2 Write property test for list virtualization
    - **Property 67: List virtualization**
    - **Validates: Requirements 16.3**
  
  - [x] 22.3 Implement image lazy loading
    - Use Intersection Observer for lazy loading
    - Load images as they enter viewport
    - _Requirements: 16.4_
  
  - [ ]* 22.4 Write property test for image lazy loading
    - **Property 68: Image lazy loading**
    - **Validates: Requirements 16.4**
  
  - [x] 22.5 Implement scroll debouncing
    - Debounce scroll handlers to 100ms
    - Use lodash.debounce or custom implementation
    - _Requirements: 16.5_
  
  - [x] 22.6 Optimize animations with CSS transforms
    - Use transform and opacity for animations
    - Avoid animating layout properties
    - _Requirements: 16.6_

- [x] 23. Frontend: Notification system integration
  - [x] 23.1 Implement notification handling
    - Listen for notification socket events
    - Display toast notifications
    - Handle notification clicks for navigation
    - Mark notifications as read
    - Create in frontend/src/components/community/CommunityNotifications.tsx
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_
  
  - [ ]* 23.2 Write property test for notification delivery
    - **Property 73: Real-time notification delivery**
    - **Validates: Requirements 17.3**
  
  - [ ]* 23.3 Write property test for notification navigation
    - **Property 75: Notification navigation**
    - **Validates: Requirements 17.5**

- [x] 24. Frontend: Analytics integration
  - [x] 24.1 Implement analytics tracking
    - Track post views with Intersection Observer
    - Track engagement actions
    - Track community joins
    - Track searches
    - Implement event batching (30 second intervals)
    - Create in frontend/src/services/communityAnalyticsService.ts
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_
  
  - [ ]* 24.2 Write property test for analytics batching
    - **Property 81: Analytics event batching**
    - **Validates: Requirements 18.5**

- [x] 25. Frontend: Moderation UI
  - [x] 25.1 Implement report modal
    - Display report button on posts
    - Display reason options
    - Submit report to backend
    - Create in frontend/src/components/community/ReportModal.tsx
    - _Requirements: 12.1, 12.5_
  
  - [x] 25.2 Implement moderation dashboard (admin only)
    - Display pending reports
    - Allow reviewing and dismissing reports
    - Allow removing posts
    - Create in frontend/src/pages/CommunityModeration.tsx
    - _Requirements: 12.2, 12.3, 12.4_

- [x] 26. Checkpoint - Frontend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 27. Integration: Wire backend and frontend
  - [x] 27.1 Add community routes to backend router
    - Import community routes in backend/src/index.ts
    - Mount routes at /api/community
    - Test all endpoints with Postman or similar
    - _Requirements: All backend requirements_
  
  - [x] 27.2 Add community route to frontend router
    - Add /community route in frontend routing
    - Add navigation link in header
    - Test navigation and deep linking
    - _Requirements: All frontend requirements_
  
  - [x] 27.3 Connect socket events
    - Initialize community socket listeners on app mount
    - Test real-time updates across multiple browser tabs
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 28. Integration: End-to-end testing
  - [ ]* 28.1 Write E2E test for post creation flow
    - Test creating post with text, trip embed, and media
    - Verify post appears in feed
    - Verify real-time broadcast to other clients
  
  - [ ]* 28.2 Write E2E test for engagement flow
    - Test liking, reposting, bookmarking
    - Verify optimistic updates
    - Verify real-time count updates
  
  - [ ]* 28.3 Write E2E test for threading flow
    - Test creating replies
    - Verify nested display
    - Verify real-time reply broadcast
  
  - [ ]* 28.4 Write E2E test for offline flow
    - Test going offline
    - Test queueing actions
    - Test reconnection and sync
  
  - [ ]* 28.5 Write E2E test for search flow
    - Test searching posts and communities
    - Verify result highlighting
    - Verify empty state

- [x] 29. Polish: UI/UX refinements
  - [x] 29.1 Apply BubbleQuest theme styling
    - Use pastel colors (pink/blue accents)
    - Add subtle bubble animations
    - Ensure minimalist Threads-like design
    - Match existing BubbleQuest design system
    - _Requirements: All UI requirements_
  
  - [x] 29.2 Add loading skeletons
    - Add skeleton loaders for feed
    - Add skeleton loaders for post cards
    - Add skeleton loaders for sidebar
  
  - [x] 29.3 Add empty states
    - Add empty state for For You feed
    - Add empty state for Following feed (suggest users to follow)
    - Add empty state for community feed
    - Add empty state for search results
    - _Requirements: 6.4, 10.5_
  
  - [x] 29.4 Add error states
    - Add error state for failed feed loads
    - Add error state for failed post creation
    - Add error state for failed engagement actions
    - Add retry buttons for recoverable errors
  
  - [x] 29.5 Add animations and transitions
    - Add fade-in for new posts
    - Add slide-in for composer modal
    - Add smooth scroll for navigation
    - Use CSS transforms for 60fps performance

- [x] 30. Final checkpoint - Complete feature
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at major milestones
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows across components
- The implementation follows a bottom-up approach: database → backend → frontend → integration
- Real-time features are integrated after core functionality is working
- Performance optimizations and polish are done last to avoid premature optimization
