const express = require('express');
const router = express.Router();
const customerPortalController = require('../controllers/customerPortalController');
const { authenticate, authorizeCustomer } = require('../middleware/auth');

// Protect all customer portal routes
router.use(authenticate, authorizeCustomer);

router.get('/profile', customerPortalController.getProfile);
router.get('/bookings', customerPortalController.getBookings);
router.get('/payments', customerPortalController.getPayments);
router.get('/ledger', customerPortalController.getLedger);

module.exports = router;
