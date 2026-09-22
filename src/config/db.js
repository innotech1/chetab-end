const mongoose = require('mongoose');

async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
