/**
 * Invitation Link Service Tests
 * 
 * Unit tests for invitation link service functionality.
 * Tests all methods including error handling and edge cases.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { invitationLinkService } from '../invitationLinkService';
import api from '../api';
import { useEnhancedAuthStore } from '../../stores/enhancedAuthStore';
import {
  InvitationLink,
  InvitationLinkDetails,
  AcceptInvitationResponse,
  InvitationLinkErrorCode
} from '../../types/invitation';

// Mock dependencies
vi.mock('../api');
vi.mock('../../stores/authStore');

describe('invitationLinkService', () => {
  const mockToken = 'mock-auth-token';
  const mockTripId = 'trip-123';
  const mockLinkId = 'link-456';
  const mockToken2 = 'abc123token';

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock auth store
    (useEnhancedAuthStore.getState as any) = vi.fn(() => ({
      accessToken: mockToken
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateInvitationLink', () => {
    it('should generate an invitation link successfully', async () => {
      const mockLink: InvitationLink = {
        id: mockLinkId,
        tripId: mockTripId,
        token: mockToken2,
        url: `http://localhost:5173/invite/${mockToken2}`,
        role: 'editor',
        createdBy: 'user-123',
        createdByName: 'John Doe',
        expiresAt: '2024-12-31T23:59:59Z',
        maxUses: null,
        useCount: 0,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      (api.post as any) = vi.fn().mockResolvedValue(mockLink);

      const result = await invitationLinkService.generateInvitationLink(mockTripId, {
        role: 'editor',
        expiresIn: 168
      });

      expect(api.post).toHaveBeenCalledWith(
        `/trips/${mockTripId}/invitation-links`,
        { role: 'editor', expiresIn: 168 },
        { token: mockToken }
      );
      expect(result).toEqual(mockLink);
    });

    it('should generate a link with max uses', async () => {
      const mockLink: InvitationLink = {
        id: mockLinkId,
        tripId: mockTripId,
        token: mockToken2,
        url: `http://localhost:5173/invite/${mockToken2}`,
        role: 'viewer',
        createdBy: 'user-123',
        createdByName: 'John Doe',
        expiresAt: '2024-12-31T23:59:59Z',
        maxUses: 5,
        useCount: 0,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      (api.post as any) = vi.fn().mockResolvedValue(mockLink);

      const result = await invitationLinkService.generateInvitationLink(mockTripId, {
        role: 'viewer',
        expiresIn: 24,
        maxUses: 5
      });

      expect(result.maxUses).toBe(5);
      expect(result.role).toBe('viewer');
    });

    it('should throw error when user is not authorized', async () => {
      (api.post as any) = vi.fn().mockRejectedValue({
        status: 403,
        message: 'Forbidden'
      });

      await expect(
        invitationLinkService.generateInvitationLink(mockTripId, { role: 'editor' })
      ).rejects.toMatchObject({
        code: InvitationLinkErrorCode.UNAUTHORIZED,
        status: 403
      });
    });

    it('should throw error when user is not authenticated', async () => {
      (api.post as any) = vi.fn().mockRejectedValue({
        status: 401,
        message: 'Unauthorized'
      });

      await expect(
        invitationLinkService.generateInvitationLink(mockTripId, { role: 'editor' })
      ).rejects.toMatchObject({
        code: InvitationLinkErrorCode.UNAUTHORIZED,
        status: 401
      });
    });
  });

  describe('getInvitationLinks', () => {
    it('should fetch all invitation links for a trip', async () => {
      const mockLinks: InvitationLink[] = [
        {
          id: 'link-1',
          tripId: mockTripId,
          token: 'token-1',
          url: 'http://localhost:5173/invite/token-1',
          role: 'editor',
          createdBy: 'user-123',
          createdByName: 'John Doe',
          expiresAt: '2024-12-31T23:59:59Z',
          maxUses: null,
          useCount: 0,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'link-2',
          tripId: mockTripId,
          token: 'token-2',
          url: 'http://localhost:5173/invite/token-2',
          role: 'viewer',
          createdBy: 'user-123',
          createdByName: 'John Doe',
          expiresAt: '2024-12-31T23:59:59Z',
          maxUses: 10,
          useCount: 3,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];

      (api.get as any) = vi.fn().mockResolvedValue(mockLinks);

      const result = await invitationLinkService.getInvitationLinks(mockTripId);

      expect(api.get).toHaveBeenCalledWith(
        `/trips/${mockTripId}/invitation-links`,
        { token: mockToken }
      );
      expect(result).toEqual(mockLinks);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no links exist', async () => {
      (api.get as any) = vi.fn().mockResolvedValue([]);

      const result = await invitationLinkService.getInvitationLinks(mockTripId);

      expect(result).toEqual([]);
    });

    it('should throw error when user is not authorized', async () => {
      (api.get as any) = vi.fn().mockRejectedValue({
        status: 403,
        message: 'Forbidden'
      });

      await expect(
        invitationLinkService.getInvitationLinks(mockTripId)
      ).rejects.toMatchObject({
        code: InvitationLinkErrorCode.UNAUTHORIZED,
        status: 403
      });
    });
  });

  describe('revokeInvitationLink', () => {
    it('should revoke an invitation link successfully', async () => {
      (api.delete as any) = vi.fn().mockResolvedValue({ message: 'Link revoked' });

      await invitationLinkService.revokeInvitationLink(mockTripId, mockLinkId);

      expect(api.delete).toHaveBeenCalledWith(
        `/trips/${mockTripId}/invitation-links/${mockLinkId}`,
        { token: mockToken }
      );
    });

    it('should throw error when link not found', async () => {
      (api.delete as any) = vi.fn().mockRejectedValue({
        status: 404,
        message: 'Not found'
      });

      await expect(
        invitationLinkService.revokeInvitationLink(mockTripId, mockLinkId)
      ).rejects.toMatchObject({
        code: InvitationLinkErrorCode.NOT_FOUND,
        status: 404
      });
    });

    it('should throw error when user is not authorized', async () => {
      (api.delete as any) = vi.fn().mockRejectedValue({
        status: 403,
        message: 'Forbidden'
      });

      await expect(
        invitationLinkService.revokeInvitationLink(mockTripId, mockLinkId)
      ).rejects.toMatchObject({
        code: InvitationLinkErrorCode.UNAUTHORIZED,
        status: 403
      });
    });
  });

  describe('acceptInvitation', () => {
    it('should accept an invitation successfully', async () => {
      const mockResponse: AcceptInvitationResponse = {
        trip: {
          id: mockTripId,
          title: 'Tokyo Adventure',
          destination: 'Tokyo, Japan',
          startDate: '2024-06-01',
          endDate: '2024-06-10'
        },
        collaborator: {
          id: 'collab-123',
          tripId: mockTripId,
          userId: 'user-456',
          role: 'editor',
          joinedAt: '2024-01-01T00:00:00Z'
        }
      };

      (api.post as any) = vi.fn().mockResolvedValue(mockResponse);

      const result = await invitationLinkService.acceptInvitation(mockToken2);

      expect(api.post).toHaveBeenCalledWith(
        `/invitation-links/${mockToken2}/accept`,
        undefined,
        { token: mockToken }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when link is expired', async () => {
      (api.post as any) = vi.fn().mockRejectedValue({
        status: 400,
        data: { error: 'This invitation link has expired' }
      });

      await expect(
        invitationLinkService.acceptInvitation(mockToken2)
      ).rejects.toMatchObject({
        code: InvitationLinkErrorCode.EXPIRED,
        status: 400
      });
    });

    it('should throw error when link is revoked', async () => {
      (api.post as any) = vi.fn().mockRejectedValue({
        status: 400,
        data: { error: 'This invitation link has been revoked' }
      });

      await expect(
        invitationLinkService.acceptInvitation(mockToken2)
      ).rejects.toMatchObject({
        code: InvitationLinkErrorCode.REVOKED,
        status: 400
      });
    });

    it('should throw error when max uses reached', async () => {
      (api.post as any) = vi.fn().mockRejectedValue({
        status: 400,
        data: { error: 'This invitation link has reached its maximum uses' }
      });

      await expect(
        invitationLinkService.acceptInvitation(mockToken2)
      ).rejects.toMatchObject({
        code: InvitationLinkErrorCode.MAX_USES_REACHED,
        status: 400
      });
    });

    it('should throw error when user is already a member', async () => {
      (api.post as any) = vi.fn().mockRejectedValue({
        status: 409,
        message: 'Already a member'
      });

      await expect(
        invitationLinkService.acceptInvitation(mockToken2)
      ).rejects.toMatchObject({
        code: InvitationLinkErrorCode.ALREADY_MEMBER,
        status: 409
      });
    });

    it('should throw error when link not found', async () => {
      (api.post as any) = vi.fn().mockRejectedValue({
        status: 404,
        message: 'Not found'
      });

      await expect(
        invitationLinkService.acceptInvitation(mockToken2)
      ).rejects.toMatchObject({
        code: InvitationLinkErrorCode.NOT_FOUND,
        status: 404
      });
    });
  });

  describe('getInvitationDetails', () => {
    it('should fetch invitation details successfully', async () => {
      const mockDetails: InvitationLinkDetails = {
        tripTitle: 'Tokyo Adventure',
        tripDestination: 'Tokyo, Japan',
        role: 'editor',
        inviterName: 'John Doe',
        expiresAt: '2024-12-31T23:59:59Z',
        isValid: true
      };

      (api.get as any) = vi.fn().mockResolvedValue(mockDetails);

      const result = await invitationLinkService.getInvitationDetails(mockToken2);

      expect(api.get).toHaveBeenCalledWith(`/invitation-links/${mockToken2}`);
      expect(result).toEqual(mockDetails);
    });

    it('should return invalid status for expired link', async () => {
      const mockDetails: InvitationLinkDetails = {
        tripTitle: 'Tokyo Adventure',
        tripDestination: 'Tokyo, Japan',
        role: 'editor',
        inviterName: 'John Doe',
        expiresAt: '2023-01-01T00:00:00Z',
        isValid: false
      };

      (api.get as any) = vi.fn().mockResolvedValue(mockDetails);

      const result = await invitationLinkService.getInvitationDetails(mockToken2);

      expect(result.isValid).toBe(false);
    });

    it('should throw error when link not found', async () => {
      (api.get as any) = vi.fn().mockRejectedValue({
        status: 404,
        message: 'Not found'
      });

      await expect(
        invitationLinkService.getInvitationDetails(mockToken2)
      ).rejects.toMatchObject({
        code: InvitationLinkErrorCode.NOT_FOUND,
        status: 404
      });
    });
  });

  describe('utility methods', () => {
    describe('isExpired', () => {
      it('should return true for expired date', () => {
        const expiredDate = '2020-01-01T00:00:00Z';
        expect(invitationLinkService.isExpired(expiredDate)).toBe(true);
      });

      it('should return false for future date', () => {
        const futureDate = '2099-12-31T23:59:59Z';
        expect(invitationLinkService.isExpired(futureDate)).toBe(false);
      });
    });

    describe('hasReachedMaxUses', () => {
      it('should return false for unlimited uses', () => {
        const link: InvitationLink = {
          id: 'link-1',
          tripId: mockTripId,
          token: 'token-1',
          url: 'http://localhost:5173/invite/token-1',
          role: 'editor',
          createdBy: 'user-123',
          createdByName: 'John Doe',
          expiresAt: '2024-12-31T23:59:59Z',
          maxUses: null,
          useCount: 100,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        };

        expect(invitationLinkService.hasReachedMaxUses(link)).toBe(false);
      });

      it('should return true when max uses reached', () => {
        const link: InvitationLink = {
          id: 'link-1',
          tripId: mockTripId,
          token: 'token-1',
          url: 'http://localhost:5173/invite/token-1',
          role: 'editor',
          createdBy: 'user-123',
          createdByName: 'John Doe',
          expiresAt: '2024-12-31T23:59:59Z',
          maxUses: 5,
          useCount: 5,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        };

        expect(invitationLinkService.hasReachedMaxUses(link)).toBe(true);
      });

      it('should return false when under max uses', () => {
        const link: InvitationLink = {
          id: 'link-1',
          tripId: mockTripId,
          token: 'token-1',
          url: 'http://localhost:5173/invite/token-1',
          role: 'editor',
          createdBy: 'user-123',
          createdByName: 'John Doe',
          expiresAt: '2024-12-31T23:59:59Z',
          maxUses: 10,
          useCount: 3,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        };

        expect(invitationLinkService.hasReachedMaxUses(link)).toBe(false);
      });
    });

    describe('formatExpiration', () => {
      it('should format future expiration in days', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        
        const result = invitationLinkService.formatExpiration(futureDate.toISOString());
        
        expect(result).toContain('Expires in');
        expect(result).toContain('day');
      });

      it('should format past expiration', () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 3);
        
        const result = invitationLinkService.formatExpiration(pastDate.toISOString());
        
        expect(result).toContain('Expired');
        expect(result).toContain('ago');
      });

      it('should handle expiration in hours', () => {
        const futureDate = new Date();
        futureDate.setHours(futureDate.getHours() + 5);
        
        const result = invitationLinkService.formatExpiration(futureDate.toISOString());
        
        expect(result).toContain('Expires in');
        expect(result).toContain('hour');
      });
    });

    describe('formatUsage', () => {
      it('should format unlimited usage', () => {
        const link: InvitationLink = {
          id: 'link-1',
          tripId: mockTripId,
          token: 'token-1',
          url: 'http://localhost:5173/invite/token-1',
          role: 'editor',
          createdBy: 'user-123',
          createdByName: 'John Doe',
          expiresAt: '2024-12-31T23:59:59Z',
          maxUses: null,
          useCount: 5,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        };

        const result = invitationLinkService.formatUsage(link);
        
        expect(result).toBe('5/∞ uses');
      });

      it('should format limited usage', () => {
        const link: InvitationLink = {
          id: 'link-1',
          tripId: mockTripId,
          token: 'token-1',
          url: 'http://localhost:5173/invite/token-1',
          role: 'editor',
          createdBy: 'user-123',
          createdByName: 'John Doe',
          expiresAt: '2024-12-31T23:59:59Z',
          maxUses: 10,
          useCount: 3,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        };

        const result = invitationLinkService.formatUsage(link);
        
        expect(result).toBe('3/10 uses');
      });
    });

    describe('copyToClipboard', () => {
      it('should copy URL to clipboard using modern API', async () => {
        const mockWriteText = vi.fn().mockResolvedValue(undefined);
        Object.assign(navigator, {
          clipboard: {
            writeText: mockWriteText
          }
        });

        await invitationLinkService.copyToClipboard('http://example.com/invite/abc123');

        expect(mockWriteText).toHaveBeenCalledWith('http://example.com/invite/abc123');
      });

      it('should use fallback method when clipboard API not available', async () => {
        // Mock document methods
        const mockTextArea = {
          value: '',
          style: { position: '', left: '' },
          select: vi.fn()
        };
        const mockAppendChild = vi.fn();
        const mockRemoveChild = vi.fn();
        const mockExecCommand = vi.fn().mockReturnValue(true);

        document.createElement = vi.fn().mockReturnValue(mockTextArea);
        document.body.appendChild = mockAppendChild;
        document.body.removeChild = mockRemoveChild;
        document.execCommand = mockExecCommand;

        // Remove clipboard API
        Object.assign(navigator, {
          clipboard: undefined
        });

        await invitationLinkService.copyToClipboard('http://example.com/invite/abc123');

        expect(mockTextArea.value).toBe('http://example.com/invite/abc123');
        expect(mockTextArea.select).toHaveBeenCalled();
        expect(mockExecCommand).toHaveBeenCalledWith('copy');
      });
    });
  });
});
