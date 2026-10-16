const router = require('express').Router();
const { protect } = require('../middlewares/auth');
const { updateProfile } = require('../controllers/authController');
const User = require('../models/User');

// Get current user profile
router.get('/profile', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// Update user profile (delegates to auth controller for full validation)
router.put('/profile', protect, updateProfile);

// Delete user account
router.delete('/profile', protect, async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json({ message: 'User account deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
