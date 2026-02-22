import { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { CommunityService } from '../services/communityService.js';
import { socketService } from '../services/socketService.js';

export class CommunityController {
  // Get all community trips with top 3 story items
  static async getCommunityTrips(req: Request, res: Response) {
    try {
      const userId = req.user?.userId; // Optional - may be undefined for anonymous users

      // Get all community trips
      const tripsResult = await pool.query(
        `SELECT * FROM trips 
         WHERE is_community = true AND is_public = true 
         ORDER BY created_at DESC`
      );

      const trips = tripsResult.rows;

      // Get top 3 story items for each trip
      const storyItemsMap: Record<string, any[]> = {};
      
      for (const trip of trips) {
        const storyResult = await pool.query(
          `SELECT * FROM story_items 
           WHERE trip_id = $1 
           ORDER BY created_at DESC 
           LIMIT 3`,
          [trip.id]
        );
        storyItemsMap[trip.id] = storyResult.rows;
      }

      // Get liked trip IDs for authenticated user
      let likedTripIds: string[] = [];
      if (userId) {
        const likesResult = await pool.query(
          `SELECT trip_id FROM trip_likes WHERE user_id = $1`,
          [userId]
        );
        likedTripIds = likesResult.rows.map((row) => row.trip_id);
      }

      res.json({
        success: true,
        data: {
          trips,
          storyItemsMap,
          likedTripIds,
        },
      });
    } catch (error) {
      console.error('Error fetching community trips:', error);
      res.status(500).json({ error: 'Failed to fetch community trips' });
    }
  }

  // Like a trip
  static async likeTrip(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { id: tripId } = req.params;

      // Check if trip exists and is community
      const tripCheck = await pool.query(
        'SELECT id, is_community FROM trips WHERE id = $1',
        [tripId]
      );

      if (tripCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Trip not found' });
      }

      if (!tripCheck.rows[0].is_community) {
        return res.status(400).json({ error: 'Trip is not in community feed' });
      }

      // Check if already liked
      const existingLike = await pool.query(
        'SELECT id FROM trip_likes WHERE trip_id = $1 AND user_id = $2',
        [tripId, userId]
      );

      if (existingLike.rows.length > 0) {
        return res.status(400).json({ error: 'Trip already liked' });
      }

      // Create like record
      await pool.query(
        'INSERT INTO trip_likes (trip_id, user_id) VALUES ($1, $2)',
        [tripId, userId]
      );

      // Increment likes count
      await pool.query(
        'UPDATE trips SET likes_count = likes_count + 1 WHERE id = $1',
        [tripId]
      );

      res.json({
        success: true,
        message: 'Trip liked successfully',
      });
    } catch (error) {
      console.error('Error liking trip:', error);
      res.status(500).json({ error: 'Failed to like trip' });
    }
  }

  // Unlike a trip
  static async unlikeTrip(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { id: tripId } = req.params;

      // Check if like exists
      const existingLike = await pool.query(
        'SELECT id FROM trip_likes WHERE trip_id = $1 AND user_id = $2',
        [tripId, userId]
      );

      if (existingLike.rows.length === 0) {
        return res.status(400).json({ error: 'Trip not liked' });
      }

      // Delete like record
      await pool.query(
        'DELETE FROM trip_likes WHERE trip_id = $1 AND user_id = $2',
        [tripId, userId]
      );

      // Decrement likes count
      await pool.query(
        'UPDATE trips SET likes_count = GREATEST(0, likes_count - 1) WHERE id = $1',
        [tripId]
      );

      res.json({
        success: true,
        message: 'Trip unliked successfully',
      });
    } catch (error) {
      console.error('Error unliking trip:', error);
      res.status(500).json({ error: 'Failed to unlike trip' });
    }
  }

  // Copy a trip to user's own trips
  static async copyTrip(req: Request, res: Response) {
    const client = await pool.connect();
    
    try {
      const userId = req.user?.userId;
      const { id: sourceTripId } = req.params;

      await client.query('BEGIN');

      // Get source trip
      const tripResult = await client.query(
        'SELECT * FROM trips WHERE id = $1 AND is_community = true AND is_public = true',
        [sourceTripId]
      );

      if (tripResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Trip not found or not available for copying' });
      }

      const sourceTrip = tripResult.rows[0];

      // Create new trip for current user
      const newTripResult = await client.query(
        `INSERT INTO trips (
          title, destination, start_date, end_date, cover_image_url, 
          theme, owner_id, total_budget, currency_code, is_public, is_community
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          `${sourceTrip.title} (Copy)`,
          sourceTrip.destination,
          sourceTrip.start_date,
          sourceTrip.end_date,
          sourceTrip.cover_image_url,
          sourceTrip.theme,
          userId,
          sourceTrip.total_budget,
          sourceTrip.currency_code,
          false, // Private by default
          false, // Not in community by default
        ]
      );

      const newTrip = newTripResult.rows[0];

      // Get all days from source trip
      const daysResult = await client.query(
        'SELECT * FROM trip_days WHERE trip_id = $1 ORDER BY day_number ASC',
        [sourceTripId]
      );

      // Copy days and places
      for (const sourceDay of daysResult.rows) {
        // Create new day
        const newDayResult = await client.query(
          `INSERT INTO trip_days (trip_id, day_number, date)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [newTrip.id, sourceDay.day_number, sourceDay.date]
        );

        const newDay = newDayResult.rows[0];

        // Get places for this day
        const placesResult = await client.query(
          'SELECT * FROM places WHERE trip_day_id = $1 ORDER BY created_at ASC',
          [sourceDay.id]
        );

        // Copy places
        for (const sourcePlace of placesResult.rows) {
          await client.query(
            `INSERT INTO places (
              trip_day_id, name, address, lat, lng, time_start, time_end,
              notes, image_url, place_type, sticker, cost, cost_currency,
              budget_category, transport_mode
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
            [
              newDay.id,
              sourcePlace.name,
              sourcePlace.address,
              sourcePlace.lat,
              sourcePlace.lng,
              sourcePlace.time_start,
              sourcePlace.time_end,
              sourcePlace.notes,
              sourcePlace.image_url,
              sourcePlace.place_type,
              sourcePlace.sticker,
              sourcePlace.cost,
              sourcePlace.cost_currency,
              sourcePlace.budget_category,
              sourcePlace.transport_mode,
            ]
          );
        }
      }

      // Get packing list from source trip
      const packingResult = await client.query(
        'SELECT * FROM packing_lists WHERE trip_id = $1',
        [sourceTripId]
      );

      // Copy packing list items
      for (const packingItem of packingResult.rows) {
        await client.query(
          `INSERT INTO packing_lists (
            trip_id, item, category, is_checked, added_by, is_custom
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            newTrip.id,
            packingItem.item,
            packingItem.category,
            false, // Reset checked status
            userId,
            packingItem.is_custom,
          ]
        );
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        data: newTrip,
        message: 'Trip copied successfully',
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error copying trip:', error);
      res.status(500).json({ error: 'Failed to copy trip' });
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // Community Threads Feed Endpoints
  // ============================================================================

  // Feed endpoints
  static async getForYouFeed(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const cursor = req.query.cursor as string | undefined;
      const limit = parseInt(req.query.limit as string) || 20;

      const feed = await CommunityService.generateForYouFeed(userId, cursor, limit);

      res.json(feed);
    } catch (error) {
      console.error('Error fetching For You feed:', error);
      res.status(500).json({ error: 'Failed to fetch For You feed' });
    }
  }

  static async getFollowingFeed(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const cursor = req.query.cursor as string | undefined;
      const limit = parseInt(req.query.limit as string) || 20;

      const feed = await CommunityService.generateFollowingFeed(userId, cursor, limit);

      res.json(feed);
    } catch (error) {
      console.error('Error fetching Following feed:', error);
      res.status(500).json({ error: 'Failed to fetch Following feed' });
    }
  }

  static async getCommunityFeed(req: Request, res: Response): Promise<void> {
    try {
      const { communityId } = req.params;
      const userId = req.user?.userId || ''; // Use empty string for anonymous users
      const cursor = req.query.cursor as string | undefined;
      const limit = parseInt(req.query.limit as string) || 20;

      const feed = await CommunityService.getCommunityPosts(communityId, userId, cursor, limit);

      res.json({
        success: true,
        data: feed,
      });
    } catch (error) {
      console.error('Error fetching community feed:', error);
      res.status(500).json({ error: 'Failed to fetch community feed' });
    }
  }

  static async getTrendingPosts(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      const posts = await CommunityService.getTrendingPosts(userId);

      res.json({
        success: true,
        data: posts,
      });
    } catch (error) {
      console.error('Error fetching trending posts:', error);
      res.status(500).json({ error: 'Failed to fetch trending posts' });
    }
  }

  // Post CRUD endpoints
  static async createPost(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { content, communityId, parentId, tripId, mediaUrls, tags } = req.body;

      // Validation
      if (!content || typeof content !== 'string') {
        res.status(400).json({ error: 'Content is required' });
        return;
      }

      if (content.length > 500) {
        res.status(400).json({ error: 'Content must be 500 characters or less' });
        return;
      }

      if (mediaUrls && (!Array.isArray(mediaUrls) || mediaUrls.length > 4)) {
        res.status(400).json({ error: 'Maximum 4 media items allowed' });
        return;
      }

      const post = await CommunityService.createPost({
        userId,
        content,
        communityId,
        parentId,
        tripId,
        mediaUrls: mediaUrls || [],
        tags: tags || [],
      });

      // Emit socket event for new post
      if (parentId) {
        // This is a reply
        socketService.emitNewReply(parentId, post);
      } else {
        // This is a new post
        socketService.emitNewPost(communityId || null, post);
      }

      res.status(201).json({
        success: true,
        data: post,
      });
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({ error: 'Failed to create post' });
    }
  }

  static async getPost(req: Request, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const userId = req.user?.userId;

      const post = await CommunityService.getPostById(postId, userId);

      if (!post) {
        res.status(404).json({ error: 'Post not found' });
        return;
      }

      res.json({
        success: true,
        data: post,
      });
    } catch (error) {
      console.error('Error fetching post:', error);
      res.status(500).json({ error: 'Failed to fetch post' });
    }
  }

  static async updatePost(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { postId } = req.params;
      const { content, mediaUrls, tags } = req.body;

      // Validation
      if (content && content.length > 500) {
        res.status(400).json({ error: 'Content must be 500 characters or less' });
        return;
      }

      if (mediaUrls && (!Array.isArray(mediaUrls) || mediaUrls.length > 4)) {
        res.status(400).json({ error: 'Maximum 4 media items allowed' });
        return;
      }

      const post = await CommunityService.updatePost(postId, userId, {
        content,
        mediaUrls,
        tags,
      });

      // Emit socket event for post update
      socketService.emitPostUpdated(postId, post);

      res.json({
        success: true,
        data: post,
      });
    } catch (error: any) {
      console.error('Error updating post:', error);
      if (error.message === 'Post not found') {
        res.status(404).json({ error: 'Post not found' });
      } else if (error.message === 'Unauthorized') {
        res.status(403).json({ error: 'You can only edit your own posts' });
      } else {
        res.status(500).json({ error: 'Failed to update post' });
      }
    }
  }

  static async deletePost(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { postId } = req.params;

      await CommunityService.deletePost(postId, userId);

      // Emit socket event for post deletion
      socketService.emitPostDeleted(postId);

      res.json({
        success: true,
        message: 'Post deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting post:', error);
      if (error.message === 'Post not found') {
        res.status(404).json({ error: 'Post not found' });
      } else if (error.message === 'Unauthorized') {
        res.status(403).json({ error: 'You can only delete your own posts' });
      } else {
        res.status(500).json({ error: 'Failed to delete post' });
      }
    }
  }

  static async getPostReplies(req: Request, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const userId = req.user?.userId;
      const cursor = req.query.cursor as string | undefined;
      const limit = parseInt(req.query.limit as string) || 20;

      const replies = await CommunityService.getPostReplies(postId, userId, cursor, limit);

      res.json({
        success: true,
        data: replies,
      });
    } catch (error) {
      console.error('Error fetching post replies:', error);
      res.status(500).json({ error: 'Failed to fetch post replies' });
    }
  }

  // Engagement action endpoints
  static async likePost(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { postId } = req.params;

      await CommunityService.likePost(postId, userId);

      // Fetch updated post to get engagement data
      const updatedPost = await CommunityService.getPostById(postId, userId);
      if (updatedPost) {
        socketService.emitEngagementUpdate(postId, {
          likeCount: updatedPost.likeCount,
          replyCount: updatedPost.replyCount,
          repostCount: updatedPost.repostCount,
          engagementScore: updatedPost.engagementScore,
        });
      }

      res.json({
        success: true,
        message: 'Post liked successfully',
      });
    } catch (error: any) {
      console.error('Error liking post:', error);
      if (error.message === 'Post not found') {
        res.status(404).json({ error: 'Post not found' });
      } else if (error.message === 'Already liked') {
        res.status(400).json({ error: 'Post already liked' });
      } else {
        res.status(500).json({ error: 'Failed to like post' });
      }
    }
  }

  static async unlikePost(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { postId } = req.params;

      await CommunityService.unlikePost(postId, userId);

      // Fetch updated post to get engagement data
      const updatedPost = await CommunityService.getPostById(postId, userId);
      if (updatedPost) {
        socketService.emitEngagementUpdate(postId, {
          likeCount: updatedPost.likeCount,
          replyCount: updatedPost.replyCount,
          repostCount: updatedPost.repostCount,
          engagementScore: updatedPost.engagementScore,
        });
      }

      res.json({
        success: true,
        message: 'Post unliked successfully',
      });
    } catch (error: any) {
      console.error('Error unliking post:', error);
      if (error.message === 'Like not found') {
        res.status(400).json({ error: 'Post not liked' });
      } else {
        res.status(500).json({ error: 'Failed to unlike post' });
      }
    }
  }

  static async repostPost(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { postId } = req.params;

      await CommunityService.repostPost(postId, userId);

      // Fetch updated post to get engagement data
      const updatedPost = await CommunityService.getPostById(postId, userId);
      if (updatedPost) {
        socketService.emitEngagementUpdate(postId, {
          likeCount: updatedPost.likeCount,
          replyCount: updatedPost.replyCount,
          repostCount: updatedPost.repostCount,
          engagementScore: updatedPost.engagementScore,
        });
      }

      res.json({
        success: true,
        message: 'Post reposted successfully',
      });
    } catch (error: any) {
      console.error('Error reposting post:', error);
      if (error.message === 'Post not found') {
        res.status(404).json({ error: 'Post not found' });
      } else if (error.message === 'Already reposted') {
        res.status(400).json({ error: 'Post already reposted' });
      } else {
        res.status(500).json({ error: 'Failed to repost post' });
      }
    }
  }

  static async unrepostPost(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { postId } = req.params;

      await CommunityService.unrepostPost(postId, userId);

      // Fetch updated post to get engagement data
      const updatedPost = await CommunityService.getPostById(postId, userId);
      if (updatedPost) {
        socketService.emitEngagementUpdate(postId, {
          likeCount: updatedPost.likeCount,
          replyCount: updatedPost.replyCount,
          repostCount: updatedPost.repostCount,
          engagementScore: updatedPost.engagementScore,
        });
      }

      res.json({
        success: true,
        message: 'Post unreposted successfully',
      });
    } catch (error: any) {
      console.error('Error unreposting post:', error);
      if (error.message === 'Repost not found') {
        res.status(400).json({ error: 'Post not reposted' });
      } else {
        res.status(500).json({ error: 'Failed to unrepost post' });
      }
    }
  }

  static async bookmarkPost(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { postId } = req.params;

      await CommunityService.bookmarkPost(postId, userId);

      res.json({
        success: true,
        message: 'Post bookmarked successfully',
      });
    } catch (error) {
      console.error('Error bookmarking post:', error);
      res.status(500).json({ error: 'Failed to bookmark post' });
    }
  }

  static async unbookmarkPost(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { postId } = req.params;

      await CommunityService.unbookmarkPost(postId, userId);

      res.json({
        success: true,
        message: 'Post unbookmarked successfully',
      });
    } catch (error) {
      console.error('Error unbookmarking post:', error);
      res.status(500).json({ error: 'Failed to unbookmark post' });
    }
  }

  // Community management endpoints
  static async getCommunities(req: Request, res: Response): Promise<void> {
    try {
      const result = await pool.query(
        `SELECT * FROM communities 
         ORDER BY member_count DESC, name ASC`
      );

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error('Error fetching communities:', error);
      res.status(500).json({ error: 'Failed to fetch communities' });
    }
  }

  static async getCommunity(req: Request, res: Response): Promise<void> {
    try {
      const { communityId } = req.params;

      const result = await pool.query(
        'SELECT * FROM communities WHERE id = $1',
        [communityId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Community not found' });
        return;
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Error fetching community:', error);
      res.status(500).json({ error: 'Failed to fetch community' });
    }
  }

  static async joinCommunity(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { communityId } = req.params;

      // Check if community exists
      const communityCheck = await pool.query(
        'SELECT id FROM communities WHERE id = $1',
        [communityId]
      );

      if (communityCheck.rows.length === 0) {
        res.status(404).json({ error: 'Community not found' });
        return;
      }

      // Check if already a member
      const memberCheck = await pool.query(
        'SELECT id FROM community_members WHERE community_id = $1 AND user_id = $2',
        [communityId, userId]
      );

      if (memberCheck.rows.length > 0) {
        res.status(400).json({ error: 'Already a member of this community' });
        return;
      }

      // Create membership
      await pool.query(
        'INSERT INTO community_members (community_id, user_id) VALUES ($1, $2)',
        [communityId, userId]
      );

      // Increment member count
      await pool.query(
        'UPDATE communities SET member_count = member_count + 1 WHERE id = $1',
        [communityId]
      );

      // Get user name for socket event
      const userResult = await pool.query(
        'SELECT name FROM users WHERE id = $1',
        [userId]
      );
      const userName = userResult.rows[0]?.name;

      // Emit socket event for community joined
      socketService.emitCommunityJoined(communityId, userId, userName);

      res.json({
        success: true,
        message: 'Joined community successfully',
      });
    } catch (error) {
      console.error('Error joining community:', error);
      res.status(500).json({ error: 'Failed to join community' });
    }
  }

  static async leaveCommunity(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { communityId } = req.params;

      // Check if member
      const memberCheck = await pool.query(
        'SELECT id FROM community_members WHERE community_id = $1 AND user_id = $2',
        [communityId, userId]
      );

      if (memberCheck.rows.length === 0) {
        res.status(400).json({ error: 'Not a member of this community' });
        return;
      }

      // Delete membership
      await pool.query(
        'DELETE FROM community_members WHERE community_id = $1 AND user_id = $2',
        [communityId, userId]
      );

      // Decrement member count
      await pool.query(
        'UPDATE communities SET member_count = GREATEST(0, member_count - 1) WHERE id = $1',
        [communityId]
      );

      // Get user name for socket event
      const userResult = await pool.query(
        'SELECT name FROM users WHERE id = $1',
        [userId]
      );
      const userName = userResult.rows[0]?.name;

      // Emit socket event for community left
      socketService.emitCommunityLeft(communityId, userId, userName);

      res.json({
        success: true,
        message: 'Left community successfully',
      });
    } catch (error) {
      console.error('Error leaving community:', error);
      res.status(500).json({ error: 'Failed to leave community' });
    }
  }

  static async getUserCommunities(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const result = await pool.query(
        `SELECT c.* 
         FROM communities c
         INNER JOIN community_members cm ON c.id = cm.community_id
         WHERE cm.user_id = $1
         ORDER BY cm.joined_at DESC`,
        [userId]
      );

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error('Error fetching user communities:', error);
      res.status(500).json({ error: 'Failed to fetch user communities' });
    }
  }

  // Search and discovery endpoints
  static async searchPosts(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query.q as string;
      const userId = req.user?.userId;

      if (!query || query.trim().length === 0) {
        res.status(400).json({ error: 'Search query is required' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 20;

      const posts = await CommunityService.searchPosts(query, userId, limit);

      res.json({
        success: true,
        data: posts,
      });
    } catch (error) {
      console.error('Error searching posts:', error);
      res.status(500).json({ error: 'Failed to search posts' });
    }
  }

  static async searchCommunities(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query.q as string;

      if (!query || query.trim().length === 0) {
        res.status(400).json({ error: 'Search query is required' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 20;

      const result = await pool.query(
        `SELECT *
         FROM communities
         WHERE name ILIKE '%' || $1 || '%'
            OR description ILIKE '%' || $1 || '%'
         ORDER BY member_count DESC
         LIMIT $2`,
        [query, limit]
      );

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error('Error searching communities:', error);
      res.status(500).json({ error: 'Failed to search communities' });
    }
  }

  static async getPostsByTag(req: Request, res: Response): Promise<void> {
    try {
      const { tag } = req.params;
      const userId = req.user?.userId;
      const cursor = req.query.cursor as string | undefined;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!tag || tag.trim().length === 0) {
        res.status(400).json({ error: 'Tag is required' });
        return;
      }

      // Remove # prefix if present
      const cleanTag = tag.startsWith('#') ? tag.substring(1) : tag;

      const feed = await CommunityService.getPostsByTag(cleanTag, userId, cursor, limit);

      res.json({
        success: true,
        data: feed,
      });
    } catch (error) {
      console.error('Error fetching posts by tag:', error);
      res.status(500).json({ error: 'Failed to fetch posts by tag' });
    }
  }

  static async getSuggestedCommunities(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const limit = parseInt(req.query.limit as string) || 10;

      // Get communities the user is not a member of, ordered by popularity
      const result = await pool.query(
        `SELECT c.*
         FROM communities c
         WHERE NOT EXISTS (
           SELECT 1 FROM community_members cm
           WHERE cm.community_id = c.id AND cm.user_id = $1
         )
         ORDER BY c.member_count DESC, c.post_count DESC
         LIMIT $2`,
        [userId, limit]
      );

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error('Error fetching suggested communities:', error);
      res.status(500).json({ error: 'Failed to fetch suggested communities' });
    }
  }

  static async publishTripToCommunity(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { tripId } = req.params;
      const { communityId, commentary } = req.body;

      const post = await CommunityService.publishTripToCommunity(
        tripId,
        userId,
        communityId,
        commentary
      );

      res.status(201).json({
        success: true,
        data: post,
        message: 'Trip published to community successfully',
      });
    } catch (error: any) {
      console.error('Error publishing trip to community:', error);
      if (error.message === 'Trip not found') {
        res.status(404).json({ error: 'Trip not found' });
      } else if (error.message === 'Unauthorized: You can only publish your own trips') {
        res.status(403).json({ error: 'You can only publish your own trips' });
      } else if (error.message === 'Trip has already been shared to community') {
        res.status(409).json({ error: 'Trip has already been shared to community' });
      } else {
        res.status(500).json({ error: 'Failed to publish trip to community' });
      }
    }
  }

  static async getTripShareStatus(req: Request, res: Response): Promise<void> {
    try {
      const { tripId } = req.params;
      const userId = req.user?.userId; // Optional - if provided, only check user's own posts

      const status = await CommunityService.getTripShareStatus(tripId, userId);

      res.status(200).json(status);
    } catch (error: any) {
      console.error('Error getting trip share status:', error);
      res.status(500).json({ error: 'Failed to get trip share status' });
    }
  }

  // Moderation endpoints
  static async reportPost(req: Request, res: Response): Promise<void> {
      try {
        const userId = req.user?.userId;
        if (!userId) {
          res.status(401).json({ error: 'Authentication required' });
          return;
        }

        const { postId } = req.params;
        const { reason, description } = req.body;

        if (!reason) {
          res.status(400).json({ error: 'Reason is required' });
          return;
        }

        // Check if post exists
        const postCheck = await pool.query(
          'SELECT id FROM posts WHERE id = $1 AND is_deleted = false',
          [postId]
        );

        if (postCheck.rows.length === 0) {
          res.status(404).json({ error: 'Post not found' });
          return;
        }

        // Check if user has already reported this post
        const existingReport = await pool.query(
          'SELECT id FROM reports WHERE post_id = $1 AND reporter_id = $2',
          [postId, userId]
        );

        if (existingReport.rows.length > 0) {
          res.status(400).json({ error: 'You have already reported this post' });
          return;
        }

        // Create report
        await pool.query(
          `INSERT INTO reports (post_id, reporter_id, reason, description)
           VALUES ($1, $2, $3, $4)`,
          [postId, userId, reason, description]
        );

        // Check if post should be flagged (3+ reports)
        const reportCount = await pool.query(
          'SELECT COUNT(*) as count FROM reports WHERE post_id = $1',
          [postId]
        );

        const count = parseInt(reportCount.rows[0].count);

        if (count >= 3) {
          // Flag post for moderator review
          await pool.query(
            'UPDATE posts SET flagged_for_review = true WHERE id = $1',
            [postId]
          );

          console.log(`Post ${postId} flagged for moderation (${count} reports)`);

          // Invalidate cache since post status changed
          await CommunityService.invalidateFeedCache();
        }

        res.json({
          success: true,
          message: 'Post reported successfully',
          flagged: count >= 3,
        });
      } catch (error) {
        console.error('Error reporting post:', error);
        res.status(500).json({ error: 'Failed to report post' });
      }
    }

  static async getReports(req: Request, res: Response): Promise<void> {
      try {
        const userId = req.user?.userId;
        if (!userId) {
          res.status(401).json({ error: 'Authentication required' });
          return;
        }

        // Check if user is moderator/admin (simplified check)
        // In production, you'd check user role from database
        const status = req.query.status as string || 'pending';
        const flaggedOnly = req.query.flagged === 'true';

        let query = `
          SELECT 
            r.id,
            r.post_id,
            r.reason,
            r.description,
            r.status,
            r.reviewed_by,
            r.reviewed_at,
            r.created_at,
            p.content as post_content,
            p.flagged_for_review,
            u.username as reporter_name,
            (SELECT COUNT(*) FROM reports WHERE post_id = r.post_id) as report_count
          FROM reports r
          INNER JOIN posts p ON r.post_id = p.id
          INNER JOIN users u ON r.reporter_id = u.id
          WHERE r.status = $1
        `;

        const params: any[] = [status];

        if (flaggedOnly) {
          query += ' AND p.flagged_for_review = true';
        }

        query += ' ORDER BY p.flagged_for_review DESC, r.created_at DESC';

        const result = await pool.query(query, params);

        res.json({
          success: true,
          data: result.rows,
        });
      } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Failed to fetch reports' });
      }
    }

  static async reviewReport(req: Request, res: Response): Promise<void> {
      try {
        const userId = req.user?.userId;
        if (!userId) {
          res.status(401).json({ error: 'Authentication required' });
          return;
        }

        const { reportId } = req.params;
        const { action } = req.body; // 'dismiss' or 'remove'

        if (!action || !['dismiss', 'remove'].includes(action)) {
          res.status(400).json({ error: 'Invalid action. Must be "dismiss" or "remove"' });
          return;
        }

        // Get the report and post info
        const report = await pool.query(
          'SELECT post_id FROM reports WHERE id = $1',
          [reportId]
        );

        if (report.rows.length === 0) {
          res.status(404).json({ error: 'Report not found' });
          return;
        }

        const postId = report.rows[0].post_id;

        // Update report status
        const status = action === 'dismiss' ? 'dismissed' : 'removed';
        await pool.query(
          `UPDATE reports 
           SET status = $1, reviewed_by = $2, reviewed_at = NOW()
           WHERE id = $3`,
          [status, userId, reportId]
        );

        // If removing, mark post as deleted
        if (action === 'remove') {
          await pool.query(
            'UPDATE posts SET is_deleted = true, flagged_for_review = false WHERE id = $1',
            [postId]
          );

          // Invalidate cache since post was removed
          await CommunityService.invalidateFeedCache();
        } else {
          // If dismissing, check if we should unflag the post
          // Unflag if all reports for this post are now dismissed or removed
          const pendingReports = await pool.query(
            `SELECT COUNT(*) as count 
             FROM reports 
             WHERE post_id = $1 AND status = 'pending'`,
            [postId]
          );

          if (parseInt(pendingReports.rows[0].count) === 0) {
            await pool.query(
              'UPDATE posts SET flagged_for_review = false WHERE id = $1',
              [postId]
            );
          }
        }

        res.json({
          success: true,
          message: `Report ${action}ed successfully`,
        });
      } catch (error) {
        console.error('Error reviewing report:', error);
        res.status(500).json({ error: 'Failed to review report' });
      }
    }

  /**
   * Get flagged posts for moderator review
   * GET /api/community/moderation/flagged
   */
  static async getFlaggedPosts(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Check if user is moderator/admin (simplified check)
      // In production, you'd check user role from database

      const result = await pool.query(
        `SELECT
          p.id,
          p.content,
          p.user_id,
          p.created_at,
          p.like_count,
          p.reply_count,
          p.repost_count,
          u.username as author_name,
          (SELECT COUNT(*) FROM reports WHERE post_id = p.id AND status = 'pending') as pending_report_count,
          (SELECT COUNT(*) FROM reports WHERE post_id = p.id) as total_report_count,
          (SELECT json_agg(json_build_object(
            'id', r.id,
            'reason', r.reason,
            'description', r.description,
            'reporter_name', ru.username,
            'created_at', r.created_at
          ))
          FROM reports r
          INNER JOIN users ru ON r.reporter_id = ru.id
          WHERE r.post_id = p.id AND r.status = 'pending') as reports
        FROM posts p
        INNER JOIN users u ON p.user_id = u.id
        WHERE p.flagged_for_review = true AND p.is_deleted = false
        ORDER BY p.created_at DESC`
      );

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error('Error fetching flagged posts:', error);
      res.status(500).json({ error: 'Failed to fetch flagged posts' });
    }
  }

}
