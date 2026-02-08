import express from 'express';
import { NotificationController } from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to each route individually
router.get('/', authenticateToken, NotificationController.getNotifications);
router.patch('/:notificationId/read', authenticateToken, NotificationController.markAsRead);
router.post('/mark-all-read', authenticateToken, NotificationController.markAllAsRead);
router.delete('/:notificationId', authenticateToken, NotificationController.deleteNotification);

export default router;
