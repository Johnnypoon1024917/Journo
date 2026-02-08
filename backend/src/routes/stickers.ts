import express from 'express';
import {
  getStickers,
  uploadSticker,
  deleteSticker,
  attachSticker,
  getEntityStickers,
  updateStickerAttachment,
  removeStickerAttachment,
  getPredefinedStickers
} from '../controllers/stickerController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All sticker routes require authentication
router.use(authenticate);

// Sticker management routes
router.get('/', getStickers);
router.post('/upload', uploadSticker);
router.delete('/:id', deleteSticker);
router.get('/predefined', getPredefinedStickers);

// Sticker attachment routes
router.post('/attach', attachSticker);
router.get('/entity/:entityType/:entityId', getEntityStickers);
router.put('/attachment/:id', updateStickerAttachment);
router.delete('/attachment/:id', removeStickerAttachment);

export default router;
