import express from 'express';
import {
  getTripCollaborators,
  addCollaborator,
  updateCollaboratorRole,
  removeCollaborator,
  getTripPermissions,
  leaveTrip
} from '../controllers/collaboratorController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { createActivityLogMiddleware } from '../middleware/activityLogMiddleware.js';

const router = express.Router();

// Get all collaborators for a trip (requires auth or public trip)
router.get('/trips/:tripId/collaborators', optionalAuth, getTripCollaborators);

// Get user's permissions for a trip
router.get('/trips/:tripId/permissions', optionalAuth, getTripPermissions);

// Add a collaborator to a trip (requires owner)
router.post('/trips/:tripId/collaborators', authenticate, createActivityLogMiddleware.collaboratorAdded(), addCollaborator);

// Update collaborator role (requires owner)
router.patch('/trips/:tripId/collaborators/:collaboratorId', authenticate, createActivityLogMiddleware.collaboratorRoleChanged(), updateCollaboratorRole);

// Remove a collaborator from a trip (requires owner)
router.delete('/trips/:tripId/collaborators/:collaboratorId', authenticate, createActivityLogMiddleware.collaboratorRemoved(), removeCollaborator);

// Leave a trip (remove self as collaborator)
router.post('/trips/:tripId/leave', authenticate, createActivityLogMiddleware.collaboratorRemoved(), leaveTrip);

export default router;
