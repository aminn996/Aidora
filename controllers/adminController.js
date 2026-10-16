const Joi = require('joi');
const User = require('../models/User');
const Service = require('../models/Service');
const Booking = require('../models/Booking');

exports.getAnalytics = async (req, res, next) => {
  try {
    const [users, providers, services, bookings, completedBookings] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: 'provider' }),
      Service.countDocuments({}),
      Booking.countDocuments({}),
      Booking.countDocuments({ status: 'completed' }),
    ]);

    const revenue = await Booking.aggregate([
      { $match: { 'payment.status': 'completed' } },
      { $group: { _id: null, total: { $sum: '$price' } } },
    ]);

    res.json({
      stats: {
        users,
        providers,
        services,
        bookings,
        completedBookings,
        revenue: revenue[0]?.total || 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.verifyProvider = async (req, res, next) => {
  try {
    const { action } = req.body; // verify | reject
    const user = await User.findById(req.params.id);
    
    if (!user || user.role !== 'provider') {
      return res.status(404).json({ message: 'Provider not found' });
    }

    if (action === 'verify') {
      user.providerProfile.verificationStatus = 'verified';
      user.providerProfile.verificationDate = new Date();
    } else if (action === 'reject') {
      user.providerProfile.verificationStatus = 'rejected';
    }

    await user.save();
    res.json({ message: `Provider ${action}ed successfully`, user });
  } catch (err) {
    next(err);
  }
};

exports.manageUser = async (req, res, next) => {
  try {
    const { action } = req.body; // approve | suspend | delete
    const user = await User.findById(req.params.id);
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (action === 'approve') user.isActive = true;
    else if (action === 'suspend') user.isActive = false;
    else if (action === 'delete') {
      await User.findByIdAndDelete(req.params.id);
      return res.json({ message: 'User deleted' });
    }
    
    await user.save();
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.manageService = async (req, res, next) => {
  try {
    const { action } = req.body; // approve | suspend | delete
    const service = await Service.findById(req.params.id);
    
    if (!service) return res.status(404).json({ message: 'Service not found' });
    
    if (action === 'approve') service.isActive = true;
    else if (action === 'suspend') service.isActive = false;
    else if (action === 'delete') {
      await Service.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Service deleted' });
    }
    
    await service.save();
    res.json({ service });
  } catch (err) {
    next(err);
  }
};

exports.listUsers = async (req, res, next) => {
  try {
    const { role, isActive } = req.query;
    const filters = {};
    
    if (role) filters.role = role;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const users = await User.find(filters).select('-password').limit(100);
    res.json({ users, count: users.length });
  } catch (err) {
    next(err);
  }
};

exports.listServices = async (req, res, next) => {
  try {
    const { category, isActive } = req.query;
    const filters = {};
    
    if (category) filters.category = category;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const services = await Service.find(filters).populate('provider', 'name email').limit(100);
    res.json({ services, count: services.length });
  } catch (err) {
    next(err);
  }
};

exports.listBookings = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filters = {};
    
    if (status) filters.status = status;

    const bookings = await Booking.find(filters)
      .populate('service', 'title category price')
      .populate('user', 'name email phone')
      .populate('provider', 'name email phone providerProfile.exemptFromCommission')
      .sort('-createdAt')
      .limit(100);
    
    res.json({ bookings, count: bookings.length });
  } catch (err) {
    next(err);
  }
};

exports.getCommissionStats = async (req, res, next) => {
  try {
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$price' },
          totalCommission: { $sum: '$platformFeeAmount' },
          totalProviderEarnings: { $sum: '$providerEarning' },
          bookingsCount: { $sum: 1 },
        },
      },
    ]);

    const exemptProviders = await User.countDocuments({
      role: 'provider',
      'providerProfile.exemptFromCommission': true,
    });

    res.json({
      stats: stats[0] || {
        totalRevenue: 0,
        totalCommission: 0,
        totalProviderEarnings: 0,
        bookingsCount: 0,
      },
      exemptProviders,
    });
  } catch (err) {
    next(err);
  }
};

exports.toggleProviderCommission = async (req, res, next) => {
  try {
    const { exempt } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user || user.role !== 'provider') {
      return res.status(404).json({ message: 'Provider not found' });
    }

    if (!user.providerProfile) {
      user.providerProfile = {};
    }

    user.providerProfile.exemptFromCommission = exempt === true;
    await user.save();
    
    res.json({
      message: `Provider commission ${exempt ? 'exempted' : 'enabled'}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        exemptFromCommission: user.providerProfile.exemptFromCommission,
      },
    });
  } catch (err) {
    next(err);
  }
};
