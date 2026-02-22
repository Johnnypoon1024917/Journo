# Requirements Document: Community Threads Feed

## Introduction

This document specifies requirements for a Threads-like community feed feature for the Journo travel platform. The feature enables users to share travel stories, embed trip itineraries, engage through social interactions (likes, replies, reposts), join communities, and discover trending content through an infinite-scrolling mobile-first interface.

## Glossary

- **Community_Feed**: The main interface displaying posts from communities and followed users
- **Post**: A user-generated content item containing text, optional trip embeds, media, and tags
- **Thread**: A post and its nested replies forming a conversation tree
- **Trip_Embed**: A reference to a Journo trip itinerary displayed within a post
- **Engagement_Score**: A calculated metric combining likes, replies, reposts, and recency
- **Community**: A group that users can join to share posts within a specific topic
- **For_You_Feed**: An algorithmically sorted feed based on engagement scoring
- **Following_Feed**: A chronological feed of posts from followed users
- **Composer**: The interface for creating new posts
- **Backend_API**: The Node.js/Express server handling data operations
- **Frontend_Client**: The React/TypeScript web application
- **Socket_Server**: The Socket.IO server providing real-time updates
- **Content_Sanitizer**: The system component that removes malicious content from user input
- **Rate_Limiter**: The system component that restricts action frequency per user
- **Cache_Layer**: The Redis-based caching system for feed data

## Requirements

### Requirement 1: Post Creation and Management

**User Story:** As a user, I want to create posts with text, trip embeds, and media, so that I can share my travel experiences with the community.

#### Acceptance Criteria

1. WHEN a user submits a post with valid content, THE Backend_API SHALL create a Post record in the database
2. WHEN a user includes text in a post, THE Content_Sanitizer SHALL remove XSS vulnerabilities before storage
3. WHEN a post text exceeds 500 characters, THE Backend_API SHALL reject the post with a validation error
4. WHEN a user includes a trip_id in a post, THE Backend_API SHALL validate the trip exists and store the foreign key reference
5. WHEN a user uploads media files, THE Backend_API SHALL accept up to 4 media items and store their URLs in jsonb format
6. WHEN a user creates more than 5 posts within 1 hour, THE Rate_Limiter SHALL reject subsequent posts until the time window resets
7. WHEN a user edits their own post, THE Backend_API SHALL update the Post record and preserve the original created_at timestamp
8. WHEN a user deletes their own post, THE Backend_API SHALL mark the post as deleted and cascade delete all associated replies

### Requirement 2: Threaded Conversations

**User Story:** As a user, I want to reply to posts and view nested conversations, so that I can participate in discussions about travel experiences.

#### Acceptance Criteria

1. WHEN a user replies to a post, THE Backend_API SHALL create a new Post record with parent_id referencing the original post
2. WHEN retrieving a thread, THE Backend_API SHALL return all replies ordered by created_at ascending
3. WHEN a post has replies, THE Frontend_Client SHALL display nested replies with visual connectors showing the conversation hierarchy
4. WHEN a reply is created, THE Socket_Server SHALL broadcast the new reply to all clients viewing the parent thread
5. WHEN a parent post is deleted, THE Backend_API SHALL cascade delete all child replies

### Requirement 3: Trip Embeds

**User Story:** As a user, I want to embed my Journo trips in posts, so that I can showcase my itineraries alongside my travel stories.

#### Acceptance Criteria

1. WHEN a post contains a trip_id, THE Backend_API SHALL fetch trip summary data including dates, destinations, and budget
2. WHEN displaying a post with a trip embed, THE Frontend_Client SHALL render an accordion component showing trip details
3. WHEN a user expands a trip embed, THE Frontend_Client SHALL display a mini map with trip destinations
4. WHEN a trip is deleted, THE Backend_API SHALL maintain the post but mark the trip_id as invalid
5. WHEN fetching trip data fails, THE Frontend_Client SHALL display a fallback message indicating the trip is unavailable

### Requirement 4: Social Engagement Actions

**User Story:** As a user, I want to like, repost, and bookmark posts, so that I can interact with content and save posts for later.

#### Acceptance Criteria

1. WHEN a user likes a post, THE Backend_API SHALL create a Like record and increment the post's like count
2. WHEN a user unlikes a post, THE Backend_API SHALL delete the Like record and decrement the post's like count
3. WHEN a user reposts a post, THE Backend_API SHALL create a Repost record and increment the post's repost count
4. WHEN a user bookmarks a post, THE Backend_API SHALL create a Bookmark record for later retrieval
5. WHEN a user performs an engagement action, THE Frontend_Client SHALL update the UI optimistically before server confirmation
6. WHEN an engagement action fails, THE Frontend_Client SHALL revert the optimistic update and display an error message
7. WHEN an engagement count changes, THE Socket_Server SHALL broadcast the updated count to all clients viewing the post

### Requirement 5: For You Feed Algorithm

**User Story:** As a user, I want to see a personalized feed of engaging content, so that I can discover interesting travel stories.

#### Acceptance Criteria

1. WHEN calculating engagement score, THE Backend_API SHALL compute: (likes × 3) + (replies × 2) + reposts + recency_bonus
2. WHEN a post is less than 24 hours old, THE Backend_API SHALL add a recency bonus of 10 to the engagement score
3. WHEN a post is between 24-48 hours old, THE Backend_API SHALL add a recency bonus of 5 to the engagement score
4. WHEN fetching the For You feed, THE Backend_API SHALL return posts ordered by engagement score descending
5. WHEN the For You feed is requested, THE Cache_Layer SHALL serve cached results if available and less than 2 minutes old
6. WHEN cached feed data is older than 2 minutes, THE Backend_API SHALL recompute the feed and update the cache

### Requirement 6: Following Feed

**User Story:** As a user, I want to see posts from users I follow in chronological order, so that I can stay updated with their travel stories.

#### Acceptance Criteria

1. WHEN fetching the Following feed, THE Backend_API SHALL return posts from followed users ordered by created_at descending
2. WHEN a user follows another user, THE Backend_API SHALL include that user's posts in the follower's Following feed
3. WHEN a user unfollows another user, THE Backend_API SHALL exclude that user's posts from the follower's Following feed
4. WHEN the Following feed is empty, THE Frontend_Client SHALL display a message suggesting users to follow

### Requirement 7: Infinite Scroll Pagination

**User Story:** As a user, I want to scroll through feeds continuously, so that I can browse content without manual page navigation.

#### Acceptance Criteria

1. WHEN fetching a feed, THE Backend_API SHALL return a cursor pointing to the last item in the result set
2. WHEN requesting the next page, THE Frontend_Client SHALL include the cursor from the previous response
3. WHEN the cursor is provided, THE Backend_API SHALL return posts after the cursor position
4. WHEN no more posts are available, THE Backend_API SHALL return an empty result set and a null cursor
5. WHEN scrolling near the bottom of the feed, THE Frontend_Client SHALL automatically fetch the next page
6. WHEN fetching the next page, THE Frontend_Client SHALL append new posts to the existing feed without duplicates

### Requirement 8: Community Management

**User Story:** As a user, I want to join communities and post within them, so that I can engage with specific travel interest groups.

#### Acceptance Criteria

1. WHEN a user joins a community, THE Backend_API SHALL create a CommunityMember record linking the user to the community
2. WHEN a user leaves a community, THE Backend_API SHALL delete the CommunityMember record
3. WHEN creating a post, THE Frontend_Client SHALL allow the user to select a community from their joined communities
4. WHEN a post is assigned to a community, THE Backend_API SHALL store the community_id with the post
5. WHEN viewing a community, THE Backend_API SHALL return only posts belonging to that community
6. WHEN a user is not a member of a community, THE Frontend_Client SHALL display a join button on the community page

### Requirement 9: Real-Time Updates

**User Story:** As a user, I want to see new posts and engagement updates in real-time, so that I can stay current with community activity.

#### Acceptance Criteria

1. WHEN a new post is created, THE Socket_Server SHALL broadcast the post to all connected clients subscribed to the relevant feed
2. WHEN a post receives a like, THE Socket_Server SHALL broadcast the updated like count to all clients viewing the post
3. WHEN a reply is added to a thread, THE Socket_Server SHALL broadcast the reply to all clients viewing the thread
4. WHEN a user joins a community, THE Socket_Server SHALL broadcast a community event to community members
5. WHEN the Frontend_Client receives a real-time update, THE Frontend_Client SHALL update the UI without requiring a page refresh
6. WHEN the socket connection is lost, THE Frontend_Client SHALL attempt to reconnect automatically

### Requirement 10: Search and Discovery

**User Story:** As a user, I want to search for posts and communities, so that I can find content relevant to my travel interests.

#### Acceptance Criteria

1. WHEN a user enters a search query, THE Backend_API SHALL return posts matching the query in text, tags, or community name
2. WHEN searching posts, THE Backend_API SHALL rank results by relevance score combining text match and engagement score
3. WHEN searching communities, THE Backend_API SHALL return communities with names or descriptions matching the query
4. WHEN displaying search results, THE Frontend_Client SHALL highlight matching text in the results
5. WHEN a search returns no results, THE Frontend_Client SHALL display suggested communities or trending posts

### Requirement 11: Trending Content

**User Story:** As a user, I want to see trending posts and communities, so that I can discover popular travel content.

#### Acceptance Criteria

1. WHEN calculating trending posts, THE Backend_API SHALL identify posts with engagement scores in the top 10% within the last 24 hours
2. WHEN fetching trending posts, THE Backend_API SHALL return posts ordered by engagement score descending with a maximum of 20 results
3. WHEN displaying trending posts, THE Frontend_Client SHALL show them in the sidebar on desktop and in a dedicated tab on mobile
4. WHEN calculating trending communities, THE Backend_API SHALL rank communities by member count and recent post activity
5. WHEN a post becomes trending, THE Cache_Layer SHALL update the trending cache immediately

### Requirement 12: Content Moderation

**User Story:** As a user, I want to report inappropriate content, so that the community remains safe and respectful.

#### Acceptance Criteria

1. WHEN a user reports a post, THE Backend_API SHALL create a Report record with the post_id and reason
2. WHEN a post receives multiple reports, THE Backend_API SHALL flag the post for moderator review
3. WHEN a moderator reviews a report, THE Backend_API SHALL allow marking the post as removed or dismissed
4. WHEN a post is removed, THE Frontend_Client SHALL hide the post from all feeds and display a removal notice
5. WHEN a user views a reported post, THE Frontend_Client SHALL display a report button with reason options

### Requirement 13: Offline Support

**User Story:** As a user, I want to interact with posts while offline, so that I can engage with content without constant connectivity.

#### Acceptance Criteria

1. WHEN a user performs an action while offline, THE Frontend_Client SHALL queue the action in local storage
2. WHEN displaying a queued action, THE Frontend_Client SHALL show a pending badge on the affected post
3. WHEN the connection is restored, THE Frontend_Client SHALL sync all queued actions with the Backend_API
4. WHEN a queued action fails during sync, THE Frontend_Client SHALL notify the user and offer to retry
5. WHEN viewing posts offline, THE Frontend_Client SHALL display cached posts from the last successful fetch

### Requirement 14: Responsive UI Layout

**User Story:** As a user, I want the community feed to work seamlessly on mobile and desktop, so that I can access it from any device.

#### Acceptance Criteria

1. WHEN viewing on mobile, THE Frontend_Client SHALL display a single-column feed with a fixed header and floating action button
2. WHEN viewing on desktop, THE Frontend_Client SHALL display a three-column layout with feed, sidebar, and trending panel
3. WHEN switching between tabs, THE Frontend_Client SHALL preserve scroll position within each feed
4. WHEN the viewport width is below 768px, THE Frontend_Client SHALL hide the sidebar and show trending in a separate tab
5. WHEN the viewport width is above 768px, THE Frontend_Client SHALL display the sidebar with trending and suggested communities

### Requirement 15: Accessibility Compliance

**User Story:** As a user with accessibility needs, I want the community feed to be fully accessible, so that I can navigate and interact using assistive technologies.

#### Acceptance Criteria

1. WHEN navigating with keyboard, THE Frontend_Client SHALL provide focus indicators on all interactive elements
2. WHEN using a screen reader, THE Frontend_Client SHALL announce post content, author, and engagement counts
3. WHEN images are displayed, THE Frontend_Client SHALL include alt text describing the image content
4. WHEN interactive elements are present, THE Frontend_Client SHALL include appropriate ARIA labels and roles
5. WHEN color is used to convey information, THE Frontend_Client SHALL provide additional non-color indicators
6. WHEN forms are displayed, THE Frontend_Client SHALL associate labels with form inputs using proper markup

### Requirement 16: Performance Optimization

**User Story:** As a user, I want the community feed to load quickly and respond smoothly, so that I can browse content without delays.

#### Acceptance Criteria

1. WHEN querying posts, THE Backend_API SHALL use database indexes on created_at and engagement_score columns
2. WHEN fetching feeds, THE Backend_API SHALL limit results to 20 posts per page
3. WHEN rendering posts, THE Frontend_Client SHALL virtualize the list to render only visible items
4. WHEN images are loaded, THE Frontend_Client SHALL lazy-load images as they enter the viewport
5. WHEN the feed is scrolled, THE Frontend_Client SHALL debounce scroll events to reduce computation
6. WHEN animations are triggered, THE Frontend_Client SHALL use CSS transforms for smooth 60fps performance

### Requirement 17: Notification System

**User Story:** As a user, I want to receive notifications for replies and mentions, so that I can stay engaged with conversations.

#### Acceptance Criteria

1. WHEN a user receives a reply to their post, THE Backend_API SHALL create a notification record
2. WHEN a user is mentioned in a post, THE Backend_API SHALL create a notification record with the mention type
3. WHEN a notification is created, THE Socket_Server SHALL send a real-time notification to the user's connected clients
4. WHEN displaying notifications, THE Frontend_Client SHALL show a toast message for new notifications
5. WHEN a user clicks a notification, THE Frontend_Client SHALL navigate to the relevant post or thread
6. WHEN a notification is viewed, THE Backend_API SHALL mark the notification as read

### Requirement 18: Analytics Tracking

**User Story:** As a product manager, I want to track user engagement metrics, so that I can understand how users interact with the community feed.

#### Acceptance Criteria

1. WHEN a post is viewed, THE Frontend_Client SHALL send a view event to the analytics system
2. WHEN a user performs an engagement action, THE Frontend_Client SHALL send an engagement event with action type
3. WHEN a user joins a community, THE Frontend_Client SHALL send a community join event
4. WHEN a user searches, THE Frontend_Client SHALL send a search event with the query and result count
5. WHEN tracking events, THE Frontend_Client SHALL batch events and send them every 30 seconds to reduce network requests

### Requirement 19: Media Handling

**User Story:** As a user, I want to view media in posts with a smooth carousel experience, so that I can see all shared photos and videos.

#### Acceptance Criteria

1. WHEN a post contains multiple media items, THE Frontend_Client SHALL display them in a swipeable carousel
2. WHEN swiping through media, THE Frontend_Client SHALL show pagination dots indicating the current position
3. WHEN a media item is clicked, THE Frontend_Client SHALL open a fullscreen lightbox view
4. WHEN viewing media in fullscreen, THE Frontend_Client SHALL allow closing with an X button or ESC key
5. WHEN media fails to load, THE Frontend_Client SHALL display a placeholder with an error message

### Requirement 20: Tag System

**User Story:** As a user, I want to add tags to posts and filter by tags, so that I can categorize and discover content by topic.

#### Acceptance Criteria

1. WHEN creating a post, THE Frontend_Client SHALL provide tag autocomplete suggestions based on existing tags
2. WHEN a user types a hashtag, THE Frontend_Client SHALL parse and store it as a tag
3. WHEN displaying a post with tags, THE Frontend_Client SHALL render tags as clickable links
4. WHEN a tag is clicked, THE Frontend_Client SHALL navigate to a feed filtered by that tag
5. WHEN fetching posts by tag, THE Backend_API SHALL return posts containing the specified tag ordered by created_at descending

### Requirement 21: Trip Publishing to Community

**User Story:** As a user, I want to publish my completed trips directly to the community feed, so that I can share my entire travel itinerary with other travelers in one action.

#### Acceptance Criteria

1. WHEN a user views their own trip details, THE Frontend_Client SHALL display a "Share to Community" button
2. WHEN a user clicks "Share to Community", THE Frontend_Client SHALL open the composer modal pre-populated with the trip embed
3. WHEN publishing a trip to community, THE Backend_API SHALL create a post with the trip_id and auto-generate a summary text from trip title and destinations
4. WHEN a trip is published, THE Frontend_Client SHALL allow the user to add additional commentary before posting
5. WHEN a trip is published, THE Backend_API SHALL automatically add relevant destination tags (e.g., #Tokyo, #Japan) to the post
6. WHEN a published trip post is displayed, THE Frontend_Client SHALL show a "Full Trip" badge to distinguish it from regular trip embeds
7. WHEN a user has already published a trip, THE Frontend_Client SHALL show "Shared" status and allow re-sharing with new commentary
8. WHEN viewing a published trip in the feed, THE Frontend_Client SHALL provide a direct link to view the full trip itinerary
