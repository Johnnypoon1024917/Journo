import express from 'express';
import { NotificationController } from '../controllers/notificationController.js';
import { createEnhancedAuthMiddleware } from '../middleware/authMiddleware.js';
import { pool } from '../config/database.js';

const router = express.Router();

// Create enhanced auth middleware instance
const enhancedAuthMiddleware = createEnhancedAuthMiddleware(pool);

// All notification routes require authentication
router.use(enhancedAuthMiddleware);

// Notification routes
router.get('/', NotificationController.getNotifications);
router.patch('/:notificationId/read', NotificationController.markAsRead);
router.post('/mark-all-read', NotificationController.markAllAsRead);
router.delete('/:notificationId', NotificationController.deleteNotification);

export default router;