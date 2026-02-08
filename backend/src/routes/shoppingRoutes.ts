import express from 'express';
import { ShoppingController } from '../controllers/shoppingController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.get('/trip/:tripId', authenticateToken, ShoppingController.getShoppingItemsByTrip);
router.post('/', authenticateToken, ShoppingController.createShoppingItem);
router.put('/:itemId', authenticateToken, ShoppingController.updateShoppingItem);
router.patch('/:itemId/toggle', authenticateToken, ShoppingController.togglePurchased);
router.delete('/:itemId', authenticateToken, ShoppingController.deleteShoppingItem);

export default router;
