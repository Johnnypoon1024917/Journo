import pool from '../config/database.js';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Invitation link interface
 */
export interface InvitationLink {
  id: string;
  tripId: string;
  token: string;
  role: 'editor' | 'viewer';
  createdBy: string;
  createdByName?: string;
  expiresAt: Date;
  maxUses: number | null;
  useCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Options for generating an invitation link
 */
export interface GenerateLinkOptions {
  tripId: string;
  role: 'editor' | 'viewer';
  createdBy: string;
  expiresIn?: number; // hours, default 168 (7 days)
  maxUses?: number | null; // null = unlimited
}

/**
 * Validation result for an invitation link
 */
export interface ValidationResult {
  isValid: boolean;
  link?: InvitationLink;
  reason?: string;
}

/**
 * Result of accepting an invitation
 */
export interface AcceptInvitationResult {
  collaboratorId: string;
  tripId: string;
  userId: string;
  role: 'editor' | 'viewer';
}

/**
 * Service for managing invitation links
 */
export class InvitationLinkService {
  /**
   * Generate a new invitation link with cryptographically secure token
   */
  async generateLink(options: GenerateLinkOptions): Promise<InvitationLink> {
    try {
      // Generate cryptographically secure token using crypto.randomBytes
      const token = crypto.randomBytes(32).toString('hex');
      
      // Calculate expiration date
      const expiresIn = options.expiresIn || 168; // Default 7 days
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresIn);
      
      const linkId = uuidv4();
      const maxUses = options.maxUses !== undefined ? options.maxUses : null;
      
      // Insert invitation link into database
      const result = await pool.query(
        `INSERT INTO invitation_links 
         (id, trip_id, token, role, created_by, expires_at, max_uses, use_count, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          linkId,
          options.tripId,
          token,
          options.role,
          options.createdBy,
          expiresAt,
          maxUses,
          0,
          true
        ]
      );
      
      const row = result.rows[0];
      
      // Get creator name
      const userResult = await pool.query(
        'SELECT name FROM users WHERE id = $1',
        [options.createdBy]
      );
      
      const link: InvitationLink = {
        id: row.id,
        tripId: row.trip_id,
        token: row.token,
        role: row.role,
        createdBy: row.created_by,
        createdByName: userResult.rows[0]?.name,
        expiresAt: row.expires_at,
        maxUses: row.max_uses,
        useCount: row.use_count,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
      
      return link;
    } catch (error) {
      console.error('Failed to generate invitation link:', error);
      throw error;
    }
  }
  
  /**
   * Validate an invitation link
   */
  async validateLink(token: string): Promise<ValidationResult> {
    try {
      // Get link from database
      const result = await pool.query(
        `SELECT il.*, u.name as created_by_name
         FROM invitation_links il
         LEFT JOIN users u ON il.created_by = u.id
         WHERE il.token = $1`,
        [token]
      );
      
      if (result.rows.length === 0) {
        return {
          isValid: false,
          reason: 'Link not found'
        };
      }
      
      const row = result.rows[0];
      const link: InvitationLink = {
        id: row.id,
        tripId: row.trip_id,
        token: row.token,
        role: row.role,
        createdBy: row.created_by,
        createdByName: row.created_by_name,
        expiresAt: row.expires_at,
        maxUses: row.max_uses,
        useCount: row.use_count,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
      
      // Check if link is active
      if (!link.isActive) {
        return {
          isValid: false,
          link,
          reason: 'Link has been revoked'
        };
      }
      
      // Check if link has expired
      if (new Date(link.expiresAt) < new Date()) {
        return {
          isValid: false,
          link,
          reason: 'Link has expired'
        };
      }
      
      // Check if link has reached max uses
      if (link.maxUses !== null && link.useCount >= link.maxUses) {
        return {
          isValid: false,
          link,
          reason: 'Link has reached maximum uses'
        };
      }
      
      return {
        isValid: true,
        link
      };
    } catch (error) {
      console.error('Failed to validate invitation link:', error);
      throw error;
    }
  }
  
  /**
   * Accept an invitation and add user as collaborator
   */
  async acceptInvitation(token: string, userId: string): Promise<AcceptInvitationResult> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Validate the link
      const validation = await this.validateLink(token);
      
      if (!validation.isValid || !validation.link) {
        throw new Error(validation.reason || 'Invalid invitation link');
      }
      
      const link = validation.link;
      
      // Check if user is already a collaborator
      const existingCheck = await client.query(
        'SELECT id FROM trip_collaborators WHERE trip_id = $1 AND user_id = $2',
        [link.tripId, userId]
      );
      
      if (existingCheck.rows.length > 0) {
        throw new Error('User is already a collaborator on this trip');
      }
      
      // Add user as collaborator
      const collaboratorId = uuidv4();
      await client.query(
        `INSERT INTO trip_collaborators (id, trip_id, user_id, role, invited_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [collaboratorId, link.tripId, userId, link.role, link.createdBy]
      );
      
      // Increment use count
      await client.query(
        'UPDATE invitation_links SET use_count = use_count + 1, updated_at = NOW() WHERE id = $1',
        [link.id]
      );
      
      await client.query('COMMIT');
      
      return {
        collaboratorId,
        tripId: link.tripId,
        userId,
        role: link.role
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Failed to accept invitation:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Revoke an invitation link
   */
  async revokeLink(linkId: string, tripId: string): Promise<void> {
    try {
      const result = await pool.query(
        `UPDATE invitation_links 
         SET is_active = false, updated_at = NOW() 
         WHERE id = $1 AND trip_id = $2
         RETURNING id`,
        [linkId, tripId]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Invitation link not found');
      }
    } catch (error) {
      console.error('Failed to revoke invitation link:', error);
      throw error;
    }
  }
  
  /**
   * Get all active invitation links for a trip
   */
  async getActiveLinks(tripId: string): Promise<InvitationLink[]> {
    try {
      const result = await pool.query(
        `SELECT il.*, u.name as created_by_name
         FROM invitation_links il
         LEFT JOIN users u ON il.created_by = u.id
         WHERE il.trip_id = $1 AND il.is_active = true
         ORDER BY il.created_at DESC`,
        [tripId]
      );
      
      const links: InvitationLink[] = result.rows.map(row => ({
        id: row.id,
        tripId: row.trip_id,
        token: row.token,
        role: row.role,
        createdBy: row.created_by,
        createdByName: row.created_by_name,
        expiresAt: row.expires_at,
        maxUses: row.max_uses,
        useCount: row.use_count,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      
      return links;
    } catch (error) {
      console.error('Failed to get active invitation links:', error);
      throw error;
    }
  }
  
  /**
   * Get invitation link by token (for public access)
   */
  async getLinkByToken(token: string): Promise<InvitationLink | null> {
    try {
      const result = await pool.query(
        `SELECT il.*, u.name as created_by_name
         FROM invitation_links il
         LEFT JOIN users u ON il.created_by = u.id
         WHERE il.token = $1`,
        [token]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        tripId: row.trip_id,
        token: row.token,
        role: row.role,
        createdBy: row.created_by,
        createdByName: row.created_by_name,
        expiresAt: row.expires_at,
        maxUses: row.max_uses,
        useCount: row.use_count,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error('Failed to get invitation link by token:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const invitationLinkService = new InvitationLinkService();
