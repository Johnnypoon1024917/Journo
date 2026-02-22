/**
 * CommunityThreads Page Component
 * 
 * Main page for the threads-style community feed feature.
 * Uses shared Header and bottom navigation from the main app.
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ThreadCard } from '@/components/community/ThreadCard';
import { CommunityComposer } from '@/components/community/CommunityComposer';
import { useCommunityFeed } from '@/hooks/useCommunityFeed';
import { useCommunitySocket } from '@/hooks/useCommunitySocket';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Header } from '@/components/layout/Header';

type FeedTab = 'forYou' | 'following';

export function CommunityThreads() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<FeedTab>(
    (searchParams.get('tab') as FeedTab) || 'forYou'
  );
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [replyToPostId, setReplyToPostId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Refs for scroll position preservation
  const forYouScrollPos = useRef(0);
  const followingScrollPos = useRef(0);
  const feedContainerRef = useRef<HTMLDivElement>(null);

  // Initialize socket connection for real-time updates
  useCommunitySocket();

  // Feed hooks for both tabs
  const forYouFeed = useCommunityFeed({
    feedType: 'forYou',
    autoLoad: activeTab === 'forYou',
  });

  const followingFeed = useCommunityFeed({
    feedType: 'following',
    autoLoad: activeTab === 'following',
  });

  // Select active feed based on tab
  const activeFeed = activeTab === 'forYou' ? forYouFeed : followingFeed;

  // Handle tab change with scroll position preservation
  const handleTabChange = (tab: FeedTab) => {
    // Save current scroll position
    if (feedContainerRef.current) {
      if (activeTab === 'forYou') {
        forYouScrollPos.current = feedContainerRef.current.scrollTop;
      } else {
        followingScrollPos.current = feedContainerRef.current.scrollTop;
      }
    }

    // Change tab
    setActiveTab(tab);
    setSearchParams({ tab });

    // Restore scroll position for new tab
    setTimeout(() => {
      if (feedContainerRef.current) {
        feedContainerRef.current.scrollTop =
          tab === 'forYou' ? forYouScrollPos.current : followingScrollPos.current;
      }
    }, 0);
  };

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (!feedContainerRef.current || activeFeed.isLoading || !activeFeed.hasMore) {
      return;
    }

    const container = feedContainerRef.current;
    const scrollPosition = container.scrollTop + container.clientHeight;
    const scrollThreshold = container.scrollHeight - 200; // 200px from bottom

    if (scrollPosition >= scrollThreshold) {
      activeFeed.loadMore();
    }
  }, [activeFeed]);

  // Attach scroll listener
  useEffect(() => {
    const container = feedContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Handle reply action
  const handleReply = (postId: string) => {
    setReplyToPostId(postId);
    setIsComposerOpen(true);
  };

  // Handle report action (placeholder)
  const handleReport = (postId: string) => {
    console.log('Report post:', postId);
    // TODO: Implement report modal
  };

  // Handle composer close
  const handleComposerClose = () => {
    setIsComposerOpen(false);
    setReplyToPostId(null);
  };

  // Get parent post for reply
  const parentPost = replyToPostId
    ? activeFeed.posts.find((p) => p.id === replyToPostId)
    : undefined;

  return (
    <>
      {/* Shared Header */}
      <Header 
        isAuthenticated={true}
        onCreateTrip={() => setIsComposerOpen(true)}
        activeRoute="community"
      />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 md:pt-20">
        {/* Search bar */}
        <div className="sticky top-16 md:top-20 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="relative max-w-2xl mx-auto">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Search posts"
              />
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => handleTabChange('forYou')}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors relative ${
                activeTab === 'forYou'
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              aria-current={activeTab === 'forYou' ? 'page' : undefined}
            >
              For You
              {activeTab === 'forYou' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t" />
              )}
            </button>
            <button
              onClick={() => handleTabChange('following')}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors relative ${
                activeTab === 'following'
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              aria-current={activeTab === 'following' ? 'page' : undefined}
            >
              Following
              {activeTab === 'following' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t" />
              )}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto lg:grid lg:grid-cols-12 lg:gap-6 mt-4">
          {/* Feed Container */}
          <main className="lg:col-span-7 xl:col-span-8">
            <div
              ref={feedContainerRef}
              className="bg-white dark:bg-gray-800 border-x border-gray-200 dark:border-gray-700 min-h-screen"
            >
              {/* Loading state */}
              {activeFeed.isLoading && (!activeFeed.posts || activeFeed.posts.length === 0) && (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="large" />
                </div>
              )}

              {/* Empty state */}
              {!activeFeed.isLoading && (!activeFeed.posts || activeFeed.posts.length === 0) && (
                <EmptyState
                  title={
                    activeTab === 'forYou'
                      ? 'No posts yet'
                      : 'No posts from followed users'
                  }
                  description={
                    activeTab === 'forYou'
                      ? 'Be the first to share your travel story!'
                      : 'Follow some users to see their posts here'
                  }
                  icon={
                    <svg
                      className="w-16 h-16 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  }
                />
              )}

              {/* Posts */}
              {activeFeed.posts && activeFeed.posts.map((post) => (
                <ThreadCard
                  key={post.id}
                  post={post}
                  onReply={handleReply}
                  onReport={handleReport}
                />
              ))}

              {/* Loading more indicator */}
              {activeFeed.isLoading && activeFeed.posts && activeFeed.posts.length > 0 && (
                <div className="flex items-center justify-center py-8">
                  <Spinner />
                </div>
              )}

              {/* End of feed indicator */}
              {!activeFeed.hasMore && activeFeed.posts && activeFeed.posts.length > 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  You've reached the end
                </div>
              )}
            </div>
          </main>

          {/* Sidebar (Desktop only) */}
          <aside className="hidden lg:block lg:col-span-5 xl:col-span-4">
            <div className="sticky top-36 space-y-4">
              {/* Trending Posts */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Trending
                </h2>
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No trending posts yet
                  </p>
                </div>
              </div>

              {/* Suggested Communities */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Communities
                </h2>
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No communities yet
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Composer Modal */}
      <CommunityComposer
        isOpen={isComposerOpen}
        onClose={handleComposerClose}
        parentPost={parentPost}
      />
    </>
  );
}
