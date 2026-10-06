const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.use(authenticate, authorizeAdmin);

router.get('/', companyController.getCompanies);
router.get('/:id', companyController.getCompanyDetails);
router.post('/', companyController.createCompany);
router.post('/:id/deposit', companyController.depositFunds);
router.post('/:id/reward', companyController.receiveReward);
router.post('/:id/deduct', companyController.deductFunds);
router.post('/:id/refund', companyController.recordRefund);
router.post('/:id/manual-transaction', companyController.createManualTransaction);
router.put('/:id/transactions/:transactionId', companyController.updateTransaction);
router.delete('/:id/transactions/:transactionId', companyController.deleteTransaction);
router.put('/:id', companyController.updateCompany);
router.delete('/:id', companyController.deleteCompany);

module.exports = router;

