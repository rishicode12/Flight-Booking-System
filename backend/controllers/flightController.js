const { seedFlights, getAllFlights, searchFlights } = require('../services/flightService');

// Seed flights into database (run once)
const seedFlightsController = async (req, res) => {
  try {
    const result = await seedFlights();
    if (!result.success) {
      // Non-fatal: flights already seeded or not needed — return 200 with informative payload
      return res.status(200).json({ message: result.message, count: result.data ? result.data.length : 0, data: result.data || [] });
    }
    res.status(201).json({
      message: result.message,
      count: result.data.length,
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all flights (returns exactly 10 flights)
const getFlights = async (req, res) => {
  try {
    const flights = await getAllFlights();
    res.status(200).json({
      count: flights.length,
      data: flights,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search flights by departure and arrival city
const searchFlightsController = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from && !to) {
      return res.status(400).json({
        message: 'Please provide at least one search parameter (from or to)',
      });
    }

    const flights = await searchFlights(from, to);
    res.status(200).json({
      count: flights.length,
      data: flights,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getFlights, seedFlightsController, searchFlightsController };
