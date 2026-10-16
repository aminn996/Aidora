const mongoose = require('mongoose');

const connectDB = async () => {
  const rawUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB || 'aidora';
  const authSource = process.env.MONGO_AUTH_SOURCE; // optional

  if (!rawUri) throw new Error('MONGODB_URI missing in environment');

  // Redact credentials for logging
  const redactedUri = rawUri.replace(/:\/\/(.*?):(.*?)@/, '://<user>:<password>@');

  mongoose.set('strictQuery', true);
  try {
    const options = { dbName };
    // Default to 'admin' for Atlas if not explicitly set
    options.authSource = authSource || 'admin';

    await mongoose.connect(rawUri, options);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed');
    console.error('URI:', redactedUri, 'DB:', dbName, authSource ? `authSource: ${authSource}` : '');
    console.error(err);
    throw err;
  }
};

module.exports = { connectDB };
