import { QuickPlanCompatibilityService } from '../services/quickPlanCompatibilityService';
import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

describe('QuickPlanCompatibilityService', () => {
  let testTripId: string;
  let testUserId: string;

  beforeEach(async () => {
    testTripId = uuidv4();
    testUserId = uuidv4();
  });

  afterEach(async () => {
    // Clean up test data
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM places WHERE trip_day_id IN (SELECT id FROM trip_days WHERE trip_id = $1)', [testTripId]);
      await client.query('DELETE FROM trip_days WHERE trip_id = $1', [testTripId]);
      await client.query('DELETE FROM trip_collaborators WHERE trip_id = $1', [testTripId]);
      await client.query('DELETE FROM trips WHERE id = $1', [testTripId]);
    } finally {
      client.release();
    }
  });

  describe('validateTripCompatibility', () => {
    it('should identify missing required fields', async () => {
      // Create a minimal trip without required fields
      const client = await pool.connect();
      try {
        await client.query(`
          INSERT INTO trips (id, title, owner_id, created_at, updated_at)
          VALUES ($1, '', $2, NOW(), NOW())
        `, [testTripId, testUserId]);

        const result = await QuickPlanCompatibilityService.validateTripCompatibility(testTripId);

        expect(result.isCompatible).toBe(false);
        expect(result.issues).toContain('Trip title is missing or empty');
        expect(result.issues).toContain('Share token is missing - sharing features will not work');
        expect(result.issues).toContain('No trip days found - trip editing features will not work');
      } finally {
        client.release();
      }
    });

    it('should validate complete trip structure', async () => {
      // Create a complete trip with all required fields
      const client = await pool.connect();
      try {
        // Create trip
        await client.query(`
          INSERT INTO trips (id, title, destination, start_date, end_date, owner_id, share_token, currency_code, created_at, updated_at)
          VALUES ($1, 'Test Trip', 'Tokyo', '2024-01-01', '2024-01-05', $2, $3, 'USD', NOW(), NOW())
        `, [testTripId, testUserId, uuidv4().replace(/-/g, '').substring(0, 12)]);

        // Create trip day
        const dayId = uuidv4();
        await client.query(`
          INSERT INTO trip_days (id, trip_id, day_number, date, created_at)
          VALUES ($1, $2, 1, '2024-01-01', NOW())
        `, [dayId, testTripId]);

        // Create place with all required fields
        await client.query(`
          INSERT INTO places (
            id, trip_day_id, name, address, lat, lng, 
            place_type, budget_category, display_order, created_at, updated_at
          )
          VALUES ($1, $2, 'Test Place', 'Test Address', 35.6762, 139.6503, 'attraction', 'activities', 1, NOW(), NOW())
        `, [uuidv4(), dayId]);

        // Add owner to collaborators
        await client.query(`
          INSERT INTO trip_collaborators (trip_id, user_id, role, created_at)
          VALUES ($1, $2, 'owner', NOW())
        `, [testTripId, testUserId]);

        const result = await QuickPlanCompatibilityService.validateTripCompatibility(testTripId);

        expect(result.isCompatible).toBe(true);
        expect(result.issues).toHaveLength(0);
      } finally {
        client.release();
      }
    });
  });

  describe('ensureFullCompatibility', () => {
    it('should fix compatibility issues and return report', async () => {
      // Create a trip with missing compatibility features
      const client = await pool.connect();
      try {
        await client.query(`
          INSERT INTO trips (id, title, destination, owner_id, created_at, updated_at)
          VALUES ($1, 'Test Trip', 'Tokyo', $2, NOW(), NOW())
        `, [testTripId, testUserId]);

        const dayId = uuidv4();
        await client.query(`
          INSERT INTO trip_days (id, trip_id, day_number, date, created_at)
          VALUES ($1, $2, 1, '2024-01-01', NOW())
        `, [dayId, testTripId]);

        const result = await QuickPlanCompatibilityService.ensureFullCompatibility(testTripId, testUserId);

        expect(result.success).toBe(true);
        expect(result.compatibilityReport.collaboration).toBe(true);
        expect(result.compatibilityReport.sharing).toBe(true);
        expect(result.shareToken).toBeDefined();

        // Verify owner was added to collaborators
        const collaboratorCheck = await client.query(
          'SELECT * FROM trip_collaborators WHERE trip_id = $1 AND user_id = $2 AND role = $3',
          [testTripId, testUserId, 'owner']
        );
        expect(collaboratorCheck.rows).toHaveLength(1);

        // Verify share token was added
        const tripCheck = await client.query(
          'SELECT share_token FROM trips WHERE id = $1',
          [testTripId]
        );
        expect(tripCheck.rows[0].share_token).toBeDefined();
      } finally {
        client.release();
      }
    });
  });

  describe('validateTripEditingCompatibility', () => {
    it('should validate trip editing capabilities', async () => {
      const client = await pool.connect();
      try {
        // Create trip with proper structure
        await client.query(`
          INSERT INTO trips (id, title, owner_id, created_at, updated_at)
          VALUES ($1, 'Test Trip', $2, NOW(), NOW())
        `, [testTripId, testUserId]);

        const dayId = uuidv4();
        await client.query(`
          INSERT INTO trip_days (id, trip_id, day_number, date, created_at)
          VALUES ($1, $2, 1, '2024-01-01', NOW())
        `, [dayId, testTripId]);

        // Add places with proper display order
        for (let i = 1; i <= 3; i++) {
          await client.query(`
            INSERT INTO places (id, trip_day_id, name, display_order, created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW())
          `, [uuidv4(), dayId, `Place ${i}`, i]);
        }

        const result = await QuickPlanCompatibilityService.validateTripEditingCompatibility(testTripId);

        expect(result.canEdit).toBe(true);
        expect(result.canAddPlaces).toBe(true);
        expect(result.canReorderPlaces).toBe(true);
        expect(result.canEditPlaces).toBe(true);
        expect(result.canDeletePlaces).toBe(true);
        expect(result.canAddDays).toBe(true);
        expect(result.issues).toHaveLength(0);
      } finally {
        client.release();
      }
    });

    it('should detect places without display order', async () => {
      const client = await pool.connect();
      try {
        await client.query(`
          INSERT INTO trips (id, title, owner_id, created_at, updated_at)
          VALUES ($1, 'Test Trip', $2, NOW(), NOW())
        `, [testTripId, testUserId]);

        const dayId = uuidv4();
        await client.query(`
          INSERT INTO trip_days (id, trip_id, day_number, date, created_at)
          VALUES ($1, $2, 1, '2024-01-01', NOW())
        `, [dayId, testTripId]);

        // Add place without display order
        await client.query(`
          INSERT INTO places (id, trip_day_id, name, created_at, updated_at)
          VALUES ($1, $2, 'Place without order', NOW(), NOW())
        `, [uuidv4(), dayId]);

        const result = await QuickPlanCompatibilityService.validateTripEditingCompatibility(testTripId);

        expect(result.canReorderPlaces).toBe(false);
        expect(result.issues).toContain('Some places missing display order - reordering may not work properly');
      } finally {
        client.release();
      }
    });
  });

  describe('ensureExportCompatibility', () => {
    it('should validate export feature requirements', async () => {
      const client = await pool.connect();
      try {
        const shareToken = uuidv4().replace(/-/g, '').substring(0, 12);
        
        await client.query(`
          INSERT INTO trips (id, title, destination, owner_id, share_token, is_public, created_at, updated_at)
          VALUES ($1, 'Test Trip', 'Tokyo', $2, $3, true, NOW(), NOW())
        `, [testTripId, testUserId, shareToken]);

        const dayId = uuidv4();
        await client.query(`
          INSERT INTO trip_days (id, trip_id, day_number, date, created_at)
          VALUES ($1, $2, 1, '2024-01-01', NOW())
        `, [dayId, testTripId]);

        await client.query(`
          INSERT INTO places (id, trip_day_id, name, created_at, updated_at)
          VALUES ($1, $2, 'Test Place', NOW(), NOW())
        `, [uuidv4(), dayId]);

        const result = await QuickPlanCompatibilityService.ensureExportCompatibility(testTripId);

        expect(result.pdfReady).toBe(true);
        expect(result.sharingReady).toBe(true);
        expect(result.qrCodeReady).toBe(true);
        expect(result.issues).toHaveLength(0);
      } finally {
        client.release();
      }
    });

    it('should detect missing export requirements', async () => {
      const client = await pool.connect();
      try {
        // Create trip without required fields for export
        await client.query(`
          INSERT INTO trips (id, title, owner_id, is_public, created_at, updated_at)
          VALUES ($1, '', $2, false, NOW(), NOW())
        `, [testTripId, testUserId]);

        const result = await QuickPlanCompatibilityService.ensureExportCompatibility(testTripId);

        expect(result.pdfReady).toBe(false);
        expect(result.sharingReady).toBe(false);
        expect(result.qrCodeReady).toBe(false);
        expect(result.issues.length).toBeGreaterThan(0);
      } finally {
        client.release();
      }
    });
  });
});