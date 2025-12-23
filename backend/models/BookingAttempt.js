const mongoose = require('mongoose');

const bookingAttemptSchema = mongoose.Schema({
  user_id: { type: String, required: true, index: true },
  flight_id: { type: String, required: true, index: true },
  attempt_time: { type: Date, default: Date.now },
  price_at_attempt: { type: Number, required: true },
}, { timestamps: true });

// Compound index for querying attempts by user and flight
bookingAttemptSchema.index({ user_id: 1, flight_id: 1, attempt_time: -1 });

// TTL index to automatically delete documents older than 15 minutes
bookingAttemptSchema.index({ attempt_time: 1 }, { expireAfterSeconds: 900 });

module.exports = mongoose.model('BookingAttempt', bookingAttemptSchema);
