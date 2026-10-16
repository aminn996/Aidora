const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    payer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    payee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Payment amount details
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'TND' },
    platformFee: { type: Number, default: 0 },
    netAmount: { type: Number, default: 0 },
    feePercent: { type: Number, default: 10 },
    
    // Payment method
    paymentMethod: {
      type: String,
      enum: ['card', 'd17', 'mobile_wallet', 'bank_transfer', 'pending'],
      default: 'pending',
    },
    cardDetails: {
      brand: String, // visa, mastercard, amex
      last4: String,
      expiryMonth: Number,
      expiryYear: Number,
    },
    
    // Stripe integration
    stripePaymentIntentId: String,
    stripeCustomerId: String,
    stripeChargeId: String,

    // D17 integration
    providerTxnId: String, // D17 reference id
    
    // Payment status
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
      default: 'pending',
    },
    
    // Payment history
    paidAt: Date,
    refundedAt: Date,
    refundAmount: { type: Number, default: 0 },
    refundReason: String,
    
    // Error tracking
    failureReason: String,
    failureCode: String,
    errorMessage: String,
    
    // Metadata
    invoiceNumber: String,
    notes: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

// Index for faster queries
PaymentSchema.index({ booking: 1 });
PaymentSchema.index({ payer: 1 });
PaymentSchema.index({ payee: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', PaymentSchema);
