const express = require('express');
const router = express.Router();
const { getFlights, seedFlightsController, searchFlightsController } = require('../controllers/flightController');

// GET all flights (returns exactly 10)
router.get('/', getFlights);

// POST seed flights (run once to populate database)
router.post('/seed', seedFlightsController);

// GET search flights by from and to cities
router.get('/search', searchFlightsController);

module.exports = router;
