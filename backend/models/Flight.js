const mongoose = require('mongoose');

const flightSchema = mongoose.Schema({
  flight_id: { type: String, required: true, unique: true, index: true },
  airline: { type: String, required: true },
  departure_city: { type: String, required: true },
  arrival_city: { type: String, required: true },
  departure_date: { type: Date, required: true }, // Date when flight departs
  departure_time: { type: String, required: true }, // HH:MM format (24-hour)
  arrival_time: { type: String, required: true }, // HH:MM format (24-hour)
  base_price: { type: Number, required: true, min: 0 },
  current_price: { type: Number, required: true, min: 0 },
  last_price_update: { type: Date, default: Date.now },
}, { timestamps: true });

// Create indexes for better query performance
flightSchema.index({ airline: 1, departure_city: 1, arrival_city: 1 });

module.exports = mongoose.model('Flight', flightSchema);
