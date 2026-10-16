// Payment Gateway Configuration
// Note: Stripe is not available in Tunisia. Card rails are disabled; use D17/other PSPs.

// Lazy-load Stripe to avoid errors when API key is not configured
let stripe = null;

const getStripe = () => {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

/**
 * Payment Methods Configuration for Tunisia
 * Supported: Visa, Mastercard, and local payment methods
 */
const PAYMENT_METHODS = {
  CARD: {
    id: 'card',
    name: 'Credit/Debit Card',
    types: ['visa', 'mastercard', 'amex'],
    description: 'Stripe is unavailable in Tunisia; card rails are disabled.',
    enabled: false,
  },
  MOBILE_WALLET: {
    id: 'mobile_wallet',
    name: 'Mobile Wallet',
    types: ['ooredoo', 'tunisie_telecom', 'orange'],
    description: 'Ooredoo Flouci, Tunisie Telecom Paymee',
    enabled: true,
  },
  BANK_TRANSFER: {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    description: 'Direct bank transfer',
    enabled: true,
  },
};

/**
 * Initialize Stripe Payment Intent
 * @param {number} amount - Amount in smallest currency unit (fils for TND)
 * @param {string} currency - Currency code (TND)
 * @param {string} customerId - Customer ID from database
 * @param {object} metadata - Additional metadata
 * @returns {Promise<object>} - Stripe PaymentIntent
 */
const createPaymentIntent = async (amount, currency = 'tnd', customerId = null, metadata = {}) => {
  throw new Error('Stripe card processing is not available in Tunisia. Use D17/other PSP.');
};

/**
 * Retrieve Payment Intent
 * @param {string} paymentIntentId - Payment Intent ID from Stripe
 * @returns {Promise<object>} - Payment Intent details
 */
const getPaymentIntent = async (paymentIntentId) => {
  throw new Error('Stripe card processing is not available in Tunisia.');
};

/**
 * Create Stripe Customer
 * @param {string} userId - User ID from database
 * @param {string} email - Customer email
 * @param {string} name - Customer name
 * @returns {Promise<object>} - Stripe Customer
 */
const createStripeCustomer = async (userId, email, name) => {
  throw new Error('Stripe card processing is not available in Tunisia.');
};

/**
 * Retrieve Stripe Customer
 * @param {string} stripeCustomerId - Stripe Customer ID
 * @returns {Promise<object>} - Customer details
 */
const getStripeCustomer = async (stripeCustomerId) => {
  throw new Error('Stripe card processing is not available in Tunisia.');
};

/**
 * Get all saved payment methods for a customer
 * @param {string} stripeCustomerId - Stripe Customer ID
 * @returns {Promise<array>} - Array of payment methods
 */
const getPaymentMethods = async (stripeCustomerId) => {
  throw new Error('Stripe card processing is not available in Tunisia.');
};

/**
 * Create Refund
 * @param {string} paymentIntentId - Payment Intent ID
 * @param {number} amount - Amount to refund (optional, full refund if not provided)
 * @returns {Promise<object>} - Refund details
 */
const createRefund = async (paymentIntentId, amount = null) => {
  throw new Error('Stripe card processing is not available in Tunisia.');
};

/**
 * Calculate platform fee
 * @param {number} amount - Amount in currency
 * @param {number} feePercent - Fee percentage (default 10%)
 * @returns {object} - { amount, feeAmount, netAmount }
 */
const calculateFee = (amount, feePercent = 10) => {
  const feeAmount = (amount * feePercent) / 100;
  const netAmount = amount - feeAmount;
  return {
    amount,
    feeAmount: parseFloat(feeAmount.toFixed(3)),
    netAmount: parseFloat(netAmount.toFixed(3)),
    feePercent,
  };
};

/**
 * Check if payment is configured
 * @returns {boolean}
 */
const isPaymentConfigured = () => {
  return false; // Stripe is not available in Tunisia
};

module.exports = {
  getStripe,
  PAYMENT_METHODS,
  createPaymentIntent,
  getPaymentIntent,
  createStripeCustomer,
  getStripeCustomer,
  getPaymentMethods,
  createRefund,
  calculateFee,
  isPaymentConfigured,
};
