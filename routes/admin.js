const router = require('express').Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  getAnalytics,
  verifyProvider,
  manageUser,
  manageService,
  listUsers,
  listServices,
  listBookings,
  getCommissionStats,
  toggleProviderCommission,
} = require('../controllers/adminController');

router.get('/analytics', protect, authorize('admin'), getAnalytics);
router.get('/users', protect, authorize('admin'), listUsers);
router.get('/services', protect, authorize('admin'), listServices);
router.get('/bookings', protect, authorize('admin'), listBookings);
router.get('/commission-stats', protect, authorize('admin'), getCommissionStats);
router.put('/users/:id', protect, authorize('admin'), manageUser);
router.put('/services/:id', protect, authorize('admin'), manageService);
router.put('/providers/:id/verify', protect, authorize('admin'), verifyProvider);
router.put('/providers/:id/commission', protect, authorize('admin'), toggleProviderCommission);

module.exports = router;
