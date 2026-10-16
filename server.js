// Aidora Backend Server
// Production-ready Express server with MongoDB, JWT auth, RBAC, validation and centralized error handling.

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const xssClean = require('xss-clean');
const compression = require('compression');
const passport = require('passport');
require('dotenv').config({ path: __dirname + '/.env' });

const { connectDB } = require('./config/db');
const { errorHandler, notFoundHandler } = require('./middlewares/error');
const authRoutes = require('./routes/auth');
const serviceRoutes = require('./routes/services');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/users');
const paymentRoutes = require('./routes/payments');
const walletRoutes = require('./routes/wallets');

const app = express();

// Initialize Passport
require('./config/passport');
app.use(passport.initialize());

// Security and performance middlewares
app.use(helmet());
app.use(compression());
app.use(xssClean());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS is explicit in production and permissive only when no origin is configured.
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  })
);
// Ensure preflight requests succeed for all routes
app.options('*', cors());

// Body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// Health and status endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', appStatus: process.env.APP_STATUS || 'active' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wallets', walletRoutes);

// Not found
app.use(notFoundHandler);
// Central error handler
app.use(errorHandler);

// Start server after DB connects
const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Aidora backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to database', err);
    process.exit(1);
  });

module.exports = app;
