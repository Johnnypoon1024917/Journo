// Collaboration types and interfaces

export type CollaboratorRole = 'owner' | 'editor' | 'viewer';

export interface TripCollaborator {
  id: string;
  trip_id: string;
  user_id: string;
  role: CollaboratorRole;
  invited_by: string | null;
  created_at: string;
}

export interface TripCollaboratorWithUser extends TripCollaborator {
  user: {
    id: string;
    name: string;
    email: string;
  };
  inviter?: {
    id: string;
    name: string;
  };
}

export interface CreateCollaboratorDto {
  trip_id: string;
  user_id: string;
  role: CollaboratorRole;
}

export interface UpdateCollaboratorDto {
  role: CollaboratorRole;
}

export interface TripVersion {
  id: string;
  trip_id: string;
  version_data: TripVersionData;
  created_at: string;
}

export interface TripVersionData {
  trip: any; // Full trip snapshot
  days: any[]; // Full days snapshot
  places: any[]; // Full places snapshot
  metadata: {
    change_description?: string;
    changed_by?: string;
  };
}

export interface CreateTripVersionDto {
  trip_id: string;
  version_data: TripVersionData;
}

// Permission helpers
export interface TripPermissions {
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_manage_collaborators: boolean;
  can_share: boolean;
  role?: CollaboratorRole;
}
