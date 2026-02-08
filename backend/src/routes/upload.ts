import express from 'express';
import { uploadPhoto, uploadCover, deleteFile, getFileInfo } from '../controllers/uploadController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All upload routes require authentication
router.use(authenticate);

// Upload endpoints
router.post('/photo', uploadPhoto);
router.post('/cover', uploadCover);
router.delete('/file', deleteFile);
router.get('/info', getFileInfo);

export default router;
