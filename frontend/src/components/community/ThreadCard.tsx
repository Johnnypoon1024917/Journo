/**
 * ThreadCard Component
 * 
 * Displays a single post with engagement actions, media carousel, trip embed, and nested replies.
 * Implements optimistic updates for instant UI feedback.
 * 
 * Requirements: 2.3, 3.2, 3.3, 19.1, 19.2, 20.3
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PostWithEngagement } from '@/types/community';
import { usePostActions } from '@/hooks/usePostActions';
import { TripEmbed } from './TripEmbed';
import { MediaCarousel } from './MediaCarousel';
import { MediaLightbox } from './MediaLightbox';

interface ThreadCardProps {
  post: PostWithEngagement;
  onReply?: (postId: string) => void;
  onReport?: (postId: string) => void;
  showReplies?: boolean;
  replies?: PostWithEngagement[];
  depth?: number;
}

export function ThreadCard({
  post,
  onReply,
  onReport,
  showReplies = false,
  replies = [],
  depth = 0,
}: ThreadCardProps) {
  const [showFullContent, setShowFullContent] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const {
    like,
    unlike,
    repost,
    unrepost,
    bookmark,
    unbookmark,
    isLiked,
    isReposted,
    isBookmarked,
    likeCount,
    replyCount,
    repostCount,
  } = usePostActions({ postId: post.id });

  // Determine if content should be truncated
  const shouldTruncate = post.content && post.content.length > 280;
  const displayContent = shouldTruncate && !showFullContent
    ? post.content.slice(0, 280) + '...'
    : (post.content || '');

  // Format timestamp
  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Handle engagement actions
  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLiked) {
      unlike();
    } else {
      like();
    }
  };

  const handleRepost = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isReposted) {
      unrepost();
    } else {
      repost();
    }
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isBookmarked) {
      unbookmark();
    } else {
      bookmark();
    }
  };

  const handleReply = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onReply?.(post.id);
  };

  const handleReport = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onReport?.(post.id);
  };

  const handleMediaClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleCloseLightbox = () => {
    setLightboxOpen(false);
  };

  // Calculate left margin for nested replies
  const marginLeft = depth > 0 ? `${Math.min(depth * 2, 8)}rem` : '0';

  return (
    <article
      className="relative bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
      style={{ marginLeft }}
      aria-label={`Post by ${post.userName}`}
    >
      {/* Visual connector for nested replies */}
      {depth > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600"
          aria-hidden="true"
        />
      )}

      <div className="p-4">
        {/* Header: Author info */}
        <div className="flex items-start space-x-3 mb-3">
          {/* Avatar */}
          <Link to={`/user/${post.userId}`} className="flex-shrink-0">
            <img
              src={post.userAvatar || '/default-avatar.png'}
              alt={`${post.userName}'s avatar`}
              className="w-10 h-10 rounded-full object-cover"
            />
          </Link>

          {/* Author name, community, and timestamp */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <Link
                to={`/user/${post.userId}`}
                className="font-semibold text-gray-900 dark:text-white hover:underline"
              >
                {post.userName}
              </Link>
              {post.communityName && (
                <>
                  <span className="text-gray-500 dark:text-gray-400">·</span>
                  <Link
                    to={`/community/${post.communityId}`}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {post.communityName}
                  </Link>
                </>
              )}
              <span className="text-gray-500 dark:text-gray-400">·</span>
              <time
                dateTime={post.createdAt}
                className="text-sm text-gray-500 dark:text-gray-400"
              >
                {formatTimestamp(post.createdAt)}
              </time>
            </div>
          </div>

          {/* More options button */}
          <button
            onClick={handleReport}
            className="flex-shrink-0 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="Report post"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="mb-3">
          <p className="text-gray-900 dark:text-white whitespace-pre-wrap break-words">
            {displayContent}
          </p>
          {shouldTruncate && (
            <button
              onClick={() => setShowFullContent(!showFullContent)}
              className="text-blue-600 dark:text-blue-400 text-sm hover:underline mt-1"
            >
              {showFullContent ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>

        {/* Trip Embed */}
        {post.tripEmbed && (
          <div className="mb-3">
            <TripEmbed trip={post.tripEmbed} isPublishedTrip={!!post.tripId} />
          </div>
        )}

        {/* Media Carousel */}
        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <div className="mb-3">
            <MediaCarousel mediaUrls={post.mediaUrls} onMediaClick={handleMediaClick} />
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                to={`/community/tag/${encodeURIComponent(tag)}`}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Engagement Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-6">
            {/* Like button */}
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 transition-colors ${
                isLiked
                  ? 'text-red-500'
                  : 'text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400'
              }`}
              aria-label={isLiked ? 'Unlike post' : 'Like post'}
              aria-pressed={isLiked}
            >
              <svg
                className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span className="text-sm">{likeCount}</span>
            </button>

            {/* Reply button */}
            <button
              onClick={handleReply}
              className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
              aria-label="Reply to post"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span className="text-sm">{replyCount}</span>
            </button>

            {/* Repost button */}
            <button
              onClick={handleRepost}
              className={`flex items-center space-x-1 transition-colors ${
                isReposted
                  ? 'text-green-500'
                  : 'text-gray-500 hover:text-green-500 dark:text-gray-400 dark:hover:text-green-400'
              }`}
              aria-label={isReposted ? 'Unrepost' : 'Repost'}
              aria-pressed={isReposted}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="text-sm">{repostCount}</span>
            </button>

            {/* Bookmark button */}
            <button
              onClick={handleBookmark}
              className={`flex items-center space-x-1 transition-colors ${
                isBookmarked
                  ? 'text-yellow-500'
                  : 'text-gray-500 hover:text-yellow-500 dark:text-gray-400 dark:hover:text-yellow-400'
              }`}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark post'}
              aria-pressed={isBookmarked}
            >
              <svg
                className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Nested Replies */}
      {showReplies && replies.length > 0 && (
        <div className="border-l-2 border-gray-200 dark:border-gray-700">
          {replies.map((reply) => (
            <ThreadCard
              key={reply.id}
              post={reply}
              onReply={onReply}
              onReport={onReport}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      {/* Media Lightbox */}
      {lightboxOpen && post.mediaUrls && post.mediaUrls.length > 0 && (
        <MediaLightbox
          mediaUrls={post.mediaUrls}
          initialIndex={lightboxIndex}
          onClose={handleCloseLightbox}
        />
      )}
    </article>
  );
}
