const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Only configure OAuth if credentials are provided
const isGoogleConfigured = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

// Google Strategy
if (isGoogleConfigured) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists by Google ID or email
          let user = await User.findOne({ googleId: profile.id });

          if (!user) {
            // Try to find by email
            user = await User.findOne({ email: profile.emails?.[0]?.value });

            if (user) {
              // Link Google ID to existing user
              user.googleId = profile.id;
              await user.save();
            } else {
              // Create new user from Google profile
              const newUser = new User({
                name: profile.displayName,
                email: profile.emails?.[0]?.value,
                googleId: profile.id,
                avatar: profile.photos?.[0]?.value,
                role: 'customer',
                isEmailVerified: true,
              });
              user = await newUser.save();
            }
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
} else {
  console.log('ℹ️  Google OAuth not configured (missing GOOGLE_CLIENT_ID/SECRET)');
}

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;
