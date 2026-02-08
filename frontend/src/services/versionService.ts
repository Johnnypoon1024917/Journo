import api from './api';

export interface TripVersion {
  id: string;
  trip_id: string;
  version_number: number;
  version_data: {
    trip: any;
    days: any[];
  };
  change_description?: string;
  created_at: string;
  created_by?: string;
  created_by_name?: string;
  created_by_email?: string;
}

export interface VersionHistoryResponse {
  success: boolean;
  data: TripVersion[];
}

export interface VersionResponse {
  success: boolean;
  data: TripVersion;
  message?: string;
}

export const versionService = {
  // Create a version snapshot
  async createSnapshot(tripId: string, changeDescription?: string): Promise<VersionResponse> {
    const response = await api.post<{ data: VersionResponse }>(`/trips/${tripId}/versions`, {
      changeDescription,
    });
    return response.data;
  },

  // Get version history for a trip
  async getVersionHistory(tripId: string): Promise<VersionHistoryResponse> {
    const response = await api.get<{ data: VersionHistoryResponse }>(`/trips/${tripId}/versions`);
    return response.data;
  },

  // Get a specific version
  async getVersion(tripId: string, versionId: string): Promise<VersionResponse> {
    const response = await api.get<{ data: VersionResponse }>(`/trips/${tripId}/versions/${versionId}`);
    return response.data;
  },

  // Restore a specific version
  async restoreVersion(tripId: string, versionId: string): Promise<VersionResponse> {
    const response = await api.post<{ data: VersionResponse }>(`/trips/${tripId}/versions/${versionId}/restore`);
    return response.data;
  },

  // Undo - revert to previous version
  async undo(tripId: string): Promise<VersionResponse> {
    const response = await api.post<{ data: VersionResponse }>(`/trips/${tripId}/undo`);
    return response.data;
  },
};
