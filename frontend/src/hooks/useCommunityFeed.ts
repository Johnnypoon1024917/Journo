/**
 * useCommunityFeed Hook
 * 
 * Custom hook for managing infinite scroll feed with pagination.
 * Handles feed loading, pagination, and refresh for different feed types.
 * 
 * Requirements: 7.5, 7.6
 */

import { useEffect, useCallback, useRef } from 'react';
import { useCommunityStore } from '@/stores/communityStore';
import type { PostWithEngagement } from '@/types/community';

export interface UseCommunityFeedOptions {
  feedType: 'forYou' | 'following' | 'community';
  communityId?: string;
  autoLoad?: boolean;
}

export interface UseCommunityFeedReturn {
  posts: PostWithEngagement[];
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing community feed with infinite scroll
 * 
 * @param options - Feed configuration options
 * @returns Feed state and control functions
 * 
 * @example
 * ```tsx
 * const { posts, isLoading, hasMore, loadMore, refresh } = useCommunityFeed({
 *   feedType: 'forYou',
 *   autoLoad: true
 * });
 * ```
 */
export function useCommunityFeed(options: UseCommunityFeedOptions): UseCommunityFeedReturn {
  const { feedType, communityId, autoLoad = true } = options;

  // Get store state and actions
  const forYouFeed = useCommunityStore((state) => state.forYouFeed);
  const followingFeed = useCommunityStore((state) => state.followingFeed);
  const communityFeeds = useCommunityStore((state) => state.communityFeeds);
  const fetchForYouFeed = useCommunityStore((state) => state.fetchForYouFeed);
  const fetchFollowingFeed = useCommunityStore((state) => state.fetchFollowingFeed);
  const fetchCommunityFeed = useCommunityStore((state) => state.fetchCommunityFeed);

  // Track if initial load has been triggered
  const hasLoadedRef = useRef(false);

  // Select the appropriate feed based on feedType
  const currentFeed = 
    feedType === 'forYou' ? forYouFeed :
    feedType === 'following' ? followingFeed :
    communityId ? (communityFeeds[communityId] || { posts: [], cursor: null, hasMore: false, isLoading: false, error: null }) :
    { posts: [], cursor: null, hasMore: false, isLoading: false, error: null };

  /**
   * Load more posts (pagination)
   * Fetches the next page of posts using the current cursor
   */
  const loadMore = useCallback(async () => {
    // Don't load if already loading or no more posts
    if (currentFeed.isLoading || !currentFeed.hasMore) {
      return;
    }

    try {
      if (feedType === 'forYou') {
        await fetchForYouFeed(false);
      } else if (feedType === 'following') {
        await fetchFollowingFeed(false);
      } else if (feedType === 'community' && communityId) {
        await fetchCommunityFeed(communityId, false);
      }
    } catch (error) {
      console.error('Failed to load more posts:', error);
    }
  }, [feedType, communityId, currentFeed.isLoading, currentFeed.hasMore, fetchForYouFeed, fetchFollowingFeed, fetchCommunityFeed]);

  /**
   * Refresh the feed
   * Clears current posts and fetches from the beginning
   */
  const refresh = useCallback(async () => {
    try {
      if (feedType === 'forYou') {
        await fetchForYouFeed(true);
      } else if (feedType === 'following') {
        await fetchFollowingFeed(true);
      } else if (feedType === 'community' && communityId) {
        await fetchCommunityFeed(communityId, true);
      }
    } catch (error) {
      console.error('Failed to refresh feed:', error);
    }
  }, [feedType, communityId, fetchForYouFeed, fetchFollowingFeed, fetchCommunityFeed]);

  // Auto-load feed on mount if enabled
  useEffect(() => {
    if (autoLoad && !hasLoadedRef.current && (!currentFeed.posts || currentFeed.posts.length === 0) && !currentFeed.isLoading) {
      hasLoadedRef.current = true;
      refresh();
    }
  }, [autoLoad, currentFeed.posts?.length, currentFeed.isLoading, refresh]);

  return {
    posts: currentFeed.posts || [],
    isLoading: currentFeed.isLoading,
    hasMore: currentFeed.hasMore,
    error: currentFeed.error,
    loadMore,
    refresh,
  };
}

export default useCommunityFeed;
