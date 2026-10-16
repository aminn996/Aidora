const Joi = require('joi');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const User = require('../models/User');
const preloadedServices = require('../utils/preloadedServices');

const serviceSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  description: Joi.string().allow('').max(2000),
  category: Joi.string().required(),
  
  // Pricing
  price: Joi.number().min(0).required(),
  currency: Joi.string().default('TND'),
  priceType: Joi.string().valid('fixed', 'hourly', 'daily', 'package').default('fixed'),
  pricingTiers: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      description: Joi.string().allow(''),
      price: Joi.number().min(0).required(),
      duration: Joi.number().min(0),
    })
  ).default([]),
  
  // Service details
  serviceType: Joi.string().valid('onsite', 'remote', 'both').default('onsite'),
  duration: Joi.number().min(0),
  tags: Joi.array().items(Joi.string()).default([]),
  requirements: Joi.string().allow('').max(1000),
  cancellationPolicy: Joi.string().default('24 hours notice required'),
  maxBookingsPerDay: Joi.number().min(1).default(10),
  
  // FAQ
  faqs: Joi.array().items(
    Joi.object({
      question: Joi.string().required(),
      answer: Joi.string().required(),
    })
  ).default([]),
  
  // Media
  icon: Joi.string().allow(''),
  images: Joi.array().items(Joi.string()).default([]),
  videoUrl: Joi.string().allow('').optional(),
  
  // Location
  location: Joi.object({
    type: Joi.string().valid('Point').required(),
    coordinates: Joi.array().items(Joi.number()).length(2).required(),
    address: Joi.string().allow(''),
    serviceRadius: Joi.number().min(1).default(10),
  }).required(),
  
  // Availability
  availability: Joi.object({
    schedule: Joi.object({
      monday: Joi.object({ enabled: Joi.boolean(), slots: Joi.array().items(Joi.string()) }).optional(),
      tuesday: Joi.object({ enabled: Joi.boolean(), slots: Joi.array().items(Joi.string()) }).optional(),
      wednesday: Joi.object({ enabled: Joi.boolean(), slots: Joi.array().items(Joi.string()) }).optional(),
      thursday: Joi.object({ enabled: Joi.boolean(), slots: Joi.array().items(Joi.string()) }).optional(),
      friday: Joi.object({ enabled: Joi.boolean(), slots: Joi.array().items(Joi.string()) }).optional(),
      saturday: Joi.object({ enabled: Joi.boolean(), slots: Joi.array().items(Joi.string()) }).optional(),
      sunday: Joi.object({ enabled: Joi.boolean(), slots: Joi.array().items(Joi.string()) }).optional(),
    }).unknown(true).optional(),
    exceptions: Joi.array().items(
      Joi.object({
        date: Joi.date().required(),
        slots: Joi.array().items(Joi.string()),
        reason: Joi.string().allow(''),
      })
    ).default([]),
  }).default({}),
}).unknown(true);

exports.seedServices = async (req, res, next) => {
  try {
    // Get or create a default provider
    let provider = await User.findOne({ email: 'provider@aidora.tn' });
    if (!provider) {
      provider = await User.create({
        name: 'Aidora Provider',
        email: 'provider@aidora.tn',
        password: 'Provider@2024',
        role: 'provider',
        providerProfile: {
          verificationStatus: 'verified',
          verificationDate: new Date(),
          rating: 4.8,
          totalReviews: 150,
          completedBookings: 500,
        },
      });
    }

    // Seed services
    const servicesToCreate = preloadedServices.map(s => ({
      ...s,
      provider: provider._id,
      rating: Math.floor(Math.random() * 2) + 4,
      totalReviews: Math.floor(Math.random() * 50),
    }));

    await Service.deleteMany({});
    const services = await Service.insertMany(servicesToCreate);

    res.json({ message: `${services.length} services seeded successfully`, count: services.length });
  } catch (err) {
    next(err);
  }
};

exports.createService = async (req, res, next) => {
  try {
    const { error, value } = serviceSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    const service = await Service.create({ ...value, provider: req.user.id });
    res.status(201).json({ service });
  } catch (err) {
    next(err);
  }
};

exports.updateService = async (req, res, next) => {
  try {
    const { error, value } = serviceSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    const service = await Service.findOneAndUpdate(
      { _id: req.params.id, provider: req.user.id },
      value,
      { new: true }
    );
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json({ service });
  } catch (err) {
    next(err);
  }
};

exports.deleteService = async (req, res, next) => {
  try {
    const service = await Service.findOneAndDelete({ _id: req.params.id, provider: req.user.id });
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json({ message: 'Service deleted' });
  } catch (err) {
    next(err);
  }
};

exports.getService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id).populate('provider', 'name email phone profilePicture providerProfile');
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json({ service });
  } catch (err) {
    next(err);
  }
};

exports.listServices = async (req, res, next) => {
  try {
    const { category, maxDistance = 50000, minRating = 0, maxPrice, search } = req.query;
    const filters = { isActive: true };

    if (category) filters.category = category;
    if (maxPrice) filters.price = { $lte: Number(maxPrice) };
    if (minRating) filters.rating = { $gte: Number(minRating) };
    if (search) {
      filters.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const { lng, lat } = req.query;
    let geoFilter = {};
    if (lng && lat) {
      geoFilter = {
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
            $maxDistance: Number(maxDistance),
          },
        },
      };
    }

    const services = await Service.find({ ...filters, ...geoFilter })
      .populate('provider', 'name email profilePicture providerProfile')
      .limit(100)
      .lean();
    
    res.json({ services, count: services.length });
  } catch (err) {
    next(err);
  }
};

exports.getNearbyServices = async (req, res, next) => {
  try {
    const { lng, lat, maxDistance = 50000 } = req.query;
    if (!lng || !lat) {
      return res.status(400).json({ message: 'Latitude and longitude required' });
    }

    const services = await Service.find({
      isActive: true,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          $maxDistance: Number(maxDistance),
        },
      },
    })
      .populate('provider', 'name email profilePicture providerProfile')
      .limit(50)
      .lean();

    res.json({ services, count: services.length });
  } catch (err) {
    next(err);
  }
};

exports.addReview = async (req, res, next) => {
  try {
    const { rating, comment, bookingId } = req.body;
    if (!rating || !bookingId) {
      return res.status(400).json({ message: 'Rating and booking ID required' });
    }

    const serviceId = req.params.id;
    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ message: 'Service not found' });

    // Prevent duplicate reviews by the same user
    const hasReviewed = (service.reviews || []).some(r => String(r.user) === String(req.user.id));
    if (hasReviewed) {
      return res.status(400).json({ message: 'You have already reviewed this service' });
    }

    // Validate booking belongs to user, is for this service, and is completed
    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.user.id,
      service: serviceId,
      status: 'completed',
    });
    if (!booking) {
      return res.status(400).json({ message: 'Only completed bookings can be reviewed' });
    }

    service.reviews.push({
      user: req.user.id,
      rating: Number(rating),
      comment,
      booking: bookingId,
    });

    // Calculate average rating
    const totalRating = service.reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0);
    const avg = service.reviews.length ? totalRating / service.reviews.length : 0;
    service.rating = Number(avg.toFixed(1));
    service.totalReviews = service.reviews.length;

    await service.save();
    const populated = await Service.findById(serviceId).populate('reviews.user', 'name profilePicture');
    res.json({ service: populated });
  } catch (err) {
    next(err);
  }
};

exports.getReviews = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id).populate('reviews.user', 'name profilePicture');
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json({ reviews: service.reviews });
  } catch (err) {
    next(err);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Service.distinct('category');
    res.json({ categories });
  } catch (err) {
    next(err);
  }
};
