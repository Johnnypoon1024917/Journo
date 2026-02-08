import { UserBadge, BADGE_DEFINITIONS, BadgeType } from '../../types/user';

interface BadgeDisplayProps {
  badge: UserBadge;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

export function BadgeDisplay({ 
  badge, 
  size = 'md', 
  showDetails = false, 
  className = '' 
}: BadgeDisplayProps) {
  const definition = BADGE_DEFINITIONS[badge.badge_type as BadgeType];
  
  if (!definition) {
    return null;
  }

  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Badge Icon */}
      <div className={`
        ${sizeClasses[size]} 
        bg-gradient-to-br from-yellow-400 to-orange-500 
        rounded-full flex items-center justify-center 
        shadow-lg border-2 border-white dark:border-gray-800
      `}>
        <span className="text-white font-bold">
          {definition.icon}
        </span>
      </div>

      {/* Badge Details */}
      {showDetails && (
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-gray-900 dark:text-white ${textSizeClasses[size]}`}>
            {definition.name}
          </h3>
          <p className={`text-gray-600 dark:text-gray-400 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
            {definition.description}
          </p>
          <p className={`text-gray-500 dark:text-gray-500 ${size === 'sm' ? 'text-xs' : 'text-xs'}`}>
            Earned {new Date(badge.earned_at).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}

interface BadgeGridProps {
  badges: UserBadge[];
  className?: string;
}

export function BadgeGrid({ badges, className = '' }: BadgeGridProps) {
  // Group badges by type and show only the first one of each type
  const uniqueBadges = badges.reduce((acc, badge) => {
    if (!acc[badge.badge_type]) {
      acc[badge.badge_type] = badge;
    }
    return acc;
  }, {} as Record<string, UserBadge>);

  const badgeList = Object.values(uniqueBadges);

  if (badgeList.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400">No badges earned yet</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Start exploring and adding places to earn your first badge!
        </p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 ${className}`}>
      {badgeList.map((badge) => (
        <div
          key={badge.id}
          className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <BadgeDisplay badge={badge} size="md" />
          <div className="mt-2 text-center">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {BADGE_DEFINITIONS[badge.badge_type as BadgeType]?.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {new Date(badge.earned_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

interface BadgeListProps {
  badges: UserBadge[];
  className?: string;
}

export function BadgeList({ badges, className = '' }: BadgeListProps) {
  if (badges.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400">No badges earned yet</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Start exploring and adding places to earn your first badge!
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {badges.map((badge) => (
        <div
          key={badge.id}
          className="flex items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <BadgeDisplay badge={badge} size="md" showDetails />
        </div>
      ))}
    </div>
  );
}