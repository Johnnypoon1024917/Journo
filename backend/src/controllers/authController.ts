import { Request, Response } from 'express';
import { AuthService } from '../services/authService.js';
import { UserModel } from '../models/User.js';

export class AuthController {
  // Register new user
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, name, password } = req.body;

      // Validate input
      if (!email || !name || !password) {
        res.status(400).json({ error: 'Email, name, and password are required' });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ error: 'Invalid email format' });
        return;
      }

      // Validate password strength
      if (password.length < 8) {
        res.status(400).json({ error: 'Password must be at least 8 characters long' });
        return;
      }

      // Register user
      const result = await AuthService.register({ email, name, password });

      res.status(201).json({
        message: 'User registered successfully',
        user: result.user,
        tokens: result.tokens,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          res.status(409).json({ error: error.message });
          return;
        }
      }
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  }

  // Login user
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      // Login user
      const result = await AuthService.login(email, password);

      res.status(200).json({
        message: 'Login successful',
        user: result.user,
        tokens: result.tokens,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Invalid email or password')) {
          res.status(401).json({ error: error.message });
          return;
        }
      }
      console.error('Login error:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  }

  // Refresh access token
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      // Validate input
      if (!refreshToken) {
        res.status(400).json({ error: 'Refresh token is required' });
        return;
      }

      // Refresh tokens
      const tokens = await AuthService.refreshAccessToken(refreshToken);

      res.status(200).json({
        message: 'Token refreshed successfully',
        tokens,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Invalid') || error.message.includes('expired')) {
          res.status(401).json({ error: error.message });
          return;
        }
      }
      console.error('Token refresh error:', error);
      res.status(500).json({ error: 'Failed to refresh token' });
    }
  }

  // Logout user
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      // Validate input
      if (!refreshToken) {
        res.status(400).json({ error: 'Refresh token is required' });
        return;
      }

      // Logout user
      await AuthService.logout(refreshToken);

      res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Failed to logout' });
    }
  }

  // Get current user profile
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Get user details
      const user = await UserModel.findById(req.user.userId);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json({ user });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  }

  // Update user profile
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { name, email, password } = req.body;

      // Validate at least one field is provided
      if (!name && !email && !password) {
        res.status(400).json({ error: 'At least one field (name, email, or password) is required' });
        return;
      }

      // Update user
      const updates: any = {};
      if (name) updates.name = name;
      if (email) updates.email = email;
      if (password) {
        if (password.length < 8) {
          res.status(400).json({ error: 'Password must be at least 8 characters long' });
          return;
        }
        updates.password = password;
      }

      const user = await UserModel.update(req.user.userId, updates);

      res.status(200).json({
        message: 'Profile updated successfully',
        user,
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }


  // Update user language preference
  static async updateLanguage(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { language } = req.body;

      // Validate language
      const validLanguages = ['en', 'zh-TW', 'zh-CN', 'ja'];
      if (!language || !validLanguages.includes(language)) {
        res.status(400).json({ error: 'Invalid language. Must be one of: en, zh-TW, zh-CN, ja' });
        return;
      }

      // Update user language
      const user = await UserModel.update(req.user.userId, { language });

      res.status(200).json({
        message: 'Language preference updated successfully',
        user,
      });
    } catch (error) {
      console.error('Update language error:', error);
      res.status(500).json({ error: 'Failed to update language preference' });
    }
  }

}

export default AuthController;
