import { Request, Response } from 'express';
import { badgeService } from '../services/badgeService.js';

/**
 * Get all badges for the authenticated user
 */
export const getUserBadges = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const badges = await badgeService.getUserBadges(userId);

    res.json(badges);
  } catch (error) {
    console.error('Error fetching user badges:', error);
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
};

/**
 * Get badges for a specific user (for profile viewing)
 */
export const getUserBadgesByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const badges = await badgeService.getUserBadges(userId);

    res.json(badges);
  } catch (error) {
    console.error('Error fetching user badges:', error);
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
};

/**
 * Manually trigger badge checks (for testing or admin purposes)
 */
export const checkBadges = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { action } = req.body;

    if (!action || !action.type) {
      return res.status(400).json({ error: 'Action type is required' });
    }

    const earnedBadges = await badgeService.checkAllBadges(userId, action);

    res.json({
      message: 'Badge check completed',
      earnedBadges
    });
  } catch (error) {
    console.error('Error checking badges:', error);
    res.status(500).json({ error: 'Failed to check badges' });
  }
};
