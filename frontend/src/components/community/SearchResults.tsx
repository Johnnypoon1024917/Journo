/**
 * SearchResults Component
 * 
 * Displays search results with highlighting and empty state with suggestions.
 * Supports both post and community search results.
 * 
 * Requirements: 10.4, 10.5
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ThreadCard } from './ThreadCard';
import type { PostWithEngagement, Community, SearchResult } from '@/types/community';

interface SearchResultsProps {
  searchType: 'posts' | 'communities';
  query: string;
  results: SearchResult<PostWithEngagement | Community>[];
  isSearching: boolean;
  onPostReply?: (postId: string) => void;
  onPostReport?: (postId: string) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  searchType,
  query,
  results,
  isSearching,
  onPostReply,
  onPostReport,
}) => {
  /**
   * Highlight matching text in search results
   */
  const highlightText = (text: string, highlights: string[]): React.ReactNode => {
    if (!highlights || highlights.length === 0) {
      return text;
    }

    // Create a regex pattern from highlights
    const pattern = highlights
      .map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');
    const regex = new RegExp(`(${pattern})`, 'gi');

    const parts = text.split(regex);

    return parts.map((part, index) => {
      const isHighlight = highlights.some(
        h => h.toLowerCase() === part.toLowerCase()
      );
      
      return isHighlight ? (
        <mark key={index} className="search-highlight">
          {part}
        </mark>
      ) : (
        <span key={index}>{part}</span>
      );
    });
  };

  /**
   * Render loading skeleton
   */
  const renderLoadingSkeleton = () => (
    <div className="search-results-loading">
      {[1, 2, 3].map(i => (
        <div key={i} className="skeleton-result-item">
          <div className="skeleton-avatar" />
          <div className="skeleton-content">
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
          </div>
        </div>
      ))}
    </div>
  );

  /**
   * Render empty state with suggestions
   */
  const renderEmptyState = () => (
    <div className="search-results-empty">
      <div className="empty-icon">🔍</div>
      <h3 className="empty-title">No results found for "{query}"</h3>
      <p className="empty-description">
        {searchType === 'posts'
          ? 'Try different keywords or browse trending posts'
          : 'Try different keywords or explore suggested communities'}
      </p>
      
      <div className="empty-suggestions">
        <h4 className="suggestions-title">Suggestions:</h4>
        <ul className="suggestions-list">
          <li>Check your spelling</li>
          <li>Try more general keywords</li>
          <li>Try different keywords</li>
          {searchType === 'posts' && (
            <li>
              <Link to="/community/trending" className="suggestion-link">
                Browse trending posts
              </Link>
            </li>
          )}
          {searchType === 'communities' && (
            <li>
              <Link to="/community/discover" className="suggestion-link">
                Discover communities
              </Link>
            </li>
          )}
        </ul>
      </div>
    </div>
  );

  /**
   * Render post search results
   */
  const renderPostResults = () => {
    const postResults = results as SearchResult<PostWithEngagement>[];

    return (
      <div className="search-results-posts">
        {postResults.map((result) => {
          const post = result.item;
          
          // Create a highlighted version of the post content
          const highlightedPost = {
            ...post,
            content: result.highlights.length > 0
              ? post.content // Will be highlighted in ThreadCard
              : post.content,
          };

          return (
            <div key={post.id} className="search-result-item">
              <ThreadCard
                post={highlightedPost}
                onReply={() => onPostReply?.(post.id)}
                onReport={() => onPostReport?.(post.id)}
              />
              {result.relevanceScore > 0 && (
                <div className="relevance-score" aria-label="Relevance score">
                  Relevance: {Math.round(result.relevanceScore * 100)}%
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  /**
   * Render community search results
   */
  const renderCommunityResults = () => {
    const communityResults = results as SearchResult<Community>[];

    return (
      <div className="search-results-communities">
        {communityResults.map((result) => {
          const community = result.item;

          return (
            <Link
              key={community.id}
              to={`/community/${community.id}`}
              className="search-result-item community-result"
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
                <h3 className="community-name">
                  {highlightText(community.name, result.highlights)}
                </h3>
                
                {community.description && (
                  <p className="community-description">
                    {highlightText(community.description, result.highlights)}
                  </p>
                )}
                
                <div className="community-stats">
                  <span className="stat">
                    {community.memberCount.toLocaleString()} members
                  </span>
                  <span className="stat-divider">·</span>
                  <span className="stat">
                    {community.postCount.toLocaleString()} posts
                  </span>
                </div>
              </div>

              {result.relevanceScore > 0 && (
                <div className="relevance-badge" aria-label="Relevance score">
                  {Math.round(result.relevanceScore * 100)}%
                </div>
              )}
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <div className="search-results">
      {/* Search Header */}
      <div className="search-results-header">
        <h2 className="results-title">
          {isSearching ? (
            'Searching...'
          ) : results.length > 0 ? (
            <>
              {results.length} {searchType === 'posts' ? 'post' : 'community'}
              {results.length !== 1 ? 's' : ''} found for "{query}"
            </>
          ) : (
            'No results'
          )}
        </h2>
      </div>

      {/* Results Content */}
      <div className="search-results-content">
        {isSearching ? (
          renderLoadingSkeleton()
        ) : results.length > 0 ? (
          searchType === 'posts' ? renderPostResults() : renderCommunityResults()
        ) : (
          renderEmptyState()
        )}
      </div>
    </div>
  );
};

export default SearchResults;
