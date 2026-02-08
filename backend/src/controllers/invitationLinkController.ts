import { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { invitationLinkService } from '../services/invitationLinkService.js';

/**
 * Generate a new invitation link for a trip
 * POST /api/trips/:tripId/invitation-links
 * 
 * Permission: Only trip owners can generate invitation links
 */
export const generateInvitationLink = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const userId = req.user?.userId;
    const { role, expiresIn, maxUses } = req.body;

    // Validate tripId
    if (!tripId) {
      return res.status(400).json({ error: 'Trip ID is required' });
    }

    // Validate role
    if (!role || !['editor', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Valid role is required (editor or viewer)' });
    }

    // Validate expiresIn if provided
    if (expiresIn !== undefined) {
      const expiresInNum = parseInt(expiresIn);
      if (isNaN(expiresInNum) || expiresInNum < 1 || expiresInNum > 8760) {
        return res.status(400).json({ error: 'expiresIn must be between 1 and 8760 hours (1 year)' });
      }
    }

    // Validate maxUses if provided
    if (maxUses !== undefined && maxUses !== null) {
      const maxUsesNum = parseInt(maxUses);
      if (isNaN(maxUsesNum) || maxUsesNum < 1) {
        return res.status(400).json({ error: 'maxUses must be a positive number or null' });
      }
    }

    // Check if user is the trip owner
    const ownerCheck = await pool.query(
      'SELECT owner_id FROM trips WHERE id = $1',
      [tripId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (ownerCheck.rows[0].owner_id !== userId) {
      return res.status(403).json({ error: 'Only trip owners can generate invitation links' });
    }

    // Generate invitation link
    const link = await invitationLinkService.generateLink({
      tripId,
      role,
      createdBy: userId!,
      expiresIn: expiresIn ? parseInt(expiresIn) : undefined,
      maxUses: maxUses !== undefined ? (maxUses === null ? null : parseInt(maxUses)) : undefined
    });

    // Construct full URL
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const fullUrl = `${baseUrl}/invite/${link.token}`;

    res.status(201).json({
      id: link.id,
      token: link.token,
      url: fullUrl,
      role: link.role,
      expiresAt: link.expiresAt,
      maxUses: link.maxUses,
      useCount: link.useCount,
      isActive: link.isActive,
      createdAt: link.createdAt
    });
  } catch (error) {
    console.error('Error generating invitation link:', error);
    res.status(500).json({ error: 'Failed to generate invitation link' });
  }
};

/**
 * Get all active invitation links for a trip
 * GET /api/trips/:tripId/invitation-links
 * 
 * Permission: Only trip owners can view invitation links
 */
export const getInvitationLinks = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const userId = req.user?.userId;

    // Validate tripId
    if (!tripId) {
      return res.status(400).json({ error: 'Trip ID is required' });
    }

    // Check if user is the trip owner
    const ownerCheck = await pool.query(
      'SELECT owner_id FROM trips WHERE id = $1',
      [tripId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (ownerCheck.rows[0].owner_id !== userId) {
      return res.status(403).json({ error: 'Only trip owners can view invitation links' });
    }

    // Get active links
    const links = await invitationLinkService.getActiveLinks(tripId);

    // Construct full URLs for each link
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const linksWithUrls = links.map(link => ({
      id: link.id,
      token: link.token,
      url: `${baseUrl}/invite/${link.token}`,
      role: link.role,
      createdBy: link.createdBy,
      createdByName: link.createdByName,
      expiresAt: link.expiresAt,
      maxUses: link.maxUses,
      useCount: link.useCount,
      isActive: link.isActive,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt
    }));

    res.json(linksWithUrls);
  } catch (error) {
    console.error('Error fetching invitation links:', error);
    res.status(500).json({ error: 'Failed to fetch invitation links' });
  }
};

/**
 * Revoke an invitation link
 * DELETE /api/trips/:tripId/invitation-links/:linkId
 * 
 * Permission: Only trip owners can revoke invitation links
 */
export const revokeInvitationLink = async (req: Request, res: Response) => {
  try {
    const { tripId, linkId } = req.params;
    const userId = req.user?.userId;

    // Validate parameters
    if (!tripId) {
      return res.status(400).json({ error: 'Trip ID is required' });
    }

    if (!linkId) {
      return res.status(400).json({ error: 'Link ID is required' });
    }

    // Check if user is the trip owner
    const ownerCheck = await pool.query(
      'SELECT owner_id FROM trips WHERE id = $1',
      [tripId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (ownerCheck.rows[0].owner_id !== userId) {
      return res.status(403).json({ error: 'Only trip owners can revoke invitation links' });
    }

    // Revoke the link
    await invitationLinkService.revokeLink(linkId, tripId);

    res.json({ message: 'Link revoked' });
  } catch (error) {
    console.error('Error revoking invitation link:', error);
    
    // Check if error is "not found"
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: 'Invitation link not found' });
    }
    
    res.status(500).json({ error: 'Failed to revoke invitation link' });
  }
};

/**
 * Accept an invitation via link
 * POST /api/invitation-links/:token/accept
 * 
 * Permission: Authenticated users only
 */
export const acceptInvitation = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const userId = req.user?.userId;

    // Validate token
    if (!token) {
      return res.status(400).json({ error: 'Invitation token is required' });
    }

    // Accept the invitation
    try {
      const result = await invitationLinkService.acceptInvitation(token, userId!);

      // Fetch trip details
      const tripResult = await pool.query(
        `SELECT t.*, u.name as owner_name, u.email as owner_email
         FROM trips t
         LEFT JOIN users u ON t.owner_id = u.id
         WHERE t.id = $1`,
        [result.tripId]
      );

      if (tripResult.rows.length === 0) {
        return res.status(404).json({ error: 'Trip not found' });
      }

      const trip = tripResult.rows[0];

      // Fetch collaborator details with user info
      const collaboratorResult = await pool.query(
        `SELECT 
          tc.*,
          u.name as user_name,
          u.email as user_email,
          u.profile_picture as user_profile_picture,
          inviter.name as inviter_name
         FROM trip_collaborators tc
         LEFT JOIN users u ON tc.user_id = u.id
         LEFT JOIN users inviter ON tc.invited_by = inviter.id
         WHERE tc.id = $1`,
        [result.collaboratorId]
      );

      const collaborator = collaboratorResult.rows[0];

      res.json({
        trip: {
          id: trip.id,
          title: trip.title,
          destination: trip.destination,
          startDate: trip.start_date,
          endDate: trip.end_date,
          description: trip.description,
          coverImage: trip.cover_image,
          isPublic: trip.is_public,
          ownerId: trip.owner_id,
          ownerName: trip.owner_name,
          createdAt: trip.created_at,
          updatedAt: trip.updated_at
        },
        collaborator: {
          id: collaborator.id,
          tripId: collaborator.trip_id,
          userId: collaborator.user_id,
          role: collaborator.role,
          invitedBy: collaborator.invited_by,
          createdAt: collaborator.created_at,
          updatedAt: collaborator.updated_at,
          user: {
            id: collaborator.user_id,
            name: collaborator.user_name,
            email: collaborator.user_email,
            profilePicture: collaborator.user_profile_picture
          },
          inviter: collaborator.invited_by ? {
            id: collaborator.invited_by,
            name: collaborator.inviter_name
          } : undefined
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        // Handle specific validation errors
        if (error.message.includes('Invalid invitation link')) {
          return res.status(400).json({ error: 'Invalid invitation link' });
        }
        if (error.message.includes('expired')) {
          return res.status(400).json({ error: 'Invitation link has expired' });
        }
        if (error.message.includes('revoked')) {
          return res.status(400).json({ error: 'Invitation link has been revoked' });
        }
        if (error.message.includes('maximum uses')) {
          return res.status(400).json({ error: 'Invitation link has reached maximum uses' });
        }
        if (error.message.includes('already a collaborator')) {
          return res.status(400).json({ error: 'You are already a collaborator on this trip' });
        }
      }
      throw error;
    }
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
};

/**
 * Get invitation link details (public endpoint, no authentication required)
 * GET /api/invitation-links/:token
 * 
 * Permission: Public (no authentication required)
 */
export const getInvitationLinkDetails = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    // Validate token
    if (!token) {
      return res.status(400).json({ error: 'Invitation token is required' });
    }

    // Get link details
    const link = await invitationLinkService.getLinkByToken(token);

    if (!link) {
      return res.status(404).json({ error: 'Invitation link not found' });
    }

    // Validate the link
    const validation = await invitationLinkService.validateLink(token);

    // Get trip details
    const tripResult = await pool.query(
      `SELECT t.title, t.destination, u.name as inviter_name
       FROM trips t
       LEFT JOIN users u ON t.owner_id = u.id
       WHERE t.id = $1`,
      [link.tripId]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const trip = tripResult.rows[0];

    res.json({
      tripTitle: trip.title,
      tripDestination: trip.destination,
      role: link.role,
      inviterName: link.createdByName || trip.inviter_name,
      expiresAt: link.expiresAt,
      isValid: validation.isValid,
      reason: validation.reason
    });
  } catch (error) {
    console.error('Error fetching invitation link details:', error);
    res.status(500).json({ error: 'Failed to fetch invitation link details' });
  }
};
