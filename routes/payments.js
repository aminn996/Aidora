const express = require('express');
const { protect } = require('../middlewares/auth');
const {
  initializePayment,
  confirmPayment,
  getPayment,
  getBookingPayment,
  refundPayment,
  getPaymentMethods,
  getPaymentStats,
  d17Callback,
  paymeeCallback,
  getConfig,
} = require('../controllers/paymentController');

const router = express.Router();

// Public endpoints (no auth)
router.get('/config', getConfig);
router.get('/d17/callback', d17Callback);
router.get('/paymee/callback', paymeeCallback);

// Protected endpoints (require auth)
router.use(protect);

// Initialize payment for a booking
router.post('/initialize', initializePayment);

// Confirm payment after Stripe completes
router.post('/confirm', confirmPayment);

// Get payment details
router.get('/:paymentId', getPayment);

// Get payment for a specific booking
router.get('/booking/:bookingId', getBookingPayment);

// Refund a payment
router.post('/refund', refundPayment);

// Get user's saved payment methods
router.get('/methods/list', getPaymentMethods);

// Admin: Get payment statistics
router.get('/admin/stats', getPaymentStats);

module.exports = router;
