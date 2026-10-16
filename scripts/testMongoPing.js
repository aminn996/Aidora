// Simple MongoDB Atlas connectivity test
// Uses connection string from backend/.env (MONGODB_URI or MONGO_URI)

const { MongoClient, ServerApiVersion } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!uri) {
  console.error('❌ Missing MONGODB_URI/MONGO_URI in backend/.env');
  process.exit(1);
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    // Ping the target DB (aidora). If it fails, try admin as fallback.
    try {
      await client.db('aidora').command({ ping: 1 });
      console.log('✅ Pinged aidora DB. Connected to MongoDB Atlas!');
    } catch (e) {
      await client.db('admin').command({ ping: 1 });
      console.log('✅ Pinged admin DB. Connected to MongoDB Atlas!');
    }
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error(err);
    process.exitCode = 1;
  } finally {
    await client.close().catch(() => {});
  }
}

run();
