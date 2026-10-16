const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    slot: { type: String },
    price: { type: Number, required: true },
    currency: { type: String, default: 'TND' },
    status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
    notes: { type: String },
    platformFeePercent: { type: Number, default: 0.1 },
    platformFeeAmount: { type: Number, default: 0 },
    providerEarning: { type: Number, default: 0 },
    payment: {
      method: { type: String, enum: ['stripe', 'd17', 'pending'], default: 'pending' },
      transactionId: { type: String },
      status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
      paidAt: { type: Date },
    },
    review: { type: mongoose.Schema.Types.ObjectId, ref: 'Review' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', BookingSchema);
