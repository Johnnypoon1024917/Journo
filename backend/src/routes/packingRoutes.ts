import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { createActivityLogMiddleware } from '../middleware/activityLogMiddleware.js';
import {
  getPackingItems,
  addPackingItem,
  updatePackingItem,
  deletePackingItem,
  getPackingProgress,
  generatePackingSuggestions,
  applyPackingSuggestions,
} from '../controllers/packingController.js';

const router = express.Router();

// Get all packing items for a trip
router.get('/trips/:tripId/packing', authenticate, getPackingItems);

// Get packing progress for a trip
router.get('/trips/:tripId/packing/progress', authenticate, getPackingProgress);

// Generate packing suggestions
router.get('/trips/:tripId/packing/suggestions', authenticate, generatePackingSuggestions);

// Apply packing suggestions
router.post('/trips/:tripId/packing/suggestions/apply', authenticate, applyPackingSuggestions);

// Add a packing item
router.post('/trips/:tripId/packing', authenticate, createActivityLogMiddleware.packingItemAdded(), addPackingItem);

// Update a packing item
router.patch('/trips/:tripId/packing/:itemId', authenticate, createActivityLogMiddleware.packingItemUpdated(), updatePackingItem);

// Delete a packing item
router.delete('/trips/:tripId/packing/:itemId', authenticate, createActivityLogMiddleware.packingItemDeleted(), deletePackingItem);

export default router;
