import { useState, useEffect } from 'react';
import { UserBadge } from '../types/user';
import { BadgeService } from '../services/badgeService';

export function useBadges(userId?: string) {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let userBadges: UserBadge[];
        if (userId) {
          userBadges = await BadgeService.getUserBadgesByUserId(userId);
        } else {
          userBadges = await BadgeService.getUserBadges();
        }
        
        setBadges(userBadges);
      } catch (err) {
        console.error('Error fetching badges:', err);
        setError('Failed to load badges');
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [userId]);

  const refetchBadges = async () => {
    try {
      setError(null);
      
      let userBadges: UserBadge[];
      if (userId) {
        userBadges = await BadgeService.getUserBadgesByUserId(userId);
      } else {
        userBadges = await BadgeService.getUserBadges();
      }
      
      setBadges(userBadges);
    } catch (err) {
      console.error('Error refetching badges:', err);
      setError('Failed to load badges');
    }
  };

  return {
    badges,
    loading,
    error,
    refetchBadges,
    totalBadges: badges.length,
    uniqueBadgeTypes: BadgeService.getUniqueBadgeTypes(badges),
    mostRecentBadge: BadgeService.getMostRecentBadge(badges),
    hasBadge: (badgeType: string) => BadgeService.hasBadge(badges, badgeType as any),
    getBadgesForTrip: (tripId: string) => BadgeService.getBadgesForTrip(badges, tripId)
  };
}