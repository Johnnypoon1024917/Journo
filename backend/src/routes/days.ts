import express from 'express';
import { DayController } from '../controllers/dayController.js';
import { authenticate } from '../middleware/auth.js';
import { createActivityLogMiddleware } from '../middleware/activityLogMiddleware.js';

const router = express.Router();

// All day routes require authentication
router.use(authenticate);

// Day CRUD operations
router.post('/', createActivityLogMiddleware.dayAdded(), DayController.createDay);
router.post('/get-or-create', createActivityLogMiddleware.dayAdded(), DayController.getOrCreateDay); // Upsert endpoint
router.get('/trip/:tripId', DayController.getDaysByTrip);
router.put('/:id', createActivityLogMiddleware.dayUpdated(), DayController.updateDay);
router.delete('/:id', createActivityLogMiddleware.dayDeleted(), DayController.deleteDay);
router.put('/trip/:tripId/reorder', DayController.reorderDays);

export default router;
