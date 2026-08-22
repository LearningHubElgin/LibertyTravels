const express = require('express');
const router = express.Router();
const agencyController = require('../controllers/agencyController');
const { authenticate, authorizeSuperAdmin } = require('../middleware/auth');

// All agency management endpoints are protected and restricted to Super Admin
router.use(authenticate, authorizeSuperAdmin);

router.get('/stats/overview', agencyController.getPlatformStats);
router.get('/', agencyController.getAgencies);
router.get('/:id', agencyController.getAgencyDetails);
router.post('/', agencyController.createAgency);
router.put('/:id', agencyController.updateAgency);
router.delete('/:id', agencyController.deleteAgency);

module.exports = router;
