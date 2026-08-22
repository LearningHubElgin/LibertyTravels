const express = require('express');
const router = express.Router();
const agencyController = require('../controllers/agencyController');
const { authenticate, authorizeSuperAdmin } = require('../middleware/auth');

// All agency management routes require Super Admin authentication
router.use(authenticate, authorizeSuperAdmin);

// Super Admin Platform Statistics
router.get('/dashboard-stats', agencyController.getPlatformStats);

// Super Admin User Management
router.get('/users', agencyController.getSuperAdminUsers);
router.post('/users', agencyController.createAgencyUser);

// Travel Agencies CRUD
router.get('/', agencyController.getAgencies);
router.get('/:id', agencyController.getAgencyDetails);
router.post('/', agencyController.createAgency);
router.put('/:id', agencyController.updateAgency);
router.delete('/:id', agencyController.deleteAgency);

module.exports = router;
