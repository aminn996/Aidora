require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Booking = require('../models/Booking');

async function debugBookings() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/aidora';
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB');
    
    console.log('\n=== ALL BOOKINGS IN DATABASE ===\n');
    const bookings = await Booking.find().populate('provider').populate('service').populate('user');
    
    bookings.forEach((booking, idx) => {
      console.log(`\nBooking ${idx + 1}:`);
      console.log(`  _id: ${booking._id}`);
      console.log(`  user: ${booking.user?.name || booking.user} (${booking.user?._id || booking.user})`);
      console.log(`  provider: ${booking.provider?.name || booking.provider} (${booking.provider?._id || booking.provider})`);
      console.log(`  service: ${booking.service?.title || booking.service} (${booking.service?._id || booking.service})`);
      console.log(`  status: ${booking.status}`);
      console.log(`  createdAt: ${booking.createdAt}`);
    });
    
    console.log(`\n\nTotal bookings: ${bookings.length}\n`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

debugBookings();
