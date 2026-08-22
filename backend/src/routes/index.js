const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const bookingRoutes = require('./bookingRoutes');
const customerRoutes = require('./customerRoutes');
const companyRoutes = require('./companyRoutes');
const agencyRoutes = require('./agencyRoutes');
const paymentRoutes = require('./paymentRoutes');
const transactionRoutes = require('./transactionRoutes');
const ledgerRoutes = require('./ledgerRoutes');
const expenseRoutes = require('./expenseRoutes');
const journeyRoutes = require('./journeyRoutes');
const calendarRoutes = require('./calendarRoutes');
const reportRoutes = require('./reportRoutes');
const userRoutes = require('./userRoutes');
const notificationRoutes = require('./notificationRoutes');
const activityLogRoutes = require('./activityLogRoutes');
const settingRoutes = require('./settingRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/bookings', bookingRoutes);
router.use('/customers', customerRoutes);
router.use('/companies', companyRoutes);
router.use('/agencies', agencyRoutes);
router.use('/superadmin/agencies', agencyRoutes);
router.use('/payments', paymentRoutes);
router.use('/transactions', transactionRoutes);
router.use('/ledger', ledgerRoutes);
router.use('/expenses', expenseRoutes);
router.use('/journeys', journeyRoutes);
router.use('/calendar', calendarRoutes);
router.use('/reports', reportRoutes);
router.use('/users', userRoutes);
router.use('/notifications', notificationRoutes);
router.use('/activity-logs', activityLogRoutes);
router.use('/settings', settingRoutes);

module.exports = router;

