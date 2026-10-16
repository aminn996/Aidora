const router = require('express').Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  createBooking,
  getBooking,
  listMyBookings,
  listProviderBookings,
  updateStatus,
  cancelBooking,
  getStats,
} = require('../controllers/bookingController');

// Specific routes BEFORE parameterized routes to avoid conflicts
router.get('/user/my-bookings', protect, listMyBookings);
router.get('/provider/bookings', protect, authorize('provider', 'admin'), listProviderBookings);
router.get('/stats', protect, getStats);

// User bookings
router.post('/', protect, authorize('user', 'admin'), createBooking);
router.get('/:id', protect, getBooking);
router.put('/:id/cancel', protect, authorize('user', 'admin'), cancelBooking);

// Provider bookings
router.put('/:id/status', protect, authorize('provider', 'admin'), updateStatus);

module.exports = router;
