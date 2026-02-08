import { useState } from 'react';

interface LikeButtonProps {
  tripId: string;
  initialLiked: boolean;
  initialCount: number;
  onLike: (tripId: string) => Promise<void>;
  disabled?: boolean;
}

export function LikeButton({
  tripId,
  initialLiked,
  initialCount,
  onLike,
  disabled = false,
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (disabled || isLoading) return;

    setIsLoading(true);
    
    // Optimistic update
    const previousLiked = isLiked;
    const previousCount = likesCount;
    
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);

    try {
      await onLike(tripId);
    } catch (error) {
      // Revert on error
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      console.error('Error toggling like:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`
        flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium
        transition-all duration-200 ease-in-out
        ${
          isLiked
            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${isLoading ? 'opacity-70' : ''}
      `}
    >
      <svg
        className={`w-4 h-4 transition-all duration-200 ${
          isLiked ? 'scale-110' : ''
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
      <span>{likesCount}</span>
    </button>
  );
}
