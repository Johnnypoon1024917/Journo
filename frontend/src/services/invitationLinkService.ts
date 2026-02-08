/**
import { getAuthToken } from '../utils/auth';
 * Invitation Link Service
 * 
 * Frontend service for invitation link API calls.
 * Handles generating, managing, and accepting invitation links.
 * 
 * Validates: Requirements 1.2-1.8 (Enhanced Member Invitation)
 */

import api from './api';
import {
  InvitationLink,
  CreateInvitationLinkDto,
  InvitationLinkDetails,
  AcceptInvitationResponse,
  InvitationLinkError,
  InvitationLinkErrorCode
} from '../types/invitation';

/**
 * Get authentication token from store
 */
const getAuthToken = (): string | undefined => {
  const token = getAuthToken();
  return token || undefined;
};

/**
 * Invitation Link Service
 * 
 * Provides methods for managing invitation links.
 */
export const invitationLinkService = {
  /**
   * Generate a new invitation link for a trip
   * 
   * Creates a shareable invitation link with specified role and expiration.
   * Only trip owners can generate invitation links.
   * 
   * @param tripId - The trip ID to generate invitation link for
   * @param data - Invitation link configuration
   * @returns Promise with the created invitation link
   * @throws {InvitationLinkError} If user is not authorized or request fails
   * 
   * @example
   * ```typescript
   * // Generate a 7-day editor invitation link
   * const link = await invitationLinkService.generateInvitationLink('trip-123', {
   *   role: 'editor',
   *   expiresIn: 168 // 7 days in hours
   * });
   * 
   * // Generate a viewer link with max 5 uses
   * const limitedLink = await invitationLinkService.generateInvitationLink('trip-123', {
   *   role: 'viewer',
   *   expiresIn: 24, // 1 day
   *   maxUses: 5
   * });
   * ```
   */
  async generateInvitationLink(
    tripId: string,
    data: CreateInvitationLinkDto
  ): Promise<InvitationLink> {
    try {
      const response = await api.post<InvitationLink>(
        `/trips/${tripId}/invitation-links`,
        data,
        { token: getAuthToken() }
      );
      
      return response;
    } catch (error: any) {
      console.error('Failed to generate invitation link:', error);
      
      // Handle specific error cases
      if (error.status === 403) {
        throw new InvitationLinkError(
          'Only trip owners can generate invitation links',
          InvitationLinkErrorCode.UNAUTHORIZED,
          403
        );
      }
      
      if (error.status === 401) {
        throw new InvitationLinkError(
          'You must be logged in to generate invitation links',
          InvitationLinkErrorCode.UNAUTHORIZED,
          401
        );
      }
      
      throw error;
    }
  },

  /**
   * Get all invitation links for a trip
   * 
   * Retrieves all active invitation links for a trip.
   * Only trip owners can view invitation links.
   * 
   * @param tripId - The trip ID to fetch invitation links for
   * @returns Promise with array of invitation links
   * @throws {InvitationLinkError} If user is not authorized or request fails
   * 
   * @example
   * ```typescript
   * const links = await invitationLinkService.getInvitationLinks('trip-123');
   * console.log(`Found ${links.length} active invitation links`);
   * 
   * // Display links with usage info
   * links.forEach(link => {
   *   console.log(`${link.role} link: ${link.useCount}/${link.maxUses || '∞'} uses`);
   * });
   * ```
   */
  async getInvitationLinks(tripId: string): Promise<InvitationLink[]> {
    try {
      const response = await api.get<InvitationLink[]>(
        `/trips/${tripId}/invitation-links`,
        { token: getAuthToken() }
      );
      
      return response;
    } catch (error: any) {
      console.error('Failed to fetch invitation links:', error);
      
      if (error.status === 403) {
        throw new InvitationLinkError(
          'Only trip owners can view invitation links',
          InvitationLinkErrorCode.UNAUTHORIZED,
          403
        );
      }
      
      if (error.status === 401) {
        throw new InvitationLinkError(
          'You must be logged in to view invitation links',
          InvitationLinkErrorCode.UNAUTHORIZED,
          401
        );
      }
      
      throw error;
    }
  },

  /**
   * Revoke an invitation link
   * 
   * Deactivates an invitation link, preventing further use.
   * Only trip owners can revoke invitation links.
   * 
   * @param tripId - The trip ID
   * @param linkId - The invitation link ID to revoke
   * @returns Promise that resolves when link is revoked
   * @throws {InvitationLinkError} If user is not authorized or request fails
   * 
   * @example
   * ```typescript
   * await invitationLinkService.revokeInvitationLink('trip-123', 'link-456');
   * console.log('Invitation link revoked successfully');
   * ```
   */
  async revokeInvitationLink(tripId: string, linkId: string): Promise<void> {
    try {
      await api.delete<{ message: string }>(
        `/trips/${tripId}/invitation-links/${linkId}`,
        { token: getAuthToken() }
      );
    } catch (error: any) {
      console.error('Failed to revoke invitation link:', error);
      
      if (error.status === 403) {
        throw new InvitationLinkError(
          'Only trip owners can revoke invitation links',
          InvitationLinkErrorCode.UNAUTHORIZED,
          403
        );
      }
      
      if (error.status === 401) {
        throw new InvitationLinkError(
          'You must be logged in to revoke invitation links',
          InvitationLinkErrorCode.UNAUTHORIZED,
          401
        );
      }
      
      if (error.status === 404) {
        throw new InvitationLinkError(
          'Invitation link not found',
          InvitationLinkErrorCode.NOT_FOUND,
          404
        );
      }
      
      throw error;
    }
  },

  /**
   * Accept an invitation via link token
   * 
   * Accepts an invitation and adds the current user as a collaborator.
   * User must be authenticated to accept invitations.
   * 
   * @param token - The invitation link token
   * @returns Promise with trip and collaborator details
   * @throws {InvitationLinkError} If link is invalid, expired, or already used
   * 
   * @example
   * ```typescript
   * try {
   *   const result = await invitationLinkService.acceptInvitation('abc123token');
   *   console.log(`Joined trip: ${result.trip.title}`);
   *   console.log(`Your role: ${result.collaborator.role}`);
   * } catch (error) {
   *   if (error.code === InvitationLinkErrorCode.EXPIRED) {
   *     console.error('This invitation link has expired');
   *   }
   * }
   * ```
   */
  async acceptInvitation(token: string): Promise<AcceptInvitationResponse> {
    try {
      const response = await api.post<AcceptInvitationResponse>(
        `/invitation-links/${token}/accept`,
        undefined,
        { token: getAuthToken() }
      );
      
      return response;
    } catch (error: any) {
      console.error('Failed to accept invitation:', error);
      
      if (error.status === 401) {
        throw new InvitationLinkError(
          'You must be logged in to accept invitations',
          InvitationLinkErrorCode.UNAUTHORIZED,
          401
        );
      }
      
      if (error.status === 404) {
        throw new InvitationLinkError(
          'Invitation link not found',
          InvitationLinkErrorCode.NOT_FOUND,
          404
        );
      }
      
      if (error.status === 400) {
        // Parse specific error messages
        const errorMessage = error.data?.error || error.message || '';
        
        if (errorMessage.includes('expired')) {
          throw new InvitationLinkError(
            'This invitation link has expired',
            InvitationLinkErrorCode.EXPIRED,
            400
          );
        }
        
        if (errorMessage.includes('revoked')) {
          throw new InvitationLinkError(
            'This invitation link has been revoked',
            InvitationLinkErrorCode.REVOKED,
            400
          );
        }
        
        if (errorMessage.includes('maximum uses')) {
          throw new InvitationLinkError(
            'This invitation link has reached its maximum uses',
            InvitationLinkErrorCode.MAX_USES_REACHED,
            400
          );
        }
      }
      
      if (error.status === 409) {
        throw new InvitationLinkError(
          'You are already a member of this trip',
          InvitationLinkErrorCode.ALREADY_MEMBER,
          409
        );
      }
      
      throw error;
    }
  },

  /**
   * Get invitation link details (public, no auth required)
   * 
   * Retrieves public information about an invitation link for preview.
   * This endpoint does not require authentication.
   * 
   * @param token - The invitation link token
   * @returns Promise with invitation link details
   * @throws {InvitationLinkError} If link is not found or invalid
   * 
   * @example
   * ```typescript
   * // Preview invitation before accepting
   * const details = await invitationLinkService.getInvitationDetails('abc123token');
   * 
   * if (details.isValid) {
   *   console.log(`Trip: ${details.tripTitle}`);
   *   console.log(`Destination: ${details.tripDestination}`);
   *   console.log(`Role: ${details.role}`);
   *   console.log(`Invited by: ${details.inviterName}`);
   *   console.log(`Expires: ${new Date(details.expiresAt).toLocaleDateString()}`);
   * } else {
   *   console.log('This invitation link is no longer valid');
   * }
   * ```
   */
  async getInvitationDetails(token: string): Promise<InvitationLinkDetails> {
    try {
      // This endpoint is public, no auth token required
      const response = await api.get<InvitationLinkDetails>(
        `/invitation-links/${token}`
      );
      
      return response;
    } catch (error: any) {
      console.error('Failed to fetch invitation details:', error);
      
      if (error.status === 404) {
        throw new InvitationLinkError(
          'Invitation link not found',
          InvitationLinkErrorCode.NOT_FOUND,
          404
        );
      }
      
      throw error;
    }
  },

  /**
   * Copy invitation link URL to clipboard
   * 
   * Utility method to copy an invitation link URL to the clipboard.
   * Shows a success message on successful copy.
   * 
   * @param url - The invitation link URL to copy
   * @returns Promise that resolves when URL is copied
   * 
   * @example
   * ```typescript
   * const link = await invitationLinkService.generateInvitationLink('trip-123', {
   *   role: 'editor'
   * });
   * 
   * await invitationLinkService.copyToClipboard(link.url);
   * // Shows success message
   * ```
   */
  async copyToClipboard(url: string): Promise<void> {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        console.log('Invitation link copied to clipboard');
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        console.log('Invitation link copied to clipboard (fallback)');
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      throw new Error('Failed to copy invitation link to clipboard');
    }
  },

  /**
   * Check if invitation link is expired
   * 
   * Utility method to check if an invitation link has expired.
   * 
   * @param expiresAt - The expiration date string
   * @returns True if the link has expired
   * 
   * @example
   * ```typescript
   * const links = await invitationLinkService.getInvitationLinks('trip-123');
   * const activeLinks = links.filter(link => 
   *   !invitationLinkService.isExpired(link.expiresAt)
   * );
   * ```
   */
  isExpired(expiresAt: string): boolean {
    return new Date(expiresAt) < new Date();
  },

  /**
   * Check if invitation link has reached max uses
   * 
   * Utility method to check if an invitation link has reached its usage limit.
   * 
   * @param link - The invitation link to check
   * @returns True if the link has reached max uses
   * 
   * @example
   * ```typescript
   * const links = await invitationLinkService.getInvitationLinks('trip-123');
   * const availableLinks = links.filter(link => 
   *   !invitationLinkService.hasReachedMaxUses(link)
   * );
   * ```
   */
  hasReachedMaxUses(link: InvitationLink): boolean {
    if (link.maxUses === null) {
      return false; // Unlimited uses
    }
    return link.useCount >= link.maxUses;
  },

  /**
   * Format expiration time for display
   * 
   * Converts expiration date to human-readable format.
   * 
   * @param expiresAt - The expiration date string
   * @returns Formatted expiration string
   * 
   * @example
   * ```typescript
   * const link = await invitationLinkService.generateInvitationLink('trip-123', {
   *   role: 'editor'
   * });
   * 
   * console.log(invitationLinkService.formatExpiration(link.expiresAt));
   * // Output: "Expires in 7 days" or "Expired 2 hours ago"
   * ```
   */
  formatExpiration(expiresAt: string): string {
    const expirationDate = new Date(expiresAt);
    const now = new Date();
    const diffMs = expirationDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMs < 0) {
      // Already expired
      const absHours = Math.abs(diffHours);
      const absDays = Math.abs(diffDays);
      
      if (absDays > 0) {
        return `Expired ${absDays} ${absDays === 1 ? 'day' : 'days'} ago`;
      } else if (absHours > 0) {
        return `Expired ${absHours} ${absHours === 1 ? 'hour' : 'hours'} ago`;
      } else {
        return 'Expired recently';
      }
    } else {
      // Not yet expired
      if (diffDays > 0) {
        return `Expires in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
      } else if (diffHours > 0) {
        return `Expires in ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'}`;
      } else {
        return 'Expires soon';
      }
    }
  },

  /**
   * Format usage count for display
   * 
   * Converts usage count to human-readable format.
   * 
   * @param link - The invitation link
   * @returns Formatted usage string
   * 
   * @example
   * ```typescript
   * const link = await invitationLinkService.generateInvitationLink('trip-123', {
   *   role: 'editor',
   *   maxUses: 10
   * });
   * 
   * console.log(invitationLinkService.formatUsage(link));
   * // Output: "0/10 uses" or "5/10 uses" or "3/∞ uses"
   * ```
   */
  formatUsage(link: InvitationLink): string {
    if (link.maxUses === null) {
      return `${link.useCount}/∞ uses`;
    }
    return `${link.useCount}/${link.maxUses} uses`;
  }
};

export default invitationLinkService;
