const router = require('express').Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  createService,
  updateService,
  deleteService,
  getService,
  listServices,
  getNearbyServices,
  seedServices,
  addReview,
  getReviews,
  getCategories,
} = require('../controllers/serviceController');

// Public listing and details
router.get('/', listServices);
router.get('/nearby', getNearbyServices);
router.get('/categories', getCategories);

// Provider route for own services (MUST be before /:id route)
router.get('/my-services', protect, authorize('provider', 'admin'), async (req, res) => {
  try {
    const services = await require('../models/Service').find({ provider: req.user.id });
    res.json({ success: true, services });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', getService);
router.get('/:id/reviews', getReviews);

// Review submission
router.post('/:id/reviews', protect, addReview);

// Provider-only CRUD
router.post('/', protect, authorize('provider', 'admin'), createService);
router.put('/:id', protect, authorize('provider', 'admin'), updateService);
router.delete('/:id', protect, authorize('provider', 'admin'), deleteService);

// Admin seeding
router.post('/admin/seed', protect, authorize('admin'), seedServices);

module.exports = router;
