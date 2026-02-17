import React, { useEffect, useState } from 'react';

interface CatEatingAnimationProps {
  percentageSpent: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

type CatState = 'idle' | 'eating' | 'happy' | 'worried' | 'sad';

const SIZE_CONFIG = {
  sm: 'w-16 h-16 text-4xl',
  md: 'w-24 h-24 text-6xl',
  lg: 'w-32 h-32 text-8xl',
};

const CAT_EMOJIS: Record<CatState, string> = {
  idle: '😺',
  eating: '😸',
  happy: '😻',
  worried: '😿',
  sad: '🙀',
};

const CAT_MESSAGES: Record<CatState, string> = {
  idle: 'Budget looking good!',
  eating: 'Nom nom nom...',
  happy: 'Great spending!',
  worried: 'Watch your budget...',
  sad: 'Budget exceeded!',
};

export const CatEatingAnimation: React.FC<CatEatingAnimationProps> = ({
  percentageSpent,
  size = 'md',
  className = '',
}) => {
  const [catState, setCatState] = useState<CatState>('idle');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Determine cat state based on budget percentage
    let newState: CatState;
    
    if (percentageSpent < 50) {
      newState = 'happy';
    } else if (percentageSpent < 70) {
      newState = 'eating';
    } else if (percentageSpent < 90) {
      newState = 'worried';
    } else if (percentageSpent < 100) {
      newState = 'sad';
    } else {
      newState = 'sad';
    }

    if (newState !== catState) {
      setIsAnimating(true);
      setCatState(newState);
      
      // Reset animation after a short delay
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [percentageSpent, catState]);

  // Eating animation - bounce when eating
  const animationClass = isAnimating
    ? 'animate-bounce'
    : catState === 'eating'
    ? 'animate-pulse'
    : '';

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div
        className={`${SIZE_CONFIG[size]} flex items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900/30 dark:to-pink-800/30 shadow-lg ${animationClass} transition-all duration-300`}
        role="img"
        aria-label={`Cat ${catState}`}
      >
        <span className="select-none">{CAT_EMOJIS[catState]}</span>
      </div>
      
      <div className="text-center">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {CAT_MESSAGES[catState]}
        </div>
        {catState === 'eating' && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Munching through your budget...
          </div>
        )}
        {catState === 'worried' && (
          <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
            Getting close to the limit!
          </div>
        )}
        {catState === 'sad' && percentageSpent >= 100 && (
          <div className="text-xs text-red-600 dark:text-red-400 mt-1">
            Oh no! Budget exceeded!
          </div>
        )}
      </div>

      {/* Add custom animations */}
      <style>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        
        .animate-bounce {
          animation: bounce 0.6s ease-in-out;
        }
        
        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
