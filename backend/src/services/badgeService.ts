import { Pool } from 'pg';
import { pool } from '../config/database.js';

export type BadgeType = 
  | 'golden_hour' 
  | 'food_explorer' 
  | 'early_bird'
  | 'world_traveler'
  | 'budget_master'
  | 'packing_pro';

export interface UserBadge {
  id: string;
  user_id: string;
  trip_id: string | null;
  badge_type: BadgeType;
  earned_at: string;
}

export interface CreateUserBadgeDto {
  user_id: string;
  trip_id?: string;
  badge_type: BadgeType;
}

export class BadgeService {
  private db: Pool;

  constructor() {
    this.db = pool;
  }

  /**
   * Award a badge to a user if they haven't already earned it
   */
  async awardBadge(data: CreateUserBadgeDto): Promise<UserBadge | null> {
    try {
      // Check if user already has this badge
      const existingBadge = await this.db.query(
        'SELECT id FROM user_badges WHERE user_id = $1 AND badge_type = $2',
        [data.user_id, data.badge_type]
      );

      if (existingBadge.rows.length > 0) {
        return null; // Badge already earned
      }

      // Award the badge
      const result = await this.db.query(
        `INSERT INTO user_badges (user_id, trip_id, badge_type, earned_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING *`,
        [data.user_id, data.trip_id || null, data.badge_type]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error awarding badge:', error);
      throw error;
    }
  }

  /**
   * Get all badges for a user
   */
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    try {
      const result = await this.db.query(
        `SELECT ub.*, t.title as trip_title, t.destination as trip_destination
         FROM user_badges ub
         LEFT JOIN trips t ON ub.trip_id = t.id
         WHERE ub.user_id = $1
         ORDER BY ub.earned_at DESC`,
        [userId]
      );

      return result.rows;
    } catch (error) {
      console.error('Error fetching user badges:', error);
      throw error;
    }
  }

  /**
   * Check and award Golden Hour badge for photo uploads after 6 PM
   */
  async checkGoldenHourBadge(userId: string, tripId: string, photoTimestamp: Date): Promise<UserBadge | null> {
    try {
      const hour = photoTimestamp.getHours();
      
      // Check if photo was uploaded after 6 PM (18:00)
      if (hour >= 18) {
        return await this.awardBadge({
          user_id: userId,
          trip_id: tripId,
          badge_type: 'golden_hour'
        });
      }

      return null;
    } catch (error) {
      console.error('Error checking Golden Hour badge:', error);
      throw error;
    }
  }

  /**
   * Check and award Food Explorer badge for 10+ food places
   */
  async checkFoodExplorerBadge(userId: string): Promise<UserBadge | null> {
    try {
      // Count total food places across all user's trips
      const result = await this.db.query(
        `SELECT COUNT(*) as food_count
         FROM places p
         JOIN trip_days td ON p.trip_day_id = td.id
         JOIN trips t ON td.trip_id = t.id
         WHERE t.owner_id = $1 AND p.place_type = 'food'`,
        [userId]
      );

      const foodCount = parseInt(result.rows[0].food_count);

      if (foodCount >= 10) {
        return await this.awardBadge({
          user_id: userId,
          badge_type: 'food_explorer'
        });
      }

      return null;
    } catch (error) {
      console.error('Error checking Food Explorer badge:', error);
      throw error;
    }
  }

  /**
   * Check and award Early Bird badge for places before 9 AM
   */
  async checkEarlyBirdBadge(userId: string, tripId: string, startTime: string): Promise<UserBadge | null> {
    try {
      // Parse time string (format: "HH:MM")
      const [hours] = startTime.split(':').map(Number);
      
      // Check if place starts before 9 AM
      if (hours < 9) {
        return await this.awardBadge({
          user_id: userId,
          trip_id: tripId,
          badge_type: 'early_bird'
        });
      }

      return null;
    } catch (error) {
      console.error('Error checking Early Bird badge:', error);
      throw error;
    }
  }

  /**
   * Check all applicable badges for a user action
   */
  async checkAllBadges(userId: string, action: {
    type: 'photo_upload' | 'place_added' | 'trip_completed' | 'trip_created' | 'quick_plan_used';
    tripId?: string;
    photoTimestamp?: Date;
    placeType?: string;
    startTime?: string;
    timestamp?: string; // Add this missing property
  }): Promise<UserBadge[]> {
    const earnedBadges: UserBadge[] = [];

    try {
      switch (action.type) {
        case 'photo_upload':
          if (action.photoTimestamp && action.tripId) {
            const goldenHourBadge = await this.checkGoldenHourBadge(
              userId, 
              action.tripId, 
              action.photoTimestamp
            );
            if (goldenHourBadge) earnedBadges.push(goldenHourBadge);
          }
          break;

        case 'place_added':
          // Check Food Explorer badge
          if (action.placeType === 'food') {
            const foodExplorerBadge = await this.checkFoodExplorerBadge(userId);
            if (foodExplorerBadge) earnedBadges.push(foodExplorerBadge);
          }

          // Check Early Bird badge
          if (action.startTime && action.tripId) {
            const earlyBirdBadge = await this.checkEarlyBirdBadge(
              userId, 
              action.tripId, 
              action.startTime
            );
            if (earlyBirdBadge) earnedBadges.push(earlyBirdBadge);
          }
          break;
      }

      return earnedBadges;
    } catch (error) {
      console.error('Error checking badges:', error);
      throw error;
    }
  }
}

export const badgeService = new BadgeService();