const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// Extract authorizeAdmin to apply it individually, not globally
// router.use(authenticate, authorizeAdmin);

// Admin only routes
router.get('/', authenticate, authorizeAdmin, customerController.getCustomers);
router.post('/', authenticate, authorizeAdmin, customerController.createCustomer);
router.put('/:id', authenticate, authorizeAdmin, customerController.updateCustomer);
router.delete('/:id', authenticate, authorizeAdmin, customerController.deleteCustomer);

// Customers can view their own data, Admins can view any
router.get('/:id', authenticate, customerController.getCustomerById);
router.put('/:id/profile', authenticate, customerController.updateCustomerProfile);
router.get('/:id/ledger', authenticate, customerController.getCustomerLedger);

module.exports = router;
