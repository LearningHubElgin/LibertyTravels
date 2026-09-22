const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.use(authenticate, authorizeAdmin);

router.get('/', customerController.getCustomers);
router.post('/', customerController.createCustomer);
router.get('/:id', customerController.getCustomerById);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);
router.get('/:id/ledger', customerController.getCustomerLedger);

module.exports = router;
