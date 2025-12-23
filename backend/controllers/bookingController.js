const Booking = require('../models/Booking');
const Flight = require('../models/Flight');
const User = require('../models/User');
const { resolveUser } = require('../services/walletService');
const { recordBookingAttempt, applyDynamicPricing } = require('../services/pricingService');
const { generateTicketPDF, getPDFPathByPNR } = require('../services/pdfService');
const fs = require('fs');

const createBooking = async (req, res, next) => {
  try {
    console.log('createBooking started, userId:', req.userId);
    const userId = req.userId; // Get from auth middleware
    const { flightId, passengerName, passengerCount = 1, pnr: customPNR, passenger_details, returnFlightId } = req.body;
    // Validate passenger count
    const passCount = Math.min(9, Math.max(1, parseInt(passengerCount) || 1));

    // Find outbound flight by flight_id (not MongoDB _id)
    const flight = await Flight.findOne({ flight_id: flightId });
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    // If returnFlightId provided, find return flight
    let returnFlight = null;
    if (returnFlightId) {
      returnFlight = await Flight.findOne({ flight_id: returnFlightId });
      if (!returnFlight) {
        return res.status(404).json({ message: 'Return flight not found' });
      }
    }
    
    // Get user from auth token
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Record booking attempts and apply dynamic pricing for each leg
    await recordBookingAttempt(userId.toString(), flightId, flight.current_price);
    let updatedFlight = flight;
    try {
      updatedFlight = await applyDynamicPricing(userId.toString(), flightId);
    } catch (pricingError) {
      console.error('Pricing error (non-fatal):', pricingError.message);
    }
    const outboundPricePerPassenger = updatedFlight.current_price;

    let returnPricePerPassenger = 0;
    if (returnFlight) {
      await recordBookingAttempt(userId.toString(), returnFlightId, returnFlight.current_price);
      try {
        const updatedReturn = await applyDynamicPricing(userId.toString(), returnFlightId);
        returnPricePerPassenger = updatedReturn.current_price;
      } catch (pricingError) {
        console.error('Pricing error for return leg (non-fatal):', pricingError.message);
        returnPricePerPassenger = returnFlight.current_price;
      }
    }

    const totalPrice = (outboundPricePerPassenger + (returnPricePerPassenger || 0)) * passCount;

    // Check wallet balance
    if (user.walletBalance < totalPrice) {
        return res.status(400).json({ 
          message: 'Insufficient funds',
          required: totalPrice,
          available: user.walletBalance
        });
    }

    // Deduct price from wallet (single transaction for whole round-trip)
    user.walletBalance -= totalPrice;
    try {
      await user.save();
      console.log('User saved successfully after wallet deduction');
    } catch (saveError) {
      console.error('Error saving user after wallet deduction:', saveError.message, saveError.stack);
      throw saveError;
    }

    // Generate PNR root (we'll generate separate PNRs per leg)
    const basePNR = customPNR || generatePNR();

    // Build passenger details array (ensure length equals passCount)
    const passengers = Array.isArray(passenger_details) && passenger_details.length > 0
      ? passenger_details.slice(0, passCount)
      : Array.from({ length: passCount }, (_, i) => ({ name: (passengerName || user.name) + (passCount > 1 ? ` #${i+1}` : ''), age: null }));

    // Create outbound booking
    const outboundPNR = basePNR + 'O';
    const outboundBooking = await Booking.create({
      user_id: user._id,
      passenger_name: passengers[0]?.name || user.name,
      passenger_details: passengers,
      flight_id: flightId,
      airline: flight.airline,
      route: `${flight.departure_city}-${flight.arrival_city}`,
      price_paid: outboundPricePerPassenger * passCount,
      passenger_count: passCount,
      base_price_per_passenger: outboundPricePerPassenger,
      pnr: outboundPNR,
      is_return: false,
    });

    let outboundPdf = null;
    try {
      outboundPdf = await generateTicketPDF({
        passenger_details: passengers,
        airline: outboundBooking.airline,
        flightId: outboundBooking.flight_id,
        departureCity: flight.departure_city,
        arrivalCity: flight.arrival_city,
        departureTime: flight.departure_time,
        arrivalTime: flight.arrival_time,
        flightDate: flight.departure_date,
        pnr: outboundBooking.pnr,
        pricePaid: outboundBooking.price_paid,
        bookingDate: outboundBooking.booking_time,
        bookingId: outboundBooking._id.toString(),
        legLabel: 'Outbound'
      });
    } catch (pdfError) {
      console.error('Outbound PDF generation error:', pdfError.message);
    }

    let returnBooking = null;
    let returnPdf = null;
    if (returnFlight) {
      const returnPNR = basePNR + 'R';
      // create return booking with reversed route for display
      // Store the actual flight route, but we'll swap cities when generating PDF
      returnBooking = await Booking.create({
        user_id: user._id,
        passenger_name: passengers[0]?.name || user.name,
        passenger_details: passengers,
        flight_id: returnFlightId,
        airline: returnFlight.airline,
        // Store reversed route for return leg: arrival_city to departure_city
        route: `${returnFlight.arrival_city}-${returnFlight.departure_city}`,
        price_paid: returnPricePerPassenger * passCount,
        passenger_count: passCount,
        base_price_per_passenger: returnPricePerPassenger,
        pnr: returnPNR,
        is_return: true,
      });

      try {
        // For return flight, swap cities to show the correct route (destination to origin)
        // The return flight should show: arrival_city → departure_city (reversed from outbound)
        returnPdf = await generateTicketPDF({
          passenger_details: passengers,
          airline: returnBooking.airline,
          flightId: returnBooking.flight_id,
          departureCity: returnFlight.arrival_city, // Swapped: show destination as departure
          arrivalCity: returnFlight.departure_city, // Swapped: show origin as arrival
          departureTime: returnFlight.departure_time,
          arrivalTime: returnFlight.arrival_time,
          flightDate: returnFlight.departure_date,
          pnr: returnBooking.pnr,
          pricePaid: returnBooking.price_paid,
          bookingDate: returnBooking.booking_time,
          bookingId: returnBooking._id.toString(),
          legLabel: 'Return'
        });
      } catch (pdfError) {
        console.error('Return PDF generation error:', pdfError.message);
      }
    }

    // Build response - include both bookings when round-trip
    const responsePayload = {
      message: 'Booking successful',
      outbound: {
        _id: outboundBooking._id,
        flight_id: outboundBooking.flight_id,
        airline: outboundBooking.airline,
        route: outboundBooking.route,
        price_paid: outboundBooking.price_paid,
        passenger_count: outboundBooking.passenger_count,
        base_price_per_passenger: outboundBooking.base_price_per_passenger,
        pnr: outboundBooking.pnr,
        booking_time: outboundBooking.booking_time,
        downloadUrl: outboundPdf ? `/api/bookings/${outboundBooking._id}/ticket` : null,
      },
      totalPrice: totalPrice,
      remainingBalance: user.walletBalance,
    };

    if (returnBooking) {
      responsePayload.return = {
        _id: returnBooking._id,
        flight_id: returnBooking.flight_id,
        airline: returnBooking.airline,
        route: returnBooking.route,
        price_paid: returnBooking.price_paid,
        passenger_count: returnBooking.passenger_count,
        base_price_per_passenger: returnBooking.base_price_per_passenger,
        pnr: returnBooking.pnr,
        booking_time: returnBooking.booking_time,
        downloadUrl: returnPdf ? `/api/bookings/${returnBooking._id}/ticket` : null,
      };
    }

    res.status(201).json(responsePayload);
  } catch (error) {
    console.error('createBooking error:', error);
    // If response hasn't been sent, send error response
    if (!res.headersSent) {
      res.status(400).json({ message: error.message || 'Booking failed' });
    } else {
      // If response already sent, log error (can't send another response)
      // asyncHandler wrapper will catch any unhandled promise rejections
      console.error('Error occurred after response was sent:', error);
    }
  }
};

const getMyBookings = async (req, res) => {
  try {
    const userId = req.userId; // Get from auth middleware
    const bookings = await Booking.find({ user_id: userId });
    res.json({
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error('getMyBookings error:', error);
    res.status(500).json({ message: error.message });
  }
}

/**
 * Download PDF ticket by booking ID
 */
const downloadTicket = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Find booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Get PDF path
    const pdfPath = getPDFPathByPNR(booking.pnr);
    if (!pdfPath || !fs.existsSync(pdfPath)) {
      return res.status(404).json({ 
        message: 'Ticket PDF not found',
        pnr: booking.pnr,
      });
    }

    // Send file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ticket_${booking.pnr}.pdf"`);
    
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);

    fileStream.on('error', () => {
      res.status(500).json({ message: 'Error downloading ticket' });
    });
  } catch (error) {
    console.error('downloadTicket error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get booking details by ID
 */
const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error('getBookingById error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Generate a unique PNR (Passenger Name Record)
 */
const generatePNR = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let pnr = '';
  for (let i = 0; i < 6; i++) {
    pnr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pnr;
};

module.exports = { createBooking, getMyBookings, downloadTicket, getBookingById };
