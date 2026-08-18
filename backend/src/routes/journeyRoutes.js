const express = require('express');
const router = express.Router();
const journeyController = require('../controllers/journeyController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.use(authenticate, authorizeAdmin);

router.get('/upcoming', journeyController.getUpcomingJourneys);

module.exports = router;
