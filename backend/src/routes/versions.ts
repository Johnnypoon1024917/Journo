import express from 'express';
import { VersionController } from '../controllers/versionController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Create a version snapshot
router.post('/trips/:tripId/versions', authenticate, VersionController.createSnapshot);

// Get version history for a trip
router.get('/trips/:tripId/versions', authenticate, VersionController.getVersionHistory);

// Get a specific version
router.get('/trips/:tripId/versions/:versionId', authenticate, VersionController.getVersion);

// Restore a specific version
router.post('/trips/:tripId/versions/:versionId/restore', authenticate, VersionController.restoreVersion);

// Undo - revert to previous version
router.post('/trips/:tripId/undo', authenticate, VersionController.undo);

export default router;
