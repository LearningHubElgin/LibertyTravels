require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { User } = require('../models');
const { ROLES, USER_STATUS } = require('../config/constants');

async function migrateSuperAdmin() {
  try {
    console.log('🔄 Connecting to database for Super Admin migration...');
    await connectDB();

    const targetId = 'superadmin';
    const targetPassword = 'password123';

    let superAdmin = await User.findOne({ email: targetId }).select('+password');

    if (!superAdmin) {
      console.log(`Creating new Super Admin account with ID: "${targetId}"...`);
      superAdmin = await User.create({
        name: 'Super Admin',
        email: targetId,
        password: targetPassword,
        role: ROLES.SUPER_ADMIN,
        status: USER_STATUS.ACTIVE
      });
      console.log('✅ Super Admin account created successfully.');
    } else {
      console.log(`Updating existing Super Admin account with ID: "${targetId}"...`);
      superAdmin.name = superAdmin.name || 'Super Admin';
      superAdmin.role = ROLES.SUPER_ADMIN;
      superAdmin.status = USER_STATUS.ACTIVE;
      superAdmin.password = targetPassword;
      await superAdmin.save();
      console.log('✅ Super Admin credentials and role updated.');
    }

    // Verify authentication
    const userForVerification = await User.findOne({ email: targetId }).select('+password');
    const isMatch = await userForVerification.comparePassword(targetPassword);

    if (isMatch) {
      console.log('\n============================================================');
      console.log('🎉 SUPER ADMIN MIGRATION COMPLETED SUCCESSFULLY!');
      console.log('============================================================');
      console.log('🔑 Login Details:');
      console.log(`   Login ID / Username: ${targetId} (or "Superadmin")`);
      console.log(`   Password:            ${targetPassword}`);
      console.log(`   Role:                ${userForVerification.role}`);
      console.log(`   Status:              ${userForVerification.status}`);
      console.log('============================================================\n');
    } else {
      throw new Error('Password verification check failed after saving.');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateSuperAdmin();
