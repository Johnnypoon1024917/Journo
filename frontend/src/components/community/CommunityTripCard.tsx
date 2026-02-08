import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trip } from '../../types/trip';
import { StoryItem } from '../../types/story';
import { Button } from '../common/Button';
import { useAuth } from '../../hooks/useAuth';
import { communityService } from '../../services/communityService';
import { useToast } from '../../hooks/useToast';

interface CommunityTripCardProps {
  trip: Trip & {
    storyItems?: StoryItem[];
    isLiked?: boolean;
    author?: {
      name: string;
      id: string;
    };
  };
  onLikeUpdate?: (tripId: string, isLiked: boolean, newCount: number) => void;
}

export function CommunityTripCard({ trip, onLikeUpdate }: CommunityTripCardProps) {
  const { accessToken, isAuthenticated } = useAuth();
  const { success, error } = useToast();
  const [isLiking, setIsLiking] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated || !accessToken) {
      error('Please login to like trips');
      return;
    }

    setIsLiking(true);
    try {
      if (trip.isLiked) {
        await communityService.unlikeTrip(trip.id, accessToken);
        onLikeUpdate?.(trip.id, false, (trip.likes_count || 0) - 1);
      } else {
        await communityService.likeTrip(trip.id, accessToken);
        onLikeUpdate?.(trip.id, true, (trip.likes_count || 0) + 1);
      }
    } catch (err: any) {
      error('Failed to update like');
    } finally {
      setIsLiking(false);
    }
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated || !accessToken) {
      error('Please login to copy trips');
      return;
    }

    setIsCopying(true);
    try {
      await communityService.copyTrip(trip.id, accessToken);
      success('Trip copied to your collection!');
    } catch (err: any) {
      error('Failed to copy trip');
    } finally {
      setIsCopying(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDuration = () => {
    if (!trip.start_date || !trip.end_date) return null;
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `${days} day${days > 1 ? 's' : ''}`;
  };

  return (
    <Link
      to={`/t/${trip.share_token}`}
      className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
    >
      {/* Cover Image */}
      <div className="aspect-w-16 aspect-h-9 bg-gray-200 relative overflow-hidden">
        {trip.cover_image_url ? (
          <img
            src={trip.cover_image_url}
            alt={trip.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
            <span className="text-white text-4xl">📍</span>
          </div>
        )}
        
        {/* Theme Badge */}
        {trip.theme && trip.theme !== 'default' && (
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 bg-black bg-opacity-70 text-white text-xs font-medium rounded-full capitalize">
              {trip.theme}
            </span>
          </div>
        )}

        {/* Duration Badge */}
        {getDuration() && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 bg-white bg-opacity-90 text-gray-800 text-xs font-medium rounded-full">
              {getDuration()}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Header */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {trip.title}
          </h3>
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{trip.destination}</span>
          </div>
        </div>

        {/* Story Items Preview */}
        {trip.storyItems && trip.storyItems.length > 0 && (
          <div className="mb-4">
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {trip.storyItems.slice(0, 4).map((story) => (
                <div key={story.id} className="flex-shrink-0">
                  {story.type === 'photo' && story.content_url && (
                    <img
                      src={story.content_url}
                      alt="Story"
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                  {story.type === 'note' && (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
              {trip.storyItems.length > 4 && (
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-medium">
                  +{trip.storyItems.length - 4}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Meta Info */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span>{formatDate(trip.created_at)}</span>
          <div className="flex items-center space-x-3">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {trip.views_count || 0}
            </span>
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {trip.likes_count || 0}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center space-x-1 text-sm transition-colors ${
              trip.isLiked
                ? 'text-red-500 hover:text-red-600'
                : 'text-gray-500 hover:text-red-500'
            } ${isLiking ? 'opacity-50' : ''}`}
          >
            <svg 
              className={`w-4 h-4 ${trip.isLiked ? 'fill-current' : ''}`} 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{trip.isLiked ? 'Liked' : 'Like'}</span>
          </button>

          {isAuthenticated && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              disabled={isCopying}
              className="text-xs"
            >
              {isCopying ? 'Copying...' : 'Copy Trip'}
            </Button>
          )}
        </div>
      </div>
    </Link>
  );
}