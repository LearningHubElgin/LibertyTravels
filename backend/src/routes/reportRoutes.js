const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.use(authenticate, authorizeAdmin);

router.get('/sales', reportController.getSalesReport);
router.get('/bookings', reportController.getBookingReport);
router.get('/revenue', reportController.getRevenueReport);
router.get('/profit', reportController.getProfitReport);
router.get('/outstanding', reportController.getCustomerOutstandingReport);
router.get('/expenses', reportController.getExpenseReport);
router.get('/companies', reportController.getCompanyReport);

module.exports = router;
