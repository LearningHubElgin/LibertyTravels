const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/liberty_travel', {
      autoIndex: true
    });
    console.log(`✅ MongoDB connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('❌ Unable to connect to MongoDB database:', error.message);
    throw error;
  }
};

module.exports = { connectDB, mongoose };