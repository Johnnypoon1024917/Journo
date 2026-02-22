/**
 * Community Threads Feed Type Definitions
 * 
 * This file contains all TypeScript interfaces and types for the community threads feed feature.
 * These types align with the backend data models and API responses.
 */

// ============================================================================
// Core Models
// ============================================================================

/**
 * Post model - represents a user-generated content item
 */
export interface Post {
  id: string;
  userId: string;
  communityId?: string;
  parentId?: string;
  content: string;
  tripId?: string;
  mediaUrls: string[];
  tags: string[];
  likeCount: number;
  replyCount: number;
  repostCount: number;
  engagementScore: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Community model - represents a group that users can join
 */
export interface Community {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  memberCount: number;
  postCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Community member model - represents a user's membership in a community
 */
export interface CommunityMember {
  id: string;
  communityId: string;
  userId: string;
  role: 'member' | 'moderator' | 'admin';
  joinedAt: string;
}

/**
 * Like model - represents a user liking a post
 */
export interface Like {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
}

/**
 * Repost model - represents a user reposting a post
 */
export interface Repost {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
}

/**
 * Bookmark model - represents a user bookmarking a post
 */
export interface Bookmark {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
}

/**
 * Report model - represents a user reporting inappropriate content
 */
export interface Report {
  id: string;
  postId: string;
  reporterId: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'removed';
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

/**
 * User follow model - represents a user following another user
 */
export interface UserFollow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

// ============================================================================
// Extended Models with Additional Data
// ============================================================================

/**
 * Post with engagement data - includes user-specific engagement states
 * Used for displaying posts in feeds with like/repost/bookmark status
 */
export interface PostWithEngagement extends Post {
  userName: string;
  userAvatar: string;
  communityName?: string;
  tripEmbed?: TripSummary;
  isLiked: boolean;
  isReposted: boolean;
  isBookmarked: boolean;
}

/**
 * Trip summary - embedded trip data displayed within posts
 */
export interface TripSummary {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  destinations: string[];
  budget?: number;
  currency?: string;
  coverImage?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Feed result - paginated feed response with cursor
 */
export interface FeedResult {
  posts: PostWithEngagement[];
  cursor: string | null;
  hasMore: boolean;
}

/**
 * Engagement data - real-time engagement counts for socket updates
 */
export interface EngagementData {
  likeCount: number;
  replyCount: number;
  repostCount: number;
  engagementScore: number;
}

// ============================================================================
// Request/Input Types
// ============================================================================

/**
 * Create post data - input for creating a new post
 */
export interface CreatePostData {
  content: string;
  communityId?: string;
  parentId?: string;
  tripId?: string;
  mediaUrls?: string[];
  tags?: string[];
}

/**
 * Update post data - input for updating an existing post
 */
export interface UpdatePostData {
  content?: string;
  mediaUrls?: string[];
  tags?: string[];
}

/**
 * Report post data - input for reporting a post
 */
export interface ReportPostData {
  postId: string;
  reason: string;
  description?: string;
}

/**
 * Review report data - input for moderator reviewing a report
 */
export interface ReviewReportData {
  reportId: string;
  status: 'dismissed' | 'removed';
}

// ============================================================================
// Search and Discovery Types
// ============================================================================

/**
 * Search result - generic search result with highlighting
 */
export interface SearchResult<T> {
  item: T;
  highlights: string[];
  relevanceScore: number;
}

/**
 * Post search result
 */
export type PostSearchResult = SearchResult<PostWithEngagement>;

/**
 * Community search result
 */
export type CommunitySearchResult = SearchResult<Community>;

/**
 * Search response
 */
export interface SearchResponse<T> {
  results: SearchResult<T>[];
  query: string;
  totalCount: number;
}

// ============================================================================
// Feed Types
// ============================================================================

/**
 * Feed type - identifies which feed to fetch
 */
export type FeedType = 'forYou' | 'following' | 'community' | 'trending' | 'tag';

/**
 * Feed options - parameters for fetching a feed
 */
export interface FeedOptions {
  feedType: FeedType;
  communityId?: string;
  tag?: string;
  cursor?: string;
  limit?: number;
}

// ============================================================================
// Socket Event Types
// ============================================================================

/**
 * Socket event payloads for real-time updates
 */
export interface CommunitySocketEvents {
  // Post events
  'post:new': PostWithEngagement;
  'post:updated': PostWithEngagement;
  'post:deleted': { postId: string };
  
  // Engagement events
  'engagement:updated': {
    postId: string;
    engagement: EngagementData;
  };
  
  // Reply events
  'reply:new': {
    parentPostId: string;
    reply: PostWithEngagement;
  };
  
  // Community events
  'community:joined': {
    communityId: string;
    userId: string;
    userName: string;
  };
  'community:left': {
    communityId: string;
    userId: string;
  };
}

// ============================================================================
// UI State Types
// ============================================================================

/**
 * Composer state - state for the post composer modal
 */
export interface ComposerState {
  isOpen: boolean;
  content: string;
  selectedCommunityId?: string;
  selectedTripId?: string;
  mediaUrls: string[];
  tags: string[];
  parentPost?: Post;
  isSubmitting: boolean;
  error?: string;
}

/**
 * Feed state - state for a single feed
 */
export interface FeedState {
  posts: PostWithEngagement[];
  cursor: string | null;
  hasMore: boolean;
  isLoading: boolean;
  error?: string;
}

/**
 * Offline queue item - queued action for offline support
 */
export interface OfflineQueueItem {
  id: string;
  action: 'like' | 'unlike' | 'repost' | 'unrepost' | 'bookmark' | 'unbookmark' | 'createPost' | 'updatePost' | 'deletePost';
  postId?: string;
  data?: any;
  timestamp: number;
  retryCount: number;
}

// ============================================================================
// Analytics Types
// ============================================================================

/**
 * Analytics event - event for tracking user interactions
 */
export interface CommunityAnalyticsEvent {
  eventType: 'post_view' | 'engagement_action' | 'community_join' | 'search' | 'post_create';
  postId?: string;
  communityId?: string;
  actionType?: 'like' | 'repost' | 'bookmark' | 'reply';
  searchQuery?: string;
  resultCount?: number;
  timestamp: number;
}

// ============================================================================
// Moderation Types
// ============================================================================

/**
 * Report reason - predefined reasons for reporting content
 */
export type ReportReason = 
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'violence'
  | 'misinformation'
  | 'inappropriate_content'
  | 'other';

/**
 * Moderation action - action taken by a moderator
 */
export interface ModerationAction {
  reportId: string;
  action: 'dismiss' | 'remove' | 'warn' | 'ban';
  reason?: string;
  moderatorId: string;
  timestamp: string;
}

// ============================================================================
// Trip Publishing Types
// ============================================================================

/**
 * Trip publish data - data for publishing a trip to community
 */
export interface TripPublishData {
  tripId: string;
  additionalCommentary?: string;
  selectedCommunityId?: string;
}

/**
 * Trip share status - status of a trip's sharing to community
 */
export interface TripShareStatus {
  tripId: string;
  isShared: boolean;
  postId?: string;
  sharedAt?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Pagination params - common pagination parameters
 */
export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

/**
 * Sort options - sorting options for feeds
 */
export type SortOption = 'engagement' | 'recent' | 'trending';

/**
 * Filter options - filtering options for feeds
 */
export interface FilterOptions {
  communityIds?: string[];
  tags?: string[];
  hasTrip?: boolean;
  hasMedia?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}
