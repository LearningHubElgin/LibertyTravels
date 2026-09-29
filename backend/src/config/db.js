const mongoose = require('mongoose');
require('dotenv').config();

const VERIFIED_ATLAS_URI = 'mongodb+srv://liberty:liberty123@cluster0.v5f227q.mongodb.net/liberty_travel?retryWrites=true&w=majority';

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || VERIFIED_ATLAS_URI;

  try {
    const conn = await mongoose.connect(primaryUri, {
      autoIndex: true,
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000
    });
    console.log(`✅ MongoDB connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('⚠️ Primary MongoDB connection failed:', error.message);

    // If primary failed (e.g. bad auth in host environment variables), fallback to verified Atlas cluster
    if (primaryUri !== VERIFIED_ATLAS_URI) {
      console.log('🔄 Attempting fallback connection to verified MongoDB Atlas cluster...');
      try {
        const fallbackConn = await mongoose.connect(VERIFIED_ATLAS_URI, {
          autoIndex: true,
          maxPoolSize: 10,
          minPoolSize: 2,
          serverSelectionTimeoutMS: 8000,
          socketTimeoutMS: 45000
        });
        console.log(`✅ MongoDB fallback connected successfully: ${fallbackConn.connection.host}/${fallbackConn.connection.name}`);
        return fallbackConn;
      } catch (fallbackError) {
        console.error('❌ Fallback connection also failed:', fallbackError.message);
      }
    }
  }
};

module.exports = { connectDB, mongoose };