/**
 * Community Store
 * Manages community feed state with real-time updates and optimistic UI
 */

import { create } from 'zustand';
import CommunityService from '@/services/communityService';
import type {
  PostWithEngagement,
  FeedResult,
  CreatePostData,
  UpdatePostData,
  EngagementData,
} from '@/types/community';

// ============================================================================
// State Interfaces
// ============================================================================

interface FeedState {
  posts: PostWithEngagement[];
  cursor: string | null;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
}

interface CommunityStore {
  // Feed state
  forYouFeed: FeedState;
  followingFeed: FeedState;
  communityFeeds: Record<string, FeedState>;
  trendingPosts: PostWithEngagement[];
  trendingLoading: boolean;
  trendingError: string | null;

  // Single post state
  currentPost: PostWithEngagement | null;
  currentPostLoading: boolean;
  currentPostError: string | null;

  // Actions - Feed fetching
  fetchForYouFeed: (refresh?: boolean) => Promise<void>;
  fetchFollowingFeed: (refresh?: boolean) => Promise<void>;
  fetchCommunityFeed: (communityId: string, refresh?: boolean) => Promise<void>;
  fetchTrendingPosts: () => Promise<void>;

  // Actions - Post CRUD
  fetchPost: (postId: string) => Promise<void>;
  createPost: (data: CreatePostData) => Promise<PostWithEngagement | null>;
  updatePost: (postId: string, data: UpdatePostData) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;

  // Actions - Engagement with optimistic updates
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  repostPost: (postId: string) => Promise<void>;
  unrepostPost: (postId: string) => Promise<void>;
  bookmarkPost: (postId: string) => Promise<void>;
  unbookmarkPost: (postId: string) => Promise<void>;

  // Actions - Real-time update handlers
  handleNewPost: (post: PostWithEngagement) => void;
  handlePostUpdated: (post: PostWithEngagement) => void;
  handlePostDeleted: (postId: string) => void;
  handleEngagementUpdate: (postId: string, engagement: EngagementData) => void;
  handleNewReply: (parentPostId: string, reply: PostWithEngagement) => void;

  // Utility actions
  clearError: (feedType: 'forYou' | 'following' | 'trending' | string) => void;
  resetFeed: (feedType: 'forYou' | 'following' | string) => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

const createInitialFeedState = (): FeedState => ({
  posts: [],
  cursor: null,
  hasMore: false,
  isLoading: false,
  error: null,
});

/**
 * Update a post in all feeds where it exists
 */
const updatePostInFeeds = (
  state: CommunityStore,
  postId: string,
  updater: (post: PostWithEngagement) => PostWithEngagement
): Partial<CommunityStore> => {
  const updateFeed = (feed: FeedState): FeedState => ({
    ...feed,
    posts: (feed.posts || []).map(p => p.id === postId ? updater(p) : p),
  });

  return {
    forYouFeed: updateFeed(state.forYouFeed),
    followingFeed: updateFeed(state.followingFeed),
    communityFeeds: Object.fromEntries(
      Object.entries(state.communityFeeds).map(([id, feed]) => [id, updateFeed(feed)])
    ),
    trendingPosts: (state.trendingPosts || []).map(p => p.id === postId ? updater(p) : p),
    currentPost: state.currentPost?.id === postId ? updater(state.currentPost) : state.currentPost,
  };
};

/**
 * Remove a post from all feeds
 */
const removePostFromFeeds = (
  state: CommunityStore,
  postId: string
): Partial<CommunityStore> => {
  const removeFeed = (feed: FeedState): FeedState => ({
    ...feed,
    posts: (feed.posts || []).filter(p => p.id !== postId),
  });

  return {
    forYouFeed: removeFeed(state.forYouFeed),
    followingFeed: removeFeed(state.followingFeed),
    communityFeeds: Object.fromEntries(
      Object.entries(state.communityFeeds).map(([id, feed]) => [id, removeFeed(feed)])
    ),
    trendingPosts: (state.trendingPosts || []).filter(p => p.id !== postId),
    currentPost: state.currentPost?.id === postId ? null : state.currentPost,
  };
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useCommunityStore = create<CommunityStore>((set, get) => ({
  // Initial state
  forYouFeed: createInitialFeedState(),
  followingFeed: createInitialFeedState(),
  communityFeeds: {},
  trendingPosts: [],
  trendingLoading: false,
  trendingError: null,
  currentPost: null,
  currentPostLoading: false,
  currentPostError: null,

  // ============================================================================
  // Feed Fetching Actions
  // ============================================================================

  fetchForYouFeed: async (refresh = false) => {
    const state = get();
    
    // Prevent multiple simultaneous fetches
    if (state.forYouFeed.isLoading) {
      return;
    }

    // If refreshing, reset cursor
    const cursor = refresh ? undefined : state.forYouFeed.cursor || undefined;

    try {
      set({
        forYouFeed: {
          ...state.forYouFeed,
          isLoading: true,
          error: null,
        },
      });

      const result: FeedResult = await CommunityService.getForYouFeed(cursor);

      set({
        forYouFeed: {
          posts: refresh ? result.posts : [...state.forYouFeed.posts, ...result.posts],
          cursor: result.cursor,
          hasMore: result.hasMore,
          isLoading: false,
          error: null,
        },
      });
    } catch (error: any) {
      console.error('Failed to fetch For You feed:', error);
      set({
        forYouFeed: {
          ...state.forYouFeed,
          isLoading: false,
          error: error.message || 'Failed to fetch For You feed',
        },
      });
    }
  },

  fetchFollowingFeed: async (refresh = false) => {
    const state = get();
    
    if (state.followingFeed.isLoading) {
      return;
    }

    const cursor = refresh ? undefined : state.followingFeed.cursor || undefined;

    try {
      set({
        followingFeed: {
          ...state.followingFeed,
          isLoading: true,
          error: null,
        },
      });

      const result: FeedResult = await CommunityService.getFollowingFeed(cursor);

      set({
        followingFeed: {
          posts: refresh ? result.posts : [...state.followingFeed.posts, ...result.posts],
          cursor: result.cursor,
          hasMore: result.hasMore,
          isLoading: false,
          error: null,
        },
      });
    } catch (error: any) {
      console.error('Failed to fetch Following feed:', error);
      set({
        followingFeed: {
          ...state.followingFeed,
          isLoading: false,
          error: error.message || 'Failed to fetch Following feed',
        },
      });
    }
  },

  fetchCommunityFeed: async (communityId: string, refresh = false) => {
    const state = get();
    const currentFeed = state.communityFeeds[communityId] || createInitialFeedState();
    
    if (currentFeed.isLoading) {
      return;
    }

    const cursor = refresh ? undefined : currentFeed.cursor || undefined;

    try {
      set({
        communityFeeds: {
          ...state.communityFeeds,
          [communityId]: {
            ...currentFeed,
            isLoading: true,
            error: null,
          },
        },
      });

      const result: FeedResult = await CommunityService.getCommunityFeed(communityId, cursor);

      set({
        communityFeeds: {
          ...state.communityFeeds,
          [communityId]: {
            posts: refresh ? result.posts : [...currentFeed.posts, ...result.posts],
            cursor: result.cursor,
            hasMore: result.hasMore,
            isLoading: false,
            error: null,
          },
        },
      });
    } catch (error: any) {
      console.error(`Failed to fetch community feed for ${communityId}:`, error);
      set({
        communityFeeds: {
          ...state.communityFeeds,
          [communityId]: {
            ...currentFeed,
            isLoading: false,
            error: error.message || 'Failed to fetch community feed',
          },
        },
      });
    }
  },

  fetchTrendingPosts: async () => {
    const state = get();
    
    if (state.trendingLoading) {
      return;
    }

    try {
      set({ trendingLoading: true, trendingError: null });

      const result: FeedResult = await CommunityService.getTrendingPosts();

      set({
        trendingPosts: result.posts,
        trendingLoading: false,
        trendingError: null,
      });
    } catch (error: any) {
      console.error('Failed to fetch trending posts:', error);
      set({
        trendingLoading: false,
        trendingError: error.message || 'Failed to fetch trending posts',
      });
    }
  },

  // ============================================================================
  // Post CRUD Actions
  // ============================================================================

  fetchPost: async (postId: string) => {
    try {
      set({ currentPostLoading: true, currentPostError: null });

      const post = await CommunityService.getPost(postId);

      set({
        currentPost: post,
        currentPostLoading: false,
        currentPostError: null,
      });
    } catch (error: any) {
      console.error(`Failed to fetch post ${postId}:`, error);
      set({
        currentPostLoading: false,
        currentPostError: error.message || 'Failed to fetch post',
      });
    }
  },

  createPost: async (data: CreatePostData) => {
    try {
      const post = await CommunityService.createPost(data);

      // Add the new post to the beginning of relevant feeds
      set((state) => {
        const addToFeed = (feed: FeedState): FeedState => ({
          ...feed,
          posts: [post, ...(feed.posts || [])],
        });

        return {
          forYouFeed: addToFeed(state.forYouFeed),
          followingFeed: addToFeed(state.followingFeed),
          communityFeeds: data.communityId
            ? {
                ...state.communityFeeds,
                [data.communityId]: addToFeed(
                  state.communityFeeds[data.communityId] || createInitialFeedState()
                ),
              }
            : state.communityFeeds,
        };
      });

      return post;
    } catch (error: any) {
      console.error('Failed to create post:', error);
      return null;
    }
  },

  updatePost: async (postId: string, data: UpdatePostData) => {
    try {
      const updatedPost = await CommunityService.updatePost(postId, data);

      // Update the post in all feeds
      set((state) => updatePostInFeeds(state, postId, () => updatedPost));
    } catch (error: any) {
      console.error(`Failed to update post ${postId}:`, error);
    }
  },

  deletePost: async (postId: string) => {
    try {
      await CommunityService.deletePost(postId);

      // Remove the post from all feeds
      set((state) => removePostFromFeeds(state, postId));
    } catch (error: any) {
      console.error(`Failed to delete post ${postId}:`, error);
    }
  },

  // ============================================================================
  // Engagement Actions with Optimistic Updates
  // ============================================================================

  likePost: async (postId: string) => {
    // Optimistic update
    set((state) =>
      updatePostInFeeds(state, postId, (post) => ({
        ...post,
        isLiked: true,
        likeCount: post.likeCount + 1,
      }))
    );

    try {
      const result = await CommunityService.likePost(postId);

      // Update with actual count from server
      set((state) =>
        updatePostInFeeds(state, postId, (post) => ({
          ...post,
          likeCount: result.likeCount,
        }))
      );
    } catch (error: any) {
      console.error(`Failed to like post ${postId}:`, error);

      // Revert optimistic update on error
      set((state) =>
        updatePostInFeeds(state, postId, (post) => ({
          ...post,
          isLiked: false,
          likeCount: Math.max(0, post.likeCount - 1),
        }))
      );
    }
  },

  unlikePost: async (postId: string) => {
    // Optimistic update
    set((state) =>
      updatePostInFeeds(state, postId, (post) => ({
        ...post,
        isLiked: false,
        likeCount: Math.max(0, post.likeCount - 1),
      }))
    );

    try {
      const result = await CommunityService.unlikePost(postId);

      // Update with actual count from server
      set((state) =>
        updatePostInFeeds(state, postId, (post) => ({
          ...post,
          likeCount: result.likeCount,
        }))
      );
    } catch (error: any) {
      console.error(`Failed to unlike post ${postId}:`, error);

      // Revert optimistic update on error
      set((state) =>
        updatePostInFeeds(state, postId, (post) => ({
          ...post,
          isLiked: true,
          likeCount: post.likeCount + 1,
        }))
      );
    }
  },

  repostPost: async (postId: string) => {
    // Optimistic update
    set((state) =>
      updatePostInFeeds(state, postId, (post) => ({
        ...post,
        isReposted: true,
        repostCount: post.repostCount + 1,
      }))
    );

    try {
      const result = await CommunityService.repostPost(postId);

      // Update with actual count from server
      set((state) =>
        updatePostInFeeds(state, postId, (post) => ({
          ...post,
          repostCount: result.repostCount,
        }))
      );
    } catch (error: any) {
      console.error(`Failed to repost post ${postId}:`, error);

      // Revert optimistic update on error
      set((state) =>
        updatePostInFeeds(state, postId, (post) => ({
          ...post,
          isReposted: false,
          repostCount: Math.max(0, post.repostCount - 1),
        }))
      );
    }
  },

  unrepostPost: async (postId: string) => {
    // Optimistic update
    set((state) =>
      updatePostInFeeds(state, postId, (post) => ({
        ...post,
        isReposted: false,
        repostCount: Math.max(0, post.repostCount - 1),
      }))
    );

    try {
      const result = await CommunityService.unrepostPost(postId);

      // Update with actual count from server
      set((state) =>
        updatePostInFeeds(state, postId, (post) => ({
          ...post,
          repostCount: result.repostCount,
        }))
      );
    } catch (error: any) {
      console.error(`Failed to unrepost post ${postId}:`, error);

      // Revert optimistic update on error
      set((state) =>
        updatePostInFeeds(state, postId, (post) => ({
          ...post,
          isReposted: true,
          repostCount: post.repostCount + 1,
        }))
      );
    }
  },

  bookmarkPost: async (postId: string) => {
    // Optimistic update
    set((state) =>
      updatePostInFeeds(state, postId, (post) => ({
        ...post,
        isBookmarked: true,
      }))
    );

    try {
      await CommunityService.bookmarkPost(postId);
    } catch (error: any) {
      console.error(`Failed to bookmark post ${postId}:`, error);

      // Revert optimistic update on error
      set((state) =>
        updatePostInFeeds(state, postId, (post) => ({
          ...post,
          isBookmarked: false,
        }))
      );
    }
  },

  unbookmarkPost: async (postId: string) => {
    // Optimistic update
    set((state) =>
      updatePostInFeeds(state, postId, (post) => ({
        ...post,
        isBookmarked: false,
      }))
    );

    try {
      await CommunityService.unbookmarkPost(postId);
    } catch (error: any) {
      console.error(`Failed to unbookmark post ${postId}:`, error);

      // Revert optimistic update on error
      set((state) =>
        updatePostInFeeds(state, postId, (post) => ({
          ...post,
          isBookmarked: true,
        }))
      );
    }
  },

  // ============================================================================
  // Real-time Update Handlers
  // ============================================================================

  handleNewPost: (post: PostWithEngagement) => {
    set((state) => {
      const addToFeed = (feed: FeedState): FeedState => {
        // Check if post already exists
        if (feed.posts && feed.posts.some(p => p.id === post.id)) {
          return feed;
        }
        return {
          ...feed,
          posts: [post, ...(feed.posts || [])],
        };
      };

      return {
        forYouFeed: addToFeed(state.forYouFeed),
        followingFeed: addToFeed(state.followingFeed),
        communityFeeds: post.communityId
          ? {
              ...state.communityFeeds,
              [post.communityId]: addToFeed(
                state.communityFeeds[post.communityId] || createInitialFeedState()
              ),
            }
          : state.communityFeeds,
      };
    });
  },

  handlePostUpdated: (post: PostWithEngagement) => {
    set((state) => updatePostInFeeds(state, post.id, () => post));
  },

  handlePostDeleted: (postId: string) => {
    set((state) => removePostFromFeeds(state, postId));
  },

  handleEngagementUpdate: (postId: string, engagement: EngagementData) => {
    set((state) =>
      updatePostInFeeds(state, postId, (post) => ({
        ...post,
        likeCount: engagement.likeCount,
        replyCount: engagement.replyCount,
        repostCount: engagement.repostCount,
        engagementScore: engagement.engagementScore,
      }))
    );
  },

  handleNewReply: (parentPostId: string, _reply: PostWithEngagement) => {
    set((state) =>
      updatePostInFeeds(state, parentPostId, (post) => ({
        ...post,
        replyCount: post.replyCount + 1,
      }))
    );
  },

  // ============================================================================
  // Utility Actions
  // ============================================================================

  clearError: (feedType: 'forYou' | 'following' | 'trending' | string) => {
    set((state) => {
      if (feedType === 'forYou') {
        return {
          forYouFeed: {
            ...state.forYouFeed,
            error: null,
          },
        };
      } else if (feedType === 'following') {
        return {
          followingFeed: {
            ...state.followingFeed,
            error: null,
          },
        };
      } else if (feedType === 'trending') {
        return {
          trendingError: null,
        };
      } else {
        // Community feed
        return {
          communityFeeds: {
            ...state.communityFeeds,
            [feedType]: {
              ...(state.communityFeeds[feedType] || createInitialFeedState()),
              error: null,
            },
          },
        };
      }
    });
  },

  resetFeed: (feedType: 'forYou' | 'following' | string) => {
    set((state) => {
      if (feedType === 'forYou') {
        return {
          forYouFeed: createInitialFeedState(),
        };
      } else if (feedType === 'following') {
        return {
          followingFeed: createInitialFeedState(),
        };
      } else {
        // Community feed
        const { [feedType]: _, ...remainingFeeds } = state.communityFeeds;
        return {
          communityFeeds: remainingFeeds,
        };
      }
    });
  },
}));

export default useCommunityStore;
