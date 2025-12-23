const Flight = require('../models/Flight');
const BookingAttempt = require('../models/BookingAttempt');

// Time windows (in milliseconds)
const PRICE_INCREASE_WINDOW = 5 * 60 * 1000; // 5 minutes
const PRICE_RESET_WINDOW = 10 * 60 * 1000; // 10 minutes
const ATTEMPTS_THRESHOLD = 3; // 3 attempts within 5 minutes triggers price increase
const PRICE_INCREASE_PERCENTAGE = 0.10; // 10% increase

/**
 * Record a booking attempt for a user on a flight
 * @param {string} userId - User ID
 * @param {string} flightId - Flight ID
 * @param {number} currentPrice - Current price at the time of attempt
 */
const recordBookingAttempt = async (userId, flightId, currentPrice) => {
  try {
    const attempt = await BookingAttempt.create({
      user_id: userId,
      flight_id: flightId,
      price_at_attempt: currentPrice,
    });
    return attempt;
  } catch (error) {
    throw new Error(`Error recording booking attempt: ${error.message}`);
  }
};

/**
 * Get recent booking attempts for a user on a specific flight
 * @param {string} userId - User ID
 * @param {string} flightId - Flight ID
 * @param {number} windowMs - Time window in milliseconds
 */
const getRecentAttempts = async (userId, flightId, windowMs) => {
  try {
    const cutoffTime = new Date(Date.now() - windowMs);
    const attempts = await BookingAttempt.find({
      user_id: userId,
      flight_id: flightId,
      attempt_time: { $gte: cutoffTime },
    }).sort({ attempt_time: -1 });
    return attempts;
  } catch (error) {
    throw new Error(`Error fetching booking attempts: ${error.message}`);
  }
};

/**
 * Check if price should be increased due to multiple booking attempts
 * @param {string} userId - User ID
 * @param {string} flightId - Flight ID
 * @returns {boolean} true if price should be increased
 */
const shouldIncreasePriceForAttempts = async (userId, flightId) => {
  try {
    const recentAttempts = await getRecentAttempts(userId, flightId, PRICE_INCREASE_WINDOW);
    return recentAttempts.length >= ATTEMPTS_THRESHOLD;
  } catch (error) {
    throw new Error(`Error checking price increase threshold: ${error.message}`);
  }
};

/**
 * Update flight price with 10% increase
 * @param {string} flightId - Flight ID
 */
const increasePriceByPercentage = async (flightId) => {
  try {
    const flight = await Flight.findOne({ flight_id: flightId });
    if (!flight) {
      throw new Error('Flight not found');
    }

    const newPrice = flight.current_price * (1 + PRICE_INCREASE_PERCENTAGE);
    
    // Use updateOne to avoid validation issues
    await Flight.updateOne(
      { flight_id: flightId },
      {
        current_price: parseFloat(newPrice.toFixed(2)),
        last_price_update: new Date(),
      }
    );

    return flight;
  } catch (error) {
    throw new Error(`Error increasing price: ${error.message}`);
  }
};

/**
 * Reset flight price to base_price
 * @param {string} flightId - Flight ID
 */
const resetPriceToBase = async (flightId) => {
  try {
    const flight = await Flight.findOne({ flight_id: flightId });
    if (!flight) {
      throw new Error('Flight not found');
    }

    if (flight.current_price !== flight.base_price) {
      // Use updateOne to avoid validation issues with required fields
      await Flight.updateOne(
        { flight_id: flightId },
        {
          current_price: flight.base_price,
          last_price_update: new Date(),
        }
      );
    }

    return flight;
  } catch (error) {
    throw new Error(`Error resetting price: ${error.message}`);
  }
};

/**
 * Check if a flight price needs to be reset based on time elapsed since last update
 * @param {string} flightId - Flight ID
 * @returns {boolean} true if price should be reset
 */
const shouldResetPrice = async (flightId) => {
  try {
    const flight = await Flight.findOne({ flight_id: flightId });
    if (!flight) {
      throw new Error('Flight not found');
    }

    const timeSinceLastUpdate = Date.now() - flight.last_price_update.getTime();
    return timeSinceLastUpdate >= PRICE_RESET_WINDOW && flight.current_price !== flight.base_price;
  } catch (error) {
    throw new Error(`Error checking price reset: ${error.message}`);
  }
};

/**
 * Apply dynamic pricing rules for a user-flight combination
 * Returns the current price after applying all pricing rules
 * @param {string} userId - User ID
 * @param {string} flightId - Flight ID
 */
const applyDynamicPricing = async (userId, flightId) => {
  try {
    // First, check if price needs to be reset
    if (await shouldResetPrice(flightId)) {
      await resetPriceToBase(flightId);
    }

    // Then, check if price should be increased due to booking attempts
    if (await shouldIncreasePriceForAttempts(userId, flightId)) {
      const flight = await Flight.findOne({ flight_id: flightId });
      // Only increase if not already increased
      if (flight.current_price === flight.base_price) {
        await increasePriceByPercentage(flightId);
      }
    }

    // Return the current flight with updated price
    const updatedFlight = await Flight.findOne({ flight_id: flightId });
    return updatedFlight;
  } catch (error) {
    throw new Error(`Error applying dynamic pricing: ${error.message}`);
  }
};

module.exports = {
  recordBookingAttempt,
  getRecentAttempts,
  shouldIncreasePriceForAttempts,
  increasePriceByPercentage,
  resetPriceToBase,
  shouldResetPrice,
  applyDynamicPricing,
};
