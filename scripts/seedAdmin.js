/* Seed a default admin user. Usage:
 * MONGODB_URI="your-uri" node scripts/seedAdmin.js
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
const User = require('../models/User');

async function run() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is missing. Set it in environment or .env');
    process.exit(1);
  }
  await mongoose.connect(uri, { dbName: 'aidora' });
  console.log('✅ Connected to MongoDB');

  const email = 'admin@aidora.tn';
  const password = 'Admin@aidora123456';

  let admin = await User.findOne({ email });
  if (admin) {
    console.log('ℹ️ Admin already exists:', email);
    await mongoose.disconnect();
    process.exit(0);
  }

  admin = await User.create({
    name: 'Admin',
    email,
    password,
    role: 'admin',
    isActive: true,
  });

  console.log('✅ Admin created:', admin.email);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Failed to seed admin:', err);
  mongoose.disconnect().then(() => process.exit(1));
});
