import express from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateProfileSchema,
  updateLanguageSchema,
} from '../schemas/authSchemas.js';

const router = express.Router();

// Public routes with validation
router.post('/register', validateBody(registerSchema), AuthController.register);
router.post('/login', validateBody(loginSchema), AuthController.login);
router.post('/refresh', validateBody(refreshTokenSchema), AuthController.refreshToken);
router.post('/logout', validateBody(refreshTokenSchema), AuthController.logout);

// Protected routes with validation
router.get('/profile', authenticate, AuthController.getProfile);
router.put('/profile', authenticate, validateBody(updateProfileSchema), AuthController.updateProfile);
router.patch('/language', authenticate, validateBody(updateLanguageSchema), AuthController.updateLanguage);

export default router;
