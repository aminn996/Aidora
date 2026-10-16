const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const WalletSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    balance: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'TND' },
    
    // Multi-currency balances
    currencies: {
      type: Map,
      of: Number,
      default: () => new Map([['TND', 0]])
    },
    
    // Pending amounts
    pendingWithdrawal: { type: Number, default: 0 },
    pendingDeposit: { type: Number, default: 0 },
    
    // Totals
    totalDeposited: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 }, // For providers
    totalSpent: { type: Number, default: 0 },
    
    // Status
    isActive: { type: Boolean, default: true },
    isFrozen: { type: Boolean, default: false },
    frozenReason: String,
    frozenAt: Date,
    
    // Security
    pin: { type: String, select: false }, // 4-6 digit PIN
    pinEnabled: { type: Boolean, default: false },
    twoFactorEnabled: { type: Boolean, default: false },
    lastPinAttempt: Date,
    failedPinAttempts: { type: Number, default: 0 },
    
    // Limits
    limits: {
      dailyWithdrawal: { type: Number, default: 1000 },
      dailyDeposit: { type: Number, default: 5000 },
      singleTransaction: { type: Number, default: 2000 },
    },
    
    // Usage tracking
    lastTransaction: Date,
    lastDeposit: Date,
    lastWithdrawal: Date,
    
    // Notifications
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      lowBalance: { type: Boolean, default: true },
      lowBalanceThreshold: { type: Number, default: 50 },
      transactionAlerts: { type: Boolean, default: true },
    },
    
    // Auto-reload
    autoReload: {
      enabled: { type: Boolean, default: false },
      threshold: { type: Number, default: 100 },
      amount: { type: Number, default: 200 },
      method: { type: String, enum: ['card', 'd17', 'paymee'] },
    },
    
    // Bank details for withdrawals
    bankDetails: {
      accountName: String,
      accountNumber: String,
      bankName: String,
      iban: String,
      swift: String,
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
    },
    
    // Analytics
    analytics: {
      monthlySpending: { type: Map, of: Number },
      categorySpending: { type: Map, of: Number },
      averageTransaction: { type: Number, default: 0 },
      transactionCount: { type: Number, default: 0 },
    },
    
    // Metadata
    metadata: {
      preferredPaymentMethod: String,
      timezone: { type: String, default: 'Africa/Tunis' },
      language: { type: String, default: 'en' },
    },
  },
  { timestamps: true }
);

// Hash PIN before saving
WalletSchema.pre('save', async function(next) {
  if (this.isModified('pin') && this.pin) {
    this.pin = await bcrypt.hash(this.pin, 10);
  }
  next();
});

// Method to verify PIN
WalletSchema.methods.verifyPin = async function(pin) {
  if (!this.pin || !this.pinEnabled) return false;
  return await bcrypt.compare(pin, this.pin);
};

// Method to check if wallet is within limits
WalletSchema.methods.checkLimit = function(amount, type) {
  switch(type) {
    case 'withdrawal':
      return amount <= this.limits.dailyWithdrawal;
    case 'deposit':
      return amount <= this.limits.dailyDeposit;
    case 'transaction':
      return amount <= this.limits.singleTransaction;
    default:
      return true;
  }
};

// Method to update analytics
WalletSchema.methods.updateAnalytics = function(amount, category = 'general') {
  this.analytics.transactionCount += 1;
  this.analytics.averageTransaction = 
    (this.analytics.averageTransaction * (this.analytics.transactionCount - 1) + amount) / 
    this.analytics.transactionCount;
  
  const month = new Date().toISOString().slice(0, 7);
  const currentMonthly = this.analytics.monthlySpending.get(month) || 0;
  this.analytics.monthlySpending.set(month, currentMonthly + amount);
  
  const currentCategory = this.analytics.categorySpending.get(category) || 0;
  this.analytics.categorySpending.set(category, currentCategory + amount);
};

// Index for faster queries
WalletSchema.index({ user: 1 });
WalletSchema.index({ isActive: 1 });
WalletSchema.index({ currency: 1 });
WalletSchema.index({ 'bankDetails.verified': 1 });

module.exports = mongoose.model('Wallet', WalletSchema);
