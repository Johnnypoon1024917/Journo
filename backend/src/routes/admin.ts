import { Router } from 'express';
import { AdminController } from '../controllers/adminController.js';
import { createEnhancedAuthMiddleware } from '../middleware/authMiddleware.js';
import { pool } from '../config/database.js';

const router = Router();

// Create enhanced auth middleware instance
const enhancedAuthMiddleware = createEnhancedAuthMiddleware(pool);

// Admin role check middleware
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

// All admin routes require enhanced authentication and admin role
router.use(enhancedAuthMiddleware);
router.use(requireAdmin);

// Dashboard metrics
router.get('/metrics', AdminController.getDashboardMetrics);

// System health
router.get('/system/health', AdminController.getSystemHealth);

// User management
router.get('/users', AdminController.getUsers);
router.put('/users/:userId/status', AdminController.updateUserStatus);
router.get('/users/export', AdminController.exportUsers);

// Content moderation
router.get('/moderation/flags', AdminController.getFlaggedContent);
router.post('/moderation/flags', AdminController.createFlag);
router.put('/moderation/flags/:flagId/action', AdminController.takeModerationAction);
router.get('/moderation/log', AdminController.getModerationLog);

// Analytics
router.get('/analytics/insights', AdminController.getAnalyticsInsights);

// Feature flags
router.get('/feature-flags', AdminController.getFeatureFlags);
router.put('/feature-flags/:flagId', AdminController.updateFeatureFlag);

export default router;