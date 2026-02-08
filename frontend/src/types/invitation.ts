/**
 * Invitation Link Types
 * 
 * Type definitions for invitation link functionality.
 * Supports shareable invitation links with expiration and usage limits.
 * 
 * Validates: Requirements 1.2-1.8 (Enhanced Member Invitation)
 */

/**
 * Invitation Link
 * 
 * Represents a shareable invitation link for a trip.
 */
export interface InvitationLink {
  id: string;
  tripId: string;
  token: string;
  url: string;
  role: 'editor' | 'viewer';
  createdBy: string;
  createdByName: string;
  expiresAt: string;
  maxUses: number | null;
  useCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create Invitation Link DTO
 * 
 * Data transfer object for creating a new invitation link.
 */
export interface CreateInvitationLinkDto {
  role: 'editor' | 'viewer';
  expiresIn?: number;  // hours, default 168 (7 days)
  maxUses?: number | null;  // null = unlimited
}

/**
 * Invitation Link Details (Public)
 * 
 * Public information about an invitation link.
 * Returned without authentication for preview purposes.
 */
export interface InvitationLinkDetails {
  tripTitle: string;
  tripDestination: string;
  role: string;
  inviterName: string;
  expiresAt: string;
  isValid: boolean;
}

/**
 * Accept Invitation Response
 * 
 * Response returned when accepting an invitation link.
 */
export interface AcceptInvitationResponse {
  trip: {
    id: string;
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
  };
  collaborator: {
    id: string;
    tripId: string;
    userId: string;
    role: string;
    joinedAt: string;
  };
}

/**
 * Invitation Link Error Codes
 * 
 * Specific error codes for invitation link operations.
 */
export enum InvitationLinkErrorCode {
  NOT_FOUND = 'INVITATION_NOT_FOUND',
  EXPIRED = 'INVITATION_EXPIRED',
  REVOKED = 'INVITATION_REVOKED',
  MAX_USES_REACHED = 'INVITATION_MAX_USES_REACHED',
  ALREADY_MEMBER = 'ALREADY_MEMBER',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
}

/**
 * Invitation Link Error
 * 
 * Custom error class for invitation link operations.
 */
export class InvitationLinkError extends Error {
  constructor(
    message: string,
    public code: InvitationLinkErrorCode,
    public status: number
  ) {
    super(message);
    this.name = 'InvitationLinkError';
  }
}
