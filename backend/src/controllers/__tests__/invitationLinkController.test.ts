import { Request, Response } from 'express';
import {
  generateInvitationLink,
  getInvitationLinks,
  revokeInvitationLink,
  acceptInvitation,
  getInvitationLinkDetails,
} from '../invitationLinkController';

// Mock dependencies
jest.mock('../../config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

jest.mock('../../services/invitationLinkService', () => ({
  invitationLinkService: {
    generateLink: jest.fn(),
    getActiveLinks: jest.fn(),
    revokeLink: jest.fn(),
    acceptInvitation: jest.fn(),
    getLinkByToken: jest.fn(),
    validateLink: jest.fn()
  }
}));

// Import after mocking
import { pool } from '../../config/database';
import { invitationLinkService } from '../../services/invitationLinkService';

describe('InvitationLinkController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockRequest = {
      params: {},
      body: {},
      user: {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'user'
      }
    };
    
    mockResponse = {
      json: mockJson,
      status: mockStatus
    };

    jest.clearAllMocks();
  });

  describe('generateInvitationLink', () => {
    it('should generate invitation link successfully', async () => {
      mockRequest.params = { tripId: 'trip-123' };
      mockRequest.body = { role: 'editor', expiresIn: 168, maxUses: 10 };

      const mockOwnerCheck = {
        rows: [{ owner_id: 'user-123' }]
      };

      const mockLink = {
        id: 'link-123',
        tripId: 'trip-123',
        token: 'abc123token',
        role: 'editor',
        createdBy: 'user-123',
        expiresAt: new Date('2024-12-31'),
        maxUses: 10,
        useCount: 0,
        isActive: true,
        createdAt: new Date('2024-12-24')
      };

      (pool.query as jest.Mock).mockResolvedValue(mockOwnerCheck);
      (invitationLinkService.generateLink as jest.Mock).mockResolvedValue(mockLink);

      await generateInvitationLink(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
        id: 'link-123',
        token: 'abc123token',
        url: expect.stringContaining('/invite/abc123token'),
        role: 'editor',
        maxUses: 10,
        useCount: 0
      }));
    });

    it('should return 400 if tripId is missing', async () => {
      mockRequest.params = {};
      mockRequest.body = { role: 'editor' };

      await generateInvitationLink(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Trip ID is required' });
    });

    it('should return 400 if role is invalid', async () => {
      mockRequest.params = { tripId: 'trip-123' };
      mockRequest.body = { role: 'invalid-role' };

      await generateInvitationLink(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Valid role is required (editor or viewer)' });
    });

    it('should return 400 if expiresIn is out of range', async () => {
      mockRequest.params = { tripId: 'trip-123' };
      mockRequest.body = { role: 'editor', expiresIn: 10000 };

      await generateInvitationLink(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ 
        error: 'expiresIn must be between 1 and 8760 hours (1 year)' 
      });
    });

    it('should return 400 if maxUses is invalid', async () => {
      mockRequest.params = { tripId: 'trip-123' };
      mockRequest.body = { role: 'editor', maxUses: -5 };

      await generateInvitationLink(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ 
        error: 'maxUses must be a positive number or null' 
      });
    });

    it('should return 404 if trip not found', async () => {
      mockRequest.params = { tripId: 'trip-123' };
      mockRequest.body = { role: 'editor' };

      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      await generateInvitationLink(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Trip not found' });
    });

    it('should return 403 if user is not the trip owner', async () => {
      mockRequest.params = { tripId: 'trip-123' };
      mockRequest.body = { role: 'editor' };

      const mockOwnerCheck = {
        rows: [{ owner_id: 'different-user' }]
      };

      (pool.query as jest.Mock).mockResolvedValue(mockOwnerCheck);

      await generateInvitationLink(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({ 
        error: 'Only trip owners can generate invitation links' 
      });
    });

    it('should return 500 on service error', async () => {
      mockRequest.params = { tripId: 'trip-123' };
      mockRequest.body = { role: 'editor' };

      const mockOwnerCheck = {
        rows: [{ owner_id: 'user-123' }]
      };

      (pool.query as jest.Mock).mockResolvedValue(mockOwnerCheck);
      (invitationLinkService.generateLink as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await generateInvitationLink(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to generate invitation link' });
    });
  });

  describe('getInvitationLinks', () => {
    it('should get invitation links successfully', async () => {
      mockRequest.params = { tripId: 'trip-123' };

      const mockOwnerCheck = {
        rows: [{ owner_id: 'user-123' }]
      };

      const mockLinks = [
        {
          id: 'link-1',
          tripId: 'trip-123',
          token: 'token1',
          role: 'editor',
          createdBy: 'user-123',
          createdByName: 'Test User',
          expiresAt: new Date('2024-12-31'),
          maxUses: 10,
          useCount: 2,
          isActive: true,
          createdAt: new Date('2024-12-24'),
          updatedAt: new Date('2024-12-24')
        }
      ];

      (pool.query as jest.Mock).mockResolvedValue(mockOwnerCheck);
      (invitationLinkService.getActiveLinks as jest.Mock).mockResolvedValue(mockLinks);

      await getInvitationLinks(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'link-1',
            token: 'token1',
            url: expect.stringContaining('/invite/token1'),
            role: 'editor'
          })
        ])
      );
    });

    it('should return 400 if tripId is missing', async () => {
      mockRequest.params = {};

      await getInvitationLinks(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Trip ID is required' });
    });

    it('should return 404 if trip not found', async () => {
      mockRequest.params = { tripId: 'trip-123' };

      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      await getInvitationLinks(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Trip not found' });
    });

    it('should return 403 if user is not the trip owner', async () => {
      mockRequest.params = { tripId: 'trip-123' };

      const mockOwnerCheck = {
        rows: [{ owner_id: 'different-user' }]
      };

      (pool.query as jest.Mock).mockResolvedValue(mockOwnerCheck);

      await getInvitationLinks(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({ 
        error: 'Only trip owners can view invitation links' 
      });
    });
  });

  describe('revokeInvitationLink', () => {
    it('should revoke invitation link successfully', async () => {
      mockRequest.params = { tripId: 'trip-123', linkId: 'link-123' };

      const mockOwnerCheck = {
        rows: [{ owner_id: 'user-123' }]
      };

      (pool.query as jest.Mock).mockResolvedValue(mockOwnerCheck);
      (invitationLinkService.revokeLink as jest.Mock).mockResolvedValue(undefined);

      await revokeInvitationLink(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({ message: 'Link revoked' });
    });

    it('should return 400 if tripId is missing', async () => {
      mockRequest.params = { linkId: 'link-123' };

      await revokeInvitationLink(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Trip ID is required' });
    });

    it('should return 400 if linkId is missing', async () => {
      mockRequest.params = { tripId: 'trip-123' };

      await revokeInvitationLink(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Link ID is required' });
    });

    it('should return 404 if trip not found', async () => {
      mockRequest.params = { tripId: 'trip-123', linkId: 'link-123' };

      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      await revokeInvitationLink(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Trip not found' });
    });

    it('should return 403 if user is not the trip owner', async () => {
      mockRequest.params = { tripId: 'trip-123', linkId: 'link-123' };

      const mockOwnerCheck = {
        rows: [{ owner_id: 'different-user' }]
      };

      (pool.query as jest.Mock).mockResolvedValue(mockOwnerCheck);

      await revokeInvitationLink(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({ 
        error: 'Only trip owners can revoke invitation links' 
      });
    });

    it('should return 404 if link not found', async () => {
      mockRequest.params = { tripId: 'trip-123', linkId: 'link-123' };

      const mockOwnerCheck = {
        rows: [{ owner_id: 'user-123' }]
      };

      (pool.query as jest.Mock).mockResolvedValue(mockOwnerCheck);
      (invitationLinkService.revokeLink as jest.Mock).mockRejectedValue(
        new Error('Invitation link not found')
      );

      await revokeInvitationLink(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Invitation link not found' });
    });
  });

  describe('acceptInvitation', () => {
    it('should accept invitation successfully', async () => {
      mockRequest.params = { token: 'abc123token' };

      const mockAcceptResult = {
        collaboratorId: 'collab-123',
        tripId: 'trip-123',
        userId: 'user-123',
        role: 'editor'
      };

      const mockTripResult = {
        rows: [{
          id: 'trip-123',
          title: 'Test Trip',
          destination: 'Tokyo',
          start_date: '2024-12-25',
          end_date: '2024-12-31',
          owner_id: 'owner-123',
          owner_name: 'Owner User',
          created_at: new Date(),
          updated_at: new Date()
        }]
      };

      const mockCollaboratorResult = {
        rows: [{
          id: 'collab-123',
          trip_id: 'trip-123',
          user_id: 'user-123',
          role: 'editor',
          invited_by: 'owner-123',
          created_at: new Date(),
          updated_at: new Date(),
          user_name: 'Test User',
          user_email: 'test@example.com',
          inviter_name: 'Owner User'
        }]
      };

      (invitationLinkService.acceptInvitation as jest.Mock).mockResolvedValue(mockAcceptResult);
      (pool.query as jest.Mock)
        .mockResolvedValueOnce(mockTripResult)
        .mockResolvedValueOnce(mockCollaboratorResult);

      await acceptInvitation(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          trip: expect.objectContaining({
            id: 'trip-123',
            title: 'Test Trip'
          }),
          collaborator: expect.objectContaining({
            id: 'collab-123',
            role: 'editor'
          })
        })
      );
    });

    it('should return 400 if token is missing', async () => {
      mockRequest.params = {};

      await acceptInvitation(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Invitation token is required' });
    });

    it('should return 400 if link is invalid', async () => {
      mockRequest.params = { token: 'invalid-token' };

      (invitationLinkService.acceptInvitation as jest.Mock).mockRejectedValue(
        new Error('Invalid invitation link')
      );

      await acceptInvitation(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Invalid invitation link' });
    });

    it('should return 400 if link has expired', async () => {
      mockRequest.params = { token: 'expired-token' };

      (invitationLinkService.acceptInvitation as jest.Mock).mockRejectedValue(
        new Error('Link has expired')
      );

      await acceptInvitation(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Invitation link has expired' });
    });

    it('should return 400 if link has been revoked', async () => {
      mockRequest.params = { token: 'revoked-token' };

      (invitationLinkService.acceptInvitation as jest.Mock).mockRejectedValue(
        new Error('Link has been revoked')
      );

      await acceptInvitation(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Invitation link has been revoked' });
    });

    it('should return 400 if link reached maximum uses', async () => {
      mockRequest.params = { token: 'maxed-token' };

      (invitationLinkService.acceptInvitation as jest.Mock).mockRejectedValue(
        new Error('Link has reached maximum uses')
      );

      await acceptInvitation(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ 
        error: 'Invitation link has reached maximum uses' 
      });
    });

    it('should return 400 if user is already a collaborator', async () => {
      mockRequest.params = { token: 'abc123token' };

      (invitationLinkService.acceptInvitation as jest.Mock).mockRejectedValue(
        new Error('User is already a collaborator on this trip')
      );

      await acceptInvitation(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ 
        error: 'You are already a collaborator on this trip' 
      });
    });
  });

  describe('getInvitationLinkDetails', () => {
    it('should get invitation link details successfully', async () => {
      mockRequest.params = { token: 'abc123token' };

      const mockLink = {
        id: 'link-123',
        tripId: 'trip-123',
        token: 'abc123token',
        role: 'editor',
        createdBy: 'user-123',
        createdByName: 'Test User',
        expiresAt: new Date('2024-12-31'),
        maxUses: 10,
        useCount: 2,
        isActive: true,
        createdAt: new Date('2024-12-24'),
        updatedAt: new Date('2024-12-24')
      };

      const mockValidation = {
        isValid: true,
        link: mockLink
      };

      const mockTripResult = {
        rows: [{
          title: 'Test Trip',
          destination: 'Tokyo',
          inviter_name: 'Test User'
        }]
      };

      (invitationLinkService.getLinkByToken as jest.Mock).mockResolvedValue(mockLink);
      (invitationLinkService.validateLink as jest.Mock).mockResolvedValue(mockValidation);
      (pool.query as jest.Mock).mockResolvedValue(mockTripResult);

      await getInvitationLinkDetails(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          tripTitle: 'Test Trip',
          tripDestination: 'Tokyo',
          role: 'editor',
          inviterName: 'Test User',
          isValid: true
        })
      );
    });

    it('should return 400 if token is missing', async () => {
      mockRequest.params = {};

      await getInvitationLinkDetails(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Invitation token is required' });
    });

    it('should return 404 if link not found', async () => {
      mockRequest.params = { token: 'nonexistent-token' };

      (invitationLinkService.getLinkByToken as jest.Mock).mockResolvedValue(null);

      await getInvitationLinkDetails(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Invitation link not found' });
    });

    it('should return invalid status for expired link', async () => {
      mockRequest.params = { token: 'expired-token' };

      const mockLink = {
        id: 'link-123',
        tripId: 'trip-123',
        token: 'expired-token',
        role: 'editor',
        createdBy: 'user-123',
        createdByName: 'Test User',
        expiresAt: new Date('2023-12-31'),
        maxUses: 10,
        useCount: 2,
        isActive: true,
        createdAt: new Date('2023-12-24'),
        updatedAt: new Date('2023-12-24')
      };

      const mockValidation = {
        isValid: false,
        link: mockLink,
        reason: 'Link has expired'
      };

      const mockTripResult = {
        rows: [{
          title: 'Test Trip',
          destination: 'Tokyo',
          inviter_name: 'Test User'
        }]
      };

      (invitationLinkService.getLinkByToken as jest.Mock).mockResolvedValue(mockLink);
      (invitationLinkService.validateLink as jest.Mock).mockResolvedValue(mockValidation);
      (pool.query as jest.Mock).mockResolvedValue(mockTripResult);

      await getInvitationLinkDetails(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          isValid: false,
          reason: 'Link has expired'
        })
      );
    });
  });
});
