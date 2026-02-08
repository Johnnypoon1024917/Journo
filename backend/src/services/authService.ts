import jwt from 'jsonwebtoken';
import { UserModel, UserCreateInput, UserResponse } from '../models/User.js';
import { RefreshTokenModel } from '../models/RefreshToken.js';
import { jwtConfig } from '../config/jwt.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export class AuthService {
  // Generate access token
  static generateAccessToken(user: UserResponse): string {
    const payload: TokenPayload = {
      userId: String(user.id), // Ensure it's a string
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn as jwt.SignOptions['expiresIn'],
    });
  }

  // Generate refresh token
  static generateRefreshToken(user: UserResponse): string {
    const payload: TokenPayload = {
      userId: String(user.id), // Ensure it's a string
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, jwtConfig.refreshSecret, {
      expiresIn: jwtConfig.refreshExpiresIn as jwt.SignOptions['expiresIn'],
    });
  }

  // Verify access token
  static verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, jwtConfig.secret) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  // Verify refresh token
  static verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, jwtConfig.refreshSecret) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  // Register new user
  static async register(userData: UserCreateInput): Promise<{ user: UserResponse; tokens: AuthTokens }> {
    // Check if user already exists
    const existingUser = await UserModel.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create user
    const user = await UserModel.create(userData);

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    await RefreshTokenModel.create(user.id, refreshToken, expiresAt);

    return {
      user,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  // Login user
  static async login(email: string, password: string): Promise<{ user: UserResponse; tokens: AuthTokens }> {
    // Find user
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await UserModel.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    await RefreshTokenModel.create(user.id, refreshToken, expiresAt);

    // Return user without password
    const { password_hash, ...userResponse } = user;

    return {
      user: userResponse as UserResponse,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  // Refresh access token
  static async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    // Verify refresh token
    const payload = this.verifyRefreshToken(refreshToken);

    // Check if refresh token exists in database
    const storedToken = await RefreshTokenModel.findByToken(refreshToken);
    if (!storedToken) {
      throw new Error('Invalid refresh token');
    }

    // Get user
    const user = await UserModel.findById(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate new tokens
    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken(user);

    // Delete old refresh token
    await RefreshTokenModel.delete(refreshToken);

    // Store new refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    await RefreshTokenModel.create(user.id, newRefreshToken, expiresAt);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  // Logout user
  static async logout(refreshToken: string): Promise<void> {
    await RefreshTokenModel.delete(refreshToken);
  }

  // Logout from all devices
  static async logoutAll(userId: string): Promise<void> {
    await RefreshTokenModel.deleteAllForUser(userId);
  }
}

export default AuthService;
