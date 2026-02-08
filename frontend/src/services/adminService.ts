import api from './api';
import { AdminDashboardMetrics, SystemHealthMetrics, UserManagementFilters, UserManagementResult } from '../types/admin';

interface UserManagementResponse {
  users: UserManagementResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class AdminService {
  async getDashboardMetrics(token: string): Promise<AdminDashboardMetrics> {
    const response = await api.get('/admin/metrics', { token });
    return response as AdminDashboardMetrics;
  }

  async getSystemHealth(token: string): Promise<SystemHealthMetrics> {
    const response = await api.get('/admin/system/health', { token });
    return response as SystemHealthMetrics;
  }

  async getUsers(token: string, filters: UserManagementFilters & { page?: number; limit?: number } = {}): Promise<UserManagementResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const url = `/admin/users${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url, { token });
    return response as UserManagementResponse;
  }

  async updateUserStatus(token: string, userId: string, action: 'block' | 'unblock'): Promise<{ message: string; user: any }> {
    const response = await api.put(`/admin/users/${userId}/status`, { action }, { token });
    return response as { message: string; user: any };
  }

  async exportUsers(token: string): Promise<Blob> {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/users/export`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export users');
    }

    return response.blob();
  }

  // Content moderation methods
  async getFlaggedContent(token: string, filters: { resource_type?: string; status?: string; page?: number; limit?: number } = {}): Promise<any> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const url = `/admin/moderation/flags${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url, { token });
    return response;
  }

  async takeModerationAction(token: string, flagId: string, action: string, reason?: string): Promise<any> {
    const response = await api.put(`/admin/moderation/flags/${flagId}/action`, { action, reason }, { token });
    return response;
  }

  async createFlag(token: string, resourceType: string, resourceId: string, reason: string): Promise<any> {
    const response = await api.post('/admin/moderation/flags', {
      resource_type: resourceType,
      resource_id: resourceId,
      reason
    }, { token });
    return response;
  }

  async getModerationLog(token: string, filters: { resource_type?: string; action?: string; moderator_id?: string; page?: number; limit?: number } = {}): Promise<any> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const url = `/admin/moderation/log${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url, { token });
    return response;
  }

  // Analytics methods
  async getAnalyticsInsights(token: string): Promise<any> {
    const response = await api.get('/admin/analytics/insights', { token });
    return response;
  }

  // Feature flag methods
  async getFeatureFlags(token: string): Promise<any> {
    const response = await api.get('/admin/feature-flags', { token });
    return response;
  }

  async updateFeatureFlag(token: string, flagId: string, updates: { enabled?: boolean; rollout_percentage?: number; description?: string }): Promise<any> {
    const response = await api.put(`/admin/feature-flags/${flagId}`, updates, { token });
    return response;
  }
}

export const adminService = new AdminService();