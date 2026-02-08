import express from 'express';
import { BookingController } from '../controllers/bookingController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.get('/trip/:tripId', authenticateToken, BookingController.getBookingsByTrip);
router.post('/', authenticateToken, BookingController.createBooking);
router.put('/:bookingId', authenticateToken, BookingController.updateBooking);
router.delete('/:bookingId', authenticateToken, BookingController.deleteBooking);

export default router;
