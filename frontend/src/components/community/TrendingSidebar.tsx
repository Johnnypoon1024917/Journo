/**
 * TrendingSidebar Component
 * 
 * Displays trending posts, suggested communities, and joined communities.
 * Shown in the sidebar on desktop layouts.
 * 
 * Requirements: 11.2, 11.3
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCommunityStore } from '@/stores/communityStore';
import CommunityService from '@/services/communityService';
import type { Community, PostWithEngagement } from '@/types/community';

interface TrendingSidebarProps {
  className?: string;
}

export const TrendingSidebar: React.FC<TrendingSidebarProps> = ({ className = '' }) => {
  const { trendingPosts, trendingLoading, fetchTrendingPosts } = useCommunityStore();
  const [suggestedCommunities, setSuggestedCommunities] = useState<Community[]>([]);
  const [joinedCommunities, setJoinedCommunities] = useState<Community[]>([]);
  const [loadingSuggested, setLoadingSuggested] = useState(true);
  const [loadingJoined, setLoadingJoined] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Fetch trending posts
    fetchTrendingPosts();

    // Fetch suggested communities
    try {
      setLoadingSuggested(true);
      const suggested = await CommunityService.getSuggestedCommunities(5);
      setSuggestedCommunities(suggested);
    } catch (err) {
      console.error('Failed to load suggested communities:', err);
    } finally {
      setLoadingSuggested(false);
    }

    // Fetch joined communities
    try {
      setLoadingJoined(true);
      const joined = await CommunityService.getUserCommunities();
      setJoinedCommunities(joined);
    } catch (err) {
      console.error('Failed to load joined communities:', err);
    } finally {
      setLoadingJoined(false);
    }
  };

  const formatEngagementScore = (score: number): string => {
    if (score >= 1000) {
      return `${(score / 1000).toFixed(1)}k`;
    }
    return score.toString();
  };

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <aside className={`trending-sidebar ${className}`}>
      {/* Trending Posts Section */}
      <section className="sidebar-section trending-posts-section">
        <h3 className="section-title">Trending Posts</h3>
        
        {trendingLoading ? (
          <div className="loading-skeleton">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton-item" />
            ))}
          </div>
        ) : trendingPosts.length > 0 ? (
          <ul className="trending-posts-list" role="list">
            {trendingPosts.slice(0, 5).map((post: PostWithEngagement) => (
              <li key={post.id} className="trending-post-item">
                <Link
                  to={`/community/post/${post.id}`}
                  className="trending-post-link"
                  aria-label={`View post by ${post.userName}`}
                >
                  <div className="post-author">
                    {post.userAvatar && (
                      <img
                        src={post.userAvatar}
                        alt=""
                        className="author-avatar"
                      />
                    )}
                    <span className="author-name">{post.userName}</span>
                  </div>
                  <p className="post-content">
                    {truncateText(post.content, 80)}
                  </p>
                  <div className="post-engagement">
                    <span className="engagement-score" aria-label="Engagement score">
                      🔥 {formatEngagementScore(post.engagementScore)}
                    </span>
                    <span className="engagement-stats">
                      {post.likeCount} likes · {post.replyCount} replies
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">No trending posts yet</p>
        )}
      </section>

      {/* Suggested Communities Section */}
      <section className="sidebar-section suggested-communities-section">
        <h3 className="section-title">Suggested Communities</h3>
        
        {loadingSuggested ? (
          <div className="loading-skeleton">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton-item" />
            ))}
          </div>
        ) : suggestedCommunities.length > 0 ? (
          <ul className="communities-list" role="list">
            {suggestedCommunities.map((community: Community) => (
              <li key={community.id} className="community-item">
                <Link
                  to={`/community/${community.id}`}
                  className="community-link"
                  aria-label={`View ${community.name} community`}
                >
                  {community.iconUrl && (
                    <img
                      src={community.iconUrl}
                      alt=""
                      className="community-icon"
                    />
                  )}
                  <div className="community-info">
                    <span className="community-name">{community.name}</span>
                    <span className="community-members">
                      {community.memberCount.toLocaleString()} members
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">No suggestions available</p>
        )}
      </section>

      {/* Joined Communities Section */}
      {joinedCommunities.length > 0 && (
        <section className="sidebar-section joined-communities-section">
          <h3 className="section-title">Your Communities</h3>
          
          {loadingJoined ? (
            <div className="loading-skeleton">
              {[1, 2].map(i => (
                <div key={i} className="skeleton-item" />
              ))}
            </div>
          ) : (
            <ul className="communities-list" role="list">
              {joinedCommunities.slice(0, 5).map((community: Community) => (
                <li key={community.id} className="community-item">
                  <Link
                    to={`/community/${community.id}`}
                    className="community-link"
                    aria-label={`View ${community.name} community`}
                  >
                    {community.iconUrl && (
                      <img
                        src={community.iconUrl}
                        alt=""
                        className="community-icon"
                      />
                    )}
                    <div className="community-info">
                      <span className="community-name">{community.name}</span>
                      <span className="community-posts">
                        {community.postCount.toLocaleString()} posts
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          
          {joinedCommunities.length > 5 && (
            <Link to="/community/my-communities" className="view-all-link">
              View all communities
            </Link>
          )}
        </section>
      )}
    </aside>
  );
};

export default TrendingSidebar;
