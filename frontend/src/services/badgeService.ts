import api from './api';
import { UserBadge, BadgeType } from '../types/user';

export interface BadgeCheckAction {
  type: 'photo_upload' | 'place_added' | 'trip_completed';
  tripId?: string;
  photoTimestamp?: Date;
  placeType?: string;
  startTime?: string;
}

export class BadgeService {
  /**
   * Get all badges for the current user
   */
  static async getUserBadges(): Promise<UserBadge[]> {
    try {
      const response = await api.get('/badges');
      return response as UserBadge[];
    } catch (error) {
      console.error('Error fetching user badges:', error);
      throw error;
    }
  }

  /**
   * Get badges for a specific user (for profile viewing)
   */
  static async getUserBadgesByUserId(userId: string): Promise<UserBadge[]> {
    try {
      const response = await api.get(`/badges/user/${userId}`);
      return response as UserBadge[];
    } catch (error) {
      console.error('Error fetching user badges:', error);
      throw error;
    }
  }

  /**
   * Manually trigger badge checks (for testing)
   */
  static async checkBadges(action: BadgeCheckAction): Promise<{ earnedBadges: UserBadge[] }> {
    try {
      const response = await api.post('/badges/check', { action });
      return response as { earnedBadges: UserBadge[] };
    } catch (error) {
      console.error('Error checking badges:', error);
      throw error;
    }
  }

  /**
   * Check if user has a specific badge
   */
  static hasBadge(badges: UserBadge[], badgeType: BadgeType): boolean {
    return badges.some(badge => badge.badge_type === badgeType);
  }

  /**
   * Get badges earned for a specific trip
   */
  static getBadgesForTrip(badges: UserBadge[], tripId: string): UserBadge[] {
    return badges.filter(badge => badge.trip_id === tripId);
  }

  /**
   * Group badges by type
   */
  static groupBadgesByType(badges: UserBadge[]): Record<BadgeType, UserBadge[]> {
    const grouped: Record<string, UserBadge[]> = {};
    
    badges.forEach(badge => {
      if (!grouped[badge.badge_type]) {
        grouped[badge.badge_type] = [];
      }
      grouped[badge.badge_type].push(badge);
    });

    return grouped as Record<BadgeType, UserBadge[]>;
  }

  /**
   * Get the most recent badge earned
   */
  static getMostRecentBadge(badges: UserBadge[]): UserBadge | null {
    if (badges.length === 0) return null;
    
    return badges.reduce((latest, current) => {
      return new Date(current.earned_at) > new Date(latest.earned_at) ? current : latest;
    });
  }

  /**
   * Count total badges earned
   */
  static getTotalBadgeCount(badges: UserBadge[]): number {
    return badges.length;
  }

  /**
   * Get unique badge types earned
   */
  static getUniqueBadgeTypes(badges: UserBadge[]): BadgeType[] {
    const uniqueTypes = new Set(badges.map(badge => badge.badge_type));
    return Array.from(uniqueTypes);
  }
}