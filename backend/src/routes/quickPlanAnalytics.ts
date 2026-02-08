import express from 'express';
import { QuickPlanAnalyticsController } from '../controllers/quickPlanAnalyticsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Performance monitoring endpoints
router.get('/performance/dashboard', QuickPlanAnalyticsController.getPerformanceDashboard);
router.get('/performance/cache', QuickPlanAnalyticsController.getCacheMetrics);
router.get('/performance/api', QuickPlanAnalyticsController.getApiMetrics);
router.get('/performance/satisfaction', QuickPlanAnalyticsController.getUserSatisfactionMetrics);

// Analytics endpoints
router.get('/usage/patterns', QuickPlanAnalyticsController.getUsagePatterns);
router.get('/usage/conversions', QuickPlanAnalyticsController.getConversionMetrics);
router.get('/usage/destinations', QuickPlanAnalyticsController.getPopularDestinations);
router.get('/usage/customizations', QuickPlanAnalyticsController.getUserCustomizationPatterns);

// Feedback analysis
router.get('/feedback/analysis', QuickPlanAnalyticsController.analyzeFeedback);
router.post('/feedback/submit', QuickPlanAnalyticsController.submitUserFeedback);

// A/B testing endpoints
router.post('/ab-tests', QuickPlanAnalyticsController.createABTest);
router.get('/ab-tests/:testId/results', QuickPlanAnalyticsController.getABTestResults);

// Comprehensive analytics report
router.get('/report', QuickPlanAnalyticsController.getAnalyticsReport);

export default router;