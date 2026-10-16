const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const roles = ['user', 'provider', 'admin'];

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, minlength: 6 }, // Optional for OAuth users
    role: { type: String, enum: roles, default: 'user' },
    phone: { type: String },
    city: { type: String },
    address: { type: String },
    profilePicture: { type: String },
    isActive: { type: Boolean, default: true },
    preferences: {
      language: { type: String, default: 'en' },
      currency: { type: String, default: 'TND' },
      timeZone: { type: String, default: 'Africa/Tunis' },
      distanceUnit: { type: String, enum: ['km', 'mi'], default: 'km' },
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    },
    notificationPreferences: {
      emailNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false },
      pushNotifications: { type: Boolean, default: true },
      bookingReminders: { type: Boolean, default: true },
      productUpdates: { type: Boolean, default: false },
    },
    providerProfile: {
      bio: { type: String },
      skills: [{ type: String }],
      servicesOffered: [
        {
          title: { type: String, trim: true },
          description: { type: String, trim: true },
          price: { type: Number, min: 0 },
        },
      ],
      hourlyRate: { type: Number, min: 0 },
      availabilityNote: { type: String },
      verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
      verificationDate: { type: Date },
      rating: { type: Number, default: 0, min: 0, max: 5 },
      totalReviews: { type: Number, default: 0 },
      completedBookings: { type: Number, default: 0 },
      certifications: [{ name: String, url: String }],
      exemptFromCommission: { type: Boolean, default: false },
      location: {
        type: {
          type: String,
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
      },
    },
    googleId: { type: String },
    stripeCustomerId: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

UserSchema.index({ 'providerProfile.location': '2dsphere' });

module.exports = mongoose.model('User', UserSchema);
