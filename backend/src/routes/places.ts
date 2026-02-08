import express from 'express';
import { PlaceController } from '../controllers/placeController.js';
import { authenticate } from '../middleware/auth.js';
import { createActivityLogMiddleware } from '../middleware/activityLogMiddleware.js';

const router = express.Router();

// All place routes require authentication
router.use(authenticate);

// Place CRUD operations
router.post('/', createActivityLogMiddleware.placeAdded(), PlaceController.createPlace);
router.get('/day/:dayId', PlaceController.getPlacesByDay);
router.put('/:id', createActivityLogMiddleware.placeUpdated(), PlaceController.updatePlace);
router.delete('/:id', createActivityLogMiddleware.placeDeleted(), PlaceController.deletePlace);

// Travel time operations
router.put('/:id/travel-time', createActivityLogMiddleware.placeUpdated(), PlaceController.updateTravelTime);
router.post('/day/:dayId/recalculate-travel-times', PlaceController.recalculateTravelTimes);

// Move place to different day or reorder
router.put('/:id/move', createActivityLogMiddleware.placeReordered(), PlaceController.movePlace);

export default router;
