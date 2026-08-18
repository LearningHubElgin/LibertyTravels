const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.use(authenticate, authorizeAdmin);

router.get('/stats', dashboardController.getDashboardStats);
router.get('/charts', dashboardController.getDashboardCharts);
router.get('/upcoming-and-recent', dashboardController.getDashboardUpcomingAndRecent);

module.exports = router;
