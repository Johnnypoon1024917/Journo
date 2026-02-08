import { Trip } from '../../types/trip';
import { StoryItem } from '../../types/story';
import { useNavigate } from 'react-router-dom';

interface CommunityCardProps {
  trip: Trip;
  storyItems: StoryItem[];
  onLike: (tripId: string) => void;
  onCopy: (tripId: string) => void;
  isLiked: boolean;
  isAuthenticated: boolean;
}

export function CommunityCard({
  trip,
  storyItems,
  onLike,
  onCopy,
  isLiked,
  isAuthenticated,
}: CommunityCardProps) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/t/${trip.share_token}`);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAuthenticated) {
      onLike(trip.id);
    }
  };

  const handleCopyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAuthenticated) {
      onCopy(trip.id);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
    >
      {/* Cover Image */}
      {trip.cover_image_url && (
        <div className="relative h-48 w-full overflow-hidden">
          <img
            src={trip.cover_image_url}
            alt={trip.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-xl font-bold text-white mb-1">{trip.title}</h3>
            {trip.destination && (
              <div className="flex items-center text-white/90 text-sm">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {trip.destination}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trip Info */}
      <div className="p-4">
        {!trip.cover_image_url && (
          <div className="mb-3">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {trip.title}
            </h3>
            {trip.destination && (
              <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {trip.destination}
              </div>
            )}
          </div>
        )}

        {/* Dates */}
        {(trip.start_date || trip.end_date) && (
          <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm mb-3">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {trip.start_date && formatDate(trip.start_date)}
            {trip.start_date && trip.end_date && ' - '}
            {trip.end_date && formatDate(trip.end_date)}
          </div>
        )}

        {/* Top 3 Story Items */}
        {storyItems.length > 0 && (
          <div className="mb-3">
            <div className="grid grid-cols-3 gap-2">
              {storyItems.slice(0, 3).map((item) => (
                <div key={item.id} className="aspect-square rounded overflow-hidden">
                  {item.type === 'photo' && item.content_url && (
                    <img
                      src={item.content_url}
                      alt={item.caption || 'Story photo'}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {item.type === 'youtube' && item.content_url && (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-red-600"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    </div>
                  )}
                  {item.type === 'note' && (
                    <div className="w-full h-full bg-gray-100 dark:bg-gray-700 p-2 flex items-center justify-center">
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3">
                        {item.caption}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats and Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center">
              <svg
                className={`w-4 h-4 mr-1 ${
                  isLiked ? 'fill-red-500 text-red-500' : ''
                }`}
                fill={isLiked ? 'currentColor' : 'none'}
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
              {trip.likes_count}
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {trip.views_count}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleLikeClick}
              disabled={!isAuthenticated}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                isLiked
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLiked ? 'Liked' : 'Like'}
            </button>
            <button
              onClick={handleCopyClick}
              disabled={!isAuthenticated}
              className={`px-3 py-1 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors ${
                !isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Copy Itinerary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
