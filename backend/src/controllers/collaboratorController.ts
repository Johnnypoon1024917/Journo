import { Request, Response } from 'express';
import pool from '../config/database';
import { NotificationService } from '../services/notificationService.js';
import { socketService } from '../services/socketService.js';

// Get all collaborators for a trip
export const getTripCollaborators = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has access to view this trip
    const accessCheck = await pool.query(
      `SELECT user_owns_trip($1, $2) as owns, 
              user_is_collaborator($1, $2) as is_collaborator,
              trip_is_public($2) as is_public`,
      [userId, tripId]
    );

    const { owns, is_collaborator, is_public } = accessCheck.rows[0];

    if (!owns && !is_collaborator && !is_public) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get collaborators with user details
    const result = await pool.query(
      `SELECT 
        tc.id,
        tc.trip_id,
        tc.user_id,
        tc.role,
        tc.invited_by,
        tc.created_at,
        u.name as user_name,
        u.email as user_email,
        inv.name as inviter_name
      FROM trip_collaborators tc
      JOIN users u ON tc.user_id = u.id
      LEFT JOIN users inv ON tc.invited_by = inv.id
      WHERE tc.trip_id = $1
      ORDER BY 
        CASE tc.role 
          WHEN 'owner' THEN 1 
          WHEN 'editor' THEN 2 
          WHEN 'viewer' THEN 3 
        END,
        tc.created_at ASC`,
      [tripId]
    );

    const collaborators = result.rows.map(row => ({
      id: row.id,
      trip_id: row.trip_id,
      user_id: row.user_id,
      role: row.role,
      invited_by: row.invited_by,
      created_at: row.created_at,
      user: {
        id: row.user_id,
        name: row.user_name,
        email: row.user_email
      },
      inviter: row.invited_by ? {
        id: row.invited_by,
        name: row.inviter_name
      } : undefined
    }));

    res.json(collaborators);
  } catch (error) {
    console.error('Error fetching trip collaborators:', error);
    res.status(500).json({ error: 'Failed to fetch collaborators' });
  }
};

// Add a collaborator to a trip
export const addCollaborator = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const { user_id, role, email } = req.body;
    const inviterId = req.user?.userId;

    if (!inviterId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate role
    if (!['editor', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be editor or viewer' });
    }

    // Check if inviter is the owner
    const ownerCheck = await pool.query(
      'SELECT user_owns_trip($1, $2) as is_owner',
      [inviterId, tripId]
    );

    if (!ownerCheck.rows[0].is_owner) {
      return res.status(403).json({ error: 'Only trip owners can add collaborators' });
    }

    let targetUserId = user_id;

    // If email is provided instead of user_id, look up the user
    if (!targetUserId && email) {
      const userResult = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found with that email' });
      }

      targetUserId = userResult.rows[0].id;
    }

    if (!targetUserId) {
      return res.status(400).json({ error: 'Either user_id or email must be provided' });
    }

    // Check if user is already a collaborator
    const existingCheck = await pool.query(
      'SELECT id FROM trip_collaborators WHERE trip_id = $1 AND user_id = $2',
      [tripId, targetUserId]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(409).json({ error: 'User is already a collaborator on this trip' });
    }

    // Add collaborator with accepted_at set to current timestamp
    // (since they're being added directly, not via invitation link)
    const result = await pool.query(
      `INSERT INTO trip_collaborators (trip_id, user_id, role, invited_by, accepted_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       RETURNING *`,
      [tripId, targetUserId, role, inviterId]
    );

    // Get user details and trip details for notification
    const userDetails = await pool.query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [targetUserId]
    );

    const inviterDetails = await pool.query(
      'SELECT name FROM users WHERE id = $1',
      [inviterId]
    );

    const tripDetails = await pool.query(
      'SELECT title FROM trips WHERE id = $1',
      [tripId]
    );

    // Create notification for the invited user
    if (userDetails.rows.length > 0 && inviterDetails.rows.length > 0 && tripDetails.rows.length > 0) {
      await NotificationService.createCollaborationInvite(
        targetUserId,
        tripId,
        tripDetails.rows[0].title,
        inviterDetails.rows[0].name,
        role,
        inviterId
      );
    }

    const collaborator = {
      ...result.rows[0],
      user: userDetails.rows[0]
    };

    // Emit collaborator:joined event to trip room
    socketService.emitCollaboratorJoined(tripId, collaborator);

    res.status(201).json(collaborator);
  } catch (error) {
    console.error('Error adding collaborator:', error);
    res.status(500).json({ error: 'Failed to add collaborator' });
  }
};

// Update collaborator role
export const updateCollaboratorRole = async (req: Request, res: Response) => {
  try {
    const { tripId, collaboratorId } = req.params;
    const { role } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate role
    if (!['editor', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be editor or viewer' });
    }

    // Check if user is the owner
    const ownerCheck = await pool.query(
      'SELECT user_owns_trip($1, $2) as is_owner',
      [userId, tripId]
    );

    if (!ownerCheck.rows[0].is_owner) {
      return res.status(403).json({ error: 'Only trip owners can update collaborator roles' });
    }

    // Update role (trigger will prevent changing owner role)
    const result = await pool.query(
      `UPDATE trip_collaborators 
       SET role = $1 
       WHERE id = $2 AND trip_id = $3
       RETURNING *`,
      [role, collaboratorId, tripId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Collaborator not found' });
    }

    const updatedCollaborator = result.rows[0];

    // Get user details for the event
    const userDetails = await pool.query(
      'SELECT name FROM users WHERE id = $1',
      [updatedCollaborator.user_id]
    );

    // Emit collaborator:role_changed event to trip room
    socketService.emitCollaboratorRoleChanged(
      tripId,
      updatedCollaborator.user_id,
      role,
      userDetails.rows[0]?.name
    );

    res.json(updatedCollaborator);
  } catch (error: any) {
    console.error('Error updating collaborator role:', error);
    
    if (error.message?.includes('Cannot change the role of the trip owner')) {
      return res.status(400).json({ error: 'Cannot change the role of the trip owner' });
    }
    
    res.status(500).json({ error: 'Failed to update collaborator role' });
  }
};

// Remove a collaborator from a trip
export const removeCollaborator = async (req: Request, res: Response) => {
  try {
    const { tripId, collaboratorId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is the owner
    const ownerCheck = await pool.query(
      'SELECT user_owns_trip($1, $2) as is_owner',
      [userId, tripId]
    );

    if (!ownerCheck.rows[0].is_owner) {
      return res.status(403).json({ error: 'Only trip owners can remove collaborators' });
    }

    // Delete collaborator (trigger will prevent deleting last owner)
    const result = await pool.query(
      'DELETE FROM trip_collaborators WHERE id = $1 AND trip_id = $2 RETURNING *',
      [collaboratorId, tripId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Collaborator not found' });
    }

    const removedCollaborator = result.rows[0];

    // Get user details for the event
    const userDetails = await pool.query(
      'SELECT name FROM users WHERE id = $1',
      [removedCollaborator.user_id]
    );

    // Emit collaborator:left event to trip room
    socketService.emitCollaboratorLeft(
      tripId,
      removedCollaborator.user_id,
      userDetails.rows[0]?.name
    );

    res.json({ message: 'Collaborator removed successfully' });
  } catch (error: any) {
    console.error('Error removing collaborator:', error);
    
    if (error.message?.includes('Cannot delete the last owner')) {
      return res.status(400).json({ error: 'Cannot delete the last owner of a trip' });
    }
    
    res.status(500).json({ error: 'Failed to remove collaborator' });
  }
};

// Get user's permissions for a trip
export const getTripPermissions = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      // Anonymous user - check if trip is public
      const publicCheck = await pool.query(
        'SELECT trip_is_public($1) as is_public',
        [tripId]
      );

      return res.json({
        can_view: publicCheck.rows[0].is_public,
        can_edit: false,
        can_delete: false,
        can_manage_collaborators: false,
        can_share: false,
        role: null
      });
    }

    // Get user's role and permissions
    const result = await pool.query(
      `SELECT 
        tc.role,
        t.owner_id = $1 as is_owner,
        t.is_public,
        user_can_edit_trip($1, $2) as can_edit
      FROM trips t
      LEFT JOIN trip_collaborators tc ON tc.trip_id = t.id AND tc.user_id = $1
      WHERE t.id = $2`,
      [userId, tripId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const { role, is_owner, is_public, can_edit } = result.rows[0];

    const permissions = {
      can_view: is_owner || role !== null || is_public,
      can_edit: can_edit,
      can_delete: is_owner,
      can_manage_collaborators: is_owner,
      can_share: is_owner || role === 'editor',
      role: role
    };

    res.json(permissions);
  } catch (error) {
    console.error('Error fetching trip permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
};

// Leave a trip (remove self as collaborator)
export const leaveTrip = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is a collaborator
    const collaboratorCheck = await pool.query(
      'SELECT id, role FROM trip_collaborators WHERE trip_id = $1 AND user_id = $2',
      [tripId, userId]
    );

    if (collaboratorCheck.rows.length === 0) {
      return res.status(404).json({ error: 'You are not a collaborator on this trip' });
    }

    const { id: collaboratorId, role } = collaboratorCheck.rows[0];

    // Prevent owner from leaving if they're the last owner
    if (role === 'owner') {
      const ownerCount = await pool.query(
        'SELECT COUNT(*) as count FROM trip_collaborators WHERE trip_id = $1 AND role = $2',
        [tripId, 'owner']
      );

      if (parseInt(ownerCount.rows[0].count) === 1) {
        return res.status(400).json({ 
          error: 'Cannot leave trip as the last owner. Transfer ownership or delete the trip instead.' 
        });
      }
    }

    // Remove self as collaborator
    await pool.query(
      'DELETE FROM trip_collaborators WHERE id = $1',
      [collaboratorId]
    );

    // Get user details for the event
    const userDetails = await pool.query(
      'SELECT name FROM users WHERE id = $1',
      [userId]
    );

    // Emit collaborator:left event to trip room
    socketService.emitCollaboratorLeft(
      tripId,
      userId,
      userDetails.rows[0]?.name
    );

    res.json({ message: 'Successfully left the trip' });
  } catch (error) {
    console.error('Error leaving trip:', error);
    res.status(500).json({ error: 'Failed to leave trip' });
  }
};
