require('dotenv').config();
// Reload configuration from .env
const app = require('./app');
const { connectDB } = require('./config/db');
require('./models');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Bind port immediately to 0.0.0.0 so Render detects the service as live right away
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Liberty Tours & Travels ERP API running on http://0.0.0.0:${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  try {
    await connectDB();
  } catch (error) {
    console.error('❌ MongoDB initial connection notice:', error.message);
  }
};

startServer();

