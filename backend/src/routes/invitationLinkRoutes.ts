import express from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import {
  generateInvitationLink,
  getInvitationLinks,
  revokeInvitationLink,
  acceptInvitation,
  getInvitationLinkDetails,
} from '../controllers/invitationLinkController.js';

const router = express.Router();

// Generate a new invitation link (authenticated, owner only)
router.post('/trips/:tripId/invitation-links', authenticate, generateInvitationLink);

// Get all active invitation links for a trip (authenticated, owner only)
router.get('/trips/:tripId/invitation-links', authenticate, getInvitationLinks);

// Revoke an invitation link (authenticated, owner only)
router.delete('/trips/:tripId/invitation-links/:linkId', authenticate, revokeInvitationLink);

// Accept an invitation via link (authenticated)
router.post('/invitation-links/:token/accept', authenticate, acceptInvitation);

// Get invitation link details (public, no auth required)
router.get('/invitation-links/:token', getInvitationLinkDetails);

export default router;
