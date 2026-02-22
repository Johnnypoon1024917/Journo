import { pool } from '../config/database.js';
import { RedisService } from '../config/redis.js';
import DOMPurify from 'isomorphic-dompurify';

// ============================================================================
// INTERFACES
// ============================================================================

export interface CreatePostData {
  userId: string;
  communityId?: string;
  parentId?: string;
  content: string;
  tripId?: string;
  mediaUrls?: string[];
  tags?: string[];
}

export interface UpdatePostData {
  content?: string;
  mediaUrls?: string[];
  tags?: string[];
}

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

export interface PostWithEngagement extends Post {
  userName: string;
  userAvatar: string;
  communityName?: string;
  isLiked: boolean;
  isReposted: boolean;
  isBookmarked: boolean;
}

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

export interface FeedResult {
  posts: PostWithEngagement[];
  cursor: string | null;
  hasMore: boolean;
}

export interface EngagementData {
  likeCount: number;
  replyCount: number;
  repostCount: number;
  engagementScore: number;
}

// ============================================================================
// COMMUNITY SERVICE CLASS
// ============================================================================

export class CommunityService {
  private static readonly FEED_PAGE_SIZE = 20;
  private static readonly FEED_CACHE_TTL = 120; // 2 minutes in seconds
  private static readonly TRIP_CACHE_TTL = 300; // 5 minutes in seconds

  // ==========================================================================
  // CONTENT SANITIZATION
  // ==========================================================================

  /**
   * Sanitizes post content to remove XSS vulnerabilities
   * Removes: script tags, event handlers, javascript: URLs, and all HTML tags
   * Validates: Requirements 1.2
   */
  private static sanitizeContent(content: string): string {
    // Configure DOMPurify to be strict
    const clean = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [], // No HTML tags allowed - strips all HTML
      ALLOWED_ATTR: [], // No attributes allowed
      KEEP_CONTENT: true, // Keep text content after stripping tags
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'], // Explicitly forbid dangerous tags
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'], // Forbid event handlers
    });
    
    // Additional sanitization: remove javascript: protocol URLs
    // This handles cases like <a href="javascript:alert('xss')">
    const withoutJsUrls = clean.replace(/javascript:/gi, '');
    
    return withoutJsUrls.trim();
  }

  // ==========================================================================
  // ENGAGEMENT SCORE CALCULATION
  // ==========================================================================

  /**
   * Calculates engagement score for a post
   * Formula: (likes × 3) + (replies × 2) + reposts + recency_bonus
   * Recency bonus: < 24h = +10, 24-48h = +5, > 48h = 0
   * Validates: Requirements 5.1, 5.2, 5.3
   */
  static calculateEngagementScore(post: {
    likeCount: number;
    replyCount: number;
    repostCount: number;
    createdAt: Date | string;
  }): number {
    const baseScore = (post.likeCount * 3) + (post.replyCount * 2) + post.repostCount;
    
    // Calculate hours since creation
    const createdAt = typeof post.createdAt === 'string' 
      ? new Date(post.createdAt) 
      : post.createdAt;
    const hoursOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    
    // Calculate recency bonus
    let recencyBonus = 0;
    if (hoursOld < 24) {
      recencyBonus = 10;
    } else if (hoursOld < 48) {
      recencyBonus = 5;
    }
    
    return baseScore + recencyBonus;
  }

  /**
   * Updates engagement score for a specific post
   */
  static async updateEngagementScore(postId: string): Promise<void> {
    await pool.query(
      'SELECT update_post_engagement_score($1)',
      [postId]
    );
  }

  // ==========================================================================
  // CACHE MANAGEMENT
  // ==========================================================================

  /**
   * Generates cache key for feeds
   */
  private static getFeedCacheKey(feedType: string, userId: string, communityId?: string): string {
    if (communityId) {
      return `feed:${feedType}:${communityId}:${userId}`;
    }
    return `feed:${feedType}:${userId}`;
  }

  /**
   * Gets cached feed data
   * Validates: Requirements 5.5
   */
  static async getCachedFeed(cacheKey: string): Promise<FeedResult | null> {
    return await RedisService.getJSON<FeedResult>(cacheKey);
  }

  /**
   * Caches feed data with TTL
   * Validates: Requirements 5.5, 5.6
   */
  static async cacheFeed(cacheKey: string, feed: FeedResult): Promise<void> {
    await RedisService.setJSON(cacheKey, feed, this.FEED_CACHE_TTL);
  }

  /**
   * Invalidates feed cache for a user or globally
   * Validates: Requirements 5.6
   */
  static async invalidateFeedCache(userId?: string): Promise<void> {
    if (userId) {
      // Invalidate specific user's feed caches
      await RedisService.del(this.getFeedCacheKey('forYou', userId));
      await RedisService.del(this.getFeedCacheKey('following', userId));
    } else {
      // Global invalidation - clear all feed caches
      // This is used when a new post is created that affects all For You feeds
      await RedisService.deletePattern('feed:forYou:*');
    }
  }

  /**
   * Invalidates community feed cache
   */
  static async invalidateCommunityFeedCache(communityId: string): Promise<void> {
    await RedisService.deletePattern(`feed:community:${communityId}:*`);
  }

  /**
   * Invalidates follower feed caches when a user creates a post
   */
  static async invalidateFollowerFeeds(userId: string): Promise<void> {
    // Get all followers of this user
    const result = await pool.query(
      'SELECT follower_id FROM user_follows WHERE following_id = $1',
      [userId]
    );

    // Invalidate each follower's Following feed cache
    for (const row of result.rows) {
      await RedisService.del(this.getFeedCacheKey('following', row.follower_id));
    }
  }

  // ==========================================================================
  // FEED GENERATION
  // ==========================================================================

  /**
   * Generates For You feed with engagement-based ranking
   * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 7.1, 7.3
   */
  static async generateForYouFeed(
    userId: string,
    cursor?: string,
    limit: number = this.FEED_PAGE_SIZE
  ): Promise<FeedResult> {
    // Check cache first
    const cacheKey = this.getFeedCacheKey('forYou', userId);
    if (!cursor) {
      const cached = await this.getCachedFeed(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Build query with cursor-based pagination
    let query = `
      SELECT 
        p.*,
        u.name as user_name,
        u.profile_picture as user_avatar,
        c.name as community_name,
        EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $1) as is_liked,
        EXISTS(SELECT 1 FROM reposts WHERE post_id = p.id AND user_id = $1) as is_reposted,
        EXISTS(SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = $1) as is_bookmarked,
        -- Trip embed data
        t.id as trip_id_data,
        t.title as trip_title,
        t.start_date as trip_start_date,
        t.end_date as trip_end_date,
        t.destination as trip_destination,
        t.total_budget as trip_budget,
        t.currency_code as trip_currency
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN communities c ON p.community_id = c.id
      LEFT JOIN trips t ON p.trip_id = t.id
      WHERE p.is_deleted = FALSE
        AND p.parent_id IS NULL
    `;

    const params: any[] = [userId];
    let paramIndex = 2;

    // Add cursor condition
    if (cursor) {
      query += ` AND p.engagement_score < $${paramIndex}`;
      params.push(parseFloat(cursor));
      paramIndex++;
    }

    query += `
      ORDER BY p.engagement_score DESC, p.created_at DESC
      LIMIT $${paramIndex}
    `;
    params.push(limit + 1); // Fetch one extra to determine hasMore

    const result = await pool.query(query, params);

    const hasMore = result.rows.length > limit;
    const posts = result.rows.slice(0, limit).map(row => this.mapRowToPostWithEngagement(row));
    const newCursor = hasMore && posts.length > 0 
      ? posts[posts.length - 1].engagementScore.toString() 
      : null;

    const feedResult: FeedResult = {
      posts,
      cursor: newCursor,
      hasMore,
    };

    // Cache the first page
    if (!cursor) {
      await this.cacheFeed(cacheKey, feedResult);
    }

    return feedResult;
  }

  /**
   * Generates Following feed with chronological ordering
   * Validates: Requirements 6.1, 7.1, 7.3
   */
  static async generateFollowingFeed(
    userId: string,
    cursor?: string,
    limit: number = this.FEED_PAGE_SIZE
  ): Promise<FeedResult> {
    // Check cache first
    const cacheKey = this.getFeedCacheKey('following', userId);
    if (!cursor) {
      const cached = await this.getCachedFeed(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Build query with cursor-based pagination
    let query = `
      SELECT 
        p.*,
        u.name as user_name,
        u.profile_picture as user_avatar,
        c.name as community_name,
        EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $1) as is_liked,
        EXISTS(SELECT 1 FROM reposts WHERE post_id = p.id AND user_id = $1) as is_reposted,
        EXISTS(SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = $1) as is_bookmarked,
        -- Trip embed data
        t.id as trip_id_data,
        t.title as trip_title,
        t.start_date as trip_start_date,
        t.end_date as trip_end_date,
        t.destination as trip_destination,
        t.total_budget as trip_budget,
        t.currency_code as trip_currency
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN communities c ON p.community_id = c.id
      LEFT JOIN trips t ON p.trip_id = t.id
      WHERE p.is_deleted = FALSE
        AND p.parent_id IS NULL
        AND p.user_id IN (
          SELECT following_id FROM user_follows WHERE follower_id = $1
        )
    `;

    const params: any[] = [userId];
    let paramIndex = 2;

    // Add cursor condition
    if (cursor) {
      query += ` AND p.created_at < $${paramIndex}`;
      params.push(cursor);
      paramIndex++;
    }

    query += `
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex}
    `;
    params.push(limit + 1);

    const result = await pool.query(query, params);

    const hasMore = result.rows.length > limit;
    const posts = result.rows.slice(0, limit).map(row => this.mapRowToPostWithEngagement(row));
    const newCursor = hasMore && posts.length > 0 
      ? posts[posts.length - 1].createdAt 
      : null;

    const feedResult: FeedResult = {
      posts,
      cursor: newCursor,
      hasMore,
    };

    // Cache the first page
    if (!cursor) {
      await this.cacheFeed(cacheKey, feedResult);
    }

    return feedResult;
  }

  /**
   * Gets posts for a specific community
   * Validates: Requirements 8.5, 7.1, 7.3
   */
  /**
     * Gets posts for a specific community
     * Validates: Requirements 8.5, 7.1, 7.3
     */
    static async getCommunityPosts(
      communityId: string,
      userId: string,
      cursor?: string,
      limit: number = this.FEED_PAGE_SIZE
    ): Promise<FeedResult> {
      // Check cache first (only for first page)
      const cacheKey = this.getFeedCacheKey('community', userId, communityId);
      if (!cursor) {
        const cached = await this.getCachedFeed(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // Build query with cursor-based pagination
      let query = `
        SELECT 
          p.*,
          u.name as user_name,
          u.profile_picture as user_avatar,
          c.name as community_name,
          EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $1) as is_liked,
          EXISTS(SELECT 1 FROM reposts WHERE post_id = p.id AND user_id = $1) as is_reposted,
          EXISTS(SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = $1) as is_bookmarked
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN communities c ON p.community_id = c.id
        WHERE p.is_deleted = FALSE
          AND p.parent_id IS NULL
          AND p.community_id = $2
      `;

      const params: any[] = [userId, communityId];
      let paramIndex = 3;

      // Add cursor condition
      if (cursor) {
        query += ` AND p.created_at < $${paramIndex}`;
        params.push(cursor);
        paramIndex++;
      }

      query += `
        ORDER BY p.created_at DESC
        LIMIT $${paramIndex}
      `;
      params.push(limit + 1);

      const result = await pool.query(query, params);

      const hasMore = result.rows.length > limit;
      const posts = result.rows.slice(0, limit).map(row => this.mapRowToPostWithEngagement(row));
      const newCursor = hasMore && posts.length > 0 
        ? posts[posts.length - 1].createdAt 
        : null;

      const feedResult: FeedResult = {
        posts,
        cursor: newCursor,
        hasMore,
      };

      // Cache the first page
      if (!cursor) {
        await this.cacheFeed(cacheKey, feedResult);
      }

      return feedResult;
    }

  // ==========================================================================
  // POST CRUD OPERATIONS
  // ==========================================================================

  /**
   * Parses hashtags from post content
   * Validates: Requirements 20.2
   */
  private static parseHashtags(content: string): string[] {
    // Match hashtags: # followed by alphanumeric characters and underscores
    const hashtagRegex = /#(\w+)/g;
    const matches = content.matchAll(hashtagRegex);
    const hashtags = new Set<string>();
    
    for (const match of matches) {
      // Store without the # prefix, lowercase for consistency
      hashtags.add(match[1].toLowerCase());
    }
    
    return Array.from(hashtags);
  }

  /**
   * Creates a new post with validation and sanitization
   * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 20.2
   */
  static async createPost(data: CreatePostData): Promise<PostWithEngagement> {
    // Sanitize content
    const sanitizedContent = this.sanitizeContent(data.content);

    // Validate content length
    if (sanitizedContent.length === 0 || sanitizedContent.length > 500) {
      throw new Error('Post content must be between 1 and 500 characters');
    }

    // Validate media URLs count
    if (data.mediaUrls && data.mediaUrls.length > 4) {
      throw new Error('Maximum 4 media items allowed per post');
    }

    // Validate trip exists if trip_id provided
    if (data.tripId) {
      const tripCheck = await pool.query(
        'SELECT id FROM trips WHERE id = $1',
        [data.tripId]
      );
      if (tripCheck.rows.length === 0) {
        throw new Error('Trip not found');
      }
    }

    // Validate parent post exists if parent_id provided
    if (data.parentId) {
      const parentCheck = await pool.query(
        'SELECT id FROM posts WHERE id = $1 AND is_deleted = FALSE',
        [data.parentId]
      );
      if (parentCheck.rows.length === 0) {
        throw new Error('Parent post not found');
      }
    }

    // Parse hashtags from content and merge with provided tags
    const parsedHashtags = this.parseHashtags(sanitizedContent);
    const allTags = [...new Set([...parsedHashtags, ...(data.tags || [])])];

    // Insert post
    const result = await pool.query(
      `INSERT INTO posts (
        user_id, community_id, parent_id, content, trip_id, media_urls, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        data.userId,
        data.communityId || null,
        data.parentId || null,
        sanitizedContent,
        data.tripId || null,
        JSON.stringify(data.mediaUrls || []),
        allTags,
      ]
    );

    // Fetch the complete post with engagement data
    const postId = result.rows[0].id;
    const completePost = await this.getPostById(postId, data.userId);

    if (!completePost) {
      throw new Error('Failed to retrieve created post');
    }

    // Invalidate relevant caches
    // 1. Invalidate For You feed caches (affects all users)
    await this.invalidateFeedCache();
    
    // 2. Invalidate Following feed caches for all followers of this user
    if (!data.parentId) { // Only for top-level posts, not replies
      await this.invalidateFollowerFeeds(data.userId);
    }
    
    // 3. Invalidate community feed cache if post is in a community
    if (data.communityId) {
      await this.invalidateCommunityFeedCache(data.communityId);
    }

    return completePost;
  }

  /**
   * Gets a post by ID with engagement data
   * Validates: Requirements 1.1
   */
  static async getPostById(postId: string, userId?: string): Promise<PostWithEngagement | null> {
    const query = `
      SELECT 
        p.*,
        u.name as user_name,
        u.profile_picture as user_avatar,
        c.name as community_name,
        ${userId ? `
          EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $2) as is_liked,
          EXISTS(SELECT 1 FROM reposts WHERE post_id = p.id AND user_id = $2) as is_reposted,
          EXISTS(SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = $2) as is_bookmarked
        ` : `
          FALSE as is_liked,
          FALSE as is_reposted,
          FALSE as is_bookmarked
        `},
        -- Trip embed data
        t.id as trip_id_data,
        t.title as trip_title,
        t.start_date as trip_start_date,
        t.end_date as trip_end_date,
        t.destination as trip_destination,
        t.total_budget as trip_budget,
        t.currency_code as trip_currency
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN communities c ON p.community_id = c.id
      LEFT JOIN trips t ON p.trip_id = t.id
      WHERE p.id = $1 AND p.is_deleted = FALSE
    `;

    const params = userId ? [postId, userId] : [postId];
    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToPostWithEngagement(result.rows[0]);
  }

  /**
   * Updates a post with ownership check
   * Validates: Requirements 1.7
   */
  static async updatePost(
    postId: string,
    userId: string,
    data: UpdatePostData
  ): Promise<Post> {
    // Check ownership
    const ownerCheck = await pool.query(
      'SELECT user_id FROM posts WHERE id = $1 AND is_deleted = FALSE',
      [postId]
    );

    if (ownerCheck.rows.length === 0) {
      throw new Error('Post not found');
    }

    if (ownerCheck.rows[0].user_id !== userId) {
      throw new Error('Unauthorized: You can only edit your own posts');
    }

    // Sanitize content if provided
    let sanitizedContent: string | undefined;
    if (data.content !== undefined) {
      sanitizedContent = this.sanitizeContent(data.content);
      if (sanitizedContent.length === 0 || sanitizedContent.length > 500) {
        throw new Error('Post content must be between 1 and 500 characters');
      }
    }

    // Validate media URLs count if provided
    if (data.mediaUrls && data.mediaUrls.length > 4) {
      throw new Error('Maximum 4 media items allowed per post');
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (sanitizedContent !== undefined) {
      updates.push(`content = $${paramIndex}`);
      params.push(sanitizedContent);
      paramIndex++;
    }

    if (data.mediaUrls !== undefined) {
      updates.push(`media_urls = $${paramIndex}`);
      params.push(JSON.stringify(data.mediaUrls));
      paramIndex++;
    }

    if (data.tags !== undefined) {
      updates.push(`tags = $${paramIndex}`);
      params.push(data.tags);
      paramIndex++;
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    params.push(postId);
    const query = `
      UPDATE posts 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, params);
    return this.mapRowToPost(result.rows[0]);
  }

  /**
   * Deletes a post with cascade logic
   * Validates: Requirements 1.8, 2.5
   */
  static async deletePost(postId: string, userId: string): Promise<void> {
    // Check ownership
    const ownerCheck = await pool.query(
      'SELECT user_id FROM posts WHERE id = $1',
      [postId]
    );

    if (ownerCheck.rows.length === 0) {
      throw new Error('Post not found');
    }

    if (ownerCheck.rows[0].user_id !== userId) {
      throw new Error('Unauthorized: You can only delete your own posts');
    }

    // Delete post (cascade will handle replies due to ON DELETE CASCADE)
    await pool.query('DELETE FROM posts WHERE id = $1', [postId]);
  }

  /**
   * Gets replies for a post with threading
   * Validates: Requirements 2.1, 2.2
   */
  static async getPostReplies(
    postId: string,
    userId?: string,
    cursor?: string,
    limit: number = this.FEED_PAGE_SIZE
  ): Promise<FeedResult> {
    let query = `
      SELECT 
        p.*,
        u.name as user_name,
        u.profile_picture as user_avatar,
        c.name as community_name,
        ${userId ? `
          EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $2) as is_liked,
          EXISTS(SELECT 1 FROM reposts WHERE post_id = p.id AND user_id = $2) as is_reposted,
          EXISTS(SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = $2) as is_bookmarked
        ` : `
          FALSE as is_liked,
          FALSE as is_reposted,
          FALSE as is_bookmarked
        `}
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN communities c ON p.community_id = c.id
      WHERE p.parent_id = $1 AND p.is_deleted = FALSE
    `;

    const params: any[] = [postId];
    let paramIndex = userId ? 3 : 2;

    if (userId) {
      params.push(userId);
    }

    // Add cursor condition
    if (cursor) {
      query += ` AND p.created_at > $${paramIndex}`;
      params.push(cursor);
      paramIndex++;
    }

    query += `
      ORDER BY p.created_at ASC
      LIMIT $${paramIndex}
    `;
    params.push(limit + 1);

    const result = await pool.query(query, params);

    const hasMore = result.rows.length > limit;
    const posts = result.rows.slice(0, limit).map(row => this.mapRowToPostWithEngagement(row));
    const newCursor = hasMore && posts.length > 0 
      ? posts[posts.length - 1].createdAt 
      : null;

    return {
      posts,
      cursor: newCursor,
      hasMore,
    };
  }

  // ==========================================================================
  // ENGAGEMENT ACTIONS
  // ==========================================================================

  /**
   * Likes a post
   * Validates: Requirements 4.1
   */
  static async likePost(postId: string, userId: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert like (will fail if already exists due to unique constraint)
      await client.query(
        'INSERT INTO likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [postId, userId]
      );

      // Increment like count
      await client.query(
        'UPDATE posts SET like_count = like_count + 1 WHERE id = $1',
        [postId]
      );

      await client.query('COMMIT');

      // Update engagement score and invalidate caches
      await this.updateEngagementScore(postId);
      await this.invalidateFeedCache(); // Invalidate For You feeds
      await this.checkAndInvalidateTrendingCache(postId); // Check if post is now trending
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Unlikes a post
   * Validates: Requirements 4.2
   */
  static async unlikePost(postId: string, userId: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Delete like
      const result = await client.query(
        'DELETE FROM likes WHERE post_id = $1 AND user_id = $2',
        [postId, userId]
      );

      // Decrement like count only if like existed
      if (result.rowCount && result.rowCount > 0) {
        await client.query(
          'UPDATE posts SET like_count = like_count - 1 WHERE id = $1',
          [postId]
        );
      }

      await client.query('COMMIT');

      // Update engagement score and invalidate caches
      await this.updateEngagementScore(postId);
      await this.invalidateFeedCache(); // Invalidate For You feeds
      await this.checkAndInvalidateTrendingCache(postId); // Check if post is now trending
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Reposts a post
   * Validates: Requirements 4.3
   */
  static async repostPost(postId: string, userId: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert repost (will fail if already exists due to unique constraint)
      await client.query(
        'INSERT INTO reposts (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [postId, userId]
      );

      // Increment repost count
      await client.query(
        'UPDATE posts SET repost_count = repost_count + 1 WHERE id = $1',
        [postId]
      );

      await client.query('COMMIT');

      // Update engagement score and invalidate caches
      await this.updateEngagementScore(postId);
      await this.invalidateFeedCache(); // Invalidate For You feeds
      await this.checkAndInvalidateTrendingCache(postId); // Check if post is now trending
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Unreposts a post
   * Validates: Requirements 4.3
   */
  static async unrepostPost(postId: string, userId: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Delete repost
      const result = await client.query(
        'DELETE FROM reposts WHERE post_id = $1 AND user_id = $2',
        [postId, userId]
      );

      // Decrement repost count only if repost existed
      if (result.rowCount && result.rowCount > 0) {
        await client.query(
          'UPDATE posts SET repost_count = repost_count - 1 WHERE id = $1',
          [postId]
        );
      }

      await client.query('COMMIT');

      // Update engagement score and invalidate caches
      await this.updateEngagementScore(postId);
      await this.invalidateFeedCache(); // Invalidate For You feeds
      await this.checkAndInvalidateTrendingCache(postId); // Check if post is now trending
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Bookmarks a post
   * Validates: Requirements 4.4
   */
  static async bookmarkPost(postId: string, userId: string): Promise<void> {
    await pool.query(
      'INSERT INTO bookmarks (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [postId, userId]
    );
  }

  /**
   * Unbookmarks a post
   * Validates: Requirements 4.4
   */
  static async unbookmarkPost(postId: string, userId: string): Promise<void> {
    await pool.query(
      'DELETE FROM bookmarks WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );
  }

  // ==========================================================================
  // TRIP EMBED INTEGRATION
  // ==========================================================================

  /**
   * Fetches trip summary data for embedding in posts
   * Validates: Requirements 3.1
   */
  static async fetchTripSummary(tripId: string): Promise<TripSummary | null> {
    // Check cache first
    const cacheKey = `trip:summary:${tripId}`;
    const cached = await RedisService.getJSON<TripSummary>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Fetch trip data
      const tripResult = await pool.query(
        `SELECT 
          t.id,
          t.title,
          t.start_date,
          t.end_date,
          t.budget,
          t.currency
        FROM trips t
        WHERE t.id = $1`,
        [tripId]
      );

      if (tripResult.rows.length === 0) {
        return null;
      }

      const trip = tripResult.rows[0];

      // Fetch destinations
      const destinationsResult = await pool.query(
        `SELECT DISTINCT d.name
        FROM days dy
        JOIN destinations d ON dy.destination_id = d.id
        WHERE dy.trip_id = $1
        ORDER BY d.name`,
        [tripId]
      );

      const destinations = destinationsResult.rows.map(row => row.name);

      // Get cover image (first place image or null)
      const coverImageResult = await pool.query(
        `SELECT p.image_url
        FROM places p
        JOIN days d ON p.day_id = d.id
        WHERE d.trip_id = $1 AND p.image_url IS NOT NULL
        ORDER BY d.date ASC, p.order_index ASC
        LIMIT 1`,
        [tripId]
      );

      const coverImage = coverImageResult.rows.length > 0 
        ? coverImageResult.rows[0].image_url 
        : null;

      const summary: TripSummary = {
        id: trip.id,
        title: trip.title,
        startDate: trip.start_date,
        endDate: trip.end_date,
        destinations,
        budget: trip.budget,
        currency: trip.currency,
        coverImage: coverImage || undefined,
      };

      // Cache the summary
      await RedisService.setJSON(cacheKey, summary, this.TRIP_CACHE_TTL);

      return summary;
    } catch (error) {
      console.error('Error fetching trip summary:', error);
      return null;
    }
  }

  // ==========================================================================
  // TRENDING CONTENT
  // ==========================================================================

  /**
   * Gets trending posts (top 10% engagement in last 24 hours)
   * Validates: Requirements 11.1, 11.2
   */
  static async getTrendingPosts(userId?: string): Promise<PostWithEngagement[]> {
    const cacheKey = 'trending:posts';
    
    // Check cache first
    const cached = await RedisService.getJSON<PostWithEngagement[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Calculate the 90th percentile engagement score for posts in last 24 hours
    const percentileResult = await pool.query(`
      SELECT PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY engagement_score) as threshold
      FROM posts
      WHERE created_at > NOW() - INTERVAL '24 hours'
        AND is_deleted = FALSE
        AND parent_id IS NULL
    `);

    const threshold = percentileResult.rows[0]?.threshold || 0;

    // Get posts above the threshold
    const query = `
      SELECT 
        p.*,
        u.name as user_name,
        u.profile_picture as user_avatar,
        c.name as community_name,
        ${userId ? `
          EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $2) as is_liked,
          EXISTS(SELECT 1 FROM reposts WHERE post_id = p.id AND user_id = $2) as is_reposted,
          EXISTS(SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = $2) as is_bookmarked
        ` : `
          FALSE as is_liked,
          FALSE as is_reposted,
          FALSE as is_bookmarked
        `},
        -- Trip embed data
        t.id as trip_id_data,
        t.title as trip_title,
        t.start_date as trip_start_date,
        t.end_date as trip_end_date,
        t.destination as trip_destination,
        t.total_budget as trip_budget,
        t.currency_code as trip_currency
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN communities c ON p.community_id = c.id
      LEFT JOIN trips t ON p.trip_id = t.id
      WHERE p.created_at > NOW() - INTERVAL '24 hours'
        AND p.is_deleted = FALSE
        AND p.parent_id IS NULL
        AND p.engagement_score >= $1
      ORDER BY p.engagement_score DESC
      LIMIT 20
    `;

    const params = userId ? [threshold, userId] : [threshold];
    const result = await pool.query(query, params);

    const trendingPosts = result.rows.map(row => this.mapRowToPostWithEngagement(row));

    // Cache the trending posts (no TTL - will be invalidated manually)
    await RedisService.setJSON(cacheKey, trendingPosts);

    return trendingPosts;
  }

  /**
   * Gets trending communities (ranked by member count and recent activity)
   * Validates: Requirements 11.4
   */
  static async getTrendingCommunities(limit: number = 10): Promise<any[]> {
    const cacheKey = 'trending:communities';
    
    // Check cache first
    const cached = await RedisService.getJSON<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Calculate trending score: member_count + (posts_last_7_days * 2)
    const query = `
      SELECT 
        c.id,
        c.name,
        c.description,
        c.icon_url,
        c.member_count,
        c.post_count,
        COUNT(p.id) as recent_posts,
        (c.member_count + (COUNT(p.id) * 2)) as trending_score
      FROM communities c
      LEFT JOIN posts p ON p.community_id = c.id 
        AND p.created_at > NOW() - INTERVAL '7 days'
        AND p.is_deleted = FALSE
      GROUP BY c.id
      ORDER BY trending_score DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);

    const trendingCommunities = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      iconUrl: row.icon_url,
      memberCount: row.member_count,
      postCount: row.post_count,
      recentPosts: parseInt(row.recent_posts),
      trendingScore: parseInt(row.trending_score),
    }));

    // Cache the trending communities
    await RedisService.setJSON(cacheKey, trendingCommunities);

    return trendingCommunities;
  }

  /**
   * Invalidates trending cache
   * Validates: Requirements 11.5
   */
  static async invalidateTrendingCache(): Promise<void> {
    await RedisService.del('trending:posts');
    await RedisService.del('trending:communities');
  }

  // ==========================================================================
  // SEARCH AND DISCOVERY
  // ==========================================================================

  /**
   * Searches posts with full-text search and relevance scoring
   * Validates: Requirements 10.1, 10.2
   */
  static async searchPosts(
    query: string,
    userId?: string,
    limit: number = 20
  ): Promise<PostWithEngagement[]> {
    // Full-text search on post content, tags, and community name
    // Relevance score combines text match quality and engagement score
    const result = await pool.query(
      `SELECT 
        p.*,
        u.name as user_name,
        u.profile_picture as user_avatar,
        c.name as community_name,
        ${userId ? `
          EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $2) as is_liked,
          EXISTS(SELECT 1 FROM reposts WHERE post_id = p.id AND user_id = $2) as is_reposted,
          EXISTS(SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = $2) as is_bookmarked,
        ` : `
          FALSE as is_liked,
          FALSE as is_reposted,
          FALSE as is_bookmarked,
        `}
        ts_rank(
          to_tsvector('english', p.content || ' ' || array_to_string(p.tags, ' ')),
          plainto_tsquery('english', $1)
        ) + (p.engagement_score / 100.0) as relevance_score
       FROM posts p
       INNER JOIN users u ON p.user_id = u.id
       LEFT JOIN communities c ON p.community_id = c.id
       WHERE p.is_deleted = false
         AND p.parent_id IS NULL
         AND (
           to_tsvector('english', p.content) @@ plainto_tsquery('english', $1)
           OR p.tags && ARRAY[$1]
           OR c.name ILIKE '%' || $1 || '%'
         )
       ORDER BY relevance_score DESC
       LIMIT ${userId ? '$3' : '$2'}`,
      userId ? [query, userId, limit] : [query, limit]
    );

    return result.rows.map(row => this.mapRowToPostWithEngagement(row));
  }

  /**
   * Searches posts by tag
   * Validates: Requirements 20.5
   */
  static async getPostsByTag(
    tag: string,
    userId?: string,
    cursor?: string,
    limit: number = this.FEED_PAGE_SIZE
  ): Promise<FeedResult> {
    let query = `
      SELECT 
        p.*,
        u.name as user_name,
        u.profile_picture as user_avatar,
        c.name as community_name,
        ${userId ? `
          EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $2) as is_liked,
          EXISTS(SELECT 1 FROM reposts WHERE post_id = p.id AND user_id = $2) as is_reposted,
          EXISTS(SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = $2) as is_bookmarked
        ` : `
          FALSE as is_liked,
          FALSE as is_reposted,
          FALSE as is_bookmarked
        `}
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN communities c ON p.community_id = c.id
      WHERE p.is_deleted = FALSE
        AND p.parent_id IS NULL
        AND $1 = ANY(p.tags)
    `;

    const params: any[] = [tag];
    let paramIndex = userId ? 3 : 2;

    if (userId) {
      params.push(userId);
    }

    // Add cursor condition
    if (cursor) {
      query += ` AND p.created_at < $${paramIndex}`;
      params.push(cursor);
      paramIndex++;
    }

    query += `
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex}
    `;
    params.push(limit + 1);

    const result = await pool.query(query, params);

    const hasMore = result.rows.length > limit;
    const posts = result.rows.slice(0, limit).map(row => this.mapRowToPostWithEngagement(row));
    const newCursor = hasMore && posts.length > 0 
      ? posts[posts.length - 1].createdAt 
      : null;

    return {
      posts,
      cursor: newCursor,
      hasMore,
    };
  }

  // ==========================================================================
  // TRIP PUBLISHING
  // ==========================================================================

  /**
   * Publishes a trip to the community feed
   * Auto-generates summary text and destination tags
   * Validates: Requirements 21.3, 21.5
   */
  static async publishTripToCommunity(
    tripId: string,
    userId: string,
    communityId?: string,
    additionalCommentary?: string
  ): Promise<Post> {
    // Check if trip has already been shared by this user
    const existingPost = await pool.query(
      `SELECT id FROM posts 
       WHERE trip_id = $1 
         AND user_id = $2 
         AND is_deleted = FALSE
       LIMIT 1`,
      [tripId, userId]
    );

    if (existingPost.rows.length > 0) {
      throw new Error('Trip has already been shared to community');
    }

    // Fetch trip data
    const tripResult = await pool.query(
      `SELECT 
        t.id,
        t.title,
        t.destination,
        t.start_date,
        t.end_date,
        t.owner_id
      FROM trips t
      WHERE t.id = $1`,
      [tripId]
    );

    if (tripResult.rows.length === 0) {
      throw new Error('Trip not found');
    }

    const trip = tripResult.rows[0];

    // Check ownership
    if (trip.owner_id !== userId) {
      throw new Error('Unauthorized: You can only publish your own trips');
    }

    // Fetch destinations from trip days
    const destinationsResult = await pool.query(
      `SELECT DISTINCT p.address
       FROM trip_days td
       JOIN places p ON p.trip_day_id = td.id
       WHERE td.trip_id = $1 AND p.address IS NOT NULL
       ORDER BY p.address
       LIMIT 5`,
      [tripId]
    );

    // Extract destination names (city/country) from addresses
    const destinations = destinationsResult.rows.map(row => {
      // Simple extraction: take the last two parts of the address (usually city, country)
      const parts = row.address.split(',').map((p: string) => p.trim());
      if (parts.length >= 2) {
        return parts[parts.length - 2]; // City name
      }
      return parts[0];
    }).filter((d: string, i: number, arr: string[]) => arr.indexOf(d) === i); // Remove duplicates

    // Generate auto-summary
    const destinationList = destinations.length > 0 
      ? destinations.slice(0, 3).join(', ') + (destinations.length > 3 ? '...' : '')
      : trip.destination;

    const autoSummary = `📍 ${trip.title}\n🗺️ ${destinationList}`;

    // Combine auto-summary with additional commentary
    const content = additionalCommentary 
      ? `${autoSummary}\n\n${additionalCommentary}`
      : autoSummary;

    // Generate destination tags (lowercase, no spaces)
    const destinationTags = destinations.map((d: string) => 
      d.toLowerCase().replace(/\s+/g, '')
    );

    // Create the post
    const post = await this.createPost({
      userId,
      content,
      communityId,
      tripId,
      mediaUrls: [],
      tags: destinationTags,
    });

    // Mark trip as shared (add a flag to trips table if needed)
    // For now, we'll just track via the post existence

    return post;
  }

  /**
   * Get trip share status - checks if a trip has been shared to community
   * Returns the post ID if shared, otherwise indicates not shared
   */
  static async getTripShareStatus(tripId: string, userId?: string): Promise<{
    tripId: string;
    isShared: boolean;
    postId?: string;
    sharedAt?: string;
  }> {
    // Check if there's a post with this trip_id
    const query = `
      SELECT 
        p.id,
        p.created_at
      FROM posts p
      WHERE p.trip_id = $1
        AND p.is_deleted = FALSE
        ${userId ? 'AND p.user_id = $2' : ''}
      ORDER BY p.created_at DESC
      LIMIT 1
    `;

    const params = userId ? [tripId, userId] : [tripId];
    const result = await pool.query(query, params);

    if (result.rows.length > 0) {
      return {
        tripId,
        isShared: true,
        postId: result.rows[0].id,
        sharedAt: result.rows[0].created_at,
      };
    }

    return {
      tripId,
      isShared: false,
    };
  }

  /**
   * Checks if a post should trigger trending cache invalidation
   * (i.e., if it enters the top 10% threshold)
   */
  static async checkAndInvalidateTrendingCache(postId: string): Promise<void> {
    // Get the post's engagement score
    const postResult = await pool.query(
      'SELECT engagement_score, created_at FROM posts WHERE id = $1',
      [postId]
    );

    if (postResult.rows.length === 0) {
      return;
    }

    const post = postResult.rows[0];
    const postAge = Date.now() - new Date(post.created_at).getTime();
    const hoursOld = postAge / (1000 * 60 * 60);

    // Only check if post is less than 24 hours old
    if (hoursOld > 24) {
      return;
    }

    // Calculate the 90th percentile threshold
    const percentileResult = await pool.query(`
      SELECT PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY engagement_score) as threshold
      FROM posts
      WHERE created_at > NOW() - INTERVAL '24 hours'
        AND is_deleted = FALSE
        AND parent_id IS NULL
    `);

    const threshold = percentileResult.rows[0]?.threshold || 0;

    // If post is above threshold, invalidate trending cache
    if (post.engagement_score >= threshold) {
      await this.invalidateTrendingCache();
    }
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Maps database row to Post object
   */
  private static mapRowToPost(row: any): Post {
    return {
      id: row.id,
      userId: row.user_id,
      communityId: row.community_id,
      parentId: row.parent_id,
      content: row.content,
      tripId: row.trip_id,
      mediaUrls: Array.isArray(row.media_urls) ? row.media_urls : JSON.parse(row.media_urls || '[]'),
      tags: row.tags || [],
      likeCount: row.like_count,
      replyCount: row.reply_count,
      repostCount: row.repost_count,
      engagementScore: parseFloat(row.engagement_score),
      isDeleted: row.is_deleted,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Maps database row to PostWithEngagement object
   */
  private static mapRowToPostWithEngagement(row: any): PostWithEngagement {
    const post: any = {
      ...this.mapRowToPost(row),
      userName: row.user_name,
      userAvatar: row.user_avatar,
      communityName: row.community_name,
      isLiked: row.is_liked || false,
      isReposted: row.is_reposted || false,
      isBookmarked: row.is_bookmarked || false,
    };

    // Add trip embed if trip data is present
    if (row.trip_id_data) {
      post.tripEmbed = {
        id: row.trip_id_data,
        title: row.trip_title,
        startDate: row.trip_start_date,
        endDate: row.trip_end_date,
        destinations: row.trip_destination ? [row.trip_destination] : [],
        budget: row.trip_budget,
        currency: row.trip_currency,
      };
    }

    return post;
  }
}
