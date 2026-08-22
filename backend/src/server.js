require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');
const { autoMigrateAgencies } = require('./database/autoMigrateAgencies');
require('./models');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await autoMigrateAgencies();
 
    app.listen(PORT, () => {
      console.log(`🚀 Liberty Tours & Travels ERP API running on http://localhost:${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🍃 Database: MongoDB (${process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/liberty_travel'})`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
