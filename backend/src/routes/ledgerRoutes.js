const express = require('express');
const router = express.Router();
const ledgerController = require('../controllers/ledgerController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.use(authenticate, authorizeAdmin);

router.get('/customer/:customerId', ledgerController.getCustomerLedger);
router.get('/general', ledgerController.getGeneralLedger);

module.exports = router;
