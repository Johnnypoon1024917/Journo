import { apiRequest } from './api';
import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  AuthTokens,
  User,
} from '../types/auth';

export class AuthService {
  // Register new user
  static async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiRequest<{
      success: boolean;
      user?: any;
      message?: string;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        firstName: data.name.split(' ')[0],
        lastName: data.name.split(' ').slice(1).join(' ') || undefined
      }),
    });

    if (!response.success) {
      throw new Error(response.message || 'Registration failed');
    }

    // Enhanced auth registration doesn't return tokens immediately (email verification required)
    // So we'll return a minimal response
    return {
      user: response.user ? {
        id: response.user.id,
        email: response.user.email,
        name: response.user.first_name ? `${response.user.first_name} ${response.user.last_name || ''}`.trim() : response.user.email,
        role: 'user',
        created_at: response.user.created_at
      } : {
        id: '',
        email: data.email,
        name: data.name,
        role: 'user',
        created_at: new Date().toISOString()
      },
      tokens: {
        accessToken: '',
        refreshToken: ''
      },
      message: response.message
    };
  }

  // Login user
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('🔐 AuthService.login - Sending login request...');
    
    const response = await apiRequest<{
      success?: boolean;
      user: any;
      tokens?: {
        accessToken: string;
        refreshToken: string;
      };
      accessToken?: string;
      refreshToken?: string;
      message?: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    console.log('📥 AuthService.login - Response received:', {
      hasUser: !!response.user,
      hasTokensObject: !!response.tokens,
      hasAccessToken: !!(response.accessToken || response.tokens?.accessToken),
      hasRefreshToken: !!(response.refreshToken || response.tokens?.refreshToken),
    });

    // Handle both response formats (tokens object or flat structure)
    const accessToken = response.tokens?.accessToken || response.accessToken || '';
    const refreshToken = response.tokens?.refreshToken || response.refreshToken || '';

    if (!accessToken) {
      console.error('❌ No access token in response!');
      throw new Error('No access token received from server');
    }

    console.log('✅ AuthService.login - Tokens extracted successfully');

    // Transform the enhanced auth response to match the expected format
    return {
      user: {
        id: response.user.id,
        email: response.user.email,
        name: response.user.first_name ? `${response.user.first_name} ${response.user.last_name || ''}`.trim() : response.user.email,
        role: response.user.role || 'user',
        created_at: response.user.created_at
      },
      tokens: {
        accessToken,
        refreshToken
      },
      message: response.message
    };
  }

  // Refresh access token
  static async refreshToken(refreshToken: string): Promise<{ tokens: AuthTokens }> {
    return apiRequest<{ tokens: AuthTokens }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  // Logout user
  static async logout(): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  }

  // Get user profile
  static async getProfile(token: string): Promise<{ user: User }> {
    return apiRequest<{ user: User }>('/auth/profile', {
      method: 'GET',
      token,
    });
  }

  // Update user profile
  static async updateProfile(
    token: string,
    updates: Partial<RegisterData>
  ): Promise<{ user: User; message: string }> {
    return apiRequest<{ user: User; message: string }>('/auth/profile', {
      method: 'PUT',
      token,
      body: JSON.stringify(updates),
    });
  }

  // Change password
  static async changePassword(
    token: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'POST',
      token,
      body: JSON.stringify({
        currentPassword,
        newPassword
      }),
    });
  }

  // Check if user is using default password
  static async checkDefaultPassword(token: string): Promise<{ success: boolean; isUsingDefaultPassword: boolean }> {
    return apiRequest<{ success: boolean; isUsingDefaultPassword: boolean }>('/auth/check-default-password', {
      method: 'GET',
      token,
    });
  }


    // Update user language preference
    static async updateLanguage(
      token: string,
      language: string
    ): Promise<{ user: User; message: string }> {
      return apiRequest<{ user: User; message: string }>('/auth/language', {
        method: 'PATCH',
        token,
        body: JSON.stringify({ language }),
      });
    }

}

export default AuthService;
