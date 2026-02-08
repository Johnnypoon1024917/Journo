import { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { activityLogService } from '../services/activityLogService.js';

/**
 * Get activity log for a trip
 * GET /api/trips/:tripId/activity-log
 */
export const getActivityLog = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const userId = req.user?.userId;

    // Validate tripId
    if (!tripId) {
      return res.status(400).json({ error: 'Trip ID is required' });
    }

    // Check if user has permission to view this trip
    const permissionCheck = await pool.query(
      'SELECT user_can_view_trip($1, $2) as can_view',
      [userId, tripId]
    );

    if (!permissionCheck.rows[0]?.can_view) {
      return res.status(403).json({ error: 'You do not have permission to view this trip' });
    }

    // Parse and validate query parameters
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const actionType = req.query.actionType as string | undefined;
    const filterUserId = req.query.userId as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    // Validate limit and offset
    if (limit < 1 || limit > 100) {
      return res.status(400).json({ error: 'Limit must be between 1 and 100' });
    }

    if (offset < 0) {
      return res.status(400).json({ error: 'Offset must be non-negative' });
    }

    // Validate date formats if provided
    if (startDate && isNaN(Date.parse(startDate))) {
      return res.status(400).json({ error: 'Invalid startDate format' });
    }

    if (endDate && isNaN(Date.parse(endDate))) {
      return res.status(400).json({ error: 'Invalid endDate format' });
    }

    // Get activity log from service
    const result = await activityLogService.getActivityLog(tripId, {
      limit,
      offset,
      actionType,
      userId: filterUserId,
      startDate,
      endDate
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching activity log:', error);
    res.status(500).json({ error: 'Failed to fetch activity log' });
  }
};

/**
 * Get activity log summary for a trip
 * GET /api/trips/:tripId/activity-log/summary
 */
export const getActivitySummary = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const userId = req.user?.userId;

    // Validate tripId
    if (!tripId) {
      return res.status(400).json({ error: 'Trip ID is required' });
    }

    // Check if user has permission to view this trip
    const permissionCheck = await pool.query(
      'SELECT user_can_view_trip($1, $2) as can_view',
      [userId, tripId]
    );

    if (!permissionCheck.rows[0]?.can_view) {
      return res.status(403).json({ error: 'You do not have permission to view this trip' });
    }

    // Get activity summary from service
    const summary = await activityLogService.getActivitySummary(tripId);

    res.json(summary);
  } catch (error) {
    console.error('Error fetching activity summary:', error);
    res.status(500).json({ error: 'Failed to fetch activity summary' });
  }
};
