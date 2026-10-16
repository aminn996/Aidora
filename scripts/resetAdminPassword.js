/* Reset or create admin account with known credentials.
 * Usage: npm run reset:admin
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const User = require('../models/User');

async function run() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is missing. Set it in environment or .env');
    process.exit(1);
  }
  await mongoose.connect(uri, { dbName: process.env.MONGO_DB || 'aidora', authSource: process.env.MONGO_AUTH_SOURCE || 'admin' });
  console.log('✅ Connected to MongoDB');

  const email = 'admin@aidora.tn';
  const password = 'Admin@aidora123456';

  let user = await User.findOne({ email });
  if (user) {
    user.password = password; // Let pre-save hash it
    user.role = 'admin';
    user.isActive = true;
    await user.save();
    console.log('🔑 Admin password reset and role ensured:', email);
  } else {
    user = await User.create({
      name: 'Admin',
      email,
      password,
      role: 'admin',
      isActive: true,
    });
    console.log('✅ Admin created:', user.email);
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Failed to reset admin:', err);
  mongoose.disconnect().then(() => process.exit(1));
});
