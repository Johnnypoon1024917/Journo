import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getActivityLog,
  getActivitySummary,
} from '../controllers/activityLogController.js';

const router = express.Router();

// Get activity log for a trip
router.get('/trips/:tripId/activity-log', authenticate, getActivityLog);

// Get activity log summary for a trip
router.get('/trips/:tripId/activity-log/summary', authenticate, getActivitySummary);

export default router;
