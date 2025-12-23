const express = require('express');
const router = express.Router();
const { createBooking, getMyBookings, downloadTicket, getBookingById } = require('../controllers/bookingController');
const auth = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

// All booking routes require authentication
router.use(auth);

// POST create a new booking - wrapped with asyncHandler to catch async errors
router.post('/', asyncHandler(createBooking));

// GET all bookings for a user
router.get('/', asyncHandler(getMyBookings));

// GET booking details by ID
router.get('/:bookingId', asyncHandler(getBookingById));

// GET download PDF ticket by booking ID
router.get('/:bookingId/ticket', asyncHandler(downloadTicket));

module.exports = router;
