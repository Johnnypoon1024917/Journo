/**
 * Theme Service
 * 
 * API service for managing system-wide and trip-specific themes
 */

import axios from 'axios';
import { getAuthToken } from '@/utils/auth';
import type { KawaiiColorTheme } from '@/types/theme';

// Use the same base URL as other services (already includes /api)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper to get axios config with auth token
const getAxiosConfig = () => {
  const token = getAuthToken();
  
  if (!token) {
    console.warn('⚠️ No auth token available for theme API request');
  } else {
    console.log('✅ Auth token found for theme API request');
  }
  
  return {
    withCredentials: true,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
};

class ThemeService {
  /**
   * Get active system color theme
   */
  async getSystemTheme(): Promise<KawaiiColorTheme> {
    try {
      const response = await axios.get<KawaiiColorTheme>(
        `${API_BASE_URL}/theme/system`,
        {
          ...getAxiosConfig(),
          validateStatus: (status) => status < 500, // Accept all non-500 errors
        }
      );
      
      // If 401, return default theme instead of throwing
      if (response.status === 401) {
        console.warn('Theme API returned 401, using default theme');
        return this.getDefaultTheme();
      }
      
      return response.data;
    } catch (error: any) {
      console.warn('Failed to load system theme, using defaults:', error);
      return this.getDefaultTheme();
    }
  }

  /**
   * Get default Kawaii pink theme
   */
  private getDefaultTheme(): KawaiiColorTheme {
    return {
      id: 'default',
      theme_name: 'Default Kawaii Pink',
      primary_50: '#fef1f7',
      primary_100: '#fee5f0',
      primary_200: '#ffcce3',
      primary_300: '#ffa3cd',
      primary_400: '#ff6aaa',
      primary_500: '#fa3d8a',
      primary_600: '#ea1b67',
      primary_700: '#cc0d4d',
      primary_800: '#a80f40',
      primary_900: '#8c1138',
      primary_950: '#56021d',
      cream_bg: '#fffbf5',
      neutral_50: '#fafafa',
      neutral_100: '#f5f5f5',
      neutral_200: '#e5e5e5',
      neutral_300: '#d4d4d4',
      neutral_400: '#a3a3a3',
      neutral_500: '#737373',
      neutral_600: '#525252',
      neutral_700: '#404040',
      neutral_800: '#262626',
      neutral_900: '#171717',
      neutral_950: '#0a0a0a',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Update system color theme (Admin only)
   */
  async updateSystemTheme(updates: Partial<KawaiiColorTheme>): Promise<KawaiiColorTheme> {
    const response = await axios.put<KawaiiColorTheme>(
      `${API_BASE_URL}/theme/system`,
      updates,
      getAxiosConfig()
    );
    return response.data;
  }

  /**
   * Get current user's theme preference
   */
  async getUserTheme(): Promise<{ primary_500: string | null }> {
    try {
      const response = await axios.get<{ primary_500: string | null }>(
        `${API_BASE_URL}/theme/user`,
        getAxiosConfig()
      );
      return response.data;
    } catch (error: any) {
      console.warn('Failed to load user theme:', error);
      return { primary_500: null };
    }
  }

  /**
   * Update current user's theme preference
   */
  async updateUserTheme(color: string): Promise<{ message: string; primary_500: string }> {
    const response = await axios.put<{ message: string; primary_500: string }>(
      `${API_BASE_URL}/theme/user`,
      { primary_500: color },
      getAxiosConfig()
    );
    return response.data;
  }

  /**
   * Reset user's theme preference to default
   */
  async resetUserTheme(): Promise<{ message: string }> {
    const response = await axios.delete<{ message: string }>(
      `${API_BASE_URL}/theme/user`,
      getAxiosConfig()
    );
    return response.data;
  }

  /**
   * Reset system theme to default Kawaii pink (Admin only)
   */
  async resetSystemTheme(): Promise<KawaiiColorTheme> {
    const response = await axios.post<KawaiiColorTheme>(
      `${API_BASE_URL}/theme/system/reset`,
      {},
      getAxiosConfig()
    );
    return response.data;
  }

  /**
   * Get trip-specific color theme
   * Falls back to system theme if no trip theme exists
   */
  async getTripTheme(tripId: string): Promise<KawaiiColorTheme> {
    try {
      const response = await axios.get<KawaiiColorTheme>(
        `${API_BASE_URL}/theme/trip/${tripId}`,
        {
          ...getAxiosConfig(),
          validateStatus: (status) => status < 500,
        }
      );
      
      // If 401 or 404, return default theme
      if (response.status === 401 || response.status === 404) {
        console.warn(`Trip theme API returned ${response.status}, using default theme`);
        return this.getDefaultTheme();
      }
      
      return response.data;
    } catch (error: any) {
      console.warn('Failed to load trip theme, using defaults:', error);
      return this.getDefaultTheme();
    }
  }

  /**
   * Update trip-specific color theme (Trip owner only)
   */
  async updateTripTheme(tripId: string, updates: Partial<KawaiiColorTheme>): Promise<KawaiiColorTheme> {
    const response = await axios.put<KawaiiColorTheme>(
      `${API_BASE_URL}/theme/trip/${tripId}`,
      updates,
      getAxiosConfig()
    );
    return response.data;
  }

  /**
   * Delete trip theme (revert to system theme)
   */
  async deleteTripTheme(tripId: string): Promise<void> {
    await axios.delete<void>(
      `${API_BASE_URL}/theme/trip/${tripId}`,
      getAxiosConfig()
    );
  }
}

export const themeService = new ThemeService();
