/**
 * Community Service - API client for community threads feed
 * 
 * This service provides methods for interacting with the community feed backend API.
 * All methods use axios with authentication headers and handle errors appropriately.
 */

import axios from 'axios';
import { getAuthToken } from '@/utils/auth';
import type {
  FeedResult,
  PostWithEngagement,
  CreatePostData,
  UpdatePostData,
  Community,
  ReportPostData,
  ReviewReportData,
  Report,
  SearchResponse,
  TripPublishData,
  TripShareStatus,
} from '@/types/community';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Helper to get axios config with auth token
 */
const getAxiosConfig = () => {
  const token = getAuthToken();
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  };
};

/**
 * Community Service class
 * Provides all API methods for community feed operations
 */
export class CommunityService {
  // ============================================================================
  // Feed Methods
  // ============================================================================

  /**
   * Get For You feed (algorithmically sorted by engagement)
   * @param cursor - Pagination cursor from previous response
   * @param limit - Number of posts to fetch (default: 20)
   * @returns Feed result with posts and pagination info
   */
  static async getForYouFeed(cursor?: string, limit: number = 20): Promise<FeedResult> {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('limit', limit.toString());

    const response = await axios.get<FeedResult>(
      `${API_BASE_URL}/community/feed/for-you?${params.toString()}`,
      getAxiosConfig()
    );
    return response.data;
  }

  /**
   * Get Following feed (chronological posts from followed users)
   * @param cursor - Pagination cursor from previous response
   * @param limit - Number of posts to fetch (default: 20)
   * @returns Feed result with posts and pagination info
   */
  static async getFollowingFeed(cursor?: string, limit: number = 20): Promise<FeedResult> {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('limit', limit.toString());

    const response = await axios.get<FeedResult>(
      `${API_BASE_URL}/community/feed/following?${params.toString()}`,
      getAxiosConfig()
    );
    return response.data;
  }

  /**
   * Get community-specific feed
   * @param communityId - ID of the community
   * @param cursor - Pagination cursor from previous response
   * @param limit - Number of posts to fetch (default: 20)
   * @returns Feed result with posts and pagination info
   */
  static async getCommunityFeed(
    communityId: string,
    cursor?: string,
    limit: number = 20
  ): Promise<FeedResult> {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('limit', limit.toString());

    const response = await axios.get<FeedResult>(
      `${API_BASE_URL}/community/feed/community/${communityId}?${params.toString()}`,
      getAxiosConfig()
    );
    return response.data;
  }

  /**
   * Get trending posts (top engagement in last 24 hours)
   * @returns Feed result with trending posts (max 20)
   */
  static async getTrendingPosts(): Promise<FeedResult> {
    const response = await axios.get<FeedResult>(
      `${API_BASE_URL}/community/feed/trending`,
      getAxiosConfig()
    );
    return response.data;
  }

  /**
   * Get posts filtered by tag
   * @param tag - Tag to filter by (without # symbol)
   * @param cursor - Pagination cursor from previous response
   * @param limit - Number of posts to fetch (default: 20)
   * @returns Feed result with tagged posts
   */
  static async getPostsByTag(
    tag: string,
    cursor?: string,
    limit: number = 20
  ): Promise<FeedResult> {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('limit', limit.toString());

    const response = await axios.get<FeedResult>(
      `${API_BASE_URL}/community/posts/tag/${encodeURIComponent(tag)}?${params.toString()}`,
      getAxiosConfig()
    );
    return response.data;
  }

  // ============================================================================
  // Post CRUD Methods
  // ============================================================================

  /**
   * Create a new post
   * @param data - Post creation data
   * @returns Created post with engagement data
   */
  static async createPost(data: CreatePostData): Promise<PostWithEngagement> {
    const response = await axios.post<PostWithEngagement>(
      `${API_BASE_URL}/community/posts`,
      data,
      getAxiosConfig()
    );
    return response.data;
  }

  /**
   * Get a single post by ID
   * @param postId - ID of the post
   * @returns Post with engagement data
   */
  static async getPost(postId: string): Promise<PostWithEngagement> {
    const response = await axios.get<PostWithEngagement>(
      `${API_BASE_URL}/community/posts/${postId}`,
      getAxiosConfig()
    );
    return response.data;
  }

  /**
   * Update an existing post
   * @param postId - ID of the post to update
   * @param data - Post update data
   * @returns Updated post with engagement data
   */
  static async updatePost(postId: string, data: UpdatePostData): Promise<PostWithEngagement> {
    const response = await axios.put<PostWithEngagement>(
      `${API_BASE_URL}/community/posts/${postId}`,
      data,
      getAxiosConfig()
    );
    return response.data;
  }

  /**
   * Delete a post
   * @param postId - ID of the post to delete
   */
  static async deletePost(postId: string): Promise<void> {
    await axios.delete(
      `${API_BASE_URL}/community/posts/${postId}`,
      getAxiosConfig()
    );
  }

  /**
   * Get replies to a post (threaded conversation)
   * @param postId - ID of the parent post
   * @param cursor - Pagination cursor from previous response
   * @param limit - Number of replies to fetch (default: 20)
   * @returns Feed result with replies
   */
  static async getPostReplies(
    postId: string,
    cursor?: string,
    limit: number = 20
  ): Promise<FeedResult> {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('limit', limit.toString());

    const response = await axios.get<FeedResult>(
      `${API_BASE_URL}/community/posts/${postId}/replies?${params.toString()}`,
      getAxiosConfig()
    );
    return response.data;
  }

  // ============================================================================
  // Engagement Action Methods
  // ============================================================================

  /**
   * Like a post
   * @param postId - ID of the post to like
   * @returns Updated engagement data
   */
  static async likePost(postId: string): Promise<{ success: boolean; likeCount: number }> {
    const response = await axios.post<{ success: boolean; likeCount: number }>(
      `${API_BASE_URL}/community/posts/${postId}/like`,
      {},
      getAxiosConfig()
    );
    return response.data;
  }

  /**
   * Unlike a post
   * @param postId - ID of the post to unlike
   * @returns Updated engagement data
   */
  static async unlikePost(postId: string): Promise<{ success: boolean; likeCount: number }> {
    const response = await axios.delete<{ success: boolean; likeCount: number }>(
      `${API_BASE_URL}/community/posts/${postId}/like`,
      getAxiosConfig()
    );
    return response.data;
  }

  /**
   * Repost a post
   * @param postId - ID of the post to repost
   * @returns Updated engagement data
   */
  static async repostPost(postId: string): Promise<{ success: boolean; repostCount: number }> {
    const response = await axios.post<{ success: boolean; repostCount: number }>(
      `${API_BASE_URL}/community/posts/${postId}/repost`,
      {},
      getAxiosConfig()
    );
    return response.data;
  }

  /**
   * Unrepost a post
   * @param postId - ID of the post to unrepost
   * @returns Updated engagement data
   */
  static async unrepostPost(postId: string): Promise<{ success: boolean; repostCount: number }> {
    const response = await axios.delete<{ success: boolean; repostCount: number }>(
      `${API_BASE_URL}/community/posts/${postId}/repost`,
      getAxiosConfig()
    );
    return response.data;
  }

  /**
   * Bookmark a post
   * @param postId - ID of the post to bookmark
   * @returns Success status
   */
  static async bookmarkPost(postId: string): Promise<{ success: boolean }> {
    const response = await axios.post<{ success: boolean }>(
      `${API_BASE_URL}/community/posts/${postId}/bookmark`,
      {},
      getAxiosConfig()
    );
    return response.data;
  }

  /**
   * Unbookmark a post
   * @param postId - ID of the post to unbookmark
   * @returns Success status
   */
  static async unbookmarkPost(postId: string): Promise<{ success: boolean }> {
    const response = await axios.delete<{ success: boolean }>(
      `${API_BASE_URL}/community/posts/${postId}/bookmark`,
      getAxiosConfig()
    );
    return response.data;
  }

  /**
   * Get user's bookmarked posts
   * @param cursor - Pagination cursor from previous response
   * @param limit - Number of posts to fetch (default: 20)
   * @returns Feed result with bookmarked posts
   */
  static async getBookmarkedPosts(cursor?: string, limit: number = 20): Promise<FeedResult> {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('limit', limit.toString());

    const response = await axios.get<FeedResult>(
      `${API_BASE_URL}/community/bookmarks?${params.toString()}`,
      getAxiosConfig()
    );
    return response.data;
  }

  // ============================================================================
  // Community Management Methods
  // ============================================================================

  /**
   * Get all communities
   * @param cursor - Pagination cursor from previous response
   * @param limit - Number of communities to fetch (default: 20)
   * @returns List of communities with pagination
   */
  static async getCommunities(
    cursor?: string,
    limit: number = 20
  ): Promise<{ communities: Community[]; cursor: string | null; hasMore: boolean }> {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('limit', limit.toString());

    const response = await axios.get<{
      communities: Community[];
      cursor: string | null;
      hasMore: boolean;
    }>(`${API_BASE_URL}/community/communities?${params.toString()}`, getAxiosConfig());
    return response.data;
  }

  /**
   * Get a single community by ID
   * @param communityId - ID of the community
   * @returns Community details
   */
  static async getCommunity(communityId: string): Promise<Community> {
    const response = await axios.get<Community>(
      `${API_BASE_URL}/community/communities/${communityId}`,
      getAxiosConfig()
    );
    return response.data;
  }

  /**
   * Join a community
   * @param communityId - ID of the community to join
   * @returns Success status
   */
  static async joinCommunity(communityId: string): Promise<{ success: boolean }> {
    const response = await axios.post<{ success: boolean }>(
      `${API_BASE_URL}/community/communities/${communityId}/join`,
      {},
      getAxiosConfig()
    );
    return response.data;
  }

  /**
   * Leave a community
   * @param communityId - ID of the community to leave
   * @returns Success status
   */
  static async leaveCommunity(communityId: string): Promise<{ success: boolean }> {
    const response = await axios.delete<{ success: boolean }>(
      `${API_BASE_URL}/community/communities/${communityId}/leave`,
      getAxiosConfig()
    );
    return response.data;
  }

  /**
   * Get communities the current user has joined
   * @returns List of joined communities
   */
  static async getUserCommunities(): Promise<Community[]> {
    const response = await axios.get<Community[]>(
      `${API_BASE_URL}/community/user/communities`,
      getAxiosConfig()
    );
    return response.data;
  }

  /**
   * Get suggested communities for the user
   * @param limit - Number of suggestions (default: 5)
   * @returns List of suggested communities
   */
  static async getSuggestedCommunities(limit: number = 5): Promise<Community[]> {
    const response = await axios.get<Community[]>(
      `${API_BASE_URL}/community/communities/suggested?limit=${limit}`,
      getAxiosConfig()
    );
    return response.data;
  }

  /**
   * Get trending communities (by member count and activity)
   * @param limit - Number of trending communities (default: 10)
   * @returns List of trending communities
   */
  static async getTrendingCommunities(limit: number = 10): Promise<Community[]> {
    const response = await axios.get<Community[]>(
      `${API_BASE_URL}/community/communities/trending?limit=${limit}`,
      getAxiosConfig()
    );
    return response.data;
  }

  // ============================================================================
  // Search Methods
  // ============================================================================

  /**
   * Search posts by query
   * @param query - Search query string
   * @param cursor - Pagination cursor from previous response
   * @param limit - Number of results to fetch (default: 20)
   * @returns Search results with highlighting
   */
  static async searchPosts(
    query: string,
    cursor?: string,
    limit: number = 20
  ): Promise<SearchResponse<PostWithEngagement>> {
    const params = new URLSearchParams();
    params.append('q', query);
    if (cursor) params.append('cursor', cursor);
    params.append('limit', limit.toString());

    const response = await axios.get<SearchResponse<PostWithEngagement>>(
      `${API_BASE_URL}/community/search/posts?${params.toString()}`,
      getAxiosConfig()
    );
    return response.data;
  }

  /**
   * Search communities by name or description
   * @param query - Search query string
   * @param limit - Number of results to fetch (default: 20)
   * @returns Search results with highlighting
   */
  static async searchCommunities(
    query: string,
    limit: number = 20
  ): Promise<SearchResponse<Community>> {
    const params = new URLSearchParams();
    params.append('q', query);
    params.append('limit', limit.toString());

    const response = await axios.get<SearchResponse<Community>>(
      `${API_BASE_URL}/community/search/communities?${params.toString()}`,
      getAxiosConfig()
    );
    return response.data;
  }

  // ============================================================================
  // Moderation Methods
  // ============================================================================

  /**
   * Report a post for inappropriate content
   * @param data - Report data with reason and description
   * @returns Created report
   */
  static async reportPost(data: ReportPostData): Promise<Report> {
    const response = await axios.post<Report>(
      `${API_BASE_URL}/community/moderation/reports`,
      data,
      getAxiosConfig()
    );
    return response.data;
  }

  /**
   * Get all reports (moderator only)
   * @param status - Filter by report status
   * @param cursor - Pagination cursor from previous response
   * @param limit - Number of reports to fetch (default: 20)
   * @returns List of reports with pagination
   */
  static async getReports(
    status?: 'pending' | 'reviewed' | 'dismissed' | 'removed',
    cursor?: string,
    limit: number = 20
  ): Promise<{ reports: Report[]; cursor: string | null; hasMore: boolean }> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (cursor) params.append('cursor', cursor);
    params.append('limit', limit.toString());

    const response = await axios.get<{
      reports: Report[];
      cursor: string | null;
      hasMore: boolean;
    }>(`${API_BASE_URL}/community/moderation/reports?${params.toString()}`, getAxiosConfig());
    return response.data;
  }

  /**
   * Review a report (moderator only)
   * @param data - Review data with report ID and action
   * @returns Updated report
   */
  static async reviewReport(data: ReviewReportData): Promise<Report> {
    const response = await axios.put<Report>(
      `${API_BASE_URL}/community/moderation/reports/${data.reportId}`,
      { status: data.status },
      getAxiosConfig()
    );
    return response.data;
  }

  // ============================================================================
  // Trip Publishing Methods
  // ============================================================================

  /**
   * Publish a trip to the community feed
   * @param data - Trip publish data
   * @returns Created post with trip embed
   */
  static async publishTripToCommunity(data: TripPublishData): Promise<PostWithEngagement> {
    const response = await axios.post<PostWithEngagement>(
      `${API_BASE_URL}/community/trips/publish`,
      data,
      getAxiosConfig()
    );
    return response.data;
  }

  /**
   * Get trip share status
   * @param tripId - ID of the trip
   * @returns Share status with post ID if shared
   */
  static async getTripShareStatus(tripId: string): Promise<TripShareStatus> {
    const response = await axios.get<TripShareStatus>(
      `${API_BASE_URL}/community/trips/${tripId}/share-status`,
      getAxiosConfig()
    );
    return response.data;
  }

  // ============================================================================
  // User Follow Methods
  // ============================================================================

  /**
   * Follow a user
   * @param userId - ID of the user to follow
   * @returns Success status
   */
  static async followUser(userId: string): Promise<{ success: boolean }> {
    const response = await axios.post<{ success: boolean }>(
      `${API_BASE_URL}/community/users/${userId}/follow`,
      {},
      getAxiosConfig()
    );
    return response.data;
  }

  /**
   * Unfollow a user
   * @param userId - ID of the user to unfollow
   * @returns Success status
   */
  static async unfollowUser(userId: string): Promise<{ success: boolean }> {
    const response = await axios.delete<{ success: boolean }>(
      `${API_BASE_URL}/community/users/${userId}/follow`,
      getAxiosConfig()
    );
    return response.data;
  }

  /**
   * Get users that the current user follows
   * @returns List of followed user IDs
   */
  static async getFollowing(): Promise<string[]> {
    const response = await axios.get<string[]>(
      `${API_BASE_URL}/community/user/following`,
      getAxiosConfig()
    );
    return response.data;
  }

  /**
   * Get users that follow the current user
   * @returns List of follower user IDs
   */
  static async getFollowers(): Promise<string[]> {
    const response = await axios.get<string[]>(
      `${API_BASE_URL}/community/user/followers`,
      getAxiosConfig()
    );
    return response.data;
  }
}

export default CommunityService;
