import api from '../../services/api';
import { getAuthToken } from '../../utils/auth';
import {
  TripCollaborator,
  TripCollaboratorWithUser,
  TripPermissions,
  CollaboratorRole
} from '../../types/collaboration';

export const collaboratorService = {
  // Get all collaborators for a trip
  async getTripCollaborators(tripId: string): Promise<TripCollaboratorWithUser[]> {
    const response = await api.get<TripCollaboratorWithUser[]>(
      `/trips/${tripId}/collaborators`,
      { token: getAuthToken() }
    );
    return response;
  },

  // Get user's permissions for a trip
  async getTripPermissions(tripId: string): Promise<TripPermissions> {
    const response = await api.get<TripPermissions>(
      `/trips/${tripId}/permissions`,
      { token: getAuthToken() }
    );
    return response;
  },

  // Add a collaborator to a trip by user ID
  async addCollaboratorById(
    tripId: string,
    userId: string,
    role: 'editor' | 'viewer'
  ): Promise<TripCollaboratorWithUser> {
    const response = await api.post<TripCollaboratorWithUser>(
      `/trips/${tripId}/collaborators`,
      { user_id: userId, role },
      { token: getAuthToken() }
    );
    return response;
  },

  // Add a collaborator to a trip by email
  async addCollaboratorByEmail(
    tripId: string,
    email: string,
    role: CollaboratorRole
  ): Promise<TripCollaboratorWithUser> {
    const response = await api.post<TripCollaboratorWithUser>(
      `/trips/${tripId}/collaborators`,
      { email, role },
      { token: getAuthToken() }
    );
    return response;
  },

  // Update a collaborator's role
  async updateCollaboratorRole(
    tripId: string,
    collaboratorId: string,
    role: CollaboratorRole
  ): Promise<TripCollaborator> {
    const response = await api.patch<TripCollaborator>(
      `/trips/${tripId}/collaborators/${collaboratorId}`,
      { role },
      { token: getAuthToken() }
    );
    return response;
  },

  // Remove a collaborator from a trip
  async removeCollaborator(
    tripId: string,
    collaboratorId: string
  ): Promise<void> {
    await api.delete<void>(
      `/trips/${tripId}/collaborators/${collaboratorId}`,
      { token: getAuthToken() }
    );
  },

  // Leave a trip (remove self as collaborator)
  async leaveTrip(tripId: string): Promise<void> {
    await api.post<void>(`/trips/${tripId}/leave`, undefined, { token: getAuthToken() });
  }
};
