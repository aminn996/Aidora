const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  },
  { timestamps: true }
);

const ServiceSchema = new mongoose.Schema(
  {
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { type: String, index: true },
    
    // Pricing
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'TND' },
    priceType: { type: String, enum: ['fixed', 'hourly', 'daily', 'package'], default: 'fixed' },
    pricingTiers: [{
      name: String,
      description: String,
      price: Number,
      duration: Number, // in minutes
    }],
    
    // Service details
    serviceType: { type: String, enum: ['onsite', 'remote', 'both'], default: 'onsite' },
    duration: { type: Number, min: 0 }, // in minutes
    tags: [{ type: String, trim: true, lowercase: true }],
    requirements: { type: String }, // What customer needs to prepare
    cancellationPolicy: { type: String, default: '24 hours notice required' },
    maxBookingsPerDay: { type: Number, default: 10, min: 1 },
    
    // FAQ section
    faqs: [{
      question: String,
      answer: String,
    }],
    
    // Reviews & ratings
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    reviews: [ReviewSchema],
    
    // Media
    images: [String],
    icon: { type: String },
    videoUrl: { type: String },
    
    // Availability
    availability: {
      schedule: {
        monday: { enabled: Boolean, slots: [String] },
        tuesday: { enabled: Boolean, slots: [String] },
        wednesday: { enabled: Boolean, slots: [String] },
        thursday: { enabled: Boolean, slots: [String] },
        friday: { enabled: Boolean, slots: [String] },
        saturday: { enabled: Boolean, slots: [String] },
        sunday: { enabled: Boolean, slots: [String] },
      },
      exceptions: [{ date: Date, slots: [String], reason: String }],
    },
    
    // Location
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
      address: { type: String },
      serviceRadius: { type: Number, default: 10 }, // km radius for service coverage
    },
    
    // Status
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    totalBookings: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ServiceSchema.index({ location: '2dsphere' });
ServiceSchema.index({ category: 1 });

module.exports = mongoose.model('Service', ServiceSchema);
