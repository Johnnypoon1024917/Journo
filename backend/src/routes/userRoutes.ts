import express from 'express';
import { NotificationController } from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Notification preferences routes
router.get('/notification-preferences', NotificationController.getPreferences);
router.patch('/notification-preferences', NotificationController.updatePreferences);
router.delete('/notification-preferences', NotificationController.resetPreferences);

export default router;
