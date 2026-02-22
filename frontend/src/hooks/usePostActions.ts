/**
 * usePostActions Hook
 * 
 * Custom hook for managing post engagement actions (like, repost, bookmark).
 * Provides optimistic updates for instant UI feedback.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { useCallback, useMemo } from 'react';
import { useCommunityStore } from '@/stores/communityStore';

export interface UsePostActionsOptions {
  postId: string;
}

export interface UsePostActionsReturn {
  // Action methods
  like: () => Promise<void>;
  unlike: () => Promise<void>;
  repost: () => Promise<void>;
  unrepost: () => Promise<void>;
  bookmark: () => Promise<void>;
  unbookmark: () => Promise<void>;
  
  // State
  isLiked: boolean;
  isReposted: boolean;
  isBookmarked: boolean;
  likeCount: number;
  replyCount: number;
  repostCount: number;
  
  // Loading states
  isLiking: boolean;
  isReposting: boolean;
  isBookmarking: boolean;
}

/**
 * Hook for managing post engagement actions with optimistic updates
 * 
 * @param options - Configuration with postId
 * @returns Engagement actions and current state
 * 
 * @example
 * ```tsx
 * const { like, unlike, isLiked, likeCount } = usePostActions({ postId: '123' });
 * 
 * const handleLike = () => {
 *   if (isLiked) {
 *     unlike();
 *   } else {
 *     like();
 *   }
 * };
 * ```
 */
export function usePostActions(options: UsePostActionsOptions): UsePostActionsReturn {
  const { postId } = options;

  // Get store actions
  const likePost = useCommunityStore((state) => state.likePost);
  const unlikePost = useCommunityStore((state) => state.unlikePost);
  const repostPost = useCommunityStore((state) => state.repostPost);
  const unrepostPost = useCommunityStore((state) => state.unrepostPost);
  const bookmarkPost = useCommunityStore((state) => state.bookmarkPost);
  const unbookmarkPost = useCommunityStore((state) => state.unbookmarkPost);

  // Find the post in any of the feeds
  const post = useCommunityStore((state) => {
    // Check current post first
    if (state.currentPost?.id === postId) {
      return state.currentPost;
    }

    // Check For You feed
    const forYouPost = state.forYouFeed.posts.find(p => p.id === postId);
    if (forYouPost) return forYouPost;

    // Check Following feed
    const followingPost = state.followingFeed.posts.find(p => p.id === postId);
    if (followingPost) return followingPost;

    // Check community feeds
    for (const feed of Object.values(state.communityFeeds)) {
      const communityPost = feed.posts.find(p => p.id === postId);
      if (communityPost) return communityPost;
    }

    // Check trending posts
    const trendingPost = state.trendingPosts.find(p => p.id === postId);
    if (trendingPost) return trendingPost;

    return null;
  });

  // Track loading states locally (could be enhanced with store state if needed)
  // For now, we rely on optimistic updates being instant

  /**
   * Like the post
   * Optimistically updates UI before server confirmation
   */
  const like = useCallback(async () => {
    try {
      await likePost(postId);
    } catch (error) {
      console.error('Failed to like post:', error);
      // Error is handled in store with revert
    }
  }, [postId, likePost]);

  /**
   * Unlike the post
   * Optimistically updates UI before server confirmation
   */
  const unlike = useCallback(async () => {
    try {
      await unlikePost(postId);
    } catch (error) {
      console.error('Failed to unlike post:', error);
      // Error is handled in store with revert
    }
  }, [postId, unlikePost]);

  /**
   * Repost the post
   * Optimistically updates UI before server confirmation
   */
  const repost = useCallback(async () => {
    try {
      await repostPost(postId);
    } catch (error) {
      console.error('Failed to repost post:', error);
      // Error is handled in store with revert
    }
  }, [postId, repostPost]);

  /**
   * Unrepost the post
   * Optimistically updates UI before server confirmation
   */
  const unrepost = useCallback(async () => {
    try {
      await unrepostPost(postId);
    } catch (error) {
      console.error('Failed to unrepost post:', error);
      // Error is handled in store with revert
    }
  }, [postId, unrepostPost]);

  /**
   * Bookmark the post
   * Optimistically updates UI before server confirmation
   */
  const bookmark = useCallback(async () => {
    try {
      await bookmarkPost(postId);
    } catch (error) {
      console.error('Failed to bookmark post:', error);
      // Error is handled in store with revert
    }
  }, [postId, bookmarkPost]);

  /**
   * Unbookmark the post
   * Optimistically updates UI before server confirmation
   */
  const unbookmark = useCallback(async () => {
    try {
      await unbookmarkPost(postId);
    } catch (error) {
      console.error('Failed to unbookmark post:', error);
      // Error is handled in store with revert
    }
  }, [postId, unbookmarkPost]);

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    // Actions
    like,
    unlike,
    repost,
    unrepost,
    bookmark,
    unbookmark,
    
    // State from post
    isLiked: post?.isLiked ?? false,
    isReposted: post?.isReposted ?? false,
    isBookmarked: post?.isBookmarked ?? false,
    likeCount: post?.likeCount ?? 0,
    replyCount: post?.replyCount ?? 0,
    repostCount: post?.repostCount ?? 0,
    
    // Loading states (optimistic updates are instant, so always false)
    isLiking: false,
    isReposting: false,
    isBookmarking: false,
  }), [
    like,
    unlike,
    repost,
    unrepost,
    bookmark,
    unbookmark,
    post?.isLiked,
    post?.isReposted,
    post?.isBookmarked,
    post?.likeCount,
    post?.replyCount,
    post?.repostCount,
  ]);
}

export default usePostActions;
