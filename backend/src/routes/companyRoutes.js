const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.use(authenticate, authorizeAdmin);

router.get('/', companyController.getCompanies);
router.get('/:id', companyController.getCompanyDetails);
router.post('/', companyController.createCompany);
router.post('/:id/buy-tickets', companyController.buyTickets);
router.put('/:id', companyController.updateCompany);
router.delete('/:id', companyController.deleteCompany);

module.exports = router;

