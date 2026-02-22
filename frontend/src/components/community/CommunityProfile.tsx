/**
 * CommunityProfile Component
 * 
 * Displays community information with join/leave functionality.
 * Shows community name, description, icon, member count, and post count.
 * 
 * Requirements: 8.1, 8.2, 8.6
 */

import React, { useState, useEffect } from 'react';
import CommunityService from '@/services/communityService';
import type { Community } from '@/types/community';

interface CommunityProfileProps {
  communityId: string;
  onJoinStatusChange?: (isJoined: boolean) => void;
}

export const CommunityProfile: React.FC<CommunityProfileProps> = ({
  communityId,
  onJoinStatusChange,
}) => {
  const [community, setCommunity] = useState<Community | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCommunity();
    checkMembershipStatus();
  }, [communityId]);

  const loadCommunity = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await CommunityService.getCommunity(communityId);
      setCommunity(data);
    } catch (err: any) {
      console.error('Failed to load community:', err);
      setError(err.message || 'Failed to load community');
    } finally {
      setIsLoading(false);
    }
  };

  const checkMembershipStatus = async () => {
    try {
      const userCommunities = await CommunityService.getUserCommunities();
      const joined = userCommunities.some(c => c.id === communityId);
      setIsJoined(joined);
    } catch (err) {
      console.error('Failed to check membership status:', err);
    }
  };

  const handleJoinLeave = async () => {
    if (!community) return;

    try {
      setIsActionLoading(true);
      setError(null);

      if (isJoined) {
        await CommunityService.leaveCommunity(communityId);
        setIsJoined(false);
        setCommunity({
          ...community,
          memberCount: Math.max(0, community.memberCount - 1),
        });
        onJoinStatusChange?.(false);
      } else {
        await CommunityService.joinCommunity(communityId);
        setIsJoined(true);
        setCommunity({
          ...community,
          memberCount: community.memberCount + 1,
        });
        onJoinStatusChange?.(true);
      }
    } catch (err: any) {
      console.error('Failed to join/leave community:', err);
      setError(err.message || 'Failed to update membership');
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="community-profile-skeleton">
        <div className="skeleton-icon" />
        <div className="skeleton-text" />
        <div className="skeleton-text short" />
        <div className="skeleton-button" />
      </div>
    );
  }

  if (error && !community) {
    return (
      <div className="community-profile-error">
        <p className="error-message">{error}</p>
        <button onClick={loadCommunity} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  if (!community) {
    return null;
  }

  return (
    <div className="community-profile">
      {/* Community Icon */}
      {community.iconUrl && (
        <div className="community-icon">
          <img
            src={community.iconUrl}
            alt={`${community.name} icon`}
            className="icon-image"
          />
        </div>
      )}

      {/* Community Name */}
      <h2 className="community-name">{community.name}</h2>

      {/* Community Description */}
      {community.description && (
        <p className="community-description">{community.description}</p>
      )}

      {/* Community Stats */}
      <div className="community-stats">
        <div className="stat-item">
          <span className="stat-value">{community.memberCount.toLocaleString()}</span>
          <span className="stat-label">
            {community.memberCount === 1 ? 'Member' : 'Members'}
          </span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-value">{community.postCount.toLocaleString()}</span>
          <span className="stat-label">
            {community.postCount === 1 ? 'Post' : 'Posts'}
          </span>
        </div>
      </div>

      {/* Join/Leave Button */}
      <button
        onClick={handleJoinLeave}
        disabled={isActionLoading}
        className={`join-button ${isJoined ? 'joined' : 'not-joined'}`}
        aria-label={isJoined ? 'Leave community' : 'Join community'}
      >
        {isActionLoading ? (
          <span className="loading-spinner" />
        ) : isJoined ? (
          'Leave'
        ) : (
          'Join'
        )}
      </button>

      {/* Error Message */}
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default CommunityProfile;
