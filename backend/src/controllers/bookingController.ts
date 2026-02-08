import { Request, Response } from 'express';
import { pool } from '../config/database.js';

export class BookingController {
  /**
   * GET /api/bookings/trip/:tripId
   * Get all bookings for a trip
   */
  static async getBookingsByTrip(req: Request, res: Response): Promise<void> {
    try {
      const { tripId } = req.params;
      const userId = req.user?.id || req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Verify user has access to this trip
      const tripAccess = await pool.query(
        `SELECT 1 FROM trips 
         WHERE id = $1 AND (owner_id = $2 OR id IN (
           SELECT trip_id FROM trip_collaborators WHERE user_id = $2
         ))`,
        [tripId, userId]
      );

      if (tripAccess.rows.length === 0) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Get all bookings for this trip
      const result = await pool.query(
        `SELECT b.*, u.first_name, u.last_name, u.email as created_by_email
         FROM bookings b
         LEFT JOIN users u ON b.user_id = u.id
         WHERE b.trip_id = $1
         ORDER BY b.booking_date ASC NULLS LAST, b.created_at DESC`,
        [tripId]
      );

      res.json({ bookings: result.rows });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * POST /api/bookings
   * Create a new booking
   */
  static async createBooking(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const {
        tripId,
        title,
        type,
        status,
        bookingDate,
        startTime,
        endTime,
        location,
        address,
        confirmationNumber,
        contactName,
        contactPhone,
        contactEmail,
        websiteUrl,
        price,
        currency,
        paymentStatus,
        notes,
        attachments
      } = req.body;

      // Verify user has access to this trip
      const tripAccess = await pool.query(
        `SELECT 1 FROM trips 
         WHERE id = $1 AND (owner_id = $2 OR id IN (
           SELECT trip_id FROM trip_collaborators WHERE user_id = $2
         ))`,
        [tripId, userId]
      );

      if (tripAccess.rows.length === 0) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const result = await pool.query(
        `INSERT INTO bookings (
          trip_id, user_id, title, type, status, booking_date, start_time, end_time,
          location, address, confirmation_number, contact_name, contact_phone,
          contact_email, website_url, price, currency, payment_status, notes, attachments
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        RETURNING *`,
        [
          tripId, userId, title, type, status || 'pending', bookingDate, startTime, endTime,
          location, address, confirmationNumber, contactName, contactPhone,
          contactEmail, websiteUrl, price, currency || 'USD', paymentStatus || 'unpaid',
          notes, JSON.stringify(attachments || [])
        ]
      );

      res.status(201).json({ booking: result.rows[0] });
    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * PUT /api/bookings/:bookingId
   * Update a booking
   */
  static async updateBooking(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      const userId = req.user?.id || req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const {
        title, type, status, bookingDate, startTime, endTime,
        location, address, confirmationNumber, contactName, contactPhone,
        contactEmail, websiteUrl, price, currency, paymentStatus, notes, attachments
      } = req.body;

      // Verify user has access to this booking's trip
      const accessCheck = await pool.query(
        `SELECT b.trip_id FROM bookings b
         JOIN trips t ON b.trip_id = t.id
         WHERE b.id = $1 AND (t.owner_id = $2 OR t.id IN (
           SELECT trip_id FROM trip_collaborators WHERE user_id = $2
         ))`,
        [bookingId, userId]
      );

      if (accessCheck.rows.length === 0) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const result = await pool.query(
        `UPDATE bookings SET
          title = COALESCE($1, title),
          type = COALESCE($2, type),
          status = COALESCE($3, status),
          booking_date = COALESCE($4, booking_date),
          start_time = COALESCE($5, start_time),
          end_time = COALESCE($6, end_time),
          location = COALESCE($7, location),
          address = COALESCE($8, address),
          confirmation_number = COALESCE($9, confirmation_number),
          contact_name = COALESCE($10, contact_name),
          contact_phone = COALESCE($11, contact_phone),
          contact_email = COALESCE($12, contact_email),
          website_url = COALESCE($13, website_url),
          price = COALESCE($14, price),
          currency = COALESCE($15, currency),
          payment_status = COALESCE($16, payment_status),
          notes = COALESCE($17, notes),
          attachments = COALESCE($18, attachments)
         WHERE id = $19
         RETURNING *`,
        [
          title, type, status, bookingDate, startTime, endTime,
          location, address, confirmationNumber, contactName, contactPhone,
          contactEmail, websiteUrl, price, currency, paymentStatus, notes,
          attachments ? JSON.stringify(attachments) : null,
          bookingId
        ]
      );

      res.json({ booking: result.rows[0] });
    } catch (error) {
      console.error('Error updating booking:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * DELETE /api/bookings/:bookingId
   * Delete a booking
   */
  static async deleteBooking(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      const userId = req.user?.id || req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Verify user has access to this booking's trip
      const accessCheck = await pool.query(
        `SELECT b.trip_id FROM bookings b
         JOIN trips t ON b.trip_id = t.id
         WHERE b.id = $1 AND (t.owner_id = $2 OR t.id IN (
           SELECT trip_id FROM trip_collaborators WHERE user_id = $2
         ))`,
        [bookingId, userId]
      );

      if (accessCheck.rows.length === 0) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      await pool.query('DELETE FROM bookings WHERE id = $1', [bookingId]);

      res.json({ message: 'Booking deleted successfully' });
    } catch (error) {
      console.error('Error deleting booking:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
