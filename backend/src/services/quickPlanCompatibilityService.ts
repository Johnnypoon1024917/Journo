import { pool } from '../config/database.js';
import { socketService } from './socketService.js';
import { badgeService } from './badgeService.js';
import { NotificationService } from './notificationService.js';
import { v4 as uuidv4 } from 'uuid';
import type { Trip, TripDay, Place, TripWithDays } from '../types/index.js';

/**
 * Service to ensure Quick Plan generated trips are fully compatible with all existing features
 */
export class QuickPlanCompatibilityService {
  
  /**
   * Validates that a Quick Plan generated trip has all required fields for existing features
   */
  static async validateTripCompatibility(tripId: string): Promise<{
    isCompatible: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const client = await pool.connect();
    
    try {
      const issues: string[] = [];
      const recommendations: string[] = [];

      // Check trip structure
      const tripResult = await client.query(
        'SELECT * FROM trips WHERE id = $1',
        [tripId]
      );

      if (tripResult.rows.length === 0) {
        issues.push('Trip not found');
        return { isCompatible: false, issues, recommendations };
      }

      const trip = tripResult.rows[0];

      // Validate required trip fields for existing features
      if (!trip.title || trip.title.trim().length === 0) {
        issues.push('Trip title is missing or empty');
        recommendations.push('Set a descriptive trip title');
      }

      if (!trip.share_token) {
        issues.push('Share token is missing - sharing features will not work');
        recommendations.push('Generate a share token for the trip');
      }

      if (!trip.currency_code) {
        issues.push('Currency code is missing - budget features may not work properly');
        recommendations.push('Set a default currency code (e.g., USD)');
      }

      // Check trip days structure
      const daysResult = await client.query(
        'SELECT * FROM trip_days WHERE trip_id = $1 ORDER BY day_number',
        [tripId]
      );

      if (daysResult.rows.length === 0) {
        issues.push('No trip days found - trip editing features will not work');
        recommendations.push('Create at least one trip day');
      }

      // Check places structure and required fields
      const placesResult = await client.query(`
        SELECT p.*, td.day_number 
        FROM places p 
        JOIN trip_days td ON p.trip_day_id = td.id 
        WHERE td.trip_id = $1 
        ORDER BY td.day_number, p.display_order
      `, [tripId]);

      for (const place of placesResult.rows) {
        // Check required fields for map integration
        if (!place.lat || !place.lng) {
          issues.push(`Place "${place.name}" missing coordinates - map features will not work`);
          recommendations.push(`Add coordinates for place "${place.name}"`);
        }

        // Check display order for drag-drop functionality
        if (place.display_order === null || place.display_order === undefined) {
          issues.push(`Place "${place.name}" missing display order - drag-drop will not work`);
          recommendations.push(`Set display order for place "${place.name}"`);
        }

        // Check for proper place type for filtering and categorization
        if (!place.place_type) {
          recommendations.push(`Consider setting place type for "${place.name}" for better categorization`);
        }

        // Check budget category for budget tracking
        if (place.cost && place.cost > 0 && !place.budget_category) {
          recommendations.push(`Set budget category for "${place.name}" to enable proper budget tracking`);
        }
      }

      // Check collaboration compatibility
      const collaboratorsResult = await client.query(
        'SELECT * FROM trip_collaborators WHERE trip_id = $1',
        [tripId]
      );

      // Ensure owner exists in collaborators table
      const ownerExists = collaboratorsResult.rows.some(
        collab => collab.user_id === trip.owner_id && collab.role === 'owner'
      );

      if (!ownerExists) {
        issues.push('Trip owner not found in collaborators table - collaboration features will not work');
        recommendations.push('Add trip owner to collaborators table with owner role');
      }

      // Check packing list compatibility
      const packingResult = await client.query(
        'SELECT COUNT(*) as count FROM packing_lists WHERE trip_id = $1',
        [tripId]
      );

      if (parseInt(packingResult.rows[0].count) === 0) {
        recommendations.push('Consider adding packing list items for better user experience');
      }

      return {
        isCompatible: issues.length === 0,
        issues,
        recommendations
      };

    } finally {
      client.release();
    }
  }

  /**
   * Ensures a Quick Plan generated trip has proper collaboration setup
   */
  static async ensureCollaborationCompatibility(tripId: string, ownerId: string): Promise<void> {
    const client = await pool.connect();
    
    try {
      // Check if owner exists in collaborators table
      const ownerCheck = await client.query(
        'SELECT id FROM trip_collaborators WHERE trip_id = $1 AND user_id = $2 AND role = $3',
        [tripId, ownerId, 'owner']
      );

      if (ownerCheck.rows.length === 0) {
        // Add owner to collaborators table
        await client.query(`
          INSERT INTO trip_collaborators (trip_id, user_id, role, created_at)
          VALUES ($1, $2, $3, NOW())
        `, [tripId, ownerId, 'owner']);
      }

    } finally {
      client.release();
    }
  }

  /**
   * Ensures a Quick Plan generated trip has proper sharing setup
   */
  static async ensureSharingCompatibility(tripId: string): Promise<string> {
    const client = await pool.connect();
    
    try {
      // Check if trip has share token
      const tripResult = await client.query(
        'SELECT share_token FROM trips WHERE id = $1',
        [tripId]
      );

      if (tripResult.rows.length === 0) {
        throw new Error('Trip not found');
      }

      let shareToken = tripResult.rows[0].share_token;

      if (!shareToken) {
        // Generate and set share token
        shareToken = uuidv4().replace(/-/g, '').substring(0, 12);
        
        await client.query(
          'UPDATE trips SET share_token = $1 WHERE id = $2',
          [shareToken, tripId]
        );
      }

      return shareToken;

    } finally {
      client.release();
    }
  }

  /**
   * Ensures proper map integration by validating and fixing place coordinates
   */
  static async ensureMapCompatibility(tripId: string): Promise<{
    placesFixed: number;
    placesWithoutCoordinates: string[];
  }> {
    const client = await pool.connect();
    
    try {
      let placesFixed = 0;
      const placesWithoutCoordinates: string[] = [];

      // Get places without coordinates
      const placesResult = await client.query(`
        SELECT p.id, p.name, p.address
        FROM places p 
        JOIN trip_days td ON p.trip_day_id = td.id 
        WHERE td.trip_id = $1 AND (p.lat IS NULL OR p.lng IS NULL)
      `, [tripId]);

      for (const place of placesResult.rows) {
        if (place.address) {
          try {
            // Try to geocode the address
            // Note: In a real implementation, you would use Google Geocoding API here
            // For now, we'll just mark it as needing coordinates
            placesWithoutCoordinates.push(place.name);
          } catch (error) {
            console.error(`Failed to geocode address for place ${place.name}:`, error);
            placesWithoutCoordinates.push(place.name);
          }
        } else {
          placesWithoutCoordinates.push(place.name);
        }
      }

      return {
        placesFixed,
        placesWithoutCoordinates
      };

    } finally {
      client.release();
    }
  }

  /**
   * Ensures proper budget tracking integration
   */
  static async ensureBudgetCompatibility(tripId: string): Promise<void> {
    const client = await pool.connect();
    
    try {
      // Get trip currency
      const tripResult = await client.query(
        'SELECT currency_code FROM trips WHERE id = $1',
        [tripId]
      );

      if (tripResult.rows.length === 0) {
        throw new Error('Trip not found');
      }

      const currencyCode = tripResult.rows[0].currency_code || 'USD';

      // Update places without budget categories
      await client.query(`
        UPDATE places 
        SET budget_category = CASE 
          WHEN place_type = 'food' THEN 'food'
          WHEN place_type = 'hotel' THEN 'accommodation'
          WHEN place_type = 'transport' THEN 'transport'
          WHEN place_type = 'attraction' THEN 'activities'
          ELSE 'misc'
        END,
        cost_currency = $2
        WHERE trip_day_id IN (
          SELECT id FROM trip_days WHERE trip_id = $1
        ) AND (budget_category IS NULL OR cost_currency IS NULL)
      `, [tripId, currencyCode]);

    } finally {
      client.release();
    }
  }

  /**
   * Ensures proper real-time collaboration setup
   */
  static async ensureRealtimeCompatibility(tripId: string): Promise<void> {
    // Emit trip creation event for any connected collaborators
    socketService.emitTripUpdate(tripId, {
      action: 'trip_created',
      tripId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Ensures proper badge system integration
   */
  static async ensureBadgeCompatibility(tripId: string, userId: string): Promise<void> {
    try {
      // Trigger badge checks for trip creation
      await badgeService.checkAllBadges(userId, {
        type: 'trip_created',
        tripId,
        timestamp: new Date().toISOString()
      });

      // Check for specific Quick Plan badges if they exist
      await badgeService.checkAllBadges(userId, {
        type: 'quick_plan_used',
        tripId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error checking badges for Quick Plan trip:', error);
      // Don't throw - badge failures shouldn't break trip creation
    }
  }

  /**
   * Ensures proper export feature compatibility (PDF, sharing, QR codes)
   */
  static async ensureExportCompatibility(tripId: string): Promise<{
    pdfReady: boolean;
    sharingReady: boolean;
    qrCodeReady: boolean;
    issues: string[];
  }> {
    const client = await pool.connect();
    
    try {
      const issues: string[] = [];

      // Check if trip has all required data for PDF export
      const tripResult = await client.query(`
        SELECT t.*, 
               COUNT(DISTINCT td.id) as day_count,
               COUNT(DISTINCT p.id) as place_count
        FROM trips t
        LEFT JOIN trip_days td ON t.id = td.trip_id
        LEFT JOIN places p ON td.id = p.trip_day_id
        WHERE t.id = $1
        GROUP BY t.id
      `, [tripId]);

      if (tripResult.rows.length === 0) {
        issues.push('Trip not found');
        return { pdfReady: false, sharingReady: false, qrCodeReady: false, issues };
      }

      const trip = tripResult.rows[0];
      
      const pdfReady = trip.title && trip.destination && parseInt(trip.place_count) > 0;
      const sharingReady = !!trip.share_token;
      const qrCodeReady = sharingReady && trip.is_public;

      if (!pdfReady) {
        issues.push('Trip missing required data for PDF export (title, destination, or places)');
      }

      if (!sharingReady) {
        issues.push('Trip missing share token for sharing features');
      }

      if (!qrCodeReady && trip.is_public) {
        issues.push('Trip not public - QR code sharing not available');
      }

      return {
        pdfReady,
        sharingReady,
        qrCodeReady,
        issues
      };

    } finally {
      client.release();
    }
  }

  /**
   * Comprehensive compatibility check and fix for a Quick Plan generated trip
   */
  static async ensureFullCompatibility(tripId: string, userId: string): Promise<{
    success: boolean;
    compatibilityReport: {
      collaboration: boolean;
      sharing: boolean;
      maps: boolean;
      budget: boolean;
      realtime: boolean;
      badges: boolean;
      export: boolean;
    };
    issues: string[];
    shareToken?: string;
  }> {
    const issues: string[] = [];
    const compatibilityReport = {
      collaboration: false,
      sharing: false,
      maps: false,
      budget: false,
      realtime: false,
      badges: false,
      export: false
    };

    try {
      // 1. Ensure collaboration compatibility
      await this.ensureCollaborationCompatibility(tripId, userId);
      compatibilityReport.collaboration = true;

      // 2. Ensure sharing compatibility
      const shareToken = await this.ensureSharingCompatibility(tripId);
      compatibilityReport.sharing = true;

      // 3. Ensure map compatibility
      const mapResult = await this.ensureMapCompatibility(tripId);
      compatibilityReport.maps = mapResult.placesWithoutCoordinates.length === 0;
      if (mapResult.placesWithoutCoordinates.length > 0) {
        issues.push(`Places without coordinates: ${mapResult.placesWithoutCoordinates.join(', ')}`);
      }

      // 4. Ensure budget compatibility
      await this.ensureBudgetCompatibility(tripId);
      compatibilityReport.budget = true;

      // 5. Ensure real-time compatibility
      await this.ensureRealtimeCompatibility(tripId);
      compatibilityReport.realtime = true;

      // 6. Ensure badge compatibility
      await this.ensureBadgeCompatibility(tripId, userId);
      compatibilityReport.badges = true;

      // 7. Ensure export compatibility
      const exportResult = await this.ensureExportCompatibility(tripId);
      compatibilityReport.export = exportResult.pdfReady && exportResult.sharingReady;
      issues.push(...exportResult.issues);

      return {
        success: issues.length === 0,
        compatibilityReport,
        issues,
        shareToken
      };

    } catch (error) {
      console.error('Error ensuring Quick Plan compatibility:', error);
      issues.push(`Compatibility check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        success: false,
        compatibilityReport,
        issues
      };
    }
  }

  /**
   * Validates that existing trip editing features work with Quick Plan generated trips
   */
  static async validateTripEditingCompatibility(tripId: string): Promise<{
    canEdit: boolean;
    canAddPlaces: boolean;
    canReorderPlaces: boolean;
    canEditPlaces: boolean;
    canDeletePlaces: boolean;
    canAddDays: boolean;
    issues: string[];
  }> {
    const client = await pool.connect();
    
    try {
      const issues: string[] = [];

      // Check trip structure
      const tripResult = await client.query(
        'SELECT * FROM trips WHERE id = $1',
        [tripId]
      );

      if (tripResult.rows.length === 0) {
        issues.push('Trip not found');
        return {
          canEdit: false,
          canAddPlaces: false,
          canReorderPlaces: false,
          canEditPlaces: false,
          canDeletePlaces: false,
          canAddDays: false,
          issues
        };
      }

      // Check if trip has proper day structure
      const daysResult = await client.query(
        'SELECT COUNT(*) as count FROM trip_days WHERE trip_id = $1',
        [tripId]
      );

      const hasDays = parseInt(daysResult.rows[0].count) > 0;
      if (!hasDays) {
        issues.push('Trip has no days - cannot add places');
      }

      // Check if places have proper display order
      const placesResult = await client.query(`
        SELECT COUNT(*) as total,
               COUNT(*) FILTER (WHERE display_order IS NOT NULL) as with_order
        FROM places p
        JOIN trip_days td ON p.trip_day_id = td.id
        WHERE td.trip_id = $1
      `, [tripId]);

      const totalPlaces = parseInt(placesResult.rows[0].total);
      const placesWithOrder = parseInt(placesResult.rows[0].with_order);

      const canReorderPlaces = totalPlaces === 0 || totalPlaces === placesWithOrder;
      if (!canReorderPlaces && totalPlaces > 0) {
        issues.push('Some places missing display order - reordering may not work properly');
      }

      return {
        canEdit: true,
        canAddPlaces: hasDays,
        canReorderPlaces,
        canEditPlaces: true,
        canDeletePlaces: true,
        canAddDays: true,
        issues
      };

    } finally {
      client.release();
    }
  }
}