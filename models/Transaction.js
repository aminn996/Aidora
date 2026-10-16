const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    wallet: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: true },
    
    // Transaction details
    type: { 
      type: String, 
      enum: ['deposit', 'withdrawal', 'payment', 'refund', 'earning', 'fee', 'adjustment', 'transfer'],
      required: true 
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'TND' },
    
    // Status
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'reversed'],
      default: 'pending'
    },
    
    // Payment method
    method: {
      type: String,
      enum: ['card', 'd17', 'paymee', 'bank_transfer', 'wallet', 'manual', 'auto_reload'],
      default: 'wallet'
    },
    
    // Category and tags
    category: {
      type: String,
      enum: ['booking', 'service', 'withdrawal', 'deposit', 'refund', 'fee', 'transfer', 'other'],
      default: 'other'
    },
    tags: [String],
    
    // References
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    
    // External references
    stripePaymentIntentId: String,
    providerTxnId: String, // D17 or other provider
    
    // Description
    description: String,
    notes: String,
    
    // For withdrawals
    withdrawalMethod: {
      type: String,
      enum: ['bank_transfer', 'mobile_wallet', 'check'],
    },
    withdrawalDetails: {
      accountName: String,
      accountNumber: String,
      bankName: String,
      reference: String,
    },
    
    // Timestamps
    processedAt: Date,
    completedAt: Date,
    
    // Admin actions
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    adminNotes: String,
    
    // Balance snapshots
    balanceBefore: Number,
    balanceAfter: Number,
    
    // Failure tracking
    failureReason: String,
    failureCode: String,
    
    // Receipt and documentation
    receiptUrl: String,
    receiptGenerated: { type: Boolean, default: false },
    
    // Location tracking
    location: {
      ip: String,
      country: String,
      city: String,
    },
    
    // Device info
    device: {
      type: String,
      browser: String,
      os: String,
    },
    
    // Transfer details (for wallet-to-wallet transfers)
    transferTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    transferFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    // Metadata
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

// Virtual for formatted amount
TransactionSchema.virtual('formattedAmount').get(function() {
  return `${this.amount.toFixed(2)} ${this.currency}`;
});

// Method to generate receipt
TransactionSchema.methods.generateReceipt = async function() {
  // Will be implemented in utils
  return `/receipts/${this._id}.pdf`;
};

// Indexes
TransactionSchema.index({ user: 1, createdAt: -1 });
TransactionSchema.index({ wallet: 1 });
TransactionSchema.index({ type: 1, status: 1 });
TransactionSchema.index({ booking: 1 });
TransactionSchema.index({ payment: 1 });

module.exports = mongoose.model('Transaction', TransactionSchema);
