import { Router } from 'express';
import { CommunityController } from '../controllers/communityController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { postCreationRateLimit } from '../middleware/rateLimitMiddleware.js';

const router = Router();

// ============================================================================
// Legacy Trip Community Routes
// ============================================================================

// Get all community trips (public, optional auth for liked status)
router.get('/trips', optionalAuth, CommunityController.getCommunityTrips);

// Like a trip (requires auth)
router.post('/trips/:id/like', authenticateToken, CommunityController.likeTrip);

// Unlike a trip (requires auth)
router.delete('/trips/:id/like', authenticateToken, CommunityController.unlikeTrip);

// Copy a trip (requires auth)
router.post('/trips/:id/copy', authenticateToken, CommunityController.copyTrip);

// ============================================================================
// Community Threads Feed Routes
// ============================================================================

// Feed endpoints
router.get('/feed/for-you', authenticateToken, CommunityController.getForYouFeed);
router.get('/feed/following', authenticateToken, CommunityController.getFollowingFeed);
router.get('/feed/community/:communityId', CommunityController.getCommunityFeed);
router.get('/feed/trending', optionalAuth, CommunityController.getTrendingPosts);

// Post CRUD endpoints
router.post('/posts', authenticateToken, postCreationRateLimit, CommunityController.createPost);
router.get('/posts/:postId', optionalAuth, CommunityController.getPost);
router.put('/posts/:postId', authenticateToken, CommunityController.updatePost);
router.delete('/posts/:postId', authenticateToken, CommunityController.deletePost);
router.get('/posts/:postId/replies', optionalAuth, CommunityController.getPostReplies);

// Engagement action endpoints
router.post('/posts/:postId/like', authenticateToken, CommunityController.likePost);
router.delete('/posts/:postId/like', authenticateToken, CommunityController.unlikePost);
router.post('/posts/:postId/repost', authenticateToken, CommunityController.repostPost);
router.delete('/posts/:postId/repost', authenticateToken, CommunityController.unrepostPost);
router.post('/posts/:postId/bookmark', authenticateToken, CommunityController.bookmarkPost);
router.delete('/posts/:postId/bookmark', authenticateToken, CommunityController.unbookmarkPost);

// Community management endpoints
router.get('/communities', CommunityController.getCommunities);
router.get('/communities/:communityId', CommunityController.getCommunity);
router.post('/communities/:communityId/join', authenticateToken, CommunityController.joinCommunity);
router.delete('/communities/:communityId/join', authenticateToken, CommunityController.leaveCommunity);
router.get('/user/communities', authenticateToken, CommunityController.getUserCommunities);

// Search and discovery endpoints
router.get('/search/posts', optionalAuth, CommunityController.searchPosts);
router.get('/search/communities', CommunityController.searchCommunities);
router.get('/tags/:tag/posts', optionalAuth, CommunityController.getPostsByTag);
router.get('/suggested-communities', authenticateToken, CommunityController.getSuggestedCommunities);

// Trip publishing endpoint
router.post('/trips/:tripId/publish', authenticateToken, CommunityController.publishTripToCommunity);

// Trip share status endpoint
router.get('/trips/:tripId/share-status', optionalAuth, CommunityController.getTripShareStatus);

// Moderation endpoints
router.post('/posts/:postId/report', authenticateToken, CommunityController.reportPost);
router.get('/reports', authenticateToken, CommunityController.getReports);
router.get('/moderation/flagged', authenticateToken, CommunityController.getFlaggedPosts);
router.put('/reports/:reportId/review', authenticateToken, CommunityController.reviewReport);

export default router;
