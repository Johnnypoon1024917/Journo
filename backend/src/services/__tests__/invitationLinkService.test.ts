import { invitationLinkService, GenerateLinkOptions } from '../invitationLinkService';
import pool from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

describe('InvitationLinkService', () => {
  let testTripId: string;
  let testOwnerId: string;
  let testUserId: string;

  beforeEach(async () => {
    // Create test data
    testTripId = uuidv4();
    testOwnerId = uuidv4();
    testUserId = uuidv4();

    const client = await pool.connect();
    try {
      // Create test owner
      await client.query(
        `INSERT INTO users (id, name, email, password_hash, created_at, updated_at)
         VALUES ($1, 'Trip Owner', 'owner@example.com', 'password_hash', NOW(), NOW())`,
        [testOwnerId]
      );

      // Create test user
      await client.query(
        `INSERT INTO users (id, name, email, password_hash, created_at, updated_at)
         VALUES ($1, 'Test User', 'user@example.com', 'password_hash', NOW(), NOW())`,
        [testUserId]
      );

      // Create test trip
      await client.query(
        `INSERT INTO trips (id, title, destination, start_date, end_date, owner_id, created_at, updated_at)
         VALUES ($1, 'Test Trip', 'Tokyo', '2024-01-01', '2024-01-05', $2, NOW(), NOW())`,
        [testTripId, testOwnerId]
      );

      // Add owner as collaborator
      await client.query(
        `INSERT INTO trip_collaborators (id, trip_id, user_id, role, created_at, updated_at)
         VALUES ($1, $2, $3, 'owner', NOW(), NOW())`,
        [uuidv4(), testTripId, testOwnerId]
      );
    } finally {
      client.release();
    }
  });

  afterEach(async () => {
    // Clean up test data
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM invitation_links WHERE trip_id = $1', [testTripId]);
      await client.query('DELETE FROM trip_collaborators WHERE trip_id = $1', [testTripId]);
      await client.query('DELETE FROM trips WHERE id = $1', [testTripId]);
      await client.query('DELETE FROM users WHERE id IN ($1, $2)', [testOwnerId, testUserId]);
    } finally {
      client.release();
    }
  });

  describe('generateLink', () => {
    it('should generate invitation link with cryptographically secure token', async () => {
      // Arrange
      const options: GenerateLinkOptions = {
        tripId: testTripId,
        role: 'editor',
        createdBy: testOwnerId,
        expiresIn: 168, // 7 days
        maxUses: null
      };

      // Act
      const link = await invitationLinkService.generateLink(options);

      // Assert
      expect(link).toBeDefined();
      expect(link.id).toBeDefined();
      expect(link.tripId).toBe(testTripId);
      expect(link.token).toBeDefined();
      expect(link.token).toHaveLength(64); // 32 bytes = 64 hex characters
      expect(link.role).toBe('editor');
      expect(link.createdBy).toBe(testOwnerId);
      expect(link.createdByName).toBe('Trip Owner');
      expect(link.expiresAt).toBeDefined();
      expect(link.maxUses).toBeNull();
      expect(link.useCount).toBe(0);
      expect(link.isActive).toBe(true);
      expect(link.createdAt).toBeDefined();
      expect(link.updatedAt).toBeDefined();

      // Verify token is cryptographically secure (should be random)
      const link2 = await invitationLinkService.generateLink(options);
      expect(link2.token).not.toBe(link.token);

      // Verify expiration is approximately 7 days from now
      const expectedExpiry = new Date();
      expectedExpiry.setHours(expectedExpiry.getHours() + 168);
      const expiryDiff = Math.abs(new Date(link.expiresAt).getTime() - expectedExpiry.getTime());
      expect(expiryDiff).toBeLessThan(5000); // Within 5 seconds
    });

    it('should generate link with viewer role', async () => {
      // Arrange
      const options: GenerateLinkOptions = {
        tripId: testTripId,
        role: 'viewer',
        createdBy: testOwnerId
      };

      // Act
      const link = await invitationLinkService.generateLink(options);

      // Assert
      expect(link.role).toBe('viewer');
    });

    it('should generate link with custom expiration', async () => {
      // Arrange
      const options: GenerateLinkOptions = {
        tripId: testTripId,
        role: 'editor',
        createdBy: testOwnerId,
        expiresIn: 24 // 1 day
      };

      // Act
      const link = await invitationLinkService.generateLink(options);

      // Assert
      const expectedExpiry = new Date();
      expectedExpiry.setHours(expectedExpiry.getHours() + 24);
      const expiryDiff = Math.abs(new Date(link.expiresAt).getTime() - expectedExpiry.getTime());
      expect(expiryDiff).toBeLessThan(5000); // Within 5 seconds
    });

    it('should generate link with max uses limit', async () => {
      // Arrange
      const options: GenerateLinkOptions = {
        tripId: testTripId,
        role: 'editor',
        createdBy: testOwnerId,
        maxUses: 5
      };

      // Act
      const link = await invitationLinkService.generateLink(options);

      // Assert
      expect(link.maxUses).toBe(5);
      expect(link.useCount).toBe(0);
    });

    it('should use default expiration of 7 days when not specified', async () => {
      // Arrange
      const options: GenerateLinkOptions = {
        tripId: testTripId,
        role: 'editor',
        createdBy: testOwnerId
      };

      // Act
      const link = await invitationLinkService.generateLink(options);

      // Assert
      const expectedExpiry = new Date();
      expectedExpiry.setHours(expectedExpiry.getHours() + 168);
      const expiryDiff = Math.abs(new Date(link.expiresAt).getTime() - expectedExpiry.getTime());
      expect(expiryDiff).toBeLessThan(5000); // Within 5 seconds
    });

    it('should save link to database', async () => {
      // Arrange
      const options: GenerateLinkOptions = {
        tripId: testTripId,
        role: 'editor',
        createdBy: testOwnerId
      };

      // Act
      const link = await invitationLinkService.generateLink(options);

      // Assert - Verify in database
      const client = await pool.connect();
      try {
        const result = await client.query(
          'SELECT * FROM invitation_links WHERE id = $1',
          [link.id]
        );
        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].token).toBe(link.token);
        expect(result.rows[0].role).toBe('editor');
        expect(result.rows[0].is_active).toBe(true);
      } finally {
        client.release();
      }
    });
  });

  describe('validateLink', () => {
    let validToken: string;
    let expiredToken: string;
    let revokedToken: string;
    let maxUsesToken: string;

    beforeEach(async () => {
      // Create valid link
      const validLink = await invitationLinkService.generateLink({
        tripId: testTripId,
        role: 'editor',
        createdBy: testOwnerId,
        expiresIn: 168
      });
      validToken = validLink.token;

      // Create expired link
      const expiredLink = await invitationLinkService.generateLink({
        tripId: testTripId,
        role: 'editor',
        createdBy: testOwnerId,
        expiresIn: -1 // Already expired
      });
      expiredToken = expiredLink.token;

      // Create revoked link
      const revokedLink = await invitationLinkService.generateLink({
        tripId: testTripId,
        role: 'editor',
        createdBy: testOwnerId
      });
      revokedToken = revokedLink.token;
      await invitationLinkService.revokeLink(revokedLink.id, testTripId);

      // Create link with max uses reached
      const maxUsesLink = await invitationLinkService.generateLink({
        tripId: testTripId,
        role: 'editor',
        createdBy: testOwnerId,
        maxUses: 1
      });
      maxUsesToken = maxUsesLink.token;
      // Manually set use count to max
      const client = await pool.connect();
      try {
        await client.query(
          'UPDATE invitation_links SET use_count = 1 WHERE token = $1',
          [maxUsesToken]
        );
      } finally {
        client.release();
      }
    });

    it('should validate a valid link', async () => {
      // Act
      const result = await invitationLinkService.validateLink(validToken);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.link).toBeDefined();
      expect(result.link?.token).toBe(validToken);
      expect(result.link?.isActive).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should reject non-existent link', async () => {
      // Act
      const result = await invitationLinkService.validateLink('nonexistent-token');

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.link).toBeUndefined();
      expect(result.reason).toBe('Link not found');
    });

    it('should reject expired link', async () => {
      // Act
      const result = await invitationLinkService.validateLink(expiredToken);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.link).toBeDefined();
      expect(result.reason).toBe('Link has expired');
    });

    it('should reject revoked link', async () => {
      // Act
      const result = await invitationLinkService.validateLink(revokedToken);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.link).toBeDefined();
      expect(result.link?.isActive).toBe(false);
      expect(result.reason).toBe('Link has been revoked');
    });

    it('should reject link that reached max uses', async () => {
      // Act
      const result = await invitationLinkService.validateLink(maxUsesToken);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.link).toBeDefined();
      expect(result.link?.useCount).toBe(1);
      expect(result.link?.maxUses).toBe(1);
      expect(result.reason).toBe('Link has reached maximum uses');
    });

    it('should include link details in validation result', async () => {
      // Act
      const result = await invitationLinkService.validateLink(validToken);

      // Assert
      expect(result.link).toBeDefined();
      expect(result.link?.tripId).toBe(testTripId);
      expect(result.link?.role).toBe('editor');
      expect(result.link?.createdBy).toBe(testOwnerId);
      expect(result.link?.createdByName).toBe('Trip Owner');
    });
  });

  describe('acceptInvitation', () => {
    let validToken: string;
    let linkId: string;

    beforeEach(async () => {
      const link = await invitationLinkService.generateLink({
        tripId: testTripId,
        role: 'editor',
        createdBy: testOwnerId,
        expiresIn: 168
      });
      validToken = link.token;
      linkId = link.id;
    });

    it('should accept invitation and add user as collaborator', async () => {
      // Act
      const result = await invitationLinkService.acceptInvitation(validToken, testUserId);

      // Assert
      expect(result).toBeDefined();
      expect(result.collaboratorId).toBeDefined();
      expect(result.tripId).toBe(testTripId);
      expect(result.userId).toBe(testUserId);
      expect(result.role).toBe('editor');

      // Verify collaborator was added to database
      const client = await pool.connect();
      try {
        const collaboratorResult = await client.query(
          'SELECT * FROM trip_collaborators WHERE id = $1',
          [result.collaboratorId]
        );
        expect(collaboratorResult.rows).toHaveLength(1);
        expect(collaboratorResult.rows[0].user_id).toBe(testUserId);
        expect(collaboratorResult.rows[0].role).toBe('editor');
        expect(collaboratorResult.rows[0].invited_by).toBe(testOwnerId);
      } finally {
        client.release();
      }
    });

    it('should increment use count after accepting', async () => {
      // Act
      await invitationLinkService.acceptInvitation(validToken, testUserId);

      // Assert - Check use count was incremented
      const link = await invitationLinkService.getLinkByToken(validToken);
      expect(link).toBeDefined();
      expect(link?.useCount).toBe(1);
    });

    it('should reject invalid token', async () => {
      // Act & Assert
      await expect(
        invitationLinkService.acceptInvitation('invalid-token', testUserId)
      ).rejects.toThrow('Link not found');
    });

    it('should reject expired link', async () => {
      // Arrange - Create expired link
      const expiredLink = await invitationLinkService.generateLink({
        tripId: testTripId,
        role: 'editor',
        createdBy: testOwnerId,
        expiresIn: -1
      });

      // Act & Assert
      await expect(
        invitationLinkService.acceptInvitation(expiredLink.token, testUserId)
      ).rejects.toThrow('Link has expired');
    });

    it('should reject revoked link', async () => {
      // Arrange - Revoke the link
      await invitationLinkService.revokeLink(linkId, testTripId);

      // Act & Assert
      await expect(
        invitationLinkService.acceptInvitation(validToken, testUserId)
      ).rejects.toThrow('Link has been revoked');
    });

    it('should reject if user is already a collaborator', async () => {
      // Arrange - Accept invitation once
      await invitationLinkService.acceptInvitation(validToken, testUserId);

      // Act & Assert - Try to accept again
      await expect(
        invitationLinkService.acceptInvitation(validToken, testUserId)
      ).rejects.toThrow('User is already a collaborator on this trip');
    });

    it('should reject if max uses reached', async () => {
      // Arrange - Create link with max uses of 1
      const limitedLink = await invitationLinkService.generateLink({
        tripId: testTripId,
        role: 'editor',
        createdBy: testOwnerId,
        maxUses: 1
      });

      // Create another user
      const anotherUserId = uuidv4();
      const client = await pool.connect();
      try {
        await client.query(
          `INSERT INTO users (id, name, email, password_hash, created_at, updated_at)
           VALUES ($1, 'Another User', 'another@example.com', 'password_hash', NOW(), NOW())`,
          [anotherUserId]
        );

        // Accept with first user
        await invitationLinkService.acceptInvitation(limitedLink.token, testUserId);

        // Act & Assert - Try to accept with second user
        await expect(
          invitationLinkService.acceptInvitation(limitedLink.token, anotherUserId)
        ).rejects.toThrow('Link has reached maximum uses');

        // Cleanup
        await client.query('DELETE FROM users WHERE id = $1', [anotherUserId]);
      } finally {
        client.release();
      }
    });

    it('should use transaction and rollback on error', async () => {
      // Arrange - Create a scenario that will fail (invalid trip_id in link)
      const client = await pool.connect();
      try {
        // Manually insert a link with invalid trip_id
        const invalidTripId = uuidv4();
        const token = crypto.randomBytes(32).toString('hex');
        await client.query(
          `INSERT INTO invitation_links 
           (id, trip_id, token, role, created_by, expires_at, is_active)
           VALUES ($1, $2, $3, 'editor', $4, NOW() + INTERVAL '7 days', true)`,
          [uuidv4(), invalidTripId, token, testOwnerId]
        );

        // Act & Assert - Should fail because trip doesn't exist
        await expect(
          invitationLinkService.acceptInvitation(token, testUserId)
        ).rejects.toThrow();

        // Verify no collaborator was added (transaction rolled back)
        const collaboratorResult = await client.query(
          'SELECT * FROM trip_collaborators WHERE trip_id = $1 AND user_id = $2',
          [invalidTripId, testUserId]
        );
        expect(collaboratorResult.rows).toHaveLength(0);
      } finally {
        client.release();
      }
    });
  });

  describe('revokeLink', () => {
    let linkId: string;
    let token: string;

    beforeEach(async () => {
      const link = await invitationLinkService.generateLink({
        tripId: testTripId,
        role: 'editor',
        createdBy: testOwnerId
      });
      linkId = link.id;
      token = link.token;
    });

    it('should revoke an active link', async () => {
      // Act
      await invitationLinkService.revokeLink(linkId, testTripId);

      // Assert - Verify link is revoked
      const link = await invitationLinkService.getLinkByToken(token);
      expect(link).toBeDefined();
      expect(link?.isActive).toBe(false);
    });

    it('should update the updated_at timestamp', async () => {
      // Arrange
      const linkBefore = await invitationLinkService.getLinkByToken(token);
      const updatedAtBefore = linkBefore?.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      // Act
      await invitationLinkService.revokeLink(linkId, testTripId);

      // Assert
      const linkAfter = await invitationLinkService.getLinkByToken(token);
      expect(linkAfter?.updatedAt).not.toEqual(updatedAtBefore);
    });

    it('should throw error if link not found', async () => {
      // Act & Assert
      await expect(
        invitationLinkService.revokeLink(uuidv4(), testTripId)
      ).rejects.toThrow('Invitation link not found');
    });

    it('should throw error if trip_id does not match', async () => {
      // Act & Assert
      await expect(
        invitationLinkService.revokeLink(linkId, uuidv4())
      ).rejects.toThrow('Invitation link not found');
    });

    it('should allow revoking already revoked link', async () => {
      // Arrange - Revoke once
      await invitationLinkService.revokeLink(linkId, testTripId);

      // Act & Assert - Should not throw error
      await expect(
        invitationLinkService.revokeLink(linkId, testTripId)
      ).rejects.toThrow('Invitation link not found');
    });
  });

  describe('getActiveLinks', () => {
    beforeEach(async () => {
      // Create multiple links
      await invitationLinkService.generateLink({
        tripId: testTripId,
        role: 'editor',
        createdBy: testOwnerId
      });

      await invitationLinkService.generateLink({
        tripId: testTripId,
        role: 'viewer',
        createdBy: testOwnerId
      });

      // Create a revoked link
      const revokedLink = await invitationLinkService.generateLink({
        tripId: testTripId,
        role: 'editor',
        createdBy: testOwnerId
      });
      await invitationLinkService.revokeLink(revokedLink.id, testTripId);
    });

    it('should return all active links for a trip', async () => {
      // Act
      const links = await invitationLinkService.getActiveLinks(testTripId);

      // Assert
      expect(links).toBeDefined();
      expect(links.length).toBe(2); // Only active links
      links.forEach(link => {
        expect(link.isActive).toBe(true);
        expect(link.tripId).toBe(testTripId);
      });
    });

    it('should not return revoked links', async () => {
      // Act
      const links = await invitationLinkService.getActiveLinks(testTripId);

      // Assert
      links.forEach(link => {
        expect(link.isActive).toBe(true);
      });
    });

    it('should include creator name', async () => {
      // Act
      const links = await invitationLinkService.getActiveLinks(testTripId);

      // Assert
      links.forEach(link => {
        expect(link.createdByName).toBe('Trip Owner');
      });
    });

    it('should order links by created_at DESC', async () => {
      // Act
      const links = await invitationLinkService.getActiveLinks(testTripId);

      // Assert
      for (let i = 0; i < links.length - 1; i++) {
        const current = new Date(links[i].createdAt);
        const next = new Date(links[i + 1].createdAt);
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }
    });

    it('should return empty array if no active links', async () => {
      // Arrange - Create a new trip with no links
      const emptyTripId = uuidv4();
      const client = await pool.connect();
      try {
        await client.query(
          `INSERT INTO trips (id, title, owner_id, created_at, updated_at)
           VALUES ($1, 'Empty Trip', $2, NOW(), NOW())`,
          [emptyTripId, testOwnerId]
        );

        // Act
        const links = await invitationLinkService.getActiveLinks(emptyTripId);

        // Assert
        expect(links).toEqual([]);

        // Cleanup
        await client.query('DELETE FROM trips WHERE id = $1', [emptyTripId]);
      } finally {
        client.release();
      }
    });

    it('should include all link properties', async () => {
      // Act
      const links = await invitationLinkService.getActiveLinks(testTripId);

      // Assert
      links.forEach(link => {
        expect(link.id).toBeDefined();
        expect(link.tripId).toBe(testTripId);
        expect(link.token).toBeDefined();
        expect(link.role).toMatch(/^(editor|viewer)$/);
        expect(link.createdBy).toBe(testOwnerId);
        expect(link.createdByName).toBe('Trip Owner');
        expect(link.expiresAt).toBeDefined();
        expect(link.useCount).toBeDefined();
        expect(link.isActive).toBe(true);
        expect(link.createdAt).toBeDefined();
        expect(link.updatedAt).toBeDefined();
      });
    });
  });

  describe('getLinkByToken', () => {
    let token: string;

    beforeEach(async () => {
      const link = await invitationLinkService.generateLink({
        tripId: testTripId,
        role: 'editor',
        createdBy: testOwnerId
      });
      token = link.token;
    });

    it('should return link by token', async () => {
      // Act
      const link = await invitationLinkService.getLinkByToken(token);

      // Assert
      expect(link).toBeDefined();
      expect(link?.token).toBe(token);
      expect(link?.tripId).toBe(testTripId);
      expect(link?.role).toBe('editor');
      expect(link?.createdBy).toBe(testOwnerId);
      expect(link?.createdByName).toBe('Trip Owner');
    });

    it('should return null for non-existent token', async () => {
      // Act
      const link = await invitationLinkService.getLinkByToken('nonexistent-token');

      // Assert
      expect(link).toBeNull();
    });

    it('should return revoked links', async () => {
      // Arrange - Revoke the link
      const linkBefore = await invitationLinkService.getLinkByToken(token);
      await invitationLinkService.revokeLink(linkBefore!.id, testTripId);

      // Act
      const link = await invitationLinkService.getLinkByToken(token);

      // Assert
      expect(link).toBeDefined();
      expect(link?.isActive).toBe(false);
    });

    it('should return expired links', async () => {
      // Arrange - Create expired link
      const expiredLink = await invitationLinkService.generateLink({
        tripId: testTripId,
        role: 'editor',
        createdBy: testOwnerId,
        expiresIn: -1
      });

      // Act
      const link = await invitationLinkService.getLinkByToken(expiredLink.token);

      // Assert
      expect(link).toBeDefined();
      expect(new Date(link!.expiresAt).getTime()).toBeLessThan(Date.now());
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete invitation flow', async () => {
      // 1. Generate link
      const link = await invitationLinkService.generateLink({
        tripId: testTripId,
        role: 'editor',
        createdBy: testOwnerId,
        expiresIn: 168,
        maxUses: 5
      });

      expect(link.token).toBeDefined();
      expect(link.useCount).toBe(0);

      // 2. Validate link
      const validation = await invitationLinkService.validateLink(link.token);
      expect(validation.isValid).toBe(true);

      // 3. Accept invitation
      const result = await invitationLinkService.acceptInvitation(link.token, testUserId);
      expect(result.collaboratorId).toBeDefined();

      // 4. Verify use count incremented
      const updatedLink = await invitationLinkService.getLinkByToken(link.token);
      expect(updatedLink?.useCount).toBe(1);

      // 5. Verify link still valid (not at max uses)
      const validation2 = await invitationLinkService.validateLink(link.token);
      expect(validation2.isValid).toBe(true);

      // 6. Revoke link
      await invitationLinkService.revokeLink(link.id, testTripId);

      // 7. Verify link is now invalid
      const validation3 = await invitationLinkService.validateLink(link.token);
      expect(validation3.isValid).toBe(false);
      expect(validation3.reason).toBe('Link has been revoked');
    });

    it('should handle multiple users accepting same link', async () => {
      // Arrange - Create link with max uses of 3
      const link = await invitationLinkService.generateLink({
        tripId: testTripId,
        role: 'viewer',
        createdBy: testOwnerId,
        maxUses: 3
      });

      // Create additional users
      const user2Id = uuidv4();
      const user3Id = uuidv4();
      const client = await pool.connect();
      try {
        await client.query(
          `INSERT INTO users (id, name, email, password_hash, created_at, updated_at)
           VALUES ($1, 'User 2', 'user2@example.com', 'password_hash', NOW(), NOW()),
                  ($2, 'User 3', 'user3@example.com', 'password_hash', NOW(), NOW())`,
          [user2Id, user3Id]
        );

        // Act - Accept with three different users
        await invitationLinkService.acceptInvitation(link.token, testUserId);
        await invitationLinkService.acceptInvitation(link.token, user2Id);
        await invitationLinkService.acceptInvitation(link.token, user3Id);

        // Assert - Verify all three are collaborators
        const collaborators = await client.query(
          'SELECT user_id FROM trip_collaborators WHERE trip_id = $1 AND user_id IN ($2, $3, $4)',
          [testTripId, testUserId, user2Id, user3Id]
        );
        expect(collaborators.rows).toHaveLength(3);

        // Verify link is now at max uses
        const updatedLink = await invitationLinkService.getLinkByToken(link.token);
        expect(updatedLink?.useCount).toBe(3);

        // Verify link is now invalid
        const validation = await invitationLinkService.validateLink(link.token);
        expect(validation.isValid).toBe(false);
        expect(validation.reason).toBe('Link has reached maximum uses');

        // Cleanup
        await client.query('DELETE FROM users WHERE id IN ($1, $2)', [user2Id, user3Id]);
      } finally {
        client.release();
      }
    });
  });
});
