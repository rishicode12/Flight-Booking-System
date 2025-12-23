const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  passenger_name: { type: String, required: true },
  // Detailed passenger information for multi-passenger bookings
  passenger_details: [
    {
      name: { type: String, required: true },
      age: { type: Number, required: false },
    }
  ],
  flight_id: { type: String, required: true, index: true },
  airline: { type: String, required: true },
  route: { type: String, required: true },
  price_paid: { type: Number, required: true, min: 0 },
  passenger_count: { type: Number, default: 1, min: 1, max: 9 },
  base_price_per_passenger: { type: Number, required: true, min: 0 },
  // Whether this booking is a return leg (useful to group round-trips)
  is_return: { type: Boolean, default: false },
  booking_time: { type: Date, default: Date.now },
  pnr: { type: String, required: true, unique: true, index: true },
}, { timestamps: true });

// Create indexes for better query performance
bookingSchema.index({ flight_id: 1, passenger_name: 1 });
bookingSchema.index({ booking_time: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
