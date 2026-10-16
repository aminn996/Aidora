const Joi = require('joi');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const { sendEmail } = require('../config/email');

const bookingSchema = Joi.object({
  serviceId: Joi.string().required(),
  date: Joi.date().required(),
  slot: Joi.string().required(),
  notes: Joi.string().allow('').optional(),
});

const COMMISSION_RATE = 0.1;

exports.createBooking = async (req, res, next) => {
  try {
    const { error, value } = bookingSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    
    const service = await Service.findById(value.serviceId).populate('provider');
    if (!service || !service.isActive) return res.status(404).json({ message: 'Service not available' });

    const providerId = service.provider._id || service.provider;
    const basePrice = service.price;
    
    // Check if provider is exempt from commission
    const isExempt = service.provider?.providerProfile?.exemptFromCommission || false;
    const platformFeePercent = isExempt ? 0 : COMMISSION_RATE;
    const platformFeeAmount = Number((basePrice * platformFeePercent).toFixed(2));
    const providerEarning = Number((basePrice - platformFeeAmount).toFixed(2));
    
    const booking = await Booking.create({
      user: req.user._id,
      provider: providerId,
      service: service._id,
      date: value.date,
      slot: value.slot,
      price: basePrice,
      currency: service.currency || 'TND',
      notes: value.notes,
      status: 'pending',
      payment: { status: 'pending' },
      platformFeePercent,
      platformFeeAmount,
      providerEarning,
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('service', 'title icon')
      .populate('provider', 'name email');

    // Send email to provider about new booking
    try {
      const customer = await User.findById(req.user._id);
      const provider = await User.findById(providerId);
      await sendEmail('newBookingNotification', {
        provider,
        customer,
        service,
        booking: populatedBooking,
      });
    } catch (emailErr) {
      console.error('Failed to send booking notification email:', emailErr.message);
      // Continue - don't fail booking if email fails
    }

    res.status(201).json({ booking: populatedBooking });
  } catch (err) {
    next(err);
  }
};

exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('service', 'title description price icon')
      .populate('provider', 'name email phone profilePicture')
      .populate('user', 'name email');
    
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json({ booking });
  } catch (err) {
    next(err);
  }
};

exports.listMyBookings = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filters = { user: req.user._id };
    if (status) filters.status = status;

    const bookings = await Booking.find(filters)
      .populate('service', 'title icon price')
      .populate('provider', 'name email profilePicture')
      .sort('-createdAt');
    
    res.json({ bookings, count: bookings.length });
  } catch (err) {
    next(err);
  }
};

exports.listProviderBookings = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filters = { provider: req.user._id };
    if (status) filters.status = status;

    const bookings = await Booking.find(filters)
      .populate('service', 'title icon price')
      .populate('user', 'name email phone profilePicture')
      .sort('-createdAt');
    
    res.json({ bookings, count: bookings.length });
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const booking = await Booking.findById(req.params.id)
      .populate('service', 'title icon')
      .populate('user', 'name email')
      .populate('provider', 'name email');
      
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.provider._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Credit provider wallet when booking is completed
    if (status === 'completed' && booking.status !== 'completed' && booking.payment.status === 'paid') {
      // Get or create provider wallet
      let providerWallet = await Wallet.findOne({ user: booking.provider._id });
      if (!providerWallet) {
        providerWallet = await Wallet.create({ user: booking.provider._id });
      }
      
      // Credit provider's earning (price minus platform fee)
      const earningAmount = booking.providerEarning || (booking.price - booking.platformFeeAmount);
      
      await Transaction.create({
        user: booking.provider._id,
        wallet: providerWallet._id,
        type: 'earning',
        amount: earningAmount,
        currency: booking.currency,
        method: 'wallet',
        status: 'completed',
        booking: booking._id,
        description: `Earning from booking ${booking._id}`,
        balanceBefore: providerWallet.balance,
        balanceAfter: providerWallet.balance + earningAmount,
        completedAt: new Date()
      });
      
      providerWallet.balance += earningAmount;
      providerWallet.totalEarned += earningAmount;
      await providerWallet.save();
    }
    
    booking.status = status;
    await booking.save();

    // Send email notification to customer
    try {
      const customer = await User.findById(booking.user._id);
      const provider = await User.findById(booking.provider._id);
      const service = await Service.findById(booking.service._id);

      if (status === 'confirmed') {
        await sendEmail('bookingConfirmed', { customer, provider, service, booking });
      } else if (status === 'cancelled') {
        await sendEmail('bookingDeclined', { customer, provider, service, booking });
      }
    } catch (emailErr) {
      console.error('Failed to send status email:', emailErr.message);
      // Continue - don't fail if email fails
    }

    res.json({ booking });
  } catch (err) {
    next(err);
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: { $in: ['pending', 'confirmed'] },
    });
    
    if (!booking) return res.status(404).json({ message: 'Booking cannot be cancelled' });
    
    booking.status = 'cancelled';
    await booking.save();
    
    res.json({ message: 'Booking cancelled successfully', booking });
  } catch (err) {
    next(err);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    const stats = await Booking.aggregate([
      { $facet: {
        userBookings: [
          { $match: { user: require('mongoose').Types.ObjectId(userId) } },
          { $group: {
            _id: '$status',
            count: { $sum: 1 },
          }},
        ],
        providerBookings: [
          { $match: { provider: require('mongoose').Types.ObjectId(userId) } },
          { $group: {
            _id: '$status',
            count: { $sum: 1 },
          }},
        ],
      }},
    ]);

    res.json({ stats: stats[0] });
  } catch (err) {
    next(err);
  }
};
