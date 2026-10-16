const Joi = require('joi');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');
const crypto = require('crypto');

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('user', 'provider', 'admin').optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const forgotSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(6).required(),
});

exports.register = async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    const emailLower = value.email.toLowerCase();
    const exists = await User.findOne({ email: emailLower });
    if (exists) return res.status(409).json({ message: 'Email already registered' });
    const user = await User.create({ ...value, email: emailLower });
    const token = signToken({ id: user._id, role: user.role });
    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    const emailLower = value.email.toLowerCase();
    const user = await User.findOne({ email: emailLower });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const match = await user.comparePassword(value.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    const token = signToken({ id: user._id, role: user.role });
    res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (err) {
    next(err);
  }
};

exports.googleLogin = async (req, res, next) => {
  try {
    const { googleId, email, name, profilePicture } = req.body;
    let user = await User.findOne({ googleId });
    
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        user.googleId = googleId;
        await user.save();
      } else {
        user = await User.create({
          name,
          email,
          googleId,
          profilePicture,
          password: 'google_' + googleId,
        });
      }
    }

    const token = signToken({ id: user._id, role: user.role });
    res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role, profilePicture: user.profilePicture },
      token,
    });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const schema = Joi.object({
      name: Joi.string().min(2).max(100),
      phone: Joi.string().max(30),
      profilePicture: Joi.string().uri().allow(null, ''),
      city: Joi.string().max(100),
      address: Joi.string().max(200),
      bio: Joi.string().max(500),
      skills: Joi.array().items(Joi.string().max(50)),
      servicesOffered: Joi.array().items(
        Joi.object({
          title: Joi.string().min(2).max(120).required(),
          description: Joi.string().allow('', null),
          price: Joi.number().min(0).optional(),
        })
      ),
      hourlyRate: Joi.number().min(0),
      availabilityNote: Joi.string().max(200),
      location: Joi.object({
        address: Joi.string().max(200),
        coordinates: Joi.array().items(Joi.number()).length(2),
      }),
      preferences: Joi.object({
        language: Joi.string().max(10),
        currency: Joi.string().max(10),
        timeZone: Joi.string().max(100),
        distanceUnit: Joi.string().valid('km', 'mi'),
        theme: Joi.string().valid('light', 'dark', 'system'),
      }),
      notificationPreferences: Joi.object({
        emailNotifications: Joi.boolean(),
        smsNotifications: Joi.boolean(),
        pushNotifications: Joi.boolean(),
        bookingReminders: Joi.boolean(),
        productUpdates: Joi.boolean(),
      }),
    });

    const { error, value } = schema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const update = {
      ...(value.name && { name: value.name }),
      ...(value.phone && { phone: value.phone }),
      ...(value.profilePicture && { profilePicture: value.profilePicture }),
      ...(value.city && { city: value.city }),
      ...(value.address && { address: value.address }),
    };

    if (value.bio !== undefined) update['providerProfile.bio'] = value.bio;
    if (value.skills) update['providerProfile.skills'] = value.skills;
    if (value.servicesOffered) update['providerProfile.servicesOffered'] = value.servicesOffered;
    if (value.hourlyRate !== undefined) update['providerProfile.hourlyRate'] = value.hourlyRate;
    if (value.availabilityNote !== undefined) update['providerProfile.availabilityNote'] = value.availabilityNote;
    if (value.location) {
      update['providerProfile.location'] = {
        type: 'Point',
        coordinates: value.location.coordinates || [],
        address: value.location.address,
      };
    }
    if (value.preferences) {
      Object.entries(value.preferences).forEach(([key, val]) => {
        update[`preferences.${key}`] = val;
      });
    }
    if (value.notificationPreferences) {
      Object.entries(value.notificationPreferences).forEach(([key, val]) => {
        update[`notificationPreferences.${key}`] = val;
      });
    }

    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true }).select('-password');

    res.json({ message: 'Profile updated successfully', user });
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const match = await user.comparePassword(currentPassword);
    if (!match) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password (Mongoose pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { error, value } = forgotSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const user = await User.findOne({ email: value.email });
    if (!user) {
      // Respond generically to avoid user enumeration
      return res.json({ message: 'If an account exists, reset instructions were sent' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken = hashed;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${rawToken}`;

    // TODO: integrate real email service. For now, return token for dev visibility.
    res.json({
      message: 'If an account exists, reset instructions were sent',
      resetToken: rawToken,
      resetUrl,
    });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { error, value } = resetSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const hashed = crypto.createHash('sha256').update(value.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.password = value.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
};
